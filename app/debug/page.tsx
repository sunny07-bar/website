import { getBanners, getMenuCategories, getMenuItems, getEvents, getActiveOffers, getGalleryImages } from '@/lib/queries'

export default async function DebugPage() {
  const banners = await getBanners()
  const categories = await getMenuCategories()
  const menuItems = await getMenuItems()
  const events = await getEvents()
  const offers = await getActiveOffers()
  const galleryImages = await getGalleryImages()

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Database Connection Debug</h1>
      
      <div className="space-y-8">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Banners</h2>
          <p>Count: {banners.length}</p>
          <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(banners, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Menu Categories</h2>
          <p>Count: {categories.length}</p>
          <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(categories, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Menu Items</h2>
          <p>Count: {menuItems.length}</p>
          <pre className="mt-2 text-xs overflow-auto max-h-96">{JSON.stringify(menuItems.slice(0, 2), null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Events</h2>
          <p>Count: {events.length}</p>
          <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(events, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Offers</h2>
          <p>Count: {offers.length}</p>
          <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(offers, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Gallery Images</h2>
          <p>Count: {galleryImages.length}</p>
          <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(galleryImages.slice(0, 2), null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}

