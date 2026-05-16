<script setup>
</script>

<template>
  <LayoutContainer class="min-h-[60vh] flex items-center justify-center py-16">
    <div class="text-center space-y-5 max-w-sm">
      <div class="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-check-circle" class="w-7 h-7 text-emerald-600" />
      </div>
      <div class="space-y-1.5">
        <h1 class="text-base font-semibold text-neutral-900">Order successful</h1>
        <p class="text-sm text-neutral-500 leading-relaxed">
          Your payment was confirmed and your order has been placed successfully.
        </p>
      </div>
      <NuxtLink
        to="/catalog"
        class="inline-block text-sm font-medium underline underline-offset-2 hover:text-neutral-900 transition-colors"
      >
        Continue shopping
      </NuxtLink>
    </div>
  </LayoutContainer>
</template>
