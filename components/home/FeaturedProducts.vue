<script setup>
const { products } = useProducts({ featured: true, per_page: 4 })
</script>

<template>
  <section class="py-16">
    <LayoutContainer>
      <div class="flex items-end justify-between mb-10">
        <div>
          <p class="text-xs tracking-widest uppercase text-[#c89b3c] mb-1">Handpicked</p>
          <h2 class="hero-font text-3xl font-medium text-[#111111]">Featured Products</h2>
        </div>
        <NuxtLink to="/products" class="text-sm text-neutral-500 hover:text-[#111111] transition-colors">
          View All →
        </NuxtLink>
      </div>

      <ProductGrid v-if="products.length" :products="products" />

      <!-- Skeleton while loading -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div v-for="i in 4" :key="i" class="animate-pulse">
          <div class="aspect-[4/5] bg-neutral-200 mb-3" />
          <div class="h-2.5 bg-neutral-200 w-1/3 mb-2" />
          <div class="h-3 bg-neutral-200 w-4/5 mb-2" />
          <div class="h-3 bg-neutral-200 w-1/4" />
        </div>
      </div>
    </LayoutContainer>
  </section>
</template>
