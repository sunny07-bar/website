'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UtensilsCrossed, Music, Beer, ChefHat, Calendar, MapPin, Clock, ArrowRight, Leaf } from 'lucide-react'
import SupabaseImage from '@/components/SupabaseImage'
import { formatFloridaTime, toFloridaTime } from '@/lib/utils/timezone'
import { parseISO } from 'date-fns'

interface HomeClientProps {
  banners: any[]
  featuredItems: any[]
  upcomingEvents: any[]
  galleryImages?: any[]
}

export default function HomeClient({ banners, featuredItems, upcomingEvents, galleryImages = [] }: HomeClientProps) {
  const validBanners = Array.isArray(banners) ? banners.filter(b => b) : []
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  // Limit events to 2 featured
  const featuredEvents = upcomingEvents.slice(0, 2)
  
  // Limit menu items to 4
  const previewMenuItems = featuredItems.slice(0, 4)

  useEffect(() => {
    if (validBanners.length > 0 && currentBannerIndex >= validBanners.length) {
      setCurrentBannerIndex(0)
    }
  }, [validBanners.length, currentBannerIndex])

  useEffect(() => {
    if (validBanners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % validBanners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [validBanners.length])

  const nextBanner = () => {
    if (validBanners.length <= 1) return
    setCurrentBannerIndex((prev) => (prev + 1) % validBanners.length)
  }

  const prevBanner = () => {
    if (validBanners.length <= 1) return
    setCurrentBannerIndex((prev) => (prev - 1 + validBanners.length) % validBanners.length)
  }

  const currentBanner = validBanners[currentBannerIndex] || validBanners[0] || null

  const formatEventDate = (dateString: string) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
      const floridaDate = toFloridaTime(date)
      return formatFloridaTime(floridaDate, 'MMM d, yyyy')
    } catch {
      return ''
    }
  }

  const formatEventTime = (dateString: string) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
      const floridaDate = toFloridaTime(date)
      return formatFloridaTime(floridaDate, 'h:mm a')
    } catch {
      return ''
    }
  }

  return (
    <div className="w-full">
      {/* 1️⃣ HERO SECTION */}
      {validBanners.length > 0 && currentBanner ? (
        <section className="relative w-full overflow-hidden px-4 md:px-6 lg:px-8">
          {currentBanner.cta_link ? (
            <Link href={currentBanner.cta_link} className="block">
              <div className="relative w-full aspect-[16/10] md:h-[90vh] md:min-h-[700px] rounded-2xl md:rounded-3xl overflow-hidden">
                <div className="absolute inset-0">
                  {validBanners.map((banner, index) => (
                    <div
                      key={banner.id || `banner-${index}`}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                    >
                      {banner.image_path ? (
                        <SupabaseImage
                          src={banner.image_path}
                          alt={banner.title || 'Banner'}
                          fill
                          className="object-cover"
                          priority={index === 0}
                          bucket="banners"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0E0E0E] to-[#111111]"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ) : (
            <div className="relative w-full aspect-[16/10] md:h-[90vh] md:min-h-[700px] rounded-2xl md:rounded-3xl overflow-hidden">
              <div className="absolute inset-0">
                {validBanners.map((banner, index) => (
                  <div
                    key={banner.id || `banner-${index}`}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    {banner.image_path ? (
                      <SupabaseImage
                        src={banner.image_path}
                        alt={banner.title || 'Banner'}
                        fill
                        className="object-cover"
                        priority={index === 0}
                        bucket="banners"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0E0E0E] to-[#111111]"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="relative w-full h-[75vh] md:h-[90vh] min-h-[500px] md:min-h-[700px] bg-[#0E0E0E] overflow-hidden">
          <div className="absolute inset-0 bg-black/60 z-10"></div>
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="container-global text-center text-white px-4">
              <div className="animate-fade-in-up max-w-4xl mx-auto">
                <h1 className="hero-heading mb-4 md:mb-6">Good Times. Great Food. Live Music.</h1>
                <p className="hero-subheading mb-8 md:mb-10 max-w-2xl mx-auto">
                  Experience the best nights in town with live bands, handcrafted drinks, and unforgettable vibes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link href="/events">
                    <button className="btn-amber text-lg px-8 py-4 min-h-[44px]">Explore Events</button>
                  </Link>
                  <Link href="/menu">
                    <button className="bg-transparent border-2 border-white/30 hover:border-[#F59E0B] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-white/5 min-h-[44px]">
                      View Menu
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2️⃣ UPCOMING EVENTS PREVIEW (2 Featured Only) */}
      {featuredEvents.length > 0 && (
        <section className="section-bg-primary section-spacing">
          <div className="container-global">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="section-title mb-4">Upcoming Live Events</h2>
              <div className="w-20 md:w-28 h-0.5 md:h-1 bg-[#F59E0B] mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto mb-10">
              {featuredEvents.map((event, index) => (
                <Link
                  key={event.id}
                  href={`/events/${encodeURIComponent(event.slug)}`}
                  className="event-item-card group cursor-pointer"
                >
                  {event.image_path ? (
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
                      <SupabaseImage
                        src={event.image_path}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        bucket="events"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute top-3 right-3 bg-[#F59E0B] text-black px-3 py-1 rounded-lg text-xs font-bold">
                        Live Band
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/10 flex items-center justify-center">
                      <Music className="h-12 w-12 text-[#F59E0B] opacity-50" />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <h3 className="card-title group-hover:text-[#F59E0B] transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm body-text">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#F59E0B]" />
                        <span>{formatEventDate(event.event_start)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#F59E0B]" />
                        <span>{formatEventTime(event.event_start)}</span>
                      </div>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm body-text">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link href="/events">
                <button className="inline-flex items-center gap-2 bg-transparent border-2 border-[#F59E0B] hover:bg-[#F59E0B] text-[#F59E0B] hover:text-black px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 min-h-[44px]">
                  Explore More Events
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 3️⃣ MENU PREVIEW (4 Items Only) */}
      {previewMenuItems.length > 0 && (
        <section className="section-bg-alt section-spacing">
          <div className="container-global">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="section-title mb-4">Signature Dishes & Craft Drinks</h2>
              <div className="w-20 md:w-28 h-0.5 md:h-1 bg-[#F59E0B] mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-10">
              {previewMenuItems.map((item, index) => {
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

            <div className="text-center">
              <Link href="/menu">
                <button className="inline-flex items-center gap-2 bg-transparent border-2 border-[#F59E0B] hover:bg-[#F59E0B] text-[#F59E0B] hover:text-black px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 min-h-[44px]">
                  View Full Menu
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 4️⃣ EXPERIENCE / VIBE SECTION */}
      <section className="section-bg-primary section-spacing">
        <div className="container-global">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="section-title mb-4">More Than Food. It's an Experience.</h2>
            <div className="w-20 md:w-28 h-0.5 md:h-1 bg-[#F59E0B] mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Music,
                title: 'Live Bands Every Weekend',
                description: 'Experience electrifying performances from local and touring artists'
              },
              {
                icon: Beer,
                title: 'Premium Beers & Cocktails',
                description: 'Handcrafted drinks and an extensive selection of craft beers'
              },
              {
                icon: ChefHat,
                title: 'Chef-Crafted Menu',
                description: 'Fresh ingredients, bold flavors, and dishes made with passion'
              },
              {
                icon: Calendar,
                title: 'Private Parties & Events',
                description: 'Host your special occasions in our vibrant atmosphere'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="event-item-card text-center group hover:border-[#F59E0B]/50 transition-all duration-300"
              >
                <div className="mb-4 flex justify-center">
                  <div className="bg-[#F59E0B]/10 rounded-full p-4 group-hover:bg-[#F59E0B]/20 transition-colors">
                    <item.icon className="h-8 w-8 md:h-10 md:w-10 text-[#F59E0B]" />
                  </div>
                </div>
                <h3 className="card-title mb-2">{item.title}</h3>
                <p className="body-text text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5️⃣ GALLERY PREVIEW */}
      <section className="section-bg-alt section-spacing-sm">
        <div className="container-global">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="section-title mb-4">Atmosphere & Vibes</h2>
            <div className="w-20 md:w-28 h-0.5 md:h-1 bg-[#F59E0B] mx-auto rounded-full"></div>
          </div>

          <div className="overflow-x-auto scrollbar-hide pb-4">
            <div className="flex gap-4 md:gap-6 min-w-max md:min-w-0 md:grid md:grid-cols-4">
              {galleryImages.length > 0 ? (
                galleryImages.map((image) => (
                  <div
                    key={image.id}
                    className="gallery-item-card w-[280px] md:w-auto aspect-square flex-shrink-0"
                  >
                    {image.image_path ? (
                      <SupabaseImage
                        src={image.image_path}
                        alt={image.caption || 'Gallery image'}
                        fill
                        className="object-cover"
                        bucket="gallery"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/10 flex items-center justify-center">
                        <Music className="h-16 w-16 text-[#F59E0B] opacity-30" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="gallery-item-card w-[280px] md:w-auto aspect-square flex-shrink-0"
                  >
                    <div className="h-full w-full bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/10 flex items-center justify-center">
                      <Music className="h-16 w-16 text-[#F59E0B] opacity-30" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/gallery">
              <button className="inline-flex items-center gap-2 bg-transparent border-2 border-[#F59E0B] hover:bg-[#F59E0B] text-[#F59E0B] hover:text-black px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 min-h-[44px]">
                View Full Gallery
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 6️⃣ LOCATION & TIMINGS */}
      <section className="section-bg-primary section-spacing-sm">
        <div className="container-global">
          <div className="text-center mb-12">
            <h2 className="section-title mb-4">Visit Us</h2>
            <div className="w-20 md:w-28 h-0.5 md:h-1 bg-[#F59E0B] mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Map Placeholder */}
            <div className="event-item-card p-0 overflow-hidden">
              <div className="aspect-[4/3] bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/10 flex items-center justify-center">
                <MapPin className="h-16 w-16 text-[#F59E0B] opacity-30" />
                <p className="body-text ml-4">Google Map will be embedded here</p>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div className="event-item-card">
                <h3 className="card-title mb-4">Location</h3>
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="h-5 w-5 text-[#F59E0B] mt-1 flex-shrink-0" />
                  <p className="body-text">123 Main Street, City, State 12345</p>
                </div>
                <Link href="#" target="_blank">
                  <button className="btn-amber-sm w-full sm:w-auto">
                    Get Directions
                  </button>
                </Link>
              </div>

              <div className="event-item-card">
                <h3 className="card-title mb-4">Opening Hours</h3>
                <div className="space-y-2 body-text">
                  <div className="flex justify-between">
                    <span>Monday - Thursday</span>
                    <span>5:00 PM - 12:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Friday - Saturday</span>
                    <span>5:00 PM - 2:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>4:00 PM - 11:00 PM</span>
                  </div>
                </div>
              </div>

              <div className="event-item-card">
                <h3 className="card-title mb-4">Contact</h3>
                <p className="body-text mb-4">Phone: (555) 123-4567</p>
                <Link href="/contact">
                  <button className="btn-amber-sm w-full sm:w-auto">
                    Contact Us
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
