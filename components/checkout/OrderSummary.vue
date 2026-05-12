<script setup>
const props = defineProps({
  shippingCost: { type: Number, default: 0 },
  shippingName: { type: String, default: null },
})

const cart = useCartStore()
const updatingId = shallowRef(null)
const refreshing = shallowRef(false)

function fmt(n) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(n ?? 0)
}

const subtotal = computed(() => cart.subtotal)
const total = computed(() => subtotal.value + props.shippingCost)

async function changeQty(item, delta) {
  const newQty = item.quantity + delta
  if (newQty < 1) return
  updatingId.value = item.product_id
  await cart.updateQuantity(item.product_id, newQty)
  await cart.fetchCart()
  updatingId.value = null
}

async function remove(item) {
  updatingId.value = item.product_id
  await cart.removeItem(item.product_id)
  await cart.fetchCart()
  updatingId.value = null
}

async function refresh() {
  refreshing.value = true
  await cart.fetchCart()
  refreshing.value = false
}
</script>

<template>
  <div class="bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden">

    <!-- Header -->
    <div class="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-800">
        Order Summary
        <span class="font-normal text-neutral-400 normal-case tracking-normal ml-1">
          ({{ cart.itemCount }} {{ cart.itemCount === 1 ? 'item' : 'items' }})
        </span>
      </h2>
      <button
        class="w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors disabled:opacity-40"
        :disabled="refreshing || !!updatingId"
        :title="refreshing ? 'Refreshing…' : 'Refresh cart'"
        @click="refresh"
      >
        <UIcon
          name="i-lucide-refresh-cw"
          class="w-3.5 h-3.5"
          :class="refreshing ? 'animate-spin' : ''"
        />
      </button>
    </div>

    <!-- Items -->
    <div class="px-5 divide-y divide-neutral-200">
      <div
        v-for="item in cart.items"
        :key="item.product_id"
        class="py-4 flex gap-3 transition-opacity duration-150"
        :class="updatingId === item.product_id ? 'opacity-40 pointer-events-none' : ''"
      >
        <!-- Thumbnail -->
        <div class="w-14 shrink-0 rounded-md overflow-hidden bg-neutral-100 self-start aspect-[3/4] relative">
          <img
            v-if="item.thumb"
            :src="item.thumb"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <UIcon name="i-lucide-image" class="w-4 h-4 text-neutral-300" />
          </div>
        </div>

        <!-- Info + controls -->
        <div class="flex-1 min-w-0 flex flex-col gap-1.5">
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm font-medium text-neutral-900 line-clamp-2 leading-snug">
              {{ item.name }}
            </p>
            <!-- Remove -->
            <button
              class="shrink-0 w-5 h-5 flex items-center justify-center rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors mt-0.5"
              title="Remove item"
              @click="remove(item)"
            >
              <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
            </button>
          </div>

          <p v-if="item.variant_label || item.size || item.color" class="text-xs text-neutral-500">
            {{ item.variant_label ?? [item.size, item.color].filter(Boolean).join(' / ') }}
          </p>

          <p v-if="item.unit_price" class="text-xs text-neutral-400">
            {{ fmt(item.unit_price) }} each
          </p>

          <!-- Qty stepper + line price -->
          <div class="flex items-center justify-between gap-3 mt-0.5">
            <div class="flex items-center gap-1 border border-neutral-200 rounded-lg overflow-hidden">
              <button
                class="w-7 h-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors disabled:opacity-30"
                :disabled="item.quantity <= 1"
                @click="changeQty(item, -1)"
              >
                <UIcon name="i-lucide-minus" class="w-3 h-3" />
              </button>
              <span class="w-7 text-center text-sm font-medium text-neutral-900 tabular-nums select-none">
                {{ item.quantity }}
              </span>
              <button
                class="w-7 h-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
                @click="changeQty(item, +1)"
              >
                <UIcon name="i-lucide-plus" class="w-3 h-3" />
              </button>
            </div>
            <span class="text-sm font-medium text-neutral-900 shrink-0">
              {{ item.unit_price ? fmt(item.unit_price * item.quantity) : '—' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Totals -->
    <div class="px-5 py-4 border-t border-neutral-200 space-y-2.5">
      <div class="flex justify-between text-sm text-neutral-600">
        <span>Subtotal</span>
        <span>{{ fmt(subtotal) }}</span>
      </div>

      <div class="flex justify-between text-sm text-neutral-600">
        <span>Shipping</span>
        <span v-if="shippingName" class="text-right">
          <span class="text-neutral-900">{{ fmt(shippingCost) }}</span>
          <span class="block text-xs text-neutral-400">{{ shippingName }}</span>
        </span>
        <span v-else class="text-neutral-400">Select shipping</span>
      </div>

      <div class="flex justify-between text-base font-semibold text-neutral-900 pt-2 border-t border-neutral-200">
        <span>Total</span>
        <span>{{ fmt(total) }}</span>
      </div>
    </div>

  </div>
</template>
