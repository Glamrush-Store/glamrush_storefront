<script setup>
import FilterSwatchGroup from '~/components/product/filters/FilterSwatchGroup.vue'

const route = useRoute()
const config = useRuntimeConfig()

// ── Product fetch ────────────────────────────────────────────────────────────
const { data: productData, pending } = await useAsyncData(
  `product-${route.params.slug}`,
  () => $fetch(`${config.public.apiBase}/products/${route.params.slug}`)
)

const product = computed(() => productData.value?.data ?? null)

useHead(() => ({
  title: product.value ? `${product.value.name} | Glamrush` : 'Glamrush',
  meta: [
    {
      name: 'description',
      content: product.value?.description?.replace(/<[^>]+>/g, '').slice(0, 160) ?? '',
    },
  ],
}))

// ── Variant selection ────────────────────────────────────────────────────────
const isVariable = computed(() => product.value?.type === 'variable')

const defaultVariant = computed(() =>
  product.value?.variants?.find(v => v.isDefault) ?? product.value?.variants?.[0] ?? null
)

// default_attributes is the canonical source for the initial selection and attr order.
// Fall back to isDefault variant attributes for older API shapes.
const _defaultAttrs = product.value?.default_attributes ?? []
const _initialDefault = _defaultAttrs.length
  ? (product.value?.variants?.find(v =>
      _defaultAttrs.every(da => v.attributes?.some(a => a.type === da.type && a.value === da.value))
    ) ?? product.value?.variants?.find(v => v.isDefault) ?? product.value?.variants?.[0] ?? null)
  : (product.value?.variants?.find(v => v.isDefault) ?? product.value?.variants?.[0] ?? null)

const selectedAttrs = ref(
  _defaultAttrs.length
    ? Object.fromEntries(_defaultAttrs.map(a => [a.type, a.value]))
    : Object.fromEntries((_initialDefault?.attributes ?? []).map(a => [a.type, a.value]))
)
const selectedVariantId = ref(_initialDefault?.id ?? null)

const activeVariant = computed(() =>
  product.value?.variants?.find(v => v.id === selectedVariantId.value) ?? defaultVariant.value
)

// ── Image carousel ───────────────────────────────────────────────────────────

// Variable products: flat list of { url, variantId } across every variant in order.
// Sliding to any entry auto-selects the owning variant.
const variantImageEntries = computed(() => {
  if (!isVariable.value) return []
  return (product.value?.variants ?? []).flatMap(v =>
    (v.images ?? [])
      .map(img => img.url ?? img.medium)
      .filter(Boolean)
      .map(url => ({ url, variantId: v.id }))
  )
})

const allImages = computed(() => {
  if (isVariable.value) return variantImageEntries.value.map(e => e.url)
  const src = product.value?.images?.length
    ? product.value.images
    : (defaultVariant.value?.images ?? [])
  return src.map(img => img.url ?? img.medium).filter(Boolean)
})

// Start at the first image belonging to the initial (default) variant
const _initialImageIdx = (() => {
  if (!isVariable.value) return 0
  const defaultId = _initialDefault?.id ?? null
  const idx = (product.value?.variants ?? [])
    .flatMap(v => (v.images ?? []).map(img => ({ url: img.url ?? img.medium, variantId: v.id })))
    .filter(e => e.url)
    .findIndex(e => e.variantId === defaultId)
  return idx >= 0 ? idx : 0
})()

const activeImageIdx = ref(_initialImageIdx)

// Prevents the selectedVariantId watcher from overriding an index already set
// by goToImage when the carousel itself is driving a variant change.
let _carouselDriving = false

// Variant changed via swatch/chip → jump carousel to that variant's first image
watch(selectedVariantId, (newId) => {
  if (_carouselDriving) return
  if (isVariable.value && newId) {
    const idx = variantImageEntries.value.findIndex(e => e.variantId === newId)
    activeImageIdx.value = idx >= 0 ? idx : 0
  } else {
    activeImageIdx.value = 0
  }
})

// Navigate carousel; for variable products auto-selects the variant shown at index i
function goToImage(i) {
  if (i < 0 || i >= allImages.value.length) return
  activeImageIdx.value = i
  if (isVariable.value) {
    const entry = variantImageEntries.value[i]
    if (entry && entry.variantId !== selectedVariantId.value) {
      const variant = product.value?.variants?.find(v => v.id === entry.variantId)
      if (variant) {
        _carouselDriving = true
        selectedVariantId.value = entry.variantId
        selectedAttrs.value = Object.fromEntries(
          (variant.attributes ?? []).map(a => [a.type, a.value])
        )
        nextTick(() => { _carouselDriving = false })
      }
    }
  }
}

function nextImg() { goToImage(activeImageIdx.value + 1) }
function prevImg() { goToImage(activeImageIdx.value - 1) }

let touchStartX = 0
function onTouchStart(e) { touchStartX = e.touches[0].clientX }
function onTouchEnd(e) {
  const dx = touchStartX - e.changedTouches[0].clientX
  if (Math.abs(dx) > 40) dx > 0 ? nextImg() : prevImg()
}

// ── Attribute groups with availability filtering ──────────────────────────────
// Build option metadata from all variants. default_attributes establishes both
// the canonical type ORDER and the display_type for each type — variant attributes
// may omit display_type (e.g. the Black variant), so we inherit it from there.
const allOptionsMeta = computed(() => {
  const map = new Map()
  const daList = product.value?.default_attributes ?? []

  // 1. Pre-seed map keys in default_attributes order
  for (const da of daList) {
    if (!map.has(da.type)) map.set(da.type, new Map())
  }

  // 2. Populate values from all variant attributes
  for (const v of product.value?.variants ?? []) {
    for (const a of v.attributes ?? []) {
      if (!map.has(a.type)) map.set(a.type, new Map())
      if (!map.get(a.type).has(a.value)) {
        let hex = null
        try {
          const m = typeof a.meta === 'string' ? JSON.parse(a.meta) : a.meta
          hex = m?.hex ?? null
        } catch {}
        // Inherit display_type from default_attributes when the variant attr omits it
        const daMatch = daList.find(da => da.type === a.type)
        const display_type = a.display_type ?? daMatch?.display_type ?? null
        map.get(a.type).set(a.value, { value: a.value, code: a.code, hex, meta: a.meta, display_type })
      }
    }
  }
  return map
})

// Which values are reachable for `type` given only the attrs that appear BEFORE
// it in the established attribute order. Filtering by all other selected attrs
// creates a circular deadlock (e.g. color=Red locks size=Large even though
// Black+Large is valid). Using only preceding types breaks the cycle: the first
// attribute is never restricted, each subsequent one is filtered by the choice
// made in the attribute(s) before it.
function validValuesForType(type) {
  const allTypes = [...allOptionsMeta.value.keys()]
  const typeIndex = allTypes.indexOf(type)
  const precedingSelected = allTypes
    .slice(0, typeIndex)
    .flatMap(t => selectedAttrs.value[t] !== undefined ? [[t, selectedAttrs.value[t]]] : [])

  const reachable = (product.value?.variants ?? []).filter(v =>
    precedingSelected.every(([t, val]) => v.attributes?.some(a => a.type === t && a.value === val))
  )
  const valid = new Set()
  for (const v of reachable) {
    const a = v.attributes?.find(a => a.type === type)
    if (a) valid.add(a.value)
  }
  return valid
}

// attrGroups is reactive to selectedAttrs — options get a `disabled` flag
// when they don't exist in any variant compatible with the current selection.
const attrGroups = computed(() => {
  if (!allOptionsMeta.value.size) return []
  return [...allOptionsMeta.value.entries()].map(([type, optionsMap]) => {
    const validValues = validValuesForType(type)
    const options = [...optionsMap.values()].map(opt => ({
      ...opt,
      disabled: !validValues.has(opt.value),
    }))
    const isColorSwatch = options.some(o => o.hex || o.display_type === 'color_swatch')
    return { type, options, isColorSwatch }
  })
})

// Unified selection handler for all attribute types.
// After setting the new value, any previously-selected attr that is no longer
// pairwise compatible with the new choice is cleared.
function selectAttr(type, value) {
  const next = { [type]: value }
  for (const [t, v] of Object.entries(selectedAttrs.value)) {
    if (t === type) continue
    const compatible = (product.value?.variants ?? []).some(variant =>
      variant.attributes?.some(a => a.type === type && a.value === value) &&
      variant.attributes?.some(a => a.type === t && a.value === v)
    )
    if (compatible) next[t] = v
  }
  selectedAttrs.value = next

  // Resolve to an exact variant only when every attribute type has been chosen.
  const allTypes = [...allOptionsMeta.value.keys()]
  const complete = allTypes.every(t => next[t] !== undefined)
  selectedVariantId.value = complete
    ? (product.value?.variants?.find(v =>
        allTypes.every(t => v.attributes?.some(a => a.type === t && a.value === next[t]))
      )?.id ?? null)
    : null
}

// Swatch adapter — value is the attr value string (not a variantId).
// Pass o.meta as-is (raw JSON string from the API) so FilterSwatchGroup's
// parseMeta extracts the hex correctly. Fall back to o.hex if meta is absent.
function groupSwatchOptions(group) {
  return group.options.map(o => ({
    value: o.value,
    label: o.value,
    count: null,
    meta: o.meta ?? (o.hex ? { hex: o.hex } : null),
    disabled: o.disabled,
  }))
}

function groupSwatchModelValue(group) {
  const sel = selectedAttrs.value[group.type]
  return sel ? [sel] : []
}

function handleGroupSwatchSelect(group, values) {
  const current = groupSwatchModelValue(group)
  const newVal = values.find(v => !current.includes(v))
  if (newVal) selectAttr(group.type, newVal)
}

// ── Pricing ──────────────────────────────────────────────────────────────────
const activePrice = computed(() => activeVariant.value?.price ?? product.value?.price ?? 0)
const activeSalePrice = computed(() => {
  const v = activeVariant.value
  return v?.isOnSale && v?.salePrice !== v?.price ? v.salePrice : null
})
// For variable products every attribute type must be chosen before the cart is enabled.
// For simple products this is always true.
const isCompleteSelection = computed(() =>
  !isVariable.value || [...allOptionsMeta.value.keys()].every(t => selectedAttrs.value[t] !== undefined)
)

// Variable product availability comes from the active variant, not the product root
// (product.available is always true for variable products at the API level).
const isAvailable = computed(() => {
  if (isVariable.value) return isCompleteSelection.value && (activeVariant.value?.available ?? false)
  return product.value?.available ?? false
})

const activeVariantSku = computed(() => activeVariant.value?.sku ?? product.value?.sku ?? null)
const variantStock = computed(() => maxQty.value === Infinity ? null : maxQty.value)

const addToCartLabel = computed(() => {
  if (!isCompleteSelection.value) return 'Select Options'
  return isAvailable.value ? 'Add to Cart' : 'Out of Stock'
})
const discount = computed(() =>
  activeSalePrice.value ? Math.round(((activePrice.value - activeSalePrice.value) / activePrice.value) * 100) : 0
)

function fmt(n) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(n)
}

// ── Quantity ─────────────────────────────────────────────────────────────────
const qty = ref(1)

// Check variant stock first, fall back to product-level stock, then unlimited
const maxQty = computed(() => {
  const v = activeVariant.value
  const variantStock = v?.stock_quantity ?? null
  if (variantStock !== null) return Math.max(0, variantStock)
  const productStock = product.value?.stock_quantity ?? null
  return productStock !== null ? Math.max(0, productStock) : Infinity
})

// Reset qty to within bounds whenever the active variant changes
watch(activeVariant, () => {
  if (qty.value > maxQty.value) qty.value = Math.max(1, maxQty.value)
})

function incQty() { if (qty.value < maxQty.value) qty.value++ }
function decQty() { if (qty.value > 1) qty.value-- }

// ── Cart ─────────────────────────────────────────────────────────────────────
const cart = useCartStore()
const { bump } = useCartAnimation()
const addingToCart = ref(false)

const currentImage = computed(() => allImages.value[activeImageIdx.value] ?? null)

async function handleAddToCart() {
  if (addingToCart.value || buyingNow.value || !isAvailable.value) return
  addingToCart.value = true
  const success = await cart.addItem(product.value.id, qty.value, currentImage.value, selectedVariantId.value)
  addingToCart.value = false
  if (success) bump()
}

const buyingNow = ref(false)

async function handleBuyNow() {
  if (buyingNow.value || addingToCart.value || !isAvailable.value) return
  buyingNow.value = true
  const success = await cart.addItem(product.value.id, qty.value, currentImage.value, selectedVariantId.value)
  buyingNow.value = false
  if (success) navigateTo('/checkout/information')
}

// ── Wishlist ─────────────────────────────────────────────────────────────────
const token = useCookie('auth_token')
const { isSaved, toggleSave } = useSavedItems()
const { trigger: triggerSave } = useSaveAnimation()
const saving = ref(false)

async function handleSave() {
  if (!token.value) { navigateTo('/login'); return }
  triggerSave(isSaved(product.value.id) ? 'unsaved' : 'saved')
  saving.value = true
  const result = await toggleSave(product.value.id)
  saving.value = false
  if (result === 'failed') triggerSave('failed')
}

// ── Related products ─────────────────────────────────────────────────────────
const { data: relatedRes } = await useAsyncData(
  `related-${route.params.slug}`,
  () => {
    const cat = productData.value?.data?.category?.slug
    if (!cat) return Promise.resolve(null)
    return $fetch(`${config.public.apiBase}/products`, { query: { category: cat, per_page: 8 } })
  }
)

const relatedProducts = computed(() =>
  (relatedRes.value?.data ?? []).filter(p => p.slug !== route.params.slug).slice(0, 4)
)

// ── Accordion ────────────────────────────────────────────────────────────────
const openSection = ref('about')
function toggleSection(id) {
  openSection.value = openSection.value === id ? null : id
}
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <div class="border-b border-neutral-100">
      <LayoutContainer>
        <nav class="flex items-center gap-2 py-3 text-xs text-neutral-400 overflow-x-auto whitespace-nowrap">
          <NuxtLink to="/" class="hover:text-neutral-700 transition-colors shrink-0">Home</NuxtLink>
          <span>/</span>
          <NuxtLink to="/catalog" class="hover:text-neutral-700 transition-colors shrink-0">Products</NuxtLink>
          <template v-if="product?.category">
            <span>/</span>
            <NuxtLink
              :to="`/catalog?category=${product.category.slug}`"
              class="hover:text-neutral-700 transition-colors shrink-0"
            >
              {{ product.category.name }}
            </NuxtLink>
          </template>
          <span>/</span>
          <span class="text-neutral-700 truncate max-w-[160px] sm:max-w-none">{{ product?.name ?? '...' }}</span>
        </nav>
      </LayoutContainer>
    </div>

    <!-- Loading skeleton -->
    <div v-if="pending" class="min-h-[70vh] flex items-center justify-center">
      <div class="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
    </div>

    <!-- Product not found -->
    <div v-else-if="!product" class="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <p class="text-lg font-medium text-neutral-800">Product not found</p>
      <NuxtLink to="/catalog" class="text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-800">
        Back to catalogue
      </NuxtLink>
    </div>

    <!-- Product content -->
    <template v-else>
      <LayoutContainer>
        <div class="py-6 lg:py-10 lg:grid lg:grid-cols-[1fr_540px] xl:grid-cols-[1fr_640px] lg:gap-10 xl:gap-16">

          <!-- ── Left: Image gallery ──────────────────────────────────────── -->
          <div class="lg:sticky lg:top-20 lg:self-start">

            <!-- Main carousel -->
            <div
              class="relative aspect-[4/5] bg-neutral-100 overflow-hidden select-none"
              @touchstart.passive="onTouchStart"
              @touchend.passive="onTouchEnd"
            >
              <!-- Images (fade transition via opacity) -->
              <img
                v-for="(img, i) in allImages"
                :key="i"
                :src="img"
                :alt="`${product.name} — image ${i + 1}`"
                class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                :class="i === activeImageIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'"
              />

              <!-- No image fallback -->
              <div v-if="!allImages.length" class="absolute inset-0 flex items-center justify-center">
                <span class="text-neutral-300 text-xs tracking-widest uppercase">No Image</span>
              </div>

              <!-- Desktop arrow navigation -->
              <template v-if="allImages.length > 1">
                <button
                  class="hidden lg:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 backdrop-blur-sm items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer disabled:opacity-30"
                  :disabled="activeImageIdx === 0"
                  aria-label="Previous image"
                  @click="prevImg"
                >
                  <UIcon name="i-lucide-chevron-left" class="w-4 h-4 text-neutral-800" />
                </button>
                <button
                  class="hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 backdrop-blur-sm items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer disabled:opacity-30"
                  :disabled="activeImageIdx === allImages.length - 1"
                  aria-label="Next image"
                  @click="nextImg"
                >
                  <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-neutral-800" />
                </button>
              </template>

              <!-- Mobile dot indicators -->
              <div v-if="allImages.length > 1" class="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 lg:hidden">
                <button
                  v-for="(_, i) in allImages"
                  :key="i"
                  class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
                  :class="i === activeImageIdx ? 'w-4 bg-[#111111]' : 'w-1.5 bg-neutral-400'"
                  :aria-label="`Go to image ${i + 1}`"
                  @click="goToImage(i)"
                />
              </div>

              <!-- Badges: top-left -->
              <div class="absolute top-3 left-3 flex flex-col gap-1.5">
                <ProductBadge v-if="activeSalePrice" label="Sale" variant="sale" />
                <ProductBadge v-if="!isAvailable" label="Sold Out" variant="out-of-stock" />
              </div>

              <!-- Wishlist button: top-right -->
              <button
                v-if="token"
                class="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                :disabled="saving"
                :aria-label="isSaved(product.id) ? 'Remove from wishlist' : 'Add to wishlist'"
                @click="handleSave"
              >
                <UIcon
                  name="i-lucide-heart"
                  class="w-4 h-4 transition-colors"
                  :class="isSaved(product.id) ? 'fill-red-500 text-red-500' : 'text-neutral-700'"
                />
              </button>
            </div>

            <!-- Thumbnail strip (desktop only) -->
            <div v-if="allImages.length > 1" class="hidden lg:flex gap-2 mt-3 overflow-x-auto pb-1">
              <button
                v-for="(img, i) in allImages"
                :key="i"
                class="flex-none w-[72px] aspect-square overflow-hidden border-2 transition-all duration-200 cursor-pointer"
                :class="i === activeImageIdx ? 'border-[#111111]' : 'border-transparent hover:border-neutral-300'"
                :aria-label="`View image ${i + 1}`"
                @click="goToImage(i)"
              >
                <img :src="img" :alt="`${product.name} thumbnail ${i + 1}`" class="w-full h-full object-cover" />
              </button>
            </div>

          </div>

          <!-- ── Right: Product details ────────────────────────────────────── -->
          <div class="mt-6 lg:mt-0 pb-28 lg:pb-0">

            <!-- Brand -->
            <p class="text-[11px] tracking-widest uppercase text-neutral-400 mb-1">
              {{ product.brand?.name }}
            </p>

            <!-- Name -->
            <h1 class="text-xl lg:text-[22px] font-medium text-[#111111] leading-snug">
              {{ product.name }}
            </h1>

            <!-- SKU -->
            <p v-if="activeVariantSku" class="text-[10px] tracking-widest uppercase text-neutral-400 mt-1">
              SKU: {{ activeVariantSku }}
            </p>

            <!-- Price -->
            <div class="flex items-baseline flex-wrap gap-x-3 gap-y-1 mt-3">
              <span
                v-if="activeSalePrice"
                class="text-xl font-semibold text-[#111111]"
              >
                {{ fmt(activeSalePrice) }}
              </span>
              <span
                class="text-xl"
                :class="activeSalePrice
                  ? 'text-base line-through text-neutral-400 font-normal'
                  : 'font-semibold text-[#111111]'"
              >
                {{ fmt(activePrice) }}
              </span>
              <span
                v-if="discount > 0"
                class="text-[11px] tracking-widest uppercase font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5"
              >
                {{ discount }}% off
              </span>
            </div>

            <!-- Stock notice -->
            <p v-if="!isAvailable" class="mt-2 text-xs text-red-500 tracking-wide uppercase">
              Currently out of stock
            </p>

            <!-- Variant stock quantity -->
            <p v-else-if="variantStock !== null" class="mt-2 text-xs tracking-wide uppercase">
              <span v-if="variantStock === 0" class="text-red-500 font-medium">Out of stock</span>
              <span v-else-if="variantStock <= 5" class="text-red-500 font-medium">Only {{ variantStock }} left in stock</span>
              <span v-else-if="variantStock <= 15" class="text-amber-600">{{ variantStock }} in stock</span>
              <span v-else class="text-emerald-600">{{ variantStock }} in stock</span>
            </p>

            <!-- Divider -->
            <div class="mt-5 border-t border-neutral-100" />

            <!-- Attribute groups: color swatches or text chips -->
            <div
              v-for="group in attrGroups"
              :key="group.type"
              class="mt-5"
            >
              <p class="text-[11px] tracking-widest uppercase text-neutral-500 mb-2.5">
                {{ group.type }}
                <template v-if="selectedAttrs[group.type]">
                  : <span class="text-neutral-800 font-semibold">{{ selectedAttrs[group.type] }}</span>
                </template>
              </p>

              <!-- Color swatch group (detected by hex data) -->
              <FilterSwatchGroup
                v-if="group.isColorSwatch"
                :options="groupSwatchOptions(group)"
                :model-value="groupSwatchModelValue(group)"
                @update:model-value="vals => handleGroupSwatchSelect(group, vals)"
              />

              <!-- Text chip group (size, material, etc.) -->
              <div v-else class="flex flex-wrap gap-2">
                <button
                  v-for="opt in group.options"
                  :key="opt.code"
                  class="min-w-[44px] h-9 px-3 border text-xs tracking-wide font-medium uppercase transition-all"
                  :class="opt.disabled
                    ? 'border-neutral-200 text-neutral-300 cursor-not-allowed line-through'
                    : selectedAttrs[group.type] === opt.value
                      ? 'border-[#111111] bg-[#111111] text-white cursor-pointer'
                      : 'border-neutral-300 text-neutral-700 hover:border-neutral-700 cursor-pointer'"
                  :disabled="opt.disabled"
                  @click="!opt.disabled && selectAttr(group.type, opt.value)"
                >
                  {{ opt.value }}
                </button>
              </div>
            </div>

            <!-- Selection hint for variable products -->
            <p v-if="isVariable && !isCompleteSelection" class="mt-4 text-[11px] uppercase tracking-wide text-amber-600">
              Please select all options to continue
            </p>

            <!-- Quantity + Add to Cart + Buy Now (desktop only) -->
            <div class="hidden lg:block mt-7 space-y-3">
              <!-- Quantity selector -->
              <div class="flex items-center gap-3">
                <div class="flex items-center border border-neutral-300 h-11 w-fit">
                  <button
                    class="w-10 h-full flex items-center justify-center text-neutral-500 hover:text-[#111111] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="qty <= 1"
                    aria-label="Decrease quantity"
                    @click="decQty"
                  >
                    <UIcon name="i-lucide-minus" class="w-3.5 h-3.5" />
                  </button>
                  <span class="w-10 text-center text-sm font-medium text-[#111111]">{{ qty }}</span>
                  <button
                    class="w-10 h-full flex items-center justify-center text-neutral-500 hover:text-[#111111] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="qty >= maxQty"
                    aria-label="Increase quantity"
                    @click="incQty"
                  >
                    <UIcon name="i-lucide-plus" class="w-3.5 h-3.5" />
                  </button>
                </div>
                <span
                  v-if="maxQty !== Infinity && maxQty <= 10"
                  class="text-xs text-amber-600"
                >
                  Only {{ maxQty }} left
                </span>
              </div>

              <!-- Add to Cart -->
              <button
                class="w-full h-11 bg-[#111111] text-white text-xs tracking-widest uppercase font-medium hover:bg-neutral-800 transition-colors disabled:opacity-60 cursor-pointer"
                :disabled="addingToCart || buyingNow || !isAvailable"
                @click="handleAddToCart"
              >
                <span v-if="addingToCart" class="flex items-center justify-center gap-2">
                  <span class="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
                <span v-else>{{ addToCartLabel }}</span>
              </button>

              <!-- Buy Now -->
              <button
                v-if="isAvailable"
                class="w-full h-11 border border-[#111111] text-[#111111] text-xs tracking-widest uppercase font-medium hover:bg-neutral-50 transition-colors disabled:opacity-60 cursor-pointer"
                :disabled="addingToCart || buyingNow"
                @click="handleBuyNow"
              >
                <span v-if="buyingNow" class="flex items-center justify-center gap-2">
                  <span class="w-3.5 h-3.5 border border-neutral-400 border-t-neutral-800 rounded-full animate-spin" />
                  Please wait...
                </span>
                <span v-else>Buy Now</span>
              </button>
            </div>

            <!-- About / Accordion sections -->
            <div class="mt-7 border-t border-neutral-200">

              <!-- About this product -->
              <div class="border-b border-neutral-200">
                <button
                  class="w-full flex items-center justify-between py-4 text-left cursor-pointer group"
                  @click="toggleSection('about')"
                >
                  <span class="text-[11px] tracking-widest uppercase font-medium text-[#111111]">
                    About this Product
                  </span>
                  <UIcon
                    name="i-lucide-plus"
                    class="w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0"
                    :class="openSection === 'about' ? 'rotate-45' : ''"
                  />
                </button>
                <div v-show="openSection === 'about'" class="pb-5">
                  <!-- product.description is CMS/admin content — trusted source -->
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <div
                    v-if="product.description"
                    class="text-sm text-neutral-600 leading-relaxed prose-sm max-w-none"
                    v-html="product.description"
                  />
                  <p v-else class="text-sm text-neutral-400 italic">No description available.</p>
                </div>
              </div>

              <!-- Details / Specifications -->
              <div
                v-if="product.specifications?.length || product.details?.length"
                class="border-b border-neutral-200"
              >
                <button
                  class="w-full flex items-center justify-between py-4 text-left cursor-pointer"
                  @click="toggleSection('details')"
                >
                  <span class="text-[11px] tracking-widest uppercase font-medium text-[#111111]">Details</span>
                  <UIcon
                    name="i-lucide-plus"
                    class="w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0"
                    :class="openSection === 'details' ? 'rotate-45' : ''"
                  />
                </button>
                <div v-show="openSection === 'details'" class="pb-5 space-y-2.5">
                  <div
                    v-for="(spec, i) in (product.specifications ?? product.details ?? [])"
                    :key="i"
                    class="flex gap-4 text-sm"
                  >
                    <span class="text-neutral-400 min-w-[110px] shrink-0">{{ spec.label }}</span>
                    <span class="text-[#111111]">{{ spec.value }}</span>
                  </div>
                </div>
              </div>

              <!-- Shipping & Returns -->
              <div class="border-b border-neutral-200">
                <button
                  class="w-full flex items-center justify-between py-4 text-left cursor-pointer"
                  @click="toggleSection('shipping')"
                >
                  <span class="text-[11px] tracking-widest uppercase font-medium text-[#111111]">
                    Shipping &amp; Returns
                  </span>
                  <UIcon
                    name="i-lucide-plus"
                    class="w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0"
                    :class="openSection === 'shipping' ? 'rotate-45' : ''"
                  />
                </button>
                <div v-show="openSection === 'shipping'" class="pb-5 space-y-2 text-sm text-neutral-600 leading-relaxed">
                  <p>Free shipping on all orders over ₦50,000.</p>
                  <p>Standard delivery: 3–5 business days.</p>
                  <p>Express delivery available at checkout.</p>
                  <p>Returns accepted within 14 days of delivery in original condition.</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </LayoutContainer>

      <!-- Related products -->
      <section v-if="relatedProducts.length" class="bg-neutral-50 py-10 lg:py-14 mt-4">
        <LayoutContainer>
          <h2 class="text-[11px] tracking-widest uppercase font-medium text-[#111111] mb-6">
            You May Also Like
          </h2>
          <ProductGrid :products="relatedProducts" />
        </LayoutContainer>
      </section>
    </template>

    <!-- Mobile sticky Add to Cart / Buy Now bar -->
    <Teleport to="body">
      <div
        v-if="product && !pending"
        class="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 px-4 py-3 z-40"
      >
        <!-- Qty row -->
        <div class="flex items-center justify-between mb-2.5">
          <div class="flex items-center gap-2">
            <div class="flex items-center border border-neutral-300 h-9">
              <button
                class="w-9 h-full flex items-center justify-center text-neutral-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="qty <= 1"
                aria-label="Decrease quantity"
                @click="decQty"
              >
                <UIcon name="i-lucide-minus" class="w-3 h-3" />
              </button>
              <span class="w-8 text-center text-sm font-medium text-[#111111]">{{ qty }}</span>
              <button
                class="w-9 h-full flex items-center justify-center text-neutral-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="qty >= maxQty"
                aria-label="Increase quantity"
                @click="incQty"
              >
                <UIcon name="i-lucide-plus" class="w-3 h-3" />
              </button>
            </div>
            <span
              v-if="maxQty !== Infinity && maxQty <= 10"
              class="text-xs text-amber-600"
            >
              Only {{ maxQty }} left
            </span>
          </div>

          <!-- Wishlist shortcut -->
          <button
            v-if="token"
            class="h-9 w-9 border border-neutral-300 flex items-center justify-center cursor-pointer"
            :disabled="saving"
            aria-label="Save to wishlist"
            @click="handleSave"
          >
            <UIcon
              name="i-lucide-heart"
              class="w-4 h-4"
              :class="product && isSaved(product.id) ? 'fill-red-500 text-red-500' : 'text-neutral-600'"
            />
          </button>
        </div>

        <!-- Action buttons row -->
        <div class="flex items-stretch gap-2.5">
          <!-- Add to Cart -->
          <button
            class="flex-1 h-11 bg-[#111111] text-white text-xs tracking-widest uppercase font-medium disabled:opacity-60 cursor-pointer"
            :disabled="addingToCart || buyingNow || !isAvailable"
            @click="handleAddToCart"
          >
            <span v-if="addingToCart" class="flex items-center justify-center gap-1.5">
              <span class="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
              Adding...
            </span>
            <span v-else>{{ addToCartLabel }}</span>
          </button>

          <!-- Buy Now -->
          <button
            v-if="isAvailable"
            class="flex-1 h-11 border border-[#111111] text-[#111111] text-xs tracking-widest uppercase font-medium disabled:opacity-60 cursor-pointer"
            :disabled="addingToCart || buyingNow"
            @click="handleBuyNow"
          >
            <span v-if="buyingNow" class="flex items-center justify-center gap-1.5">
              <span class="w-3 h-3 border border-neutral-400 border-t-neutral-800 rounded-full animate-spin" />
              ...
            </span>
            <span v-else>Buy Now</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
