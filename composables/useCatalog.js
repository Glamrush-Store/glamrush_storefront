export function useCatalog() {
  const config = useRuntimeConfig()
  const route = useRoute()
  const router = useRouter()

  const activeFilters = computed(() => {
    let attrs = {}
    if (route.query.attrs) {
      try { attrs = JSON.parse(route.query.attrs) } catch {}
    }
    return {
      category: route.query.category || null,
      brand: route.query.brand || null,
      search: route.query.search || null,
      price_min: route.query.price_min != null ? Number(route.query.price_min) : null,
      price_max: route.query.price_max != null ? Number(route.query.price_max) : null,
      sort: route.query.sort || null,
      direction: route.query.direction || null,
      page: route.query.page ? Number(route.query.page) : 1,
      attrs,
    }
  })

  const apiQuery = computed(() => {
    const f = activeFilters.value
    const q = { per_page: 24 }
    if (f.category) q.category = f.category
    if (f.brand) q.brand = f.brand
    if (f.search) q.search = f.search
    if (f.price_min != null) q.price_min = f.price_min
    if (f.price_max != null) q.price_max = f.price_max
    if (f.sort) q.sort = f.sort
    if (f.direction) q.direction = f.direction
    q.page = f.page

    const types = Object.keys(f.attrs).filter(t => f.attrs[t]?.length)
    if (types.length === 1) {
      const [type] = types
      const vals = f.attrs[type]
      q.filters = vals.length === 1
        ? { attributes: { $has: [{ type, value: vals[0] }] } }
        : { attributes: { $hasAny: vals.map(v => ({ type, value: v })) } }
    } else if (types.length > 1) {
      const conditions = types.map(type => {
        const vals = f.attrs[type]
        return vals.length === 1
          ? { attributes: { $has: [{ type, value: vals[0] }] } }
          : { attributes: { $hasAny: vals.map(v => ({ type, value: v })) } }
      })
      q.filters = { $and: conditions }
    }

    return q
  })

  // Synchronous call — Nuxt collects this for SSR automatically without needing async/await
  const { data, pending } = useAsyncData(
    'catalog',
    () => $fetch(`${config.public.apiBase}/products`, { query: apiQuery.value }),
    { watch: [apiQuery] }
  )

  const products = computed(() => data.value?.data ?? [])
  const meta = computed(() => data.value?.meta ?? null)
  const facets = computed(() => data.value?.facets ?? null)

  function setFilter(key, value) {
    const query = { ...route.query }
    if (value == null || value === '') delete query[key]
    else query[key] = value
    if (key !== 'page') delete query.page
    router.push({ query })
  }

  function setFilters(updates) {
    const query = { ...route.query }
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === '') delete query[key]
      else query[key] = value
    }
    delete query.page
    router.push({ query })
  }

  function setAttrFilter(type, values) {
    let current = {}
    if (route.query.attrs) {
      try { current = JSON.parse(route.query.attrs) } catch {}
    }
    if (!values?.length) delete current[type]
    else current[type] = values

    const query = { ...route.query }
    const attrsStr = Object.keys(current).length ? JSON.stringify(current) : null
    if (attrsStr) query.attrs = attrsStr
    else delete query.attrs
    delete query.page
    router.push({ query })
  }

  function clearAll() {
    router.push({ query: {} })
  }

  const hasActiveFilters = computed(() => {
    const f = activeFilters.value
    return !!(f.category || f.brand || f.search || f.price_min || f.price_max || Object.keys(f.attrs).length)
  })

  return {
    activeFilters,
    products,
    meta,
    facets,
    pending,
    setFilter,
    setFilters,
    setAttrFilter,
    clearAll,
    hasActiveFilters,
  }
}
