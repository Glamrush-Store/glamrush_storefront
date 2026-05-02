<script setup>
const { categories } = await useCategories()
const mainCategory = computed(() => categories.value[0] ?? null)
const gridCategories = computed(() => categories.value.slice(1, 5))

const mobileRow1 = computed(() => categories.value.slice(0, 2))
const mobileRow2 = computed(() => categories.value.slice(2, 5))

function bgStyle(url) {
  if (!url) return {}
  return { '--bg-url': `url('${url}')` }
}
</script>

<template>
  <section class="mt-10 mb-16">
    <LayoutContainer>
      <h2 class="hero-font text-3xl font-bold text-center mb-6 text-neutral-900">
        Shop Categories
      </h2>

      <!-- Mobile layout: 2 rows (2-col then 3-col) -->
      <div class="md:hidden space-y-3">
        <!-- Row 1: 2 columns — medium images -->
        <div class="grid grid-cols-2 gap-3 h-[200px]">
          <NuxtLink
            v-for="cat in mobileRow1"
            :key="cat.id"
            :to="`/catalog?category=${cat.slug}`"
            class="cat-card relative overflow-hidden rounded-xl group"
            :style="bgStyle(cat.images?.medium ?? cat.images?.url)"
            :class="{ 'bg-neutral-200': !(cat.images?.medium || cat.images?.url) }"
          >
            <div class="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
            <div class="absolute bottom-3 left-3">
              <span class="text-white font-semibold text-base drop-shadow">{{ cat.name }}</span>
            </div>
          </NuxtLink>
        </div>

        <!-- Row 2: 3 columns — thumb images -->
        <div class="grid grid-cols-3 gap-3 h-[130px]">
          <NuxtLink
            v-for="cat in mobileRow2"
            :key="cat.id"
            :to="`/catalog?category=${cat.slug}`"
            class="cat-card relative overflow-hidden rounded-xl group"
            :style="bgStyle(cat.images?.thumb ?? cat.images?.medium ?? cat.images?.url)"
            :class="{ 'bg-neutral-200': !(cat.images?.thumb || cat.images?.medium || cat.images?.url) }"
          >
            <div class="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
            <div class="absolute bottom-2 left-2">
              <span class="text-white font-semibold text-xs drop-shadow">{{ cat.name }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Desktop layout: 1 tall card left + 2×2 right -->
      <div class="hidden md:grid grid-cols-3 grid-rows-2 gap-3 h-[480px]">
        <NuxtLink
          v-if="mainCategory"
          :to="`/catalog?category=${mainCategory.slug}`"
          class="cat-card row-span-2 relative overflow-hidden rounded-xl group"
          :style="bgStyle(mainCategory.images?.url ?? mainCategory.images?.medium)"
          :class="{ 'bg-neutral-200': !mainCategory.images?.url }"
        >
          <div class="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
          <div class="absolute bottom-5 left-5">
            <span class="text-white font-semibold text-2xl drop-shadow">{{ mainCategory.name }}</span>
          </div>
        </NuxtLink>

        <NuxtLink
          v-for="cat in gridCategories"
          :key="cat.id"
          :to="`/catalog?category=${cat.slug}`"
          class="cat-card relative overflow-hidden rounded-xl group"
          :style="bgStyle(cat.images?.url ?? cat.images?.medium)"
          :class="{ 'bg-neutral-200': !cat.images?.url }"
        >
          <div class="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
          <div class="absolute bottom-4 left-4">
            <span class="text-white font-semibold text-lg drop-shadow">{{ cat.name }}</span>
          </div>
        </NuxtLink>
      </div>

    </LayoutContainer>
  </section>
</template>

<style scoped>
.cat-card {
  background-image: var(--bg-url);
  background-size: cover;
  background-position: center;
}
</style>
