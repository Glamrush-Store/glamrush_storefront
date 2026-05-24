export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  authStore.init()

  const cart = useCartStore()

  async function initializeAuthAndCart() {
    if (authStore.token) {
      if (!authStore.user) {
        await authStore.fetchUser()
      }

      await cart.mergeGuestCart()
      await cart.fetchCart()
      return
    }

    await cart.fetchCart()
  }

  initializeAuthAndCart().catch(() => {})
})
