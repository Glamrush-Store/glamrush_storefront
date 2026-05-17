<script setup>
const { categories } = useCategories()
const route = useRoute()

const activeCategory = computed(() => route.query.category ?? null)
</script>

<template>
  <div v-if="categories.length" class="border-b border-neutral-100 bg-white">
    <LayoutContainer>
      <div class="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
        <NuxtLink
          v-for="cat in categories"
          :key="cat.id"
          :to="`/catalog?category=${cat.slug}`"
          class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          :class="activeCategory === cat.slug
            ? 'bg-[#111111] text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'"
        >
          {{ cat.name }}
        </NuxtLink>
      </div>
    </LayoutContainer>
  </div>
</template>
