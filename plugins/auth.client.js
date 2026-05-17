export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  authStore.init()

  const cart = useCartStore()

  const initializers = [cart.fetchCart()]
  if (authStore.token && !authStore.user) {
    initializers.push(authStore.fetchUser())
  }

  Promise.all(initializers).catch(() => {})
})
