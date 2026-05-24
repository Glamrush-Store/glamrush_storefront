export function useOrders() {
  const { request } = useApi()

  const orders = ref([])
  const meta = shallowRef(null)
  const loading = shallowRef(false)
  const error = shallowRef('')

  async function fetchOrders(page = 1) {
    loading.value = true
    error.value = ''

    try {
      const res = await request('/orders', {
        query: { page },
      })

      if (res?.success) {
        orders.value = Array.isArray(res.data) ? res.data : []
        meta.value = res.meta ?? null
      } else {
        orders.value = []
        meta.value = null
        error.value = res?.message ?? 'Unable to load orders.'
      }
    } catch (e) {
      orders.value = []
      meta.value = null
      error.value = e?.data?.message ?? 'Unable to load orders.'
    } finally {
      loading.value = false
    }
  }

  return {
    orders,
    meta,
    loading,
    error,
    fetchOrders,
  }
}
