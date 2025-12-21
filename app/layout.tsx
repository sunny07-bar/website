import type { Metadata } from "next"
import { Inter, Oswald, Bebas_Neue } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Toaster } from "@/components/ui/toaster"
import ScrollToTop from "@/components/ScrollToTop"
import RouteLoaderWrapper from "@/components/RouteLoaderWrapper"

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

const oswald = Oswald({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-bebas',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Good Times Bar & Grill - Live Music, Great Food",
  description: "Good Times Bar and Grill is your destination for great food, awesome drinks, live music and more!",
  icons: {
    icon: '/images/good-times-logo.png',
    shortcut: '/images/good-times-logo.png',
    apple: '/images/good-times-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${oswald.variable} ${bebasNeue.variable} font-sans`}>
        <div className="flex flex-col min-h-screen relative">
          <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02] pointer-events-none z-0"></div>
          <RouteLoaderWrapper />
          <Header />
          <main className="flex-grow relative z-10 page-transition-enhanced">
            {children}
          </main>
          <Footer />
          <ScrollToTop />
          <Toaster />
        </div>
      </body>
    </html>
  )
}

