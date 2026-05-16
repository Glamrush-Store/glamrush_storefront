export default defineEventHandler(async (event) => {
  const { token, user } = await readBody(event)
  await setUserSession(event, { token, user })
  if (token) {
    setCookie(event, 'auth_token', token, {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
  }
  return { success: true }
})
