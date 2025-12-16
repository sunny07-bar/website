/**
 * Get the full URL for an image stored in Supabase Storage
 * If the path is already a full URL, return it as-is
 */
export function getImageUrl(imagePath: string | null | undefined, bucket?: string): string | null {
  if (!imagePath || typeof imagePath !== 'string') {
    return null
  }

  // If it's already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // Get Supabase URL from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL is not set')
    return null
  }

  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
  
  // Determine bucket and path
  let finalBucket = bucket
  let finalPath = cleanPath
  
  if (finalBucket) {
    // If bucket is provided, use the path as-is (it should not include bucket name)
    finalPath = cleanPath
  } else {
    // Try to extract bucket from path (e.g., "banners/image.jpg" or "hero/image.webp")
    // Common bucket names from schema: banners, menu-items, events, gallery, offers, site-assets
    const pathParts = cleanPath.split('/').filter(part => part.length > 0)
    const possibleBuckets = ['banners', 'menu-items', 'events', 'gallery', 'offers', 'hero', 'site-assets']
    
    if (pathParts.length > 1 && possibleBuckets.includes(pathParts[0])) {
      // First part is a known bucket name
      finalBucket = pathParts[0]
      finalPath = pathParts.slice(1).join('/')
    } else if (pathParts.length > 1) {
      // First part might be a bucket, use it anyway
      finalBucket = pathParts[0]
      finalPath = pathParts.slice(1).join('/')
    } else {
      // Single path segment - can't determine bucket, return null
      console.warn(`Cannot determine bucket for image path: ${imagePath}. Please specify bucket parameter.`)
      return null
    }
  }
  
  // Ensure we have both bucket and path
  if (!finalBucket || !finalPath) {
    console.warn(`Invalid image path or bucket: path=${imagePath}, bucket=${bucket}`)
    return null
  }
  
  // Construct the full Supabase Storage URL
  // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
  return `${supabaseUrl}/storage/v1/object/public/${finalBucket}/${finalPath}`
}

