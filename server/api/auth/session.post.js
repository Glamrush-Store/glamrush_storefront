export default defineEventHandler(async (event) => {
  const { token, user } = await readBody(event)
  await setUserSession(event, { token, user })
  return { success: true }
})
