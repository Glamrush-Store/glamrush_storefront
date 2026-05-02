import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const { user, loggedIn } = useUserSession()
  const profile = computed(() => user.value ?? null)
  const isLoggedIn = computed(() => loggedIn.value)
  return { profile, isLoggedIn }
})
