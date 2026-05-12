<script setup>
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { request } = useApi()

const status = shallowRef('verifying') // 'verifying' | 'success' | 'failed'
const errorMessage = shallowRef('')

onMounted(async () => {
  const provider = route.query.provider
  const reference = route.query.reference ?? route.query.tx_ref

  if (!provider || !reference) {
    errorMessage.value = 'Invalid callback — missing payment details.'
    status.value = 'failed'
    return
  }

  try {
    const res = await request('/payments/verify', {
      method: 'POST',
      body: { provider, reference },
    })

    const paymentStatus = res?.payment?.status ?? res?.status

    if (['paid', 'successful', 'success', 'completed'].includes(paymentStatus)) {
      status.value = 'success'
      await navigateTo('/checkout/confirmation')
    } else {
      errorMessage.value = `Payment ${paymentStatus ?? 'could not be confirmed'}. Please contact support if you were charged.`
      status.value = 'failed'
    }
  } catch (e) {
    errorMessage.value = e?.data?.message ?? 'Payment verification failed. Please contact support.'
    status.value = 'failed'
  }
})
</script>

<template>
  <LayoutContainer class="min-h-[60vh] flex items-center justify-center py-16">

    <!-- Verifying -->
    <div v-if="status === 'verifying'" class="text-center space-y-4">
      <span class="w-10 h-10 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mx-auto block" />
      <p class="text-sm text-neutral-500">Verifying your payment, please wait…</p>
    </div>

    <!-- Failed -->
    <div v-else-if="status === 'failed'" class="text-center space-y-5 max-w-sm">
      <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-x-circle" class="w-7 h-7 text-red-500" />
      </div>
      <div class="space-y-1.5">
        <h1 class="text-base font-semibold text-neutral-900">Payment unsuccessful</h1>
        <p class="text-sm text-neutral-500 leading-relaxed">{{ errorMessage }}</p>
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
