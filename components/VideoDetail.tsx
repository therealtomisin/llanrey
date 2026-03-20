'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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
  category_id: string | null
  categories?: Category | null
}

export default function VideoDetail({ videoId }: { videoId: string }) {
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([])

  useEffect(() => {
    const fetchVideo = async () => {
      const supabase = createClient()

      const { data: videoData } = await supabase
        .from('videos')
        .select('*, categories(id, name, slug)')
        .eq('id', videoId)
        .single()

      if (videoData) {
        setVideo(videoData)

        const { data: relatedData } = await supabase
          .from('videos')
          .select('*, categories(id, name, slug)')
          .neq('id', videoId)
          .order('display_order', { ascending: true })
          .limit(3)

        setRelatedVideos(relatedData || [])
      }

      setLoading(false)
    }

    if (videoId) {
      fetchVideo()
    }
  }, [videoId])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <nav className="border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <Skeleton className="h-10 w-40" />
          </div>
        </nav>
        <section className="bg-card border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="mt-8 space-y-3">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-5 w-full max-w-xl" />
              <Skeleton className="h-5 w-3/4 max-w-lg" />
            </div>
          </div>
        </section>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <Skeleton className="h-8 w-40 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-lg" />
            ))}
          </div>
        </section>
      </main>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-foreground text-lg mb-4 font-display">Video not found</p>
        <Link href="/">
          <Button>Back to Portfolio</Button>
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background noise-bg">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/">
            <Button variant="ghost" className="font-display">← Back to Portfolio</Button>
          </Link>
        </div>
      </motion.nav>

      {/* Video Player Section */}
      <section className="relative bg-card/50 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/50 ring-1 ring-white/5"
          >
            <video
              src={video.video_url}
              controls
              autoPlay={false}
              preload="metadata"
              controlsList="nodownload"
              className="w-full h-full object-contain"
              poster={video.thumbnail_url}
            />
          </motion.div>

          {/* Video Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 sm:mt-8"
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground">
                {video.title}
              </h1>
              {video.categories && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                  {video.categories.name}
                </span>
              )}
            </div>
            {video.description && (
              <p className="text-lg text-foreground/70 leading-relaxed max-w-3xl">
                {video.description}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Related Videos */}
      {relatedVideos.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-display text-2xl font-bold text-foreground mb-8"
          >
            More Work
            <span className="block h-1 w-12 mt-3 rounded-full bg-gradient-to-r from-primary to-accent" />
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedVideos.map((relatedVideo, i) => (
              <motion.div
                key={relatedVideo.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href={`/video/${relatedVideo.id}`}>
                  <Card className="overflow-hidden border-border/50 hover:border-primary/40 glow-card transition-all duration-400 cursor-pointer h-full">
                    <CardContent className="p-0">
                      <div className="relative h-40 bg-card overflow-hidden group">
                        {relatedVideo.thumbnail_url ? (
                          <img
                            src={relatedVideo.thumbnail_url}
                            alt={relatedVideo.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-card to-accent/10 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <div className="w-0 h-0 border-l-6 border-l-primary border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-500 ease-out">
                            <div className="w-0 h-0 border-l-6 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                      </div>
                      <div className="p-3">
                        <h3 className="font-display font-semibold text-foreground line-clamp-2">
                          {relatedVideo.title}
                        </h3>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
