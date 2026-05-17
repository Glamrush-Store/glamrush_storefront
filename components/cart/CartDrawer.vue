<script setup>
defineProps({
  open: { type: Boolean, default: false },
})

defineEmits(['close'])

const cart = useCartStore()
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-40 bg-black/40"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Panel -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="open"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl flex flex-col"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 class="text-base font-semibold text-neutral-900">
            Your Cart
            <span v-if="cart.itemCount" class="text-neutral-400 font-normal text-sm ml-1">({{ cart.itemCount }})</span>
          </h2>
          <button
            class="text-neutral-400 hover:text-neutral-900 transition-colors"
            aria-label="Close cart"
            @click="$emit('close')"
          >
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Items -->
        <div class="flex-1 overflow-y-auto px-5">
          <!-- Empty state -->
          <div v-if="!cart.items.length" class="flex flex-col items-center justify-center h-full gap-3 text-center">
            <UIcon name="i-lucide-shopping-bag" class="w-10 h-10 text-neutral-300" />
            <p class="text-sm text-neutral-500">Your cart is empty</p>
            <UButton color="neutral" variant="solid" size="sm" @click="$emit('close')">
              Continue Shopping
            </UButton>
          </div>

          <!-- Cart items -->
          <div v-else class="py-2">
            <CartItem v-for="item in cart.items" :key="item.product_id" :item="item" />
          </div>
        </div>

        <!-- Footer -->
        <div v-if="cart.items.length" class="border-t border-neutral-200 px-5 py-4 space-y-3">
          <NuxtLink
            to="/checkout/information"
            class="w-full flex items-center justify-center gap-2 bg-[#111111] text-white text-xs tracking-widest uppercase py-3 hover:bg-neutral-800 transition-colors cursor-pointer"
            @click="$emit('close')"
          >
            <UIcon name="i-lucide-credit-card" class="w-4 h-4" />
            Proceed to Checkout
          </NuxtLink>
          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            size="sm"
            block
            @click="cart.clearCart()"
          >
            Clear cart
          </UButton>
          <p class="text-center text-[11px] text-neutral-400 leading-snug">
            Items in your cart are reserved for 2 hours, after which they may be moved to your saved items.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
