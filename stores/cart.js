import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const config = useRuntimeConfig()
  const cartToken = useCookie('cart_token', { sameSite: 'lax', path: '/' })
  const authToken = useCookie('auth_token')

  const itemCount = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))

  function buildHeaders() {
    const h = { Accept: 'application/json' }
    if (authToken.value) {
      h['Authorization'] = `Bearer ${authToken.value}`
    } else if (cartToken.value) {
      h['X-Cart-Token'] = cartToken.value
    }
    return h
  }

  function syncResponse(res) {
    if (!res) return
    if (res.cart_token) cartToken.value = res.cart_token
    if (Array.isArray(res.data)) {
      items.value = res.data
    } else if (res.data) {
      const idx = items.value.findIndex(i => i.product_id === res.data.product_id)
      if (idx >= 0) items.value[idx] = res.data
      else items.value.push(res.data)
    }
  }

  async function fetchCart() {
    const res = await $fetch(`${config.public.apiBase}/cart`, {
      headers: buildHeaders(),
    }).catch(() => null)
    syncResponse(res)
  }

  async function addItem(productId, quantity = 1) {
    try {
      const res = await $fetch(`${config.public.apiBase}/cart`, {
        method: 'POST',
        headers: buildHeaders(),
        body: { product_id: productId, quantity },
      })
      syncResponse(res)
      return true
    } catch {
      return false
    }
  }

  async function updateQuantity(productId, quantity) {
    const prev = items.value.map(i => ({ ...i }))
    const item = items.value.find(i => i.product_id === productId)
    if (item) item.quantity = quantity
    try {
      const res = await $fetch(`${config.public.apiBase}/cart/${productId}`, {
        method: 'PATCH',
        headers: buildHeaders(),
        body: { quantity },
      })
      syncResponse(res)
    } catch {
      items.value = prev
    }
  }

  async function removeItem(productId) {
    const prev = [...items.value]
    items.value = items.value.filter(i => i.product_id !== productId)
    try {
      await $fetch(`${config.public.apiBase}/cart/${productId}`, {
        method: 'DELETE',
        headers: buildHeaders(),
      })
    } catch {
      items.value = prev
    }
  }

  async function clearCart() {
    const prev = [...items.value]
    items.value = []
    try {
      await $fetch(`${config.public.apiBase}/cart`, {
        method: 'DELETE',
        headers: buildHeaders(),
      })
    } catch {
      items.value = prev
    }
  }

  async function mergeGuestCart() {
    if (!cartToken.value || !authToken.value) return
    const res = await $fetch(`${config.public.apiBase}/cart/merge`, {
      method: 'POST',
      headers: buildHeaders(),
      body: { cart_token: cartToken.value },
    }).catch(() => null)
    if (res) {
      items.value = res.data ?? []
      cartToken.value = null
    }
  }

  return { items, itemCount, fetchCart, addItem, updateQuantity, removeItem, clearCart, mergeGuestCart }
})
