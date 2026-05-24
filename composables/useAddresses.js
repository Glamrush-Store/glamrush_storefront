export function useAddresses() {
  const { request } = useApi()

  const addresses = ref([])
  const loading = shallowRef(false)

  async function fetchAddresses() {
    loading.value = true
    try {
      const res = await request('/addresses')
      if (res?.success) addresses.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function createAddress(data) {
    return request('/addresses', { method: 'POST', body: data })
  }

  async function updateAddress(id, data) {
    return request(`/addresses/${id}`, { method: 'PATCH', body: data })
  }

  async function deleteAddress(id) {
    return request(`/addresses/${id}`, { method: 'DELETE' })
  }

  async function setDefaultAddress(id) {
    return request(`/addresses/${id}/default`, { method: 'PATCH' })
  }

  return {
    addresses,
    loading,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  }
}
