export function useSavedItems() {
  const savedIds = useState('savedItemIds', () => [])
  const savedItemsList = useState('savedItemsList', () => [])

  const { request } = useApi()
  const token = useCookie('auth_token')

  async function fetchSavedItems() {
    if (!token.value) return
    const res = await request('/saved-items')
    if (res?.data) {
      savedItemsList.value = res.data
      savedIds.value = res.data.map(i => i.product_id)
    }
  }

  function isSaved(productId) {
    return savedIds.value.includes(productId)
  }

  async function toggleSave(productId) {
    const wasSaved = isSaved(productId)

    // Snapshot for rollback
    const prevIds = [...savedIds.value]
    const prevList = [...savedItemsList.value]

    // Optimistic update
    if (wasSaved) {
      savedIds.value = savedIds.value.filter(id => id !== productId)
      savedItemsList.value = savedItemsList.value.filter(i => i.product_id !== productId)
    } else {
      savedIds.value = [...savedIds.value, productId]
    }

    try {
      if (wasSaved) {
        await request(`/saved-items/${productId}`, { method: 'DELETE' })
      } else {
        const res = await request('/saved-items', { method: 'POST', body: { product_id: productId } })
        if (res?.data) {
          savedItemsList.value = [...savedItemsList.value, res.data]
        }
      }
      return wasSaved ? 'unsaved' : 'saved'
    } catch {
      // Revert to snapshot
      savedIds.value = prevIds
      savedItemsList.value = prevList
      return 'failed'
    }
  }

  async function removeSaved(productId) {
    await request(`/saved-items/${productId}`, { method: 'DELETE' })
    savedIds.value = savedIds.value.filter(id => id !== productId)
    savedItemsList.value = savedItemsList.value.filter(i => i.product_id !== productId)
  }

  return { savedItemsList, savedIds, fetchSavedItems, isSaved, toggleSave, removeSaved }
}
