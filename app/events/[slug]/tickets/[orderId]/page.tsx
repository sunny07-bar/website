'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ticket, CheckCircle, Download, Mail } from 'lucide-react'
import { supabase } from '@/lib/db'
import { getImageUrl } from '@/lib/image-utils'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import type { jsPDF as JSPDFType } from 'jspdf'
import AnimatedSection from '@/components/AnimatedSection'
import { format } from 'date-fns'
import { formatFloridaTime, toFloridaTime } from '@/lib/utils/timezone'

export default function TicketConfirmationPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<any>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'Good Times Bar & Grill',
    phone: '(321) 316-4644',
    email: 'fun@goodtimesbarandgrill.com',
    address: '1/20 Fennell St, Maitland, FL 32751',
    logo_url: null as string | null
  })

  useEffect(() => {
    loadTickets()
    loadRestaurantInfo()
  }, [orderId])

  const loadRestaurantInfo = async () => {
    try {
      if (!supabase) {
        console.warn('Supabase client not available')
        return
      }
      
      const { data: settings } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['restaurant_name', 'phone', 'email', 'address', 'logo_path'])

      if (settings) {
        const info: any = {
          name: 'Good Times Bar & Grill',
          phone: '(321) 316-4644',
          email: 'fun@goodtimesbarandgrill.com',
          address: '1/20 Fennell St, Maitland, FL 32751',
          logo_url: null
        }

        settings.forEach((setting: any) => {
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

          if (setting.key === 'restaurant_name' && value) info.name = value
          if (setting.key === 'phone' && value) info.phone = value
          if (setting.key === 'email' && value) info.email = value
          if (setting.key === 'address' && value) info.address = value
          if (setting.key === 'logo_path' && value) {
            info.logo_url = getImageUrl(value, 'site-assets')
          }
        })

        setRestaurantInfo(info)
      }
    } catch (error) {
      console.error('Error loading restaurant info:', error)
    }
  }

  const loadTickets = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }
      
      const { data: orderData, error: orderError } = await supabase
        .from('ticket_orders')
        .select(`
          *,
          events (
            id,
            title,
            event_start,
            event_end,
            location
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError || !orderData) {
        console.error('Order error:', orderError)
        return
      }

      setOrder(orderData)

      // Get tickets for this order
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('purchased_tickets')
        .select('*')
        .eq('ticket_order_id', orderId)
        .order('created_at', { ascending: true })

      if (ticketsError) {
        console.error('Tickets error:', ticketsError)
        return
      }

      // Generate QR code images for each ticket
      const ticketsWithQR = await Promise.all(
        (ticketsData || []).map(async (ticket: any) => {
          try {
            const qrCodeImage = await QRCode.toDataURL(ticket.qr_code_data, {
              errorCorrectionLevel: 'H',
              type: 'image/png',
              width: 300,
              margin: 2,
            })
            return {
              ...ticket,
              qr_code_image: qrCodeImage,
            }
          } catch (err) {
            console.error('QR generation error:', err)
            return ticket
          }
        })
      )

      setTickets(ticketsWithQR)
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadTicketPDF = async (ticket: any) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, 297] // A4 size
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - (margin * 2)

      // Header Section with Dark Background
      pdf.setFillColor(220, 20, 11) // Dark red
      pdf.rect(0, 0, pageWidth, 70, 'F')

      let yPos = margin + 5

      // Logo (if available)
      if (restaurantInfo.logo_url) {
        try {
          const logoDataUrl = await loadImage(restaurantInfo.logo_url)
          // Get image dimensions by creating a temporary image
          const img = new Image()
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = logoDataUrl
          })
          const logoWidth = 25
          const logoHeight = (img.height / img.width) * logoWidth
          pdf.addImage(logoDataUrl, 'PNG', margin, yPos, logoWidth, logoHeight)
          yPos += logoHeight + 8
        } catch (err) {
          console.error('Error loading logo:', err)
          yPos += 5
        }
      }

      // Restaurant Name (White text on dark background)
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(22)
      pdf.setFont('helvetica', 'bold')
      const restaurantName = restaurantInfo.name.toUpperCase()
      pdf.text(restaurantName, margin, yPos)
      yPos += 7

      // Restaurant Tagline
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text('BAR & GRILL LIVE MUSIC', margin, yPos)
      yPos += 12

      // Ticket Title Section (Amber background)
      pdf.setFillColor(255, 184, 77) // Amber
      pdf.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F')
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('EVENT TICKET', margin + 5, yPos + 8)
      yPos += 18

      // Main Content Area (White background)
      pdf.setFillColor(255, 255, 255)
      const contentHeight = pageHeight - yPos - margin - 35
      pdf.roundedRect(margin, yPos, contentWidth, contentHeight, 2, 2, 'F')

      // Event Information
      pdf.setTextColor(31, 41, 55) // Dark gray
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      const eventTitle = order?.events?.title || 'Event'
      pdf.text(eventTitle, margin + 8, yPos + 8)

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      let textY = yPos + 16

      // Event Date and Time (EST only - no other times shown)
      if (order?.events?.event_start) {
        const eventDate = toFloridaTime(order.events.event_start)
        pdf.text(`Date: ${formatFloridaTime(eventDate, 'EEEE, MMMM d, yyyy')}`, margin + 8, textY)
        textY += 6
        pdf.text(`Time: ${formatFloridaTime(eventDate, 'h:mm a')} EST`, margin + 8, textY)
        textY += 6
      }
      
      // Event End Time (if available)
      if (order?.events?.event_end) {
        const eventEndDate = toFloridaTime(order.events.event_end)
        pdf.text(`End Time: ${formatFloridaTime(eventEndDate, 'h:mm a')} EST`, margin + 8, textY)
        textY += 6
      }

      // Event Location
      if (order?.events?.location) {
        pdf.text(`Location: ${order.events.location}`, margin + 8, textY)
        textY += 8
      }

      // Divider
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.3)
      pdf.line(margin + 8, textY, pageWidth - margin - 8, textY)
      textY += 8

      // Ticket Details Section
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('TICKET DETAILS', margin + 8, textY)
      textY += 7

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Ticket Number: ${ticket.ticket_number}`, margin + 8, textY)
      textY += 6
      pdf.text(`Ticket Type: ${ticket.ticket_type_name}`, margin + 8, textY)
      textY += 6
      pdf.text(`Customer: ${ticket.customer_name}`, margin + 8, textY)
      textY += 6
      const pricePaid = parseFloat(ticket.price_paid.toString())
      const priceText = pricePaid === 0 ? 'FREE' : `$${pricePaid.toFixed(2)}`
      pdf.text(`Price Paid: ${priceText}`, margin + 8, textY)
      textY += 6
      
      // Status badge
      const statusColor: [number, number, number] = ticket.status === 'valid' ? [34, 197, 94] : [156, 163, 175]
      pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2])
      pdf.roundedRect(margin + 8, textY - 4, 20, 5, 1, 1, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.text(ticket.status.toUpperCase(), margin + 9, textY)
      textY += 10

      // QR Code Section
      if (ticket.qr_code_image) {
        // Divider
        pdf.setDrawColor(200, 200, 200)
        pdf.setLineWidth(0.3)
        pdf.line(margin + 8, textY, pageWidth - margin - 8, textY)
        textY += 8

        // QR Code
        try {
          const qrDataUrl = await loadImage(ticket.qr_code_image)
          const qrSize = 45
          const qrX = (pageWidth - qrSize) / 2
          pdf.addImage(qrDataUrl, 'PNG', qrX, textY, qrSize, qrSize)
          textY += qrSize + 6

          // QR Code Label
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(31, 41, 55)
          pdf.text('SCAN AT EVENT ENTRANCE', pageWidth / 2, textY, { align: 'center' })
          textY += 5
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(8)
          pdf.setTextColor(100, 100, 100)
          pdf.text('Present this QR code at the venue', pageWidth / 2, textY, { align: 'center' })
        } catch (err) {
          console.error('Error adding QR code to PDF:', err)
        }
      }

      // Footer Section
      const footerY = pageHeight - margin - 15
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.3)
      pdf.line(margin + 8, footerY, pageWidth - margin - 8, footerY)

      pdf.setFontSize(7)
      pdf.setTextColor(120, 120, 120)
      pdf.text(restaurantInfo.address, pageWidth / 2, footerY + 4, { align: 'center' })
      pdf.text(`Phone: ${restaurantInfo.phone} | Email: ${restaurantInfo.email}`, pageWidth / 2, footerY + 8, { align: 'center' })
      pdf.setFontSize(6)
      pdf.text('This ticket is valid for one-time use only. Please arrive 15 minutes before the event.', pageWidth / 2, footerY + 12, { align: 'center', maxWidth: contentWidth - 16 })

      // Download PDF
      pdf.save(`ticket-${ticket.ticket_number}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  // Helper function to load image from URL (handles CORS)
  const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // For data URLs (QR codes), return directly
      if (url.startsWith('data:')) {
        resolve(url)
        return
      }

      // For external URLs, fetch and convert to data URL
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        .catch(reject)
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading your tickets...</p>
      </div>
    )
  }

  if (!order || tickets.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Tickets not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <AnimatedSection direction="down">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold heading-gradient mb-4">
            Tickets Purchased!
          </h1>
          <p className="text-xl bar-text-muted">
            Order #{order.order_number}
          </p>
        </div>
      </AnimatedSection>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Event Info */}
        <AnimatedSection direction="up">
          <Card className="bar-card">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">{order.events?.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">
                    {formatFloridaTime(order.events?.event_start, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-semibold">
                    {formatFloridaTime(order.events?.event_start, 'h:mm a')}
                  </p>
                </div>
                {order.events?.location && (
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold">{order.events.location}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Tickets */}
        <div className="space-y-4">
          {tickets.map((ticket, index) => (
            <AnimatedSection key={ticket.id} direction="up" delay={index * 100}>
              <Card className="bar-card border-2 border-orange-200">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Ticket Info */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-4">
                        <Ticket className="h-6 w-6 bar-text-amber" />
                        <h3 className="text-xl font-bold">{ticket.ticket_type_name}</h3>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Ticket Number</p>
                          <p className="font-bold text-lg">{ticket.ticket_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Customer</p>
                          <p className="font-semibold">{ticket.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Price Paid</p>
                          <p className="font-semibold">
                            {parseFloat(ticket.price_paid.toString()) === 0 
                              ? <span className="text-green-600">FREE</span>
                              : `$${parseFloat(ticket.price_paid.toString()).toFixed(2)}`
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                              ticket.status === 'valid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {ticket.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center">
                      {ticket.qr_code_image ? (
                        <>
                          <img
                            src={ticket.qr_code_image}
                            alt="QR Code"
                            className="w-48 h-48 border-4 border-orange-500 p-2 bg-white rounded-lg mb-4"
                          />
                          <p className="text-xs text-center text-gray-600 mb-4">
                            Scan at event entrance
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadTicketPDF(ticket)}
                            className="w-full btn-neon-blue"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </Button>
                        </>
                      ) : (
                        <p className="text-gray-500">Loading QR code...</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>

        {/* Important Info */}
        <AnimatedSection direction="up" delay={tickets.length * 100}>
          <Card className="bar-card bg-yellow-50 border-2 border-yellow-200">
            <CardContent className="p-6">
              <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Important Information
              </h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li>• Your tickets have been sent to <strong>{order.customer_email}</strong></li>
                <li>• Each ticket can only be used once</li>
                <li>• Please arrive at least 15 minutes before the event</li>
                <li>• Bring a valid ID that matches the name on the ticket</li>
                <li>• Keep this page or your email safe - you'll need to show the QR code</li>
              </ul>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  )
}

