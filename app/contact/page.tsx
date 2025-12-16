'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MapPin, Phone, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="section-bg-primary section-spacing">
      <div className="container-global">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="section-title mb-4">CONTACT US</h1>
          <div className="section-divider mb-6"></div>
          <p className="body-text max-w-3xl mx-auto text-lg">
            a question or want to get in touch? We'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card-premium">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#F59E0B]/10 rounded-xl p-3 border border-[#F59E0B]/20">
                  <MapPin className="h-6 w-6 text-[#F59E0B]" />
                </div>
                <h3 className="card-title text-[#F59E0B]">ADDRESS</h3>
              </div>
              <p className="body-text">
                1/20 Fennell St, Maitland, FL 32751
              </p>
            </div>

            <div className="card-premium">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#F59E0B]/10 rounded-xl p-3 border border-[#F59E0B]/20">
                  <Phone className="h-6 w-6 text-[#F59E0B]" />
                </div>
                <h3 className="card-title text-[#F59E0B]">PHONE</h3>
              </div>
              <a href="tel:+13213164644" className="price-amber hover:text-[#D97706] transition-colors text-lg font-semibold">
                (321) 316-4644
              </a>
            </div>

            <div className="card-premium">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#F59E0B]/10 rounded-xl p-3 border border-[#F59E0B]/20">
                  <Mail className="h-6 w-6 text-[#F59E0B]" />
                </div>
                <h3 className="card-title text-[#F59E0B]">EMAIL</h3>
              </div>
              <a href="mailto:fun@goodtimesbarandgrill.com" className="price-amber hover:text-[#D97706] transition-colors break-all">
                fun@goodtimesbarandgrill.com
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="card-premium">
              <h2 className="card-title mb-8 text-[#F59E0B]">SEND US A MESSAGE</h2>

              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <p className="text-green-400 body-text">Thank you for your message! We'll get back to you soon.</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 body-text">Something went wrong. Please try again later.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="body-text mb-2 block font-semibold">Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-input-premium"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="body-text mb-2 block font-semibold">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input-premium"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone" className="body-text mb-2 block font-semibold">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="form-input-premium"
                      placeholder="(321) 316-4644"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject" className="body-text mb-2 block font-semibold">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="form-input-premium"
                      placeholder="What's this about?"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="body-text mb-2 block font-semibold">Message *</Label>
                  <Textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="form-textarea-premium"
                    placeholder="Tell us what's on your mind..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-amber text-lg px-10 py-4 min-h-[50px] w-full md:w-auto"
                >
                  {isSubmitting ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
