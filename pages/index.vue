<script setup>
const { heroBannerBlock } = await useCmsPage('home')
</script>

<template>
  <div>
    <BlocksHeroBlock v-if="heroBannerBlock" :block="heroBannerBlock" />
    <HomeShopCategories />
    <HomeFeaturedProducts />
  </div>
</template>
