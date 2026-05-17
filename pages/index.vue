<script setup>
const { heroBannerBlock } = useCmsPage('home')
</script>

<template>
  <div>
    <BlocksHeroBlock v-if="heroBannerBlock" :block="heroBannerBlock" />
    <HomeShopCategories />
    <HomeFeaturedProducts />
  </div>
</template>
