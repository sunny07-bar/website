import { getBanners, getFeaturedMenuItems, getUpcomingEvents, getGalleryImages } from '@/lib/queries'
import HomeClient from '@/components/HomeClient'

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const banners = await getBanners()
  const featuredItems = await getFeaturedMenuItems()
  const upcomingEvents = await getUpcomingEvents(2)
  const galleryImages = await getGalleryImages('all', 4) // Get 4 images for preview

  return <HomeClient banners={banners} featuredItems={featuredItems} upcomingEvents={upcomingEvents} galleryImages={galleryImages} />
}
