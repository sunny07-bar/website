import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

// Database types based on schema
export type OrderType = 'pickup' | 'delivery' | 'dine_in'
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type OfferType = 'percentage_discount' | 'flat_discount' | 'bogo' | 'bundle'
export type OfferScope = 'entire_order' | 'category' | 'item'
export type GalleryCategory = 'food' | 'ambience' | 'events' | 'other'
