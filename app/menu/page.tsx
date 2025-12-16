import { getMenuCategories, getMenuItems } from '@/lib/queries'
import MenuClient from '@/components/MenuClient'

export default async function MenuPage() {
  const categories = await getMenuCategories()
  const allItems = await getMenuItems()

  return <MenuClient categories={categories} items={allItems} />
}
