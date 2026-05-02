<script setup>
import FilterSection from '~/components/product/filters/FilterSection.vue'
import FilterCheckboxGroup from '~/components/product/filters/FilterCheckboxGroup.vue'
import FilterPriceRange from '~/components/product/filters/FilterPriceRange.vue'
import FilterSwatchGroup from '~/components/product/filters/FilterSwatchGroup.vue'
import FilterChipGroup from '~/components/product/filters/FilterChipGroup.vue'

const props = defineProps({
  facets: { type: Object, default: null },
  activeCategory: { type: String, default: null },
  activeBrand: { type: String, default: null },
  activePriceMin: { type: Number, default: null },
  activePriceMax: { type: Number, default: null },
  activeAttrs: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:category', 'update:brand', 'update:price', 'update:attr', 'clear'])

const categoryOptions = computed(() =>
  (props.facets?.categories ?? []).map(c => ({ value: c.slug, label: c.name, count: c.count }))
)

const brandOptions = computed(() =>
  (props.facets?.brands ?? []).map(b => ({ value: b.slug, label: b.name, count: b.count }))
)

const priceRange = computed(() => props.facets?.price_range ?? { min: 0, max: 10000 })

// Single-select for category: wrap in array for FilterCheckboxGroup, emit single slug back
const selectedCategories = computed({
  get: () => props.activeCategory ? [props.activeCategory] : [],
  set: (vals) => {
    const next = vals.find(v => v !== props.activeCategory) ?? null
    emit('update:category', next)
  },
})

const selectedBrands = computed({
  get: () => props.activeBrand ? [props.activeBrand] : [],
  set: (vals) => {
    const next = vals.find(v => v !== props.activeBrand) ?? null
    emit('update:brand', next)
  },
})

const selectedPrice = computed({
  get: () => [props.activePriceMin, props.activePriceMax],
  set: ([min, max]) => emit('update:price', [min, max]),
})

function getAttrValues(type) {
  return props.activeAttrs[type] ?? []
}

const hasActive = computed(() =>
  !!(props.activeCategory || props.activeBrand || props.activePriceMin || props.activePriceMax ||
    Object.values(props.activeAttrs).some(v => v.length))
)
</script>

<template>
  <aside class="space-y-6">

    <!-- Clear all -->
    <div v-if="hasActive" class="flex items-center justify-between pb-2 border-b border-neutral-100">
      <span class="text-sm font-semibold text-neutral-900">Filters</span>
      <button
        class="text-xs text-neutral-500 hover:text-neutral-900 transition-colors underline underline-offset-2"
        @click="emit('clear')"
      >
        Clear all
      </button>
    </div>

    <!-- Categories -->
    <FilterSection v-if="categoryOptions.length" title="Category">
      <FilterCheckboxGroup v-model="selectedCategories" :options="categoryOptions" />
    </FilterSection>

    <!-- Brands -->
    <FilterSection v-if="brandOptions.length" title="Brand">
      <FilterCheckboxGroup v-model="selectedBrands" :options="brandOptions" />
    </FilterSection>

    <!-- Price -->
    <FilterSection v-if="facets?.price_range" title="Price">
      <FilterPriceRange
        v-model="selectedPrice"
        :min="priceRange.min"
        :max="priceRange.max"
      />
    </FilterSection>

    <!-- Attribute groups — each type (color, size, material…) gets its own section -->
    <template v-if="facets?.attributes?.length">
      <FilterSection
        v-for="group in facets.attributes"
        :key="group.type"
        :title="group.type.charAt(0).toUpperCase() + group.type.slice(1)"
      >
        <!-- Color → swatches -->
        <FilterSwatchGroup
          v-if="group.display_type === 'color_swatch'"
          :options="group.options"
          :model-value="getAttrValues(group.type)"
          @update:model-value="vals => emit('update:attr', { type: group.type, values: vals })"
        />

        <!-- Anything else (size, material…) → text chips -->
        <FilterChipGroup
          v-else
          :options="group.options"
          :model-value="getAttrValues(group.type)"
          @update:model-value="vals => emit('update:attr', { type: group.type, values: vals })"
        />
      </FilterSection>
    </template>

  </aside>
</template>
