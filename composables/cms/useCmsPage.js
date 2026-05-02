export async function useCmsPage(slug) {
  const config = useRuntimeConfig()
  const cacheKey = `strapi-page-${slug}`

  const { data: pageData, pending, error } = await useFetch(
    `${config.public.strapiUrl}/pages`,
    {
      key: cacheKey,
      query: {
        'filters[slug][$eq]': slug,
        populate: 'blocks.backgroundImage,blocks.cta',
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

  const heroBannerBlock = computed(() =>
    pageData.value?.data?.[0]?.blocks?.find(
      (b) => b.__component === 'blocks.hero-banner'
    )
  )

  return { pageData, heroBannerBlock, pending, error }
}
