'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { z } from 'zod'

const videoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  category_id: z.string().optional(),
})

interface Category {
  id: string
  name: string
  slug: string
}

interface Video {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  display_order: number
  category_id: string | null
  categories?: Category | null
}

interface NewVideo {
  title: string
  description: string
  category_id: string
  videoFile: File | null
  thumbnailFile: File | null
}

export default function VideoManager() {
  const [videos, setVideos] = useState<Video[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newVideo, setNewVideo] = useState<NewVideo>({
    title: '',
    description: '',
    category_id: '',
    videoFile: null,
    thumbnailFile: null,
  })

  useEffect(() => {
    fetchVideos()
    fetchCategories()
  }, [])

  // Clean up thumbnail preview URL on unmount
  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    }
  }, [thumbnailPreview])

  const fetchCategories = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
    setCategories(data || [])
  }

  const fetchVideos = async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from('videos')
      .select('*, categories(id, name, slug)')
      .order('display_order', { ascending: true })

    setVideos(data || [])
    setLoading(false)
  }

  const handleThumbnailChange = (file: File | null) => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)

    if (file) {
      setThumbnailPreview(URL.createObjectURL(file))
    } else {
      setThumbnailPreview(null)
    }
    setNewVideo((prev) => ({ ...prev, thumbnailFile: file }))
  }

  const handleAddVideo = async () => {
    // Validate with Zod
    const result = videoSchema.safeParse({
      title: newVideo.title,
      description: newVideo.description || undefined,
      category_id: newVideo.category_id || undefined,
    })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    if (!newVideo.videoFile) {
      setErrors({ videoFile: 'Video file is required' })
      return
    }

    setErrors({})
    setUploading(true)

    try {
      // Upload video file
      const videoFormData = new FormData()
      videoFormData.append('file', newVideo.videoFile)
      videoFormData.append('type', 'video')

      const videoResponse = await fetch('/api/upload', {
        method: 'POST',
        body: videoFormData,
      })

      if (!videoResponse.ok) throw new Error('Video upload failed')
      const { url: videoUrl } = await videoResponse.json()

      // Upload thumbnail if provided
      let thumbnailUrl = ''
      if (newVideo.thumbnailFile) {
        const thumbFormData = new FormData()
        thumbFormData.append('file', newVideo.thumbnailFile)
        thumbFormData.append('type', 'thumbnail')

        const thumbResponse = await fetch('/api/upload', {
          method: 'POST',
          body: thumbFormData,
        })

        if (!thumbResponse.ok) throw new Error('Thumbnail upload failed')
        const { url } = await thumbResponse.json()
        thumbnailUrl = url
      }

      // Save to database
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from('videos').insert({
        user_id: user.id,
        title: newVideo.title,
        description: newVideo.description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        category_id: newVideo.category_id || null,
        display_order: videos.length,
      })

      if (error) throw error

      // Reset form
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
      setThumbnailPreview(null)
      setNewVideo({
        title: '',
        description: '',
        category_id: '',
        videoFile: null,
        thumbnailFile: null,
      })
      await fetchVideos()
      toast.success('Video added successfully!')
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteVideo = async (videoId: string, videoUrl: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    try {
      // Delete from Blob
      await fetch('/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl }),
      })

      // Delete from database
      const supabase = createClient()
      await supabase.from('videos').delete().eq('id', videoId)

      await fetchVideos()
      toast.success('Video deleted successfully!')
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Delete failed. Please try again.')
    }
  }

  const handleMoveVideo = async (index: number, direction: 'up' | 'down') => {
    if (reordering) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= videos.length) return

    setReordering(true)

    // Swap locally for instant feedback
    const updated = [...videos]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    setVideos(updated)

    // Persist new order to DB
    try {
      const supabase = createClient()
      await Promise.all(
        updated.map((video, i) =>
          supabase
            .from('videos')
            .update({ display_order: i })
            .eq('id', video.id)
        )
      )
      toast.success('Order updated!')
    } catch (error) {
      console.error('Reorder failed:', error)
      toast.error('Failed to save new order.')
      await fetchVideos() // revert on failure
    } finally {
      setReordering(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-border rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Video Form */}
      <Card className="bg-card border-accent border-2">
        <CardHeader>
          <CardTitle>Add New Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <Input
              value={newVideo.title}
              onChange={(e) => {
                setNewVideo({ ...newVideo, title: e.target.value })
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
              }}
              placeholder="Video title"
              className={`bg-background border-border ${errors.title ? 'border-destructive' : ''}`}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={newVideo.description}
              onChange={(e) => {
                setNewVideo({ ...newVideo, description: e.target.value })
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }))
              }}
              placeholder="Video description (optional)"
              className={`w-full h-24 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none ${errors.description ? 'border-destructive' : ''}`}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              value={newVideo.category_id}
              onChange={(e) =>
                setNewVideo({ ...newVideo, category_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Video File *
              </label>
              <label className="block">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    setNewVideo({ ...newVideo, videoFile: e.target.files?.[0] || null })
                    if (errors.videoFile) setErrors((prev) => ({ ...prev, videoFile: '' }))
                  }}
                  className="hidden"
                />
                <div className={`px-4 py-3 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 text-center text-sm font-medium ${errors.videoFile ? 'ring-2 ring-destructive' : ''}`}>
                  {newVideo.videoFile ? newVideo.videoFile.name : 'Choose Video'}
                </div>
              </label>
              {errors.videoFile && (
                <p className="text-sm text-destructive mt-1">{errors.videoFile}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Thumbnail Image
              </label>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleThumbnailChange(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="px-4 py-3 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 text-center text-sm font-medium">
                  {newVideo.thumbnailFile ? newVideo.thumbnailFile.name : 'Choose Thumbnail'}
                </div>
              </label>
              {/* Thumbnail Preview */}
              {thumbnailPreview && (
                <div className="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-border">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleThumbnailChange(null)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:opacity-90"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleAddVideo}
            disabled={uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? 'Uploading...' : 'Add Video'}
          </Button>
        </CardContent>
      </Card>

      {/* Videos List */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Your Videos ({videos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <p className="text-muted-foreground">No videos uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 p-4 bg-background border border-border rounded-lg"
                >
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveVideo(index, 'up')}
                      disabled={index === 0 || reordering}
                      className="w-7 h-7 flex items-center justify-center rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveVideo(index, 'down')}
                      disabled={index === videos.length - 1 || reordering}
                      className="w-7 h-7 flex items-center justify-center rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="w-20 h-20 bg-border rounded shrink-0 overflow-hidden">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No thumb
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground truncate">
                        {index + 1}. {video.title}
                      </h4>
                      {video.categories && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent text-accent-foreground shrink-0">
                          {video.categories.name}
                        </span>
                      )}
                    </div>
                    {video.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Delete Button */}
                  <Button
                    onClick={() => handleDeleteVideo(video.id, video.video_url)}
                    variant="destructive"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
