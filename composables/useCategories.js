export function useCategories() {
  const config = useRuntimeConfig()

  const { data, pending, error } = useLazyFetch(
    `${config.public.apiBase}/categories`,
    {
      key: 'categories-list',
      query: { deep: false },
    }
  )

  const categories = computed(() => data.value?.data?.slice(0, 5) ?? [])

  return { categories, pending, error }
}
