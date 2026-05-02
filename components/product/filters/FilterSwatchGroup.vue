<script setup>
const props = defineProps({
  options: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

function toggle(value) {
  const current = [...props.modelValue]
  const idx = current.indexOf(value)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(value)
  emit('update:modelValue', current)
}

// Determine a readable check colour (white or dark) based on perceived brightness
function checkColor(hex) {
  if (!hex) return 'white'
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#111111' : 'white'
}

// meta may arrive as a parsed object or a raw JSON string
function parseMeta(meta) {
  if (!meta) return null
  if (typeof meta === 'string') {
    try { return JSON.parse(meta) } catch { return null }
  }
  return meta
}

function swatchColor(meta) {
  return parseMeta(meta)?.hex ?? '#d1d5db'
}
</script>

<template>
  <div class="flex flex-wrap gap-2.5">
    <button
      v-for="opt in options"
      :key="opt.value"
      :title="`${opt.label} (${opt.count})`"
      class="relative w-7 h-7 rounded-full border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-neutral-500"
      :class="modelValue.includes(opt.value)
        ? 'border-neutral-900 scale-110 shadow-md'
        : 'border-neutral-200 hover:border-neutral-500'"
      :style="{ backgroundColor: swatchColor(opt.meta) }"
      @click="toggle(opt.value)"
    >
      <span
        v-if="modelValue.includes(opt.value)"
        class="absolute inset-0 flex items-center justify-center"
      >
        <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l3 3 5-5"
            :stroke="checkColor(parseMeta(opt.meta)?.hex)"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </button>
  </div>
</template>
