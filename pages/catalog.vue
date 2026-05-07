<script setup>
const {
  activeFilters,
  products,
  meta,
  facets,
  pending,
  setFilter,
  setFilters,
  setAttrFilter,
  clearAll,
  hasActiveFilters,
} = useCatalog()

const { attributes: allAttributes } = useAttributes()

// Merge facets with globally fetched attributes.
// facets.attributes has live counts scoped to current filters.
// allAttributes is the full list — used as fallback so the filter
// section is always populated regardless of the current result set.
const displayFacets = computed(() => {
  if (!facets.value && !allAttributes.value?.length) return null

  const facetAttributes = facets.value?.attributes ?? []

  // If facets already have attributes, overlay any global attrs that
  // are missing from the current result set (adding them with count 0).
  let mergedAttributes = facetAttributes
  if (allAttributes.value?.length) {
    const facetTypes = new Set(facetAttributes.map(g => g.type))
    const missing = allAttributes.value.filter(g => !facetTypes.has(g.type)).map(g => ({
      ...g,
      options: g.options.map(o => ({ ...o, count: 0 })),
    }))
    mergedAttributes = [...facetAttributes, ...missing]
  }

  return { ...facets.value, attributes: mergedAttributes }
})

const showMobileFilters = ref(false)

// ─── Sort ────────────────────────────────────────────────────────────────────
const sortOptions = [
  { label: 'Newest',              value: '' },
  { label: 'Price: Low to High',  value: 'price_asc' },
  { label: 'Price: High to Low',  value: 'price_desc' },
  { label: 'Name A–Z',            value: 'name_asc' },
  { label: 'Name Z–A',            value: 'name_desc' },
]

const currentSort = computed(() => {
  if (!activeFilters.value.sort) return ''
  return `${activeFilters.value.sort}_${activeFilters.value.direction || 'asc'}`
})

function handleSort(value) {
  if (!value) {
    setFilters({ sort: null, direction: null })
  } else {
    const idx = value.lastIndexOf('_')
    setFilters({ sort: value.slice(0, idx), direction: value.slice(idx + 1) })
  }
}

// ─── Filter handlers ─────────────────────────────────────────────────────────
function handleCategoryUpdate(slug) { setFilter('category', slug) }
function handleBrandUpdate(slug)    { setFilter('brand', slug) }

function handlePriceUpdate([min, max]) {
  setFilters({ price_min: min ?? null, price_max: max ?? null })
}

function handleAttrUpdate({ type, values }) {
  setAttrFilter(type, values)
}

// ─── Pagination ──────────────────────────────────────────────────────────────
const pageRange = computed(() => {
  if (!meta.value) return []
  const { current_page, last_page } = meta.value
  const delta = 2
  const pages = []
  for (let i = Math.max(1, current_page - delta); i <= Math.min(last_page, current_page + delta); i++) {
    pages.push(i)
  }
  return pages
})
</script>

<template>
  <div>

    <!-- ── Page header ────────────────────────────────────────────────────── -->
    <div class="border-b border-neutral-100 bg-white sticky top-0 z-10">
      <LayoutContainer>
        <div class="py-4 flex items-center justify-between gap-4">
          <div>
            <h1 class="text-lg font-semibold text-neutral-900 leading-tight">All Products</h1>
            <p class="text-xs text-neutral-400 mt-0.5 tabular-nums">
              <template v-if="!pending && meta">{{ meta.total }} product{{ meta.total !== 1 ? 's' : '' }}</template>
              <template v-else>&nbsp;</template>
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <!-- Mobile filter trigger -->
            <button
              class="md:hidden flex items-center gap-1.5 text-sm border border-neutral-200 rounded-md px-3 py-1.5 hover:border-neutral-400 transition-colors"
              @click="showMobileFilters = true"
            >
              <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4" />
              Filters
              <span
                v-if="hasActiveFilters"
                class="bg-[#111111] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center leading-none"
              >
                {{ [activeFilters.category, activeFilters.brand, (activeFilters.price_min || activeFilters.price_max) ? 1 : null, ...Object.values(activeFilters.attrs)].filter(Boolean).length }}
              </span>
            </button>

            <!-- Sort -->
            <select
              :value="currentSort"
              class="text-sm text-neutral-900 border border-neutral-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-neutral-400 cursor-pointer transition-colors hover:border-neutral-400"
              @change="handleSort($event.target.value)"
            >
              <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
      </LayoutContainer>
    </div>

    <!-- ── Main content ───────────────────────────────────────────────────── -->
    <LayoutContainer>
      <div class="flex gap-8 py-8">

        <!-- Sidebar -->
        <div class="hidden md:block w-56 shrink-0">
          <!-- Skeleton while first load -->
          <div v-if="pending && !displayFacets" class="space-y-6 animate-pulse">
            <div v-for="n in 3" :key="n" class="space-y-3">
              <div class="h-3 bg-neutral-200 rounded w-1/3" />
              <div v-for="m in 4" :key="m" class="h-3 bg-neutral-100 rounded w-3/4" />
            </div>
          </div>
          <ProductFilters
            v-else
            :facets="displayFacets"
            :active-category="activeFilters.category"
            :active-brand="activeFilters.brand"
            :active-price-min="activeFilters.price_min"
            :active-price-max="activeFilters.price_max"
            :active-attrs="activeFilters.attrs"
            @update:category="handleCategoryUpdate"
            @update:brand="handleBrandUpdate"
            @update:price="handlePriceUpdate"
            @update:attr="handleAttrUpdate"
            @clear="clearAll"
          />
        </div>

        <!-- Product area -->
        <div class="flex-1 min-w-0">

          <!-- Loading skeleton -->
          <div v-if="pending" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div v-for="n in 12" :key="n" class="animate-pulse">
              <div class="aspect-[4/5] bg-neutral-200 rounded" />
              <div class="mt-3 space-y-2">
                <div class="h-2.5 bg-neutral-200 rounded w-1/3" />
                <div class="h-2.5 bg-neutral-200 rounded w-2/3" />
                <div class="h-2.5 bg-neutral-200 rounded w-1/4" />
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="!products.length"
            class="flex flex-col items-center justify-center py-24 text-center"
          >
            <UIcon name="i-lucide-package-search" class="w-12 h-12 text-neutral-300 mb-4" />
            <p class="text-neutral-700 font-medium">No products found</p>
            <p class="text-sm text-neutral-400 mt-1">Try adjusting your filters</p>
            <button
              v-if="hasActiveFilters"
              class="mt-5 text-sm underline underline-offset-2 text-neutral-600 hover:text-neutral-900 transition-colors"
              @click="clearAll"
            >
              Clear all filters
            </button>
          </div>

          <!-- Grid -->
          <ProductGrid v-else :products="products" />

          <!-- Pagination -->
          <div v-if="meta && meta.last_page > 1" class="mt-12 flex items-center justify-center gap-1">

            <button
              :disabled="meta.current_page === 1"
              class="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded hover:border-neutral-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              @click="setFilter('page', meta.current_page - 1)"
            >
              <UIcon name="i-lucide-chevron-left" class="w-4 h-4" />
            </button>

            <!-- Leading ellipsis -->
            <template v-if="pageRange[0] > 1">
              <button
                class="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded text-sm hover:border-neutral-400 transition-colors"
                @click="setFilter('page', 1)"
              >1</button>
              <span v-if="pageRange[0] > 2" class="w-6 text-center text-neutral-400 text-sm">…</span>
            </template>

            <!-- Page range -->
            <button
              v-for="p in pageRange"
              :key="p"
              class="w-9 h-9 flex items-center justify-center border rounded text-sm transition-colors"
              :class="p === meta.current_page
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'border-neutral-200 hover:border-neutral-400 text-neutral-700'"
              @click="setFilter('page', p)"
            >
              {{ p }}
            </button>

            <!-- Trailing ellipsis -->
            <template v-if="pageRange[pageRange.length - 1] < meta.last_page">
              <span v-if="pageRange[pageRange.length - 1] < meta.last_page - 1" class="w-6 text-center text-neutral-400 text-sm">…</span>
              <button
                class="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded text-sm hover:border-neutral-400 transition-colors"
                @click="setFilter('page', meta.last_page)"
              >{{ meta.last_page }}</button>
            </template>

            <button
              :disabled="meta.current_page === meta.last_page"
              class="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded hover:border-neutral-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              @click="setFilter('page', meta.current_page + 1)"
            >
              <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </LayoutContainer>

    <!-- ── Mobile filter drawer ───────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showMobileFilters"
          class="fixed inset-0 bg-black/40 z-40 md:hidden"
          @click="showMobileFilters = false"
        />
      </Transition>

      <Transition name="slide-in">
        <div
          v-if="showMobileFilters"
          class="fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto md:hidden"
        >
          <div class="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100">
            <span class="text-sm font-semibold">Filters</span>
            <button
              class="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
              @click="showMobileFilters = false"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </div>
          <div class="p-4">
            <ProductFilters
              :facets="displayFacets"
              :active-category="activeFilters.category"
              :active-brand="activeFilters.brand"
              :active-price-min="activeFilters.price_min"
              :active-price-max="activeFilters.price_max"
              :active-attrs="activeFilters.attrs"
              @update:category="handleCategoryUpdate"
              @update:brand="handleBrandUpdate"
              @update:price="handlePriceUpdate"
              @update:attr="handleAttrUpdate"
              @clear="clearAll"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active  { transition: opacity 0.2s ease; }
.fade-enter-from,  .fade-leave-to       { opacity: 0; }

.slide-in-enter-active, .slide-in-leave-active { transition: transform 0.28s ease; }
.slide-in-enter-from,   .slide-in-leave-to     { transform: translateX(-100%); }
</style>
