<script setup>
const { orders, meta, loading, error, fetchOrders } = useOrders()

const currentPage = computed(() => meta.value?.current_page ?? 1)
const lastPage = computed(() => meta.value?.last_page ?? 1)
const selectedOrder = shallowRef(null)
const itemsModalOpen = shallowRef(false)

onMounted(() => fetchOrders())

function formatMoney(amount, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0))
}

function formatDate(value) {
  if (!value) return 'Not available'

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusLabel(status) {
  return String(status ?? 'unknown').replaceAll('_', ' ')
}

function statusClasses(status) {
  const normalized = String(status ?? '').toLowerCase()
  if (['paid', 'shipped', 'delivered', 'completed'].includes(normalized)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  }
  if (['pending_payment', 'pending'].includes(normalized)) {
    return 'bg-amber-50 text-amber-700 border-amber-100'
  }
  if (['cancelled', 'failed', 'expired'].includes(normalized)) {
    return 'bg-red-50 text-red-700 border-red-100'
  }
  return 'bg-neutral-100 text-neutral-700 border-neutral-200'
}

function itemImage(item) {
  const image = item.images?.[0] ?? item.product_snapshot?.images?.[0]
  return image?.thumb ?? image?.medium ?? image?.url ?? null
}

function firstLine(address) {
  if (!address) return 'Address unavailable'
  return address.line1 ?? address.address_line_1 ?? 'Address unavailable'
}

function secondLine(address) {
  if (!address) return ''
  return [address.city, address.state, address.country].filter(Boolean).join(', ')
}

function pageNumbers() {
  const total = lastPage.value
  const active = currentPage.value
  const start = Math.max(1, active - 2)
  const end = Math.min(total, active + 2)

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function visibleItems(order) {
  return order.items?.slice(0, 3) ?? []
}

function hiddenItemCount(order) {
  return Math.max((order.items?.length ?? 0) - 3, 0)
}

function openItemsModal(order) {
  selectedOrder.value = order
  itemsModalOpen.value = true
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-xl font-semibold text-neutral-900">Orders</h1>
        <p v-if="meta" class="text-xs text-neutral-400 mt-1">
          {{ meta.total }} order{{ meta.total === 1 ? '' : 's' }}
        </p>
      </div>

      <button
        class="h-9 px-3 inline-flex items-center gap-2 border border-neutral-200 rounded text-xs font-medium text-neutral-700 hover:border-neutral-400 transition-colors disabled:opacity-50"
        :disabled="loading"
        @click="fetchOrders(currentPage)"
      >
        <UIcon name="i-lucide-refresh-cw" class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        Refresh
      </button>
    </div>

    <div v-if="loading && !orders.length" class="space-y-4">
      <USkeleton v-for="n in 3" :key="n" class="h-40 rounded-lg" />
    </div>

    <div v-else-if="error" class="py-12 text-center border border-neutral-200 rounded-lg">
      <UIcon name="i-lucide-alert-circle" class="w-8 h-8 mx-auto text-red-500 mb-3" />
      <p class="text-sm text-neutral-700">{{ error }}</p>
      <button
        class="mt-4 text-sm font-medium underline underline-offset-2 hover:text-neutral-900"
        @click="fetchOrders(currentPage)"
      >
        Try again
      </button>
    </div>

    <div v-else-if="!orders.length" class="py-12 text-center border border-neutral-200 rounded-lg">
      <UIcon name="i-lucide-package" class="w-8 h-8 mx-auto text-neutral-300 mb-3" />
      <p class="text-sm text-neutral-500">No orders yet.</p>
      <NuxtLink to="/catalog" class="inline-block mt-3 text-sm font-medium underline underline-offset-2 hover:text-neutral-900">
        Browse products
      </NuxtLink>
    </div>

    <div v-else class="space-y-4">
      <article
        v-for="order in orders"
        :key="order.id"
        class="border border-neutral-200 rounded-lg overflow-hidden bg-white"
      >
        <div class="p-4 sm:p-5 border-b border-neutral-100">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-sm font-semibold text-neutral-900">{{ order.order_number }}</h2>
                <span
                  class="px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize"
                  :class="statusClasses(order.status)"
                >
                  {{ statusLabel(order.status) }}
                </span>
              </div>
              <p class="text-xs text-neutral-400 mt-1">
                Placed {{ formatDate(order.placed_at) }}
              </p>
            </div>

            <div class="sm:text-right">
              <p class="text-base font-semibold text-neutral-900">
                {{ formatMoney(order.total, order.currency) }}
              </p>
              <p class="text-xs text-neutral-400">
                {{ order.items?.length ?? 0 }} item{{ order.items?.length === 1 ? '' : 's' }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs text-neutral-500">
            <div>
              <p class="font-medium text-neutral-700">Shipping</p>
              <p class="mt-0.5">{{ order.shipping_method_name ?? 'Not assigned' }}</p>
              <p>{{ order.shipping_zone_name ?? 'Zone unavailable' }}</p>
            </div>
            <div>
              <p class="font-medium text-neutral-700">Delivery address</p>
              <p class="mt-0.5 truncate">{{ firstLine(order.shipping_address) }}</p>
              <p class="truncate">{{ secondLine(order.shipping_address) }}</p>
            </div>
          </div>
        </div>

        <ul class="divide-y divide-neutral-100">
          <li
            v-for="item in visibleItems(order)"
            :key="item.id"
            class="p-4 sm:px-5 flex gap-3"
          >
            <NuxtLink
              :to="`/products/${item.product_slug}`"
              class="w-14 h-16 bg-neutral-100 rounded overflow-hidden shrink-0"
            >
              <img
                v-if="itemImage(item)"
                :src="itemImage(item)"
                :alt="item.product_name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-neutral-300">
                <UIcon name="i-lucide-image" class="w-5 h-5" />
              </div>
            </NuxtLink>

            <div class="min-w-0 flex-1">
              <NuxtLink
                :to="`/products/${item.product_slug}`"
                class="text-sm font-medium text-neutral-900 hover:text-neutral-600 line-clamp-2"
              >
                {{ item.product_name }}
              </NuxtLink>
              <p class="text-xs text-neutral-400 mt-0.5">SKU {{ item.sku }}</p>
              <p class="text-xs text-neutral-500 mt-1">
                {{ item.quantity }} x {{ formatMoney(item.unit_price, order.currency) }}
              </p>
            </div>

            <p class="text-sm font-medium text-neutral-900 shrink-0">
              {{ formatMoney(item.line_total, order.currency) }}
            </p>
          </li>
        </ul>

        <div
          v-if="hiddenItemCount(order) > 0"
          class="px-4 sm:px-5 py-3 border-t border-neutral-100"
        >
          <button
            class="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
            @click="openItemsModal(order)"
          >
            View all {{ order.items.length }} items
          </button>
        </div>

        <div class="px-4 sm:px-5 py-3 bg-neutral-50 border-t border-neutral-100 text-xs text-neutral-500 flex flex-wrap gap-x-4 gap-y-1">
          <span>Subtotal: {{ formatMoney(order.subtotal, order.currency) }}</span>
          <span>Shipping: {{ formatMoney(order.shipping_amount, order.currency) }}</span>
          <span v-if="order.paid_at">Paid: {{ formatDate(order.paid_at) }}</span>
        </div>
      </article>

      <div v-if="lastPage > 1" class="flex items-center justify-center gap-1 pt-4">
        <button
          class="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded hover:border-neutral-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          :disabled="currentPage === 1 || loading"
          @click="fetchOrders(currentPage - 1)"
        >
          <UIcon name="i-lucide-chevron-left" class="w-4 h-4" />
        </button>

        <button
          v-for="page in pageNumbers()"
          :key="page"
          class="w-9 h-9 flex items-center justify-center border rounded text-sm transition-colors"
          :class="page === currentPage
            ? 'bg-[#111111] text-white border-[#111111]'
            : 'border-neutral-200 hover:border-neutral-400 text-neutral-700'"
          :disabled="loading"
          @click="fetchOrders(page)"
        >
          {{ page }}
        </button>

        <button
          class="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded hover:border-neutral-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          :disabled="currentPage === lastPage || loading"
          @click="fetchOrders(currentPage + 1)"
        >
          <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <UModal
      v-model:open="itemsModalOpen"
      :title="selectedOrder ? `Items in ${selectedOrder.order_number}` : 'Order items'"
    >
      <template #body>
        <div class="text-white">
          <ul v-if="selectedOrder" class="divide-y divide-neutral-100">
            <li
              v-for="item in selectedOrder.items"
              :key="item.id"
              class="py-4 flex gap-3"
            >
              <NuxtLink
                :to="`/products/${item.product_slug}`"
                class="w-14 h-16 bg-neutral-100 rounded overflow-hidden shrink-0"
                @click="itemsModalOpen = false"
              >
                <img
                  v-if="itemImage(item)"
                  :src="itemImage(item)"
                  :alt="item.product_name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-neutral-300">
                  <UIcon name="i-lucide-image" class="w-5 h-5" />
                </div>
              </NuxtLink>

              <div class="min-w-0 flex-1">
                <NuxtLink
                  :to="`/products/${item.product_slug}`"
                  class="text-sm font-medium text-white hover:text-neutral-200 line-clamp-2"
                  @click="itemsModalOpen = false"
                >
                  {{ item.product_name }}
                </NuxtLink>
                <p class="text-xs text-neutral-300 mt-0.5">SKU {{ item.sku }}</p>
                <p class="text-xs text-neutral-200 mt-1">
                  {{ item.quantity }} x {{ formatMoney(item.unit_price, selectedOrder.currency) }}
                </p>
              </div>

              <p class="text-sm font-semibold text-white shrink-0">
                {{ formatMoney(item.line_total, selectedOrder.currency) }}
              </p>
            </li>
          </ul>
        </div>
      </template>
    </UModal>
  </div>
</template>
