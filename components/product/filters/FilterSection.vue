<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="border-b border-neutral-200 pb-6">
    <h3 class="text-sm font-semibold mb-3 text-neutral-900">{{ title }}</h3>
    <slot />
  </div>
</template>
