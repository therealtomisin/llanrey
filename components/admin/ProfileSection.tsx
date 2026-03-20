'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Portfolio {
  id?: string
  user_id?: string
  logo_url?: string
  profile_picture_url?: string
  bitmoji_url?: string
  bio?: string
}

export default function ProfileSection() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bio, setBio] = useState('')

  useEffect(() => {
    const fetchPortfolio = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Try to get existing portfolio
      let { data: portfolioData, error } = await supabase
        .from('portfolio_config')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // If not found, create default one
      if (error || !portfolioData) {
        const { data: newPortfolio } = await supabase
          .from('portfolio_config')
          .insert({
            user_id: user.id,
            bio: '',
          })
          .select()
          .single()

        portfolioData = newPortfolio
      }

      if (portfolioData) {
        setPortfolio(portfolioData)
        setBio(portfolioData.bio || '')
      }

      setLoading(false)
    }

    fetchPortfolio()
  }, [])

  const [uploading, setUploading] = useState(false)

  const handleUploadFile = async (
    file: File,
    fileType: 'logo' | 'profile_picture' | 'bitmoji'
  ) => {
    if (!file || !portfolio?.id) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', fileType)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Upload failed')
        return
      }

      // Update portfolio in Supabase
      const supabase = createClient()
      const updateData =
        fileType === 'logo'
          ? { logo_url: result.url }
          : fileType === 'bitmoji'
            ? { bitmoji_url: result.url }
            : { profile_picture_url: result.url }

      const { data, error } = await supabase
        .from('portfolio_config')
        .update(updateData)
        .eq('id', portfolio.id)
        .select()

      if (error) {
        console.error('Supabase update failed:', error)
        toast.error('Image uploaded but failed to save. Please try again.')
        return
      }

      if (data && data.length > 0) {
        setPortfolio(data[0])
        const label = fileType === 'logo' ? 'Logo' : fileType === 'bitmoji' ? 'Bitmoji' : 'Profile picture'
        toast.success(`${label} updated!`)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveBio = async () => {
    if (!portfolio?.id) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('portfolio_config')
        .update({ bio })
        .eq('id', portfolio.id)
        .select()

      if (!error && data) {
        setPortfolio(data[0])
        toast.success('Bio saved!')
      }
    } catch (error) {
      console.error('Save failed:', error)
      toast.error('Failed to save bio. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-border rounded animate-pulse" />
            <div className="h-32 bg-border rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card sticky top-6">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Logo
          </label>
          <div className="relative w-32 h-32 bg-border rounded-lg overflow-hidden mb-3">
            {portfolio?.logo_url ? (
              <img
                src={portfolio.logo_url}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No logo
              </div>
            )}
          </div>
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleUploadFile(e.target.files[0], 'logo')
                }
              }}
              className="hidden"
            />
            <div className={`px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 text-center text-sm font-medium ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </div>
          </label>
        </div>

        {/* Profile Picture Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Profile Picture
          </label>
          <div className="relative w-40 h-40 bg-border rounded-full overflow-hidden mb-3">
            {portfolio?.profile_picture_url ? (
              <img
                src={portfolio.profile_picture_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No photo
              </div>
            )}
          </div>
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleUploadFile(e.target.files[0], 'profile_picture')
                }
              }}
              className="hidden"
            />
            <div className={`px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 text-center text-sm font-medium ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </div>
          </label>
        </div>

        {/* Bitmoji Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Bitmoji / Avatar
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Upload a bitmoji or cartoon avatar. It will alternate with your profile picture on the public page.
          </p>
          <div className="relative w-40 h-40 bg-border rounded-full overflow-hidden mb-3">
            {portfolio?.bitmoji_url ? (
              <img
                src={portfolio.bitmoji_url}
                alt="Bitmoji"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No bitmoji
              </div>
            )}
          </div>
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleUploadFile(e.target.files[0], 'bitmoji')
                }
              }}
              className="hidden"
            />
            <div className={`px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 text-center text-sm font-medium ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? 'Uploading...' : 'Upload Bitmoji'}
            </div>
          </label>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write a brief bio about yourself..."
            className="w-full h-32 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
          <Button
            onClick={handleSaveBio}
            disabled={saving}
            className="w-full mt-3"
          >
            {saving ? 'Saving...' : 'Save Bio'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
