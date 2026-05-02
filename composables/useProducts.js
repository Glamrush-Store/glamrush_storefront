export async function useProducts(query = {}) {
  const config = useRuntimeConfig()
  const cacheKey = `products-${JSON.stringify(query)}`

  const { data, pending, error } = await useFetch(
    `${config.public.apiBase}/products`,
    { key: cacheKey, query }
  )

  const products = computed(() => data.value?.data ?? [])
  return { products, pending, error }
}
