export function useStockLimit() {
  const toastStore = useToastStore()

  function clamp(value: number, stock: number): number {
    if (value <= stock) return value
    toastStore.add(stock > 0 ? `Доступно лише ${stock} шт.` : 'Товару немає в наявності', 'warning')
    return stock > 0 ? stock : 1
  }

  return { clamp }
}
