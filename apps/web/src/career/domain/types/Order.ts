export type OrderMenu = {
  menuId: number
  name: string
  quantity: number
}

export type Order = {
  totalPrice: number
  orderedMenus: OrderMenu[]
}
