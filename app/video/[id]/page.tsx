import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import VideoDetail from '@/components/VideoDetail'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: video } = await supabase
    .from('videos')
    .select('title, description, thumbnail_url')
    .eq('id', id)
    .single()

  if (!video) {
    return {
      title: 'Video Not Found',
    }
  }

  const description = video.description || `Watch ${video.title} — a professional video editing project.`

  return {
    title: `${video.title} | Video Editor Portfolio`,
    description,
    openGraph: {
      title: video.title,
      description,
      type: 'video.other',
      ...(video.thumbnail_url && {
        images: [
          {
            url: video.thumbnail_url,
            width: 1280,
            height: 720,
            alt: video.title,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: video.title,
      description,
      ...(video.thumbnail_url && {
        images: [video.thumbnail_url],
      }),
    },
  }
}

export default async function VideoPage({ params }: Props) {
  const { id } = await params
  return <VideoDetail videoId={id} />
}
