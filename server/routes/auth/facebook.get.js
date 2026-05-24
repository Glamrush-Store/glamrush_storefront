export default defineOAuthFacebookEventHandler({
  async onSuccess(event, { tokens }) {
    const config = useRuntimeConfig(event)
    const apiBase = config.apiBase || config.public.apiBase

    const res = await $fetch(`${apiBase}/auth/social/facebook`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: { token: tokens.access_token },
    }).catch(() => null)

    const authData = res?.data ?? res

    if (authData?.token) {
      await setUserSession(event, {
        token: authData.token,
        user: authData.user,
      })
      setCookie(event, 'auth_token', authData.token, {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
      return sendRedirect(event, '/')
    }

    return sendRedirect(event, '/login?error=social')
  },
  onError(event, _error) {
    return sendRedirect(event, '/login?error=social')
  },
})
