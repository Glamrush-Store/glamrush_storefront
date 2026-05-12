export function useApi() {
  const config = useRuntimeConfig()
  const token = useCookie('auth_token')

  async function request(endpoint, options = {}) {
    const headers = { 'Accept': 'application/json', ...options.headers }
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    return await $fetch(`${config.public.apiBase}${endpoint}`, { ...options, headers })
  }

  return { request }
}
