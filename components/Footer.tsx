'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Music, MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react'
import { supabase } from '@/lib/db'

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState({
    instagram_url: '',
    facebook_url: ''
  })

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['instagram_url', 'facebook_url'])

        if (error) {
          console.error('Error fetching social links:', error)
          return
        }

        if (data) {
          const links: any = {}
          data.forEach((setting: any) => {
            let value = setting.value
            if (typeof value === 'string' && (value.startsWith('"') || value.startsWith('{'))) {
              try {
                value = JSON.parse(value)
              } catch {
                // Keep as is
              }
            }
            if (typeof value === 'string') {
              value = value.replace(/^"|"$/g, '')
            }
            links[setting.key] = value || ''
          })
          setSocialLinks(links)
        }
      } catch (error) {
        console.error('Error in fetchSocialLinks:', error)
      }
    }

    fetchSocialLinks()
  }, [])

  return (
    <footer className="footer-dark py-16 md:py-20">
      <div className="container-global">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-12">
          {/* Address & Contact */}
          <div>
            <h3 className="card-title mb-6">Location</h3>
            <div className="space-y-3 body-text">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#F59E0B] mt-0.5 flex-shrink-0" />
                <p>1/20 Fennell St, Maitland, FL 32751</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#F59E0B] flex-shrink-0" />
                <a href="tel:+13213164644" className="hover:text-[#F59E0B] transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  (321) 316-4644
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#F59E0B] flex-shrink-0" />
                <a href="mailto:fun@goodtimesbarandgrill.com" className="hover:text-[#F59E0B] transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  fun@goodtimesbarandgrill.com
                </a>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 className="card-title mb-6">Hours</h3>
            <div className="space-y-2 body-text">
              <p>Monday - Thursday: 4:00 PM - 11:00 PM</p>
              <p>Friday - Saturday: 4:00 PM - 12:00 AM</p>
              <p>Sunday: 4:00 PM - 10:00 PM</p>
            </div>
          </div>

          {/* Social & Links */}
          <div>
            <h3 className="card-title mb-6">Connect</h3>
            <div className="flex gap-4 mb-8">
              {socialLinks.instagram_url && (
                <a
                  href={socialLinks.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-[#111111] border border-white/10 rounded-full flex items-center justify-center hover:bg-[#F59E0B] hover:border-[#F59E0B] transition-all hover:scale-110 shadow-lg hover:shadow-[#F59E0B]/30"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5 text-white" />
                </a>
              )}
              {socialLinks.facebook_url && (
                <a
                  href={socialLinks.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-[#111111] border border-white/10 rounded-full flex items-center justify-center hover:bg-[#F59E0B] hover:border-[#F59E0B] transition-all hover:scale-110 shadow-lg hover:shadow-[#F59E0B]/30"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5 text-white" />
                </a>
              )}
            </div>
            <div className="space-y-3">
              <Link href="/menu" className="block body-text hover:text-[#F59E0B] transition-all duration-300 font-medium hover:translate-x-2 hover:shadow-lg">
                Menu
              </Link>
              <Link href="/events" className="block body-text hover:text-[#F59E0B] transition-all duration-300 font-medium hover:translate-x-2 hover:shadow-lg">
                Events
              </Link>
              <Link href="/reservations" className="block body-text hover:text-[#F59E0B] transition-all duration-300 font-medium hover:translate-x-2 hover:shadow-lg">
                Reservations
              </Link>
              <Link href="/gallery" className="block body-text hover:text-[#F59E0B] transition-all duration-300 font-medium hover:translate-x-2 hover:shadow-lg">
                Gallery
              </Link>
            </div>
          </div>
        </div>

        {/* Google Maps Link */}
        <div className="border-t border-white/10 pt-8 mt-8">
          <a
            href="https://maps.google.com/?q=1/20+Fennell+St,+Maitland,+FL+32751"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-amber-sm inline-flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            View on Google Maps
          </a>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 mt-8 text-center">
          <p className="small-text">
            © {new Date().getFullYear()} Good Times Bar & Grill. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
