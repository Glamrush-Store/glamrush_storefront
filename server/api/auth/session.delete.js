export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  deleteCookie(event, 'auth_token', { path: '/' })
  return { success: true }
})
