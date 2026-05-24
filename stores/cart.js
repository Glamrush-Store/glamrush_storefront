import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const subtotal = ref(0)
  const thumbOverrides = reactive({})
  const config = useRuntimeConfig()
  const cartToken = useCookie('cart_token', { sameSite: 'lax', path: '/' })
  const authToken = useCookie('auth_token')

  const itemCount = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))

  function createCartToken() {
    if (import.meta.client && globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID()
    }

    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 15)}`
  }

  function getOrCreateCartToken() {
    if (!cartToken.value || cartToken.value.length > 36) {
      cartToken.value = createCartToken()
    }

    return cartToken.value
  }

  function buildHeaders() {
    const h = { Accept: 'application/json' }
    if (authToken.value) {
      h['Authorization'] = `Bearer ${authToken.value}`
    } else {
      h['X-Cart-Token'] = getOrCreateCartToken()
    }
    return h
  }

  function syncResponse(res) {
    if (!res) return
    if (res.cart_token) cartToken.value = res.cart_token
    if (Array.isArray(res.data)) {
      items.value = res.data
      subtotal.value = res.subtotal ?? 0
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

  async function addItem(productId, quantity = 1, imageUrl = null, variantId = null) {
    try {
      const body = { product_id: productId, quantity }
      if (variantId) body.variant_id = variantId
      await $fetch(`${config.public.apiBase}/cart`, {
        method: 'POST',
        headers: buildHeaders(),
        body,
      })
      if (imageUrl) thumbOverrides[productId] = imageUrl
      await fetchCart()
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
    delete thumbOverrides[productId]
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
      subtotal.value = res.subtotal ?? 0
      cartToken.value = null
    }
  }

  return { items, subtotal, thumbOverrides, itemCount, fetchCart, addItem, updateQuantity, removeItem, clearCart, mergeGuestCart }
})
