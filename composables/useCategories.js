export async function useCategories() {
  const config = useRuntimeConfig()

  const { data, pending, error } = await useFetch(
    `${config.public.apiBase}/categories`,
    {
      key: 'categories-list',
      query: { deep: false },
    }
  )

  const categories = computed(() => data.value?.data?.slice(0, 5) ?? [])

  return { categories, pending, error }
}
