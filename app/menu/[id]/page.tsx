import { getMenuItemById } from '@/lib/queries'
import { notFound } from 'next/navigation'
import { Leaf, Flame, ArrowLeft, ChefHat } from 'lucide-react'
import SupabaseImage from '@/components/SupabaseImage'
import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MenuItemDetailPage({ params }: { params: { id: string } }) {
  const item = await getMenuItemById(params.id)

  if (!item) {
    notFound()
  }

  const hasVariants = item.menu_item_variants && item.menu_item_variants.length > 0
  const minPrice = hasVariants
    ? Math.min(...item.menu_item_variants.map((v: any) => v.price))
    : item.base_price || 0
  const maxPrice = hasVariants
    ? Math.max(...item.menu_item_variants.map((v: any) => v.price))
    : item.base_price || 0

  return (
    <div className="section-bg-primary section-spacing">
      <div className="container-global">
        {/* Back Button */}
        <AnimatedSection direction="left">
          <Link href="/menu" className="inline-flex items-center gap-2 mb-10 px-6 py-3 rounded-xl bg-[#111111] border border-white/10 hover:bg-[#F59E0B]/10 hover:border-[#F59E0B]/40 text-[#D1D5DB] hover:text-[#F59E0B] transition-all font-semibold">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Menu</span>
          </Link>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
          {/* Image Section */}
          <AnimatedSection direction="left">
            <div className="relative">
              {item.image_path ? (
                <div className="relative aspect-square max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl group border border-white/10">
                  <SupabaseImage
                    src={item.image_path}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    priority
                    bucket="menu-items"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Badges */}
                  <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
                    {item.is_featured && (
                      <span className="badge-featured">
                        ⭐ Featured
                      </span>
                    )}
                    {item.is_veg && (
                      <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-xl backdrop-blur-sm border border-white/20">
                        <Leaf className="h-4 w-4" />
                        Vegetarian
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-[500px] md:h-[600px] bg-gradient-to-br from-[#111111] to-[#0E0E0E] rounded-2xl flex items-center justify-center shadow-2xl border border-white/10">
                  <ChefHat className="h-24 w-24 text-[#F59E0B] opacity-30" />
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Details Section */}
          <AnimatedSection direction="right">
            <div className="space-y-8">
              {/* Category */}
              {item.menu_categories && (
                <div className="inline-block px-4 py-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-full">
                  <span className="text-sm font-semibold text-[#F59E0B] uppercase tracking-wider">
                    {item.menu_categories.name}
                  </span>
                </div>
              )}

              {/* Title */}
              <div>
                <h1 className="section-title mb-6 leading-tight">
                  {item.name}
                </h1>
                
                {/* Price */}
                <div className="mb-8">
                  {hasVariants ? (
                    <div className="card-premium inline-block">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl md:text-5xl font-bold price-amber">
                          ${minPrice.toFixed(2)}
                        </span>
                        {minPrice !== maxPrice && (
                          <span className="text-2xl body-text opacity-75">
                            - ${maxPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm body-text opacity-75 mt-2">Starting from</p>
                    </div>
                  ) : (
                    <div className="card-premium inline-block">
                      <span className="text-4xl md:text-5xl font-bold price-amber">
                        ${(item.base_price || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Spicy Level */}
              {item.spicy_level && item.spicy_level > 0 && (
                <div className="flex items-center gap-3">
                  <div className="bg-[#F59E0B]/10 rounded-lg p-2 border border-[#F59E0B]/20">
                    <Flame className="h-5 w-5 text-[#F59E0B]" />
                  </div>
                  <span className="body-text font-semibold">
                    {item.spicy_level === 1 ? 'Mild Spice' : item.spicy_level === 2 ? 'Medium Spice' : 'Very Spicy'}
                  </span>
                </div>
              )}

              {/* Description */}
              {item.description && (
                <div className="pt-6 border-t border-white/10">
                  <h3 className="card-title mb-4 text-[#F59E0B]">Description</h3>
                  <div className="card-premium">
                    <p className="body-text text-base md:text-lg leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Variants */}
              {hasVariants && (
                <div className="pt-6 border-t border-white/10">
                  <h3 className="card-title mb-6 text-[#F59E0B]">Available Sizes/Options</h3>
                  <div className="space-y-4">
                    {item.menu_item_variants.map((variant: any) => (
                      <div key={variant.id} className="card-premium group hover:border-[#F59E0B]/50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="card-title mb-2">{variant.name}</h4>
                            {variant.description && (
                              <p className="body-text text-sm opacity-75">{variant.description}</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <span className="text-2xl md:text-3xl font-bold price-amber">
                              ${variant.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {(item.preparation_time || item.allergen_info) && (
                <div className="pt-4 space-y-2 body-text text-sm opacity-75">
                  {item.preparation_time && (
                    <p>⏱️ Preparation time: {item.preparation_time} minutes</p>
                  )}
                  {item.allergen_info && (
                    <p>⚠️ Allergen info: {item.allergen_info}</p>
                  )}
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>

        {/* Related Items Section */}
        <AnimatedSection>
          <div className="mt-20 pt-16 border-t border-white/10">
            <div className="text-center mb-10">
              <h2 className="section-title mb-4">You Might Also Like</h2>
              <div className="section-divider mb-8"></div>
            </div>
            <div className="text-center">
              <Link href="/menu">
                <button className="btn-amber px-10 py-4 text-lg">
                  View Full Menu
                </button>
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
