<script setup>
defineProps({
  products: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div class="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
    <ProductCard v-for="product in products" :key="product.slug" :product="product" />
  </div>
</template>
