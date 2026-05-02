<script setup>
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: 'default',
  },
})

const variantClass = computed(() => {
  const map = {
    sale: 'bg-[#c89b3c] text-black',
    featured: 'bg-[#111111] text-white',
    new: 'bg-white border border-neutral-300 text-neutral-800',
    'out-of-stock': 'bg-neutral-200 text-neutral-500',
  }
  return map[props.variant] ?? 'bg-neutral-100 text-neutral-700'
})
</script>

<template>
  <span
    class="inline-block px-2 py-0.5 text-[10px] tracking-wider uppercase font-semibold"
    :class="variantClass"
  >
    {{ label }}
  </span>
</template>
