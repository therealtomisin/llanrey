'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import PortfolioHeader from '@/components/PortfolioHeader'
import VideoGrid from '@/components/VideoGrid'

interface Portfolio {
  logo_url?: string
  profile_picture_url?: string
  bitmoji_url?: string
  bio?: string
  name?: string
  roles?: string[]
}

export default function Home() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPortfolio = async () => {
      const supabase = createClient()

      const { data: portfolioData } = await supabase
        .from('portfolio_config')
        .select('*')
        .single()

      setPortfolio(portfolioData || {})
      setLoading(false)
    }

    fetchPortfolio()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <nav className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-20" />
          </div>
        </nav>
        <section className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <Skeleton className="w-32 h-32 rounded-lg shrink-0" />
              <div className="flex-1 space-y-4">
                <Skeleton className="w-40 h-40 rounded-full" />
                <Skeleton className="h-5 w-full max-w-md" />
                <Skeleton className="h-5 w-3/4 max-w-sm" />
              </div>
            </div>
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <Skeleton className="h-9 w-48 mb-12" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background noise-bg">
      {/* Ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        {portfolio?.logo_url && (
          <div className="w-10 h-10 relative rounded-lg overflow-hidden border border-border/50">
            <Image
              src={portfolio.logo_url}
              alt="Logo"
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
        )}
        {!portfolio?.logo_url && <div />}
        <Link href="/auth/login">
          <Button variant="outline" className="border-border/50 hover:border-primary/50 transition-colors">
            Admin
          </Button>
        </Link>
      </div>

      {/* Portfolio Header Section o */}
      <PortfolioHeader portfolio={portfolio} />

      {/* Videos Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 sm:mb-12"
        >
          Featured Work
          <span className="block h-1 w-16 mt-3 rounded-full bg-gradient-to-r from-primary to-accent" />
        </motion.h2>
        <VideoGrid />
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
