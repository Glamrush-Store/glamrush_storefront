import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref([])

  const count = computed(() => items.value.length)

  function addItem(product) {
    if (!items.value.find((i) => i.id === product.id)) {
      items.value.push(product)
    }
  }

  function removeItem(productId) {
    items.value = items.value.filter((i) => i.id !== productId)
  }

  function toggle(product) {
    const exists = items.value.find((i) => i.id === product.id)
    if (exists) removeItem(product.id)
    else addItem(product)
  }

  function isWishlisted(productId) {
    return items.value.some((i) => i.id === productId)
  }

  return { items, count, addItem, removeItem, toggle, isWishlisted }
})
