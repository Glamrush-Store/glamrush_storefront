export function useApi() {
  const config = useRuntimeConfig()
  const token = useCookie('auth_token')

  async function request(endpoint, options = {}) {
    const headers = { 'Accept': 'application/json', ...options.headers }
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    try {
      return await $fetch(`${config.public.apiBase}${endpoint}`, { ...options, headers })
    } catch (err) {
      if (err.data) return err.data
      throw err
    }
  }

  return { request }
}
