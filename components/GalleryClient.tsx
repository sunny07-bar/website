'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { getGalleryImages } from '@/lib/queries'
import SupabaseImage from '@/components/SupabaseImage'

interface GalleryClientProps {
  initialImages: any[]
}

export default function GalleryClient({ initialImages }: GalleryClientProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [images, setImages] = useState<any[]>(initialImages)
  const [loading, setLoading] = useState(false)

  const categories = ['all', 'food', 'ambience', 'events', 'other']
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    async function loadImages() {
      if (activeCategory === 'all') {
        setImages(initialImages)
        return
      }

      setLoading(true)
      try {
        const data = await getGalleryImages(activeCategory)
        setImages(data)
      } catch (error) {
        console.error('Error loading images:', error)
      } finally {
        setLoading(false)
      }
    }
    loadImages()
  }, [activeCategory, initialImages])

  const filteredImages = activeCategory === 'all' 
    ? images 
    : images.filter(img => img.category === activeCategory)

  return (
    <div className="section-bg-primary section-spacing">
      <div className="container-global">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h1 className="section-title mb-4">GALLERY</h1>
          <div className="w-20 md:w-28 h-0.5 md:h-1 bg-[#F59E0B] mx-auto rounded-full mb-6"></div>
          <p className="body-text max-w-3xl mx-auto">
            Take a look at our food, ambience, and events through our photo gallery.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2.5 md:gap-3 justify-center mb-8 md:mb-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                activeCategory === category 
                  ? 'bg-[#F59E0B] text-black' 
                  : 'bg-[#111111] border border-white/10 text-[#D1D5DB] hover:bg-[#F59E0B]/10 hover:border-[#F59E0B]/40 hover:text-[#F59E0B]'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        {loading ? (
          <div className="text-center py-16 md:py-20">
            <p className="body-text">Loading gallery...</p>
          </div>
        ) : filteredImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              className="gallery-item-card cursor-pointer aspect-square animate-fade-in-up group"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => setSelectedImage(index)}
            >
              {image.image_path ? (
                <div className="h-full w-full relative">
                  <SupabaseImage
                    src={image.image_path}
                    alt={image.caption || 'Gallery image'}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    bucket="gallery"
                  />
                </div>
              ) : (
                <div className="h-full w-full bg-[#111111] flex items-center justify-center">
                  <span className="body-text text-sm">{image.caption || 'Image'}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 md:py-20">
          <div className="card-dark p-8 md:p-12 max-w-md mx-auto">
            <p className="body-text font-medium">No images in this category yet.</p>
          </div>
        </div>
      )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && filteredImages[selectedImage] && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full card-dark p-4 md:p-6 animate-scale-in">
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/40 rounded-full p-2 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6 md:h-8 md:w-8" />
            </button>
            {filteredImages[selectedImage]?.image_path ? (
              <div className="w-full h-full relative aspect-video">
                <SupabaseImage
                  src={filteredImages[selectedImage].image_path}
                  alt={filteredImages[selectedImage].caption || 'Gallery image'}
                  fill
                  className="object-contain"
                  bucket="gallery"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center aspect-video">
                <span className="text-gray-500 text-lg">
                  {filteredImages[selectedImage]?.caption || 'Image'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

