'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, Music, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/db'
import { getImageUrl } from '@/lib/image-utils'

export default function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchLogo = async () => {
      if (!supabase) {
        console.warn('Supabase client not available')
        return
      }

      try {
        const { data: settings } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'logo_path')
          .single()

        if (settings?.value) {
          const logoPath = typeof settings.value === 'string' 
            ? settings.value.replace(/^"|"$/g, '')
            : settings.value
          
          if (logoPath) {
            const logoUrl = getImageUrl(logoPath, 'site-assets')
            setLogoUrl(logoUrl ? `${logoUrl}?t=${Date.now()}` : null)
          }
        }
      } catch (error) {
        console.error('Error fetching logo:', error)
      }
    }

    fetchLogo()
  }, [])

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-500 ease-out ${
      // Always blurred on mobile, blurred on desktop when scrolled or menu open
      scrolled || mobileMenuOpen
        ? 'bg-[#0E0E0E]/98 backdrop-blur-xl border-b border-white/10 shadow-2xl glass-effect' 
        : 'bg-[#0E0E0E]/98 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-b border-white/10 lg:border-b-0'
    }`}>
      <nav className="relative">
        <div className="container-global">
          <div className="flex items-center justify-between h-20 md:h-24">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover-scale transition-all duration-300 group z-10 magnetic-hover">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <div className="rounded-lg p-1 transition-all group-hover:scale-105">
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      className="h-16 w-16 md:h-20 md:w-20 object-contain"
                      style={{ background: 'transparent' }}
                    />
                  </div>
                ) : (
                  <div className="bg-[#F59E0B] rounded-lg p-2 md:p-3 transition-all group-hover:scale-105 shadow-md">
                    <Music className="h-8 w-8 md:h-10 md:w-10 text-black" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-lg md:text-xl font-bold text-white tracking-tight">
                    GOOD TIMES
                  </span>
                  <span className="text-[9px] md:text-[10px] text-[#F59E0B] font-medium uppercase tracking-wider">
                    BAR & GRILL LIVE MUSIC
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-md transition-all duration-300 font-semibold text-xs uppercase tracking-wide relative group ${
                  isActive('/') 
                    ? 'text-[#F59E0B] bg-[#F59E0B]/10' 
                    : 'text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5 hover:scale-105'
                }`}
              >
                HOME
                {isActive('/') && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-[#F59E0B] rounded-full animate-pulse-custom"></span>
                )}
              </Link>
              <Link 
                href="/menu" 
                className={`px-4 py-2.5 rounded-lg transition-all duration-300 font-bold text-sm uppercase tracking-wide relative group ${
                  isActive('/menu') 
                    ? 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30' 
                    : 'text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5 hover:scale-105 hover:shadow-lg hover:shadow-[#F59E0B]/20'
                }`}
              >
                MENU
                {isActive('/menu') && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[#F59E0B] rounded-full animate-pulse-custom"></span>
                )}
              </Link>
              <Link 
                href="/events" 
                className={`px-4 py-2.5 rounded-lg transition-all duration-300 font-bold text-sm uppercase tracking-wide relative group ${
                  isActive('/events') 
                    ? 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30' 
                    : 'text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5 hover:scale-105 hover:shadow-lg hover:shadow-[#F59E0B]/20'
                }`}
              >
                EVENTS
                {isActive('/events') && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[#F59E0B] rounded-full animate-pulse-custom"></span>
                )}
              </Link>
              <Link 
                href="/reservations" 
                className={`px-4 py-2.5 rounded-lg transition-all duration-300 font-bold text-sm uppercase tracking-wide relative group ${
                  isActive('/reservations') 
                    ? 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30' 
                    : 'text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5 hover:scale-105 hover:shadow-lg hover:shadow-[#F59E0B]/20'
                }`}
              >
                RESERVATIONS
                {isActive('/reservations') && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[#F59E0B] rounded-full animate-pulse-custom"></span>
                )}
              </Link>
              <div className="relative group">
                <Link 
                  href="/about" 
                  className={`px-4 py-2.5 rounded-lg transition-all font-bold text-sm uppercase tracking-wide relative flex items-center gap-1 ${
                    isActive('/about') || isActive('/gallery') || isActive('/contact')
                      ? 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30' 
                      : 'text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5'
                  }`}
                >
                  MORE
                  <span className="text-xs transform group-hover:rotate-180 transition-transform">▼</span>
                </Link>
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#111111] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                  <Link href="/about" className="block px-4 py-3 text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5 transition-all duration-300 hover:translate-x-2 hover:shadow-lg">
                    About Us
                  </Link>
                  <Link href="/gallery" className="block px-4 py-3 text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5 transition-all duration-300 hover:translate-x-2 hover:shadow-lg">
                    Gallery
                  </Link>
                  <Link href="/contact" className="block px-4 py-3 text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5 transition-all duration-300 hover:translate-x-2 hover:shadow-lg">
                    Contact
                  </Link>
                </div>
              </div>
              <Link href="/reservations">
                <button className="btn-amber-sm ml-3">
                  Book Table
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-[#D1D5DB] hover:text-[#F59E0B] transition-colors z-10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0E0E0E]/95 backdrop-blur-xl border-t border-white/10 shadow-xl animate-fade-in-down">
            <div className="container-global py-6 space-y-2">
              <Link 
                href="/" 
                className={`block px-4 py-3 rounded-lg transition-all font-bold text-sm uppercase ${
                  isActive('/') ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                HOME
              </Link>
              <Link 
                href="/menu" 
                className={`block px-4 py-3 rounded-lg transition-all font-bold text-sm uppercase ${
                  isActive('/menu') ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                MENU
              </Link>
              <Link 
                href="/events" 
                className={`block px-4 py-3 rounded-lg transition-all font-bold text-sm uppercase ${
                  isActive('/events') ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                EVENTS
              </Link>
              <Link 
                href="/reservations" 
                className={`block px-4 py-3 rounded-lg transition-all font-bold text-sm uppercase ${
                  isActive('/reservations') ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                RESERVATIONS
              </Link>
              <Link 
                href="/about" 
                className={`block px-4 py-3 rounded-lg transition-all font-bold text-sm uppercase ${
                  isActive('/about') ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                ABOUT
              </Link>
              <Link 
                href="/gallery" 
                className={`block px-4 py-3 rounded-lg transition-all font-bold text-sm uppercase ${
                  isActive('/gallery') ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                GALLERY
              </Link>
              <Link 
                href="/contact" 
                className={`block px-4 py-3 rounded-lg transition-all font-bold text-sm uppercase ${
                  isActive('/contact') ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#D1D5DB] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                CONTACT
              </Link>
              <Link href="/reservations" onClick={() => setMobileMenuOpen(false)}>
                <button className="btn-amber w-full mt-4">
                  Book Table
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
