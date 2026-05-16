export async function useFooter() {
  const cacheKey = 'strapi-footer'

  const { data: footerData, pending, error } = await useFetch(
    '/api/cms/footer',
    {
      key: cacheKey,
      getCachedData(key, nuxtApp) {
        const cached = nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
        if (!cached?._cacheExpiresAt || Date.now() > cached._cacheExpiresAt) {
          return undefined
        }
        return cached
      },
      transform(response) {
        return { ...response, _cacheExpiresAt: Date.now() + 5 * 60 * 1000 }
      },
    }
  )

  const footer = computed(() => footerData.value?.data ?? null)

  return { footer, pending, error }
}
