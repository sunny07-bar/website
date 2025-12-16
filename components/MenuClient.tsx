'use client'

import { useState, useRef, useEffect } from 'react'
import { Leaf, UtensilsCrossed } from 'lucide-react'
import SupabaseImage from '@/components/SupabaseImage'
import Link from 'next/link'

interface MenuClientProps {
  categories: any[]
  items: any[]
}

export default function MenuClient({ categories, items }: MenuClientProps) {
  // Default to first category if available
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  )

  // Scroll tracking for category selector
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [canScroll, setCanScroll] = useState(false)

  // Check if scrolling is possible and track scroll progress
  useEffect(() => {
    const container = categoryScrollRef.current
    if (!container) return

    const updateScrollInfo = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      const maxScroll = scrollWidth - clientWidth
      const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0
      
      setScrollProgress(progress)
      setCanScroll(maxScroll > 0)
    }

    // Initial check
    updateScrollInfo()

    // Update on scroll
    container.addEventListener('scroll', updateScrollInfo)
    
    // Update on resize
    window.addEventListener('resize', updateScrollInfo)

    return () => {
      container.removeEventListener('scroll', updateScrollInfo)
      window.removeEventListener('resize', updateScrollInfo)
    }
  }, [categories])

  // Filter items based on selected category
  const filteredItems = selectedCategoryId
    ? items.filter(item => item.category_id === selectedCategoryId)
    : []

  // Get the selected category name for display
  const selectedCategory = selectedCategoryId
    ? categories.find(cat => cat.id === selectedCategoryId)
    : null

  return (
    <div className="section-bg-primary section-spacing">
      <div className="container-global">
        <div className="text-center mb-12">
          <h1 className="section-title mb-4">OUR MENU</h1>
          <div className="w-20 md:w-28 h-0.5 md:h-1 bg-[#F59E0B] mx-auto rounded-full mb-6"></div>
          <p className="body-text max-w-3xl mx-auto">
            Discover our delicious selection of food and drinks, crafted with care and passion.
          </p>
        </div>

      {/* Premium Category Selector */}
      <div className="mb-12 md:mb-16">
        <div 
          ref={categoryScrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide px-4 md:px-0 justify-start"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`relative whitespace-nowrap text-sm md:text-base px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold transition-all duration-300 min-h-[44px] ${
                selectedCategoryId === category.id
                  ? 'bg-[#F59E0B] text-black shadow-lg shadow-[#F59E0B]/30 scale-105'
                  : 'bg-[#111111] border-2 border-white/10 text-[#D1D5DB] hover:bg-[#F59E0B]/10 hover:border-[#F59E0B]/40 hover:text-[#F59E0B] hover:scale-105'
              }`}
            >
              {category.name}
              {selectedCategoryId === category.id && (
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-[#F59E0B] rounded-full"></span>
              )}
            </button>
          ))}
        </div>
        
        {/* Horizontal Scroll Indicator Bar */}
        {canScroll && (
          <div className="mt-4 px-4 md:px-0">
            <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F59E0B]/20 to-transparent animate-pulse"></div>
              
              {/* Scroll progress indicator */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#F59E0B]/60 via-[#F59E0B] to-[#F59E0B]/60 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${Math.max(10, scrollProgress * 100)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
              
              {/* Scroll hint dots */}
              <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${scrollProgress > 0.1 ? 'bg-[#F59E0B]/40' : 'bg-[#F59E0B] animate-pulse'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${scrollProgress > 0.5 ? 'bg-[#F59E0B]/40' : 'bg-[#F59E0B] animate-pulse'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${scrollProgress > 0.9 ? 'bg-[#F59E0B]/40' : 'bg-[#F59E0B] animate-pulse'}`}></div>
              </div>
            </div>
            
            {/* Scroll hint text (only on mobile) */}
            <div className="mt-2 flex items-center justify-center gap-2 md:hidden">
              <svg className="w-4 h-4 text-[#F59E0B]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              <span className="text-xs text-[#F59E0B]/60 font-medium">Swipe to see more</span>
              <svg className="w-4 h-4 text-[#F59E0B]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Selected Category Info */}
      {selectedCategory && (
        <div className="mb-10 md:mb-12 pb-6 border-b border-white/10">
          <h2 className="section-title mb-3">{selectedCategory.name}</h2>
          {selectedCategory.description && (
            <p className="body-text text-base md:text-lg max-w-3xl">{selectedCategory.description}</p>
          )}
        </div>
      )}

      {/* Menu Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {filteredItems.map((item, index) => {
            const price = item.menu_item_variants && item.menu_item_variants.length > 0
              ? item.menu_item_variants[0].price
              : item.base_price || 0

            return (
              <div 
                key={item.id} 
                className="menu-item-card-premium animate-fade-in-up group rounded-xl md:rounded-2xl" 
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Image Section */}
                {item.image_path ? (
                  <div className="aspect-square relative overflow-hidden rounded-t-xl md:rounded-t-2xl group-hover:rounded-t-xl md:group-hover:rounded-t-2xl transition-all duration-300">
                    <Link href={`/menu/${item.id}`}>
                      <SupabaseImage
                        src={item.image_path}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        bucket="menu-items"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      {item.is_featured && (
                        <span className="absolute top-2 right-2 md:top-4 md:right-4 bg-[#F59E0B] text-black px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold shadow-xl backdrop-blur-sm">
                          Featured
                        </span>
                      )}
                      {item.is_veg && (
                        <span className="absolute top-2 left-2 md:top-4 md:left-4 bg-green-500 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1 md:gap-1.5 shadow-xl backdrop-blur-sm">
                          <Leaf className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" />
                          Veg
                        </span>
                      )}
                    </Link>
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-[#111111] to-[#0E0E0E] relative flex items-center justify-center border-b border-white/10 rounded-t-xl md:rounded-t-2xl">
                    {item.is_featured && (
                      <span className="absolute top-2 right-2 md:top-4 md:right-4 bg-[#F59E0B] text-black px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold shadow-xl">
                        Featured
                      </span>
                    )}
                    {item.is_veg && (
                      <span className="absolute top-2 left-2 md:top-4 md:left-4 bg-green-500 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1 md:gap-1.5 shadow-xl">
                        <Leaf className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" />
                        Veg
                      </span>
                    )}
                    <UtensilsCrossed className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 text-[#F59E0B] opacity-30" />
                  </div>
                )}

                {/* Content Section */}
                <div className="p-3 md:p-4 lg:p-6">
                  <Link href={`/menu/${item.id}`}>
                    <div className="flex items-start justify-between group-hover:text-[#F59E0B] transition-colors">
                      <h3 className="card-title flex-1 pr-2 md:pr-4 text-base md:text-lg lg:text-xl">{item.name}</h3>
                      <div className="text-right flex-shrink-0">
                        <span className="text-lg md:text-2xl lg:text-3xl font-bold price-amber block">
                          ${price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 md:py-20">
          <div className="card-dark max-w-md mx-auto">
            <UtensilsCrossed className="h-14 w-14 md:h-16 md:w-16 text-[#F59E0B] mx-auto mb-4 opacity-60" />
            <p className="body-text text-center">
              {selectedCategory
                ? `No items available in ${selectedCategory.name} category.`
                : 'No menu items available at the moment.'}
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

