<script setup>
const props = defineProps({
  item: { type: Object, required: true },
})

const cart = useCartStore()
const updating = ref(false)

async function setQuantity(qty) {
  if (qty < 1 || updating.value) return
  updating.value = true
  await cart.updateQuantity(props.item.product_id, qty)
  updating.value = false
}

async function remove() {
  await cart.removeItem(props.item.product_id)
}
</script>

<template>
  <div class="flex gap-3 py-4 border-b border-neutral-100 last:border-0">
    <!-- Thumbnail -->
    <div class="w-16 h-20 shrink-0 bg-neutral-100 rounded overflow-hidden">
      <img
        v-if="item.thumb"
        :src="item.thumb"
        :alt="item.name"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <UIcon name="i-lucide-image" class="w-5 h-5 text-neutral-300" />
      </div>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <NuxtLink
        :to="`/products/${item.slug}`"
        class="text-sm font-medium text-neutral-900 line-clamp-2 hover:text-[#c89b3c] transition-colors leading-snug"
      >
        {{ item.name }}
      </NuxtLink>

      <!-- Qty stepper -->
      <div class="flex items-center gap-2 mt-2">
        <button
          class="w-6 h-6 flex items-center justify-center rounded border border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors disabled:opacity-40"
          :disabled="updating || item.quantity <= 1"
          @click="setQuantity(item.quantity - 1)"
        >
          <UIcon name="i-lucide-minus" class="w-3 h-3" />
        </button>

        <span class="w-6 text-center text-sm tabular-nums">{{ item.quantity }}</span>

        <button
          class="w-6 h-6 flex items-center justify-center rounded border border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors disabled:opacity-40"
          :disabled="updating"
          @click="setQuantity(item.quantity + 1)"
        >
          <UIcon name="i-lucide-plus" class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- Remove -->
    <button
      class="shrink-0 self-start mt-0.5 text-neutral-400 hover:text-neutral-900 transition-colors"
      aria-label="Remove item"
      @click="remove"
    >
      <UIcon name="i-lucide-x" class="w-4 h-4" />
    </button>
  </div>
</template>
