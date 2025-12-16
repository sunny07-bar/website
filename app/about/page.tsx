import { Card, CardContent } from '@/components/ui/card'
import { Heart, Users, Award, Coffee } from 'lucide-react'
import { getStaticSection, getOpeningHours } from '@/lib/queries'
import SupabaseImage from '@/components/SupabaseImage'

export default async function AboutPage() {
  const aboutSection = await getStaticSection('about')
  const openingHours = await getOpeningHours()

  return (
    <div className="section-bg-primary section-spacing">
      <div className="container-global">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="section-title mb-4">ABOUT US</h1>
          <div className="section-divider mb-6"></div>
          <p className="body-text max-w-3xl mx-auto text-lg">
            Learn more about Good Times Bar & Grill and what makes us special.
          </p>
        </div>

        {/* Main Story */}
        <div className="max-w-4xl mx-auto mb-16 md:mb-20">
          <div className="card-premium">
            {aboutSection?.image_path ? (
              <div className="h-64 md:h-80 relative rounded-2xl mb-8 overflow-hidden group">
                <SupabaseImage
                  src={aboutSection.image_path}
                  alt={aboutSection.title || 'About us'}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  bucket="gallery"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
            ) : (
              <div className="h-64 md:h-80 bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/10 rounded-2xl mb-8 flex items-center justify-center">
                <Coffee className="h-20 w-20 text-[#F59E0B] opacity-30" />
              </div>
            )}
            <h2 className="section-title mb-6 text-[#F59E0B]">
              {aboutSection?.title || 'OUR STORY'}
            </h2>
            <div className="prose prose-lg max-w-none body-text space-y-5 text-base md:text-lg leading-relaxed">
              {aboutSection?.body ? (
                <div dangerouslySetInnerHTML={{ __html: aboutSection.body.replace(/\n/g, '<br />') }} />
              ) : (
                <>
                  <p>
                    Good Times Bar and Grill is your destination for great food, awesome drinks, live music and more! 
                    We are located in Maitland, FL at 1720 Fennell Street and are open daily for happy hour, and dinner.
                  </p>
                  <p>
                    Since opening our doors, we've been committed to providing an exceptional dining experience 
                    combined with live entertainment that creates unforgettable memories. Our passion for quality food, 
                    craft beverages, and vibrant atmosphere has made us a beloved gathering place in the community.
                  </p>
                  <p>
                    Whether you're joining us for a casual meal, celebrating a special occasion, or enjoying one of 
                    our live music events, we're here to ensure you have a great time.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16 md:mb-20">
          <div className="card-premium text-center group hover:border-[#F59E0B]/50">
            <div className="mb-6 flex justify-center">
              <div className="bg-[#F59E0B]/10 rounded-2xl w-16 h-16 md:w-20 md:h-20 flex items-center justify-center group-hover:bg-[#F59E0B]/20 transition-colors border border-[#F59E0B]/20">
                <Heart className="h-8 w-8 md:h-10 md:w-10 text-[#F59E0B]" />
              </div>
            </div>
            <h3 className="card-title mb-3 text-[#F59E0B]">PASSION</h3>
            <p className="body-text text-sm">
              We're passionate about creating amazing experiences for our guests.
            </p>
          </div>

          <div className="card-premium text-center group hover:border-[#F59E0B]/50">
            <div className="mb-6 flex justify-center">
              <div className="bg-[#F59E0B]/10 rounded-2xl w-16 h-16 md:w-20 md:h-20 flex items-center justify-center group-hover:bg-[#F59E0B]/20 transition-colors border border-[#F59E0B]/20">
                <Users className="h-8 w-8 md:h-10 md:w-10 text-[#F59E0B]" />
              </div>
            </div>
            <h3 className="card-title mb-3 text-[#F59E0B]">COMMUNITY</h3>
            <p className="body-text text-sm">
              Building connections and bringing people together through food and music.
            </p>
          </div>

          <div className="card-premium text-center group hover:border-[#F59E0B]/50">
            <div className="mb-6 flex justify-center">
              <div className="bg-[#F59E0B]/10 rounded-2xl w-16 h-16 md:w-20 md:h-20 flex items-center justify-center group-hover:bg-[#F59E0B]/20 transition-colors border border-[#F59E0B]/20">
                <Award className="h-8 w-8 md:h-10 md:w-10 text-[#F59E0B]" />
              </div>
            </div>
            <h3 className="card-title mb-3 text-[#F59E0B]">QUALITY</h3>
            <p className="body-text text-sm">
              Using the finest ingredients and maintaining the highest standards.
            </p>
          </div>

          <div className="card-premium text-center group hover:border-[#F59E0B]/50">
            <div className="mb-6 flex justify-center">
              <div className="bg-[#F59E0B]/10 rounded-2xl w-16 h-16 md:w-20 md:h-20 flex items-center justify-center group-hover:bg-[#F59E0B]/20 transition-colors border border-[#F59E0B]/20">
                <Coffee className="h-8 w-8 md:h-10 md:w-10 text-[#F59E0B]" />
              </div>
            </div>
            <h3 className="card-title mb-3 text-[#F59E0B]">EXPERIENCE</h3>
            <p className="body-text text-sm">
              Creating memorable moments that keep you coming back.
            </p>
          </div>
        </div>

        {/* Location & Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="card-premium">
            <h2 className="card-title mb-6 text-[#F59E0B]">LOCATION</h2>
            <div className="space-y-5">
              <div>
                <p className="font-semibold body-text mb-2">Address</p>
                <p className="body-text opacity-80">1/20 Fennell St, Maitland, FL 32751</p>
              </div>
              <div>
                <p className="font-semibold body-text mb-2">Phone</p>
                <a href="tel:+13213164644" className="price-amber hover:text-[#D97706] transition-colors">
                  (321) 316-4644
                </a>
              </div>
              <div>
                <p className="font-semibold body-text mb-2">Email</p>
                <a href="mailto:fun@goodtimesbarandgrill.com" className="price-amber hover:text-[#D97706] transition-colors">
                  fun@goodtimesbarandgrill.com
                </a>
              </div>
            </div>
          </div>

          <div className="card-premium">
            <h2 className="card-title mb-6 text-[#F59E0B]">OPENING HOURS</h2>
            {openingHours.length > 0 ? (
              <div className="space-y-4">
                {openingHours.map((hours) => {
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                  if (hours.is_closed) {
                    return (
                      <div key={hours.id} className="flex justify-between items-center pb-3 border-b border-white/10">
                        <span className="font-medium body-text">{dayNames[hours.weekday]}</span>
                        <span className="body-text opacity-60">Closed</span>
                      </div>
                    )
                  }
                  return (
                    <div key={hours.id} className="flex justify-between items-center pb-3 border-b border-white/10">
                      <span className="font-medium body-text">{dayNames[hours.weekday]}</span>
                      <span className="body-text opacity-80">
                        {hours.open_time} - {hours.close_time}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="font-medium body-text">Monday - Friday</span>
                  <span className="body-text opacity-80">5:00 PM - 11:00 PM</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="font-medium body-text">Saturday</span>
                  <span className="body-text opacity-80">4:00 PM - 12:00 AM</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="font-medium body-text">Sunday</span>
                  <span className="body-text opacity-80">4:00 PM - 10:00 PM</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
