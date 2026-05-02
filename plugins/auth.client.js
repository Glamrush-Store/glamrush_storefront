export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  authStore.init()

  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }

  const cart = useCartStore()
  await cart.fetchCart()
})
