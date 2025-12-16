import { getGalleryImages } from '@/lib/queries'
import GalleryClient from '@/components/GalleryClient'

export default async function GalleryPage() {
  const images = await getGalleryImages()

  return <GalleryClient initialImages={images} />
}
