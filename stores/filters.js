import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFiltersStore = defineStore('filters', () => {
  const categories = ref([])
  const priceRange = ref([0, 1000])
  const sortBy = ref('featured')

  const activeFilters = computed(() => ({
    categories: categories.value,
    priceRange: priceRange.value,
    sortBy: sortBy.value,
  }))

  function setCategories(values) {
    categories.value = values
  }

  function setPriceRange(range) {
    priceRange.value = range
  }

  function setSortBy(value) {
    sortBy.value = value
  }

  function resetFilters() {
    categories.value = []
    priceRange.value = [0, 1000]
    sortBy.value = 'featured'
  }

  return { categories, priceRange, sortBy, activeFilters, setCategories, setPriceRange, setSortBy, resetFilters }
})
