import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tag, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { getActiveOffers } from '@/lib/queries'
import SupabaseImage from '@/components/SupabaseImage'

export default async function OffersPage() {
  const offers = await getActiveOffers()

  const formatDays = (days: string[] | null) => {
    if (!days || days.length === 0) return 'Any day'
    const dayMap: { [key: string]: string } = {
      MON: 'Monday',
      TUE: 'Tuesday',
      WED: 'Wednesday',
      THU: 'Thursday',
      FRI: 'Friday',
      SAT: 'Saturday',
      SUN: 'Sunday',
    }
    return days.map(d => dayMap[d] || d).join(', ')
  }

  const formatDiscount = (offer: any) => {
    switch (offer.offer_type) {
      case 'percentage_discount':
        return `${offer.discount_value}% OFF`
      case 'flat_discount':
        return `$${offer.discount_value} OFF`
      case 'bundle':
        return `$${offer.discount_value}`
      default:
        return 'Special Offer'
    }
  }

  return (
    <div className="section-bg-primary section-spacing">
      <div className="container-global">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="section-title mb-4">SPECIAL OFFERS</h1>
          <div className="section-divider mb-6"></div>
          <p className="body-text max-w-3xl mx-auto text-lg">
            Take advantage of our amazing deals and promotions!
          </p>
        </div>

        {offers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {offers.map((offer) => {
              const startDate = offer.start_date ? new Date(offer.start_date) : null
              const endDate = offer.end_date ? new Date(offer.end_date) : null
              return (
                <div key={offer.id} className="card-premium overflow-hidden group hover:border-[#F59E0B]/50">
                  {offer.image_path ? (
                    <div className="h-56 relative -m-6 md:-m-8 mb-6 md:mb-8">
                      <SupabaseImage
                        src={offer.image_path}
                        alt={offer.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        bucket="offers"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <div className="absolute top-4 right-4">
                        <span className="badge-featured">
                          {formatDiscount(offer)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-56 relative -m-6 md:-m-8 mb-6 md:mb-8 bg-gradient-to-br from-[#F59E0B]/30 to-[#F59E0B]/10">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute top-4 right-4">
                        <span className="badge-featured">
                          {formatDiscount(offer)}
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Tag className="h-16 w-16 text-[#F59E0B] opacity-30" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#F59E0B]/10 rounded-lg p-2 border border-[#F59E0B]/20">
                        <Tag className="h-5 w-5 text-[#F59E0B]" />
                      </div>
                      <h3 className="card-title">{offer.title}</h3>
                    </div>
                    {offer.description && (
                      <p className="body-text text-sm leading-relaxed">{offer.description}</p>
                    )}
                    
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      {startDate && endDate && (
                        <div className="flex items-center gap-3">
                          <div className="bg-[#F59E0B]/10 rounded-lg p-1.5 border border-[#F59E0B]/20">
                            <Calendar className="h-4 w-4 text-[#F59E0B]" />
                          </div>
                          <span className="body-text text-sm">
                            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      {offer.days_of_week && offer.days_of_week.length > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="bg-[#F59E0B]/10 rounded-lg p-1.5 border border-[#F59E0B]/20">
                            <Calendar className="h-4 w-4 text-[#F59E0B]" />
                          </div>
                          <span className="body-text text-sm">{formatDays(offer.days_of_week)}</span>
                        </div>
                      )}
                      {offer.time_from && offer.time_to && (
                        <div className="flex items-center gap-3">
                          <div className="bg-[#F59E0B]/10 rounded-lg p-1.5 border border-[#F59E0B]/20">
                            <Clock className="h-4 w-4 text-[#F59E0B]" />
                          </div>
                          <span className="body-text text-sm">
                            {offer.time_from} - {offer.time_to}
                          </span>
                        </div>
                      )}
                      {offer.min_order_amount && (
                        <p className="body-text text-sm opacity-75">
                          Minimum order: <span className="price-amber font-semibold">${offer.min_order_amount}</span>
                        </p>
                      )}
                    </div>

                    <Button className="btn-amber w-full mt-6">
                      Use This Offer
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 md:py-20">
            <div className="card-premium max-w-md mx-auto">
              <Tag className="h-16 w-16 text-[#F59E0B] mx-auto mb-6 opacity-50" />
              <p className="body-text text-lg font-medium">No active offers at the moment. Check back soon!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
