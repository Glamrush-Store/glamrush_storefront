export function useCmsPage(slug) {
  const cacheKey = `strapi-page-${slug}`

  const { data: pageData, pending, error } = useLazyFetch(
    `/api/cms/pages/${slug}`,
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

  const heroBannerBlock = computed(() =>
    pageData.value?.data?.[0]?.blocks?.find(
      (b) => b.__component === 'blocks.hero-banner'
    )
  )

  return { pageData, heroBannerBlock, pending, error }
}
