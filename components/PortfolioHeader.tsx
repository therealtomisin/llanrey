'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface Portfolio {
  logo_url?: string
  profile_picture_url?: string
  bitmoji_url?: string
  bio?: string
}

export default function PortfolioHeader({ portfolio }: { portfolio: Portfolio | null }) {
  const hasProfilePic = !!portfolio?.profile_picture_url
  const hasBitmoji = !!portfolio?.bitmoji_url
  const shouldAlternate = hasProfilePic && hasBitmoji

  const [showBitmoji, setShowBitmoji] = useState(false)

  useEffect(() => {
    if (!shouldAlternate) return

    const interval = setInterval(() => {
      setShowBitmoji((prev) => !prev)
    }, 4000)

    return () => clearInterval(interval)
  }, [shouldAlternate])

  const currentImage = showBitmoji
    ? portfolio?.bitmoji_url
    : portfolio?.profile_picture_url

  const currentAlt = showBitmoji ? 'Bitmoji' : 'Profile'

  return (
    <section className="relative border-b border-border/50 bg-card overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-10 items-center md:items-start">
          {/* Profile Section */}
          <div className="flex-1 flex flex-col items-center md:items-start">
            {/* Avatar — alternates between profile pic and bitmoji */}
            {(hasProfilePic || hasBitmoji) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="mb-6 w-32 h-32 sm:w-40 sm:h-40 relative rounded-full overflow-hidden gradient-border"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={showBitmoji ? 'bitmoji' : 'profile'}
                    initial={{ opacity: 0, scale: 1.1, rotateY: 90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotateY: -90 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={currentImage!}
                      alt={currentAlt}
                      fill
                      sizes="(max-width: 640px) 128px, 160px"
                      className="object-cover"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Indicator dots when alternating */}
                {shouldAlternate && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        !showBitmoji ? 'bg-white scale-110' : 'bg-white/40'
                      }`}
                    />
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        showBitmoji ? 'bg-white scale-110' : 'bg-white/40'
                      }`}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Bio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            >
              {portfolio?.bio ? (
                <p className="text-base sm:text-lg text-foreground/80 leading-relaxed max-w-2xl text-center md:text-left font-body">
                  {portfolio.bio}
                </p>
              ) : (
                <p className="text-base sm:text-lg text-muted-foreground text-center md:text-left">
                  Welcome to my portfolio. Update your profile in the admin dashboard.
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
