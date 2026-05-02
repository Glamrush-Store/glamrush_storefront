<script setup>
const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const selectedVariantId = ref(null)
const isHovered = ref(false)

const token = useCookie('auth_token')
const { isSaved, toggleSave } = useSavedItems()
const { trigger } = useSaveAnimation()
const saving = ref(false)

const cart = useCartStore()
const { bump } = useCartAnimation()
const addingToCart = ref(false)

async function handleAddToCart() {
  if (addingToCart.value || !isAvailable.value) return
  addingToCart.value = true
  const success = await cart.addItem(props.product.id)
  addingToCart.value = false
  if (success) bump()
}

async function handleSave() {
  if (!token.value) {
    navigateTo('/login')
    return
  }

  // Trigger animation immediately (optimistic)
  trigger(isSaved(props.product.id) ? 'unsaved' : 'saved')

  saving.value = true
  const result = await toggleSave(props.product.id)
  saving.value = false

  if (result === 'failed') {
    trigger('failed')
  }
}

const defaultVariant = computed(() => props.product.variants?.[0] ?? null)

const activeVariant = computed(() => {
  if (!selectedVariantId.value) return defaultVariant.value
  return props.product.variants?.find(v => v.id === selectedVariantId.value) ?? defaultVariant.value
})

const mainImage = computed(() => {
  if (selectedVariantId.value) {
    return activeVariant.value?.images?.[0]?.medium ?? null
  }
  return (
    props.product.images?.[0]?.medium ??
    defaultVariant.value?.images?.[0]?.medium ??
    null
  )
})

const hoverImage = computed(() => {
  let candidate
  if (selectedVariantId.value) {
    candidate = activeVariant.value?.images?.[1]?.medium ?? null
  } else {
    candidate = defaultVariant.value?.images?.[0]?.medium ?? null
  }
  if (!candidate || candidate === mainImage.value) return null
  return candidate
})

const displayImage = computed(() =>
  isHovered.value && hoverImage.value ? hoverImage.value : mainImage.value
)

const colorSwatches = computed(() => {
  if (!props.product.variants?.length) return []
  const seen = new Set()
  const swatches = []
  for (const variant of props.product.variants) {
    for (const attr of variant.attributes ?? []) {
      if (attr.display_type !== 'color_swatch') continue
      if (seen.has(attr.value)) continue
      seen.add(attr.value)
      let hex = null
      try {
        const meta = typeof attr.meta === 'string' ? JSON.parse(attr.meta) : attr.meta
        hex = meta?.hex ?? null
      } catch {}
      swatches.push({ variantId: variant.id, value: attr.value, code: attr.code, hex })
    }
  }
  return swatches
})

const activePrice = computed(() => {
  if (props.product.variants?.length) {
    return activeVariant.value?.price ?? 0
  }
  return props.product.price ?? 0
})

const activeSalePrice = computed(() => {
  if (props.product.variants?.length) {
    const v = activeVariant.value
    return v?.isOnSale && v?.salePrice !== v?.price ? v.salePrice : null
  }
  return null
})

const isAvailable = computed(() => props.product.available)

function formatPrice(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function selectVariant(id) {
  selectedVariantId.value = id
}
</script>

<template>
  <div class="group" @mouseenter="isHovered = true" @mouseleave="isHovered = false">

    <!-- Image wrapper -->
    <div class="relative aspect-[4/5] overflow-hidden bg-neutral-100">

      <!-- Main image -->
      <img
        v-if="mainImage"
        :src="mainImage"
        :alt="product.name"
        class="w-full h-full object-cover transition-opacity duration-300"
        :class="{ 'opacity-0': isHovered && hoverImage }"
      />

      <!-- Hover image -->
      <img
        v-if="hoverImage"
        :src="hoverImage"
        :alt="product.name"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        :class="isHovered ? 'opacity-100' : 'opacity-0'"
      />

      <!-- No image placeholder -->
      <div v-if="!mainImage" class="absolute inset-0 bg-neutral-100 flex items-center justify-center">
        <span class="text-neutral-300 text-xs">No Image</span>
      </div>

      <!-- Badges: top-left -->
      <div class="absolute top-2 left-2 flex flex-col gap-1">
        <ProductBadge v-if="activeSalePrice" label="Sale" variant="sale" />
        <ProductBadge v-if="!isAvailable" label="Sold Out" variant="out-of-stock" />
      </div>

      <!-- Wishlist: top-right (authenticated users only) -->
      <button
        v-if="token"
        class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-[#111111] rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
        :disabled="saving"
        @click.prevent="handleSave"
      >
        <UIcon
          name="i-lucide-heart"
          class="w-4 h-4 text-[#f5f5f5]"
          :class="isSaved(product.id) ? 'fill-red-500 text-red-500' : ''"
        />
      </button>

      <!-- Add to Cart: slide up from bottom on hover -->
      <div class="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <button
          class="w-full bg-[#111111] text-white text-xs tracking-widest uppercase py-3 hover:bg-neutral-800 transition-colors disabled:opacity-60 cursor-pointer"
          :disabled="addingToCart || !isAvailable"
          @click.prevent="handleAddToCart"
        >
          {{ addingToCart ? 'Adding...' : 'Add to Cart' }}
        </button>
      </div>

    </div>

    <!-- Info section -->
    <div class="pt-3 space-y-1">

      <!-- Brand -->
      <p class="text-[11px] text-neutral-400 tracking-wide uppercase">{{ product.brand?.name }}</p>

      <!-- Name -->
      <NuxtLink :to="`/products/${product.slug}`" class="block">
        <h3 class="text-sm font-medium text-neutral-900 leading-snug line-clamp-2 hover:text-[#c89b3c] transition-colors">
          {{ product.name }}
        </h3>
      </NuxtLink>

      <!-- Color swatches -->
      <div v-if="colorSwatches.length" class="flex items-center gap-1.5 pt-1">
        <button
          v-for="swatch in colorSwatches"
          :key="swatch.code"
          :title="swatch.value"
          class="w-3.5 h-3.5 rounded-full border transition-all"
          :class="selectedVariantId === swatch.variantId ? 'ring-1 ring-offset-1 ring-neutral-800 scale-110' : 'border-neutral-300'"
          :style="{ backgroundColor: swatch.hex ?? '#ccc' }"
          @click="selectVariant(swatch.variantId)"
        />
      </div>

      <!-- Price -->
      <div class="flex items-baseline gap-2 pt-0.5">
        <span v-if="activeSalePrice" class="text-sm font-semibold text-[#111111]">
          {{ formatPrice(activeSalePrice) }}
        </span>
        <span
          class="text-sm"
          :class="activeSalePrice ? 'line-through text-neutral-400 font-normal' : 'font-semibold text-[#111111]'"
        >
          {{ formatPrice(activePrice) }}
        </span>
      </div>

    </div>
  </div>
</template>
