<script setup>
const props = defineProps({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 10000 },
  modelValue: { type: Array, default: () => [null, null] }, // [price_min, price_max]
})

const emit = defineEmits(['update:modelValue'])

const localMin = ref(props.modelValue[0] ?? '')
const localMax = ref(props.modelValue[1] ?? '')

watch(() => props.modelValue, ([min, max]) => {
  localMin.value = min ?? ''
  localMax.value = max ?? ''
})

function apply() {
  const min = localMin.value !== '' ? Number(localMin.value) : null
  const max = localMax.value !== '' ? Number(localMax.value) : null
  emit('update:modelValue', [min, max])
}

function clear() {
  localMin.value = ''
  localMax.value = ''
  emit('update:modelValue', [null, null])
}

const hasActive = computed(() => props.modelValue[0] != null || props.modelValue[1] != null)

function formatBound(val) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(val)
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs text-neutral-400">
      Range: {{ formatBound(min) }} – {{ formatBound(max) }}
    </p>

    <div class="flex items-center gap-2">
      <input
        v-model="localMin"
        type="number"
        :min="min"
        :max="max"
        placeholder="Min"
        class="w-full border border-neutral-200 rounded px-2.5 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
        @blur="apply"
        @keydown.enter="apply"
      />
      <span class="text-neutral-400 shrink-0">–</span>
      <input
        v-model="localMax"
        type="number"
        :min="min"
        :max="max"
        placeholder="Max"
        class="w-full border border-neutral-200 rounded px-2.5 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
        @blur="apply"
        @keydown.enter="apply"
      />
    </div>

    <button
      v-if="hasActive"
      class="text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
      @click="clear"
    >
      Clear price
    </button>
  </div>
</template>
