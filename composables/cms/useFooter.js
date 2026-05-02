export async function useFooter() {
  const config = useRuntimeConfig()
  const cacheKey = 'strapi-footer'

  const { data: footerData, pending, error } = await useFetch(
    `${config.public.strapiUrl}/footer`,
    {
      key: cacheKey,
      query: {
        'populate[columns][populate]': 'links',
        'populate[socialLinks]': 'true',
        'populate[bottomLinks]': 'true',
      },
      headers: { Authorization: `Bearer ${config.public.strapiToken}` },
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
