export type MenuCategory = {
    id: string
    name: string
    count: number
}

export type MenuCard = {
    id: string
    title: string
    description: string
    categoryName: string
    price: number
    oldPrice?: number | null
    label: string
    imageUrl?: string | null
    slug: string
}
