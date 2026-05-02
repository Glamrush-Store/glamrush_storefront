const CART_TOKEN_KEY = 'glamrush_cart_token'

function generateCartToken() {
  return 'cart_' + crypto.randomUUID()
}

function getOrCreateCartToken() {
  let token = localStorage.getItem(CART_TOKEN_KEY)
  if (!token) {
    token = generateCartToken()
    localStorage.setItem(CART_TOKEN_KEY, token)
  }
  return token
}

export function useCart() {
  const config = useRuntimeConfig()
  const { loggedIn, session } = useUserSession()

  async function cartRequest(endpoint, options = {}) {
    const headers = { 'Accept': 'application/json', ...options.headers }

    if (loggedIn.value) {
      const token = session.value?.user?.token
      if (token) headers['Authorization'] = `Bearer ${token}`
    } else if (import.meta.client) {
      headers['X-Cart-Token'] = getOrCreateCartToken()
    }

    try {
      return await $fetch(`${config.public.apiBase}${endpoint}`, { ...options, headers })
    } catch (err) {
      if (err.data) return err.data
      throw err
    }
  }

  function clearCartToken() {
    if (import.meta.client) {
      localStorage.removeItem(CART_TOKEN_KEY)
    }
  }

  return { cartRequest, clearCartToken }
}
