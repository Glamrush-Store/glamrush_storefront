export function useAttributes() {
  const config = useRuntimeConfig()

  const { data } = useAsyncData(
    'attributes',
    () => $fetch(`${config.public.apiBase}/attributes`)
  )

  // Normalize to the same shape as facets.attributes:
  // [{ type, options: [{ value, label, code, display_type, meta }] }]
  const attributes = computed(() => data.value?.data ?? [])

  return { attributes }
}
