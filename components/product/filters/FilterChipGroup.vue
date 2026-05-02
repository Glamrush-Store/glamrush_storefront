<script setup>
const props = defineProps({
  options: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const expanded = ref(false)
const LIMIT = 10

const visible = computed(() =>
  expanded.value ? props.options : props.options.slice(0, LIMIT)
)
const hiddenCount = computed(() => props.options.length - LIMIT)

function toggle(value) {
  const current = [...props.modelValue]
  const idx = current.indexOf(value)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(value)
  emit('update:modelValue', current)
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="opt in visible"
        :key="opt.value"
        :title="`${opt.count} products`"
        class="px-3 py-1 text-xs border rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-neutral-500"
        :class="modelValue.includes(opt.value)
          ? 'bg-[#111111] text-white border-[#111111]'
          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-500'"
        @click="toggle(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <button
      v-if="hiddenCount > 0"
      class="text-xs text-neutral-500 hover:text-neutral-800 transition-colors mt-1"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : `Show ${hiddenCount} more` }}
    </button>
  </div>
</template>
