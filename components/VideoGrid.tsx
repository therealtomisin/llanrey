'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
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
  thumbnail_url: string
  display_order: number
  category_id: string | null
  categories?: Category | null
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } },
}

export default function VideoGrid() {
  const [videos, setVideos] = useState<Video[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const [videosRes, categoriesRes] = await Promise.all([
        supabase
          .from('videos')
          .select('*, categories(id, name, slug)')
          .order('display_order', { ascending: true }),
        supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true }),
      ])

      setVideos(videosRes.data || [])
      const usedCategoryIds = new Set(
        (videosRes.data || []).map((v: Video) => v.category_id).filter(Boolean)
      )
      setCategories(
        (categoriesRes.data || []).filter((c: Category) => usedCategoryIds.has(c.id))
      )
      setLoading(false)
    }

    fetchData()
  }, [])

  const filteredVideos =
    activeCategory === 'all'
      ? videos
      : videos.filter((v) => v.category_id === activeCategory)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden">
            <Skeleton className="h-64 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <p className="text-lg text-muted-foreground">No videos yet. Check back soon!</p>
      </motion.div>
    )
  }

  return (
    <div>
      {/* Category Filter Tabs */}
      {categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-primary/20'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-primary/20'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredVideos.map((video, i) => (
            <motion.div
              key={video.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
            >
              <Link href={`/video/${video.id}`}>
                <Card className="overflow-hidden border-border/50 hover:border-primary/40 cursor-pointer h-full glow-card transition-all duration-400">
                  <CardContent className="p-0">
                    <div className="relative h-64 bg-card overflow-hidden group">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 via-card to-accent/10 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                              <div className="w-0 h-0 border-l-8 border-l-primary border-t-5 border-t-transparent border-b-5 border-b-transparent ml-1" />
                            </div>
                            <p className="text-muted-foreground text-sm font-display">Video</p>
                          </div>
                        </div>
                      )}
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-500 ease-out">
                          <div className="w-0 h-0 border-l-8 border-l-white border-t-5 border-t-transparent border-b-5 border-b-transparent ml-1" />
                        </div>
                      </div>
                      {/* Gradient overlay at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-display font-semibold text-foreground line-clamp-1">
                          {video.title}
                        </h3>
                        {video.categories && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                            {video.categories.name}
                          </span>
                        )}
                      </div>
                      {video.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
