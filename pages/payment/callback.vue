<script setup>
const route = useRoute()
const { request } = useApi()
const cart = useCartStore()

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function failureUrl(reason) {
  return {
    path: '/payment/failed',
    query: { reason },
  }
}

onMounted(async () => {
  const provider = firstQueryValue(route.query.provider)
  const transactionId = firstQueryValue(route.query.transaction_id)

  if (!provider || !transactionId) {
    await navigateTo(failureUrl('Missing payment verification details.'))
    return
  }

  try {
    const res = await request('/payments/verify', {
      method: 'POST',
      body: { provider, transaction_id: transactionId },
    })

    const paymentStatus = res?.data?.payment?.status ?? res?.data?.status ?? res?.status
    const normalizedStatus = String(paymentStatus ?? '').toLowerCase()

    if (['paid', 'succesful', 'successful'].includes(normalizedStatus)) {
      await cart.clearCart()
      await navigateTo('/payment/success')
      return
    }

    await navigateTo(failureUrl('Failed payment.'))
  } catch (e) {
    await navigateTo(failureUrl(e?.data?.message ?? 'Failed payment.'))
  }
})
</script>

<template>
  <LayoutContainer class="min-h-[60vh] flex items-center justify-center py-16">
    <div class="text-center space-y-4">
      <span class="w-10 h-10 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mx-auto block" />
      <p class="text-sm text-neutral-500">Verifying your payment, please wait...</p>
    </div>
  </LayoutContainer>
</template>
