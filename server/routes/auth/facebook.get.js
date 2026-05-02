export default defineOAuthFacebookEventHandler({
  async onSuccess(event, { tokens }) {
    const config = useRuntimeConfig(event)

    const res = await $fetch(`${config.public.apiBase}/auth/social/facebook`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: { token: tokens.access_token },
    }).catch(() => null)

    if (res?.token) {
      await setUserSession(event, {
        token: res.token,
        user: res.user,
      })
      return sendRedirect(event, '/')
    }

    return sendRedirect(event, '/login?error=social')
  },
  onError(event, _error) {
    return sendRedirect(event, '/login?error=social')
  },
})
