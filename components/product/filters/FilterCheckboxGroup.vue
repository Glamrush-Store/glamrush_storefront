<script setup>
const props = defineProps({
  // Each option: { value: string, label: string, count: number }
  options: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const expanded = ref(false)
const LIMIT = 6

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
    <label
      v-for="opt in visible"
      :key="opt.value"
      class="flex items-center justify-between cursor-pointer group select-none"
    >
      <div class="flex items-center gap-2.5">
        <input
          type="checkbox"
          :checked="modelValue.includes(opt.value)"
          class="rounded border-neutral-300 text-[#111111] focus:ring-1 focus:ring-[#111111]"
          @change="toggle(opt.value)"
        />
        <span class="text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors">
          {{ opt.label }}
        </span>
      </div>
      <span class="text-xs text-neutral-400 tabular-nums">{{ opt.count }}</span>
    </label>

    <button
      v-if="hiddenCount > 0"
      class="text-xs text-neutral-500 hover:text-neutral-800 transition-colors mt-1"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : `Show ${hiddenCount} more` }}
    </button>
  </div>
</template>
