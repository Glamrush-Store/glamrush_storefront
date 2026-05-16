<script setup>
const route = useRoute()

const reason = computed(() => {
  const rawReason = Array.isArray(route.query.reason) ? route.query.reason[0] : route.query.reason
  return rawReason || 'Failed payment.'
})
</script>

<template>
  <LayoutContainer class="min-h-[60vh] flex items-center justify-center py-16">
    <div class="text-center space-y-5 max-w-sm">
      <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-x-circle" class="w-7 h-7 text-red-500" />
      </div>
      <div class="space-y-1.5">
        <h1 class="text-base font-semibold text-neutral-900">Order failed</h1>
        <p class="text-sm text-neutral-500 leading-relaxed">
          {{ reason }}
        </p>
      </div>
      <NuxtLink
        to="/checkout/information"
        class="inline-block text-sm font-medium underline underline-offset-2 hover:text-neutral-900 transition-colors"
      >
        Return to checkout
      </NuxtLink>
    </div>
  </LayoutContainer>
</template>
