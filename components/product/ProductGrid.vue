<script setup>
defineProps({
  products: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    <ProductCard v-for="product in products" :key="product.slug" :product="product" />
  </div>
</template>
