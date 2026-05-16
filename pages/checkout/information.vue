<script setup>
const cart = useCartStore()
const authStore = useAuthStore()
const {
  addresses,
  loading: loadingAddresses,
  fetchAddresses,
  createAddress,
} = useAddresses()

const co = useCheckoutState()
const toast = useToast()

const {
  countryOptions,
  stateOptions,
  cityOptions,
  resolveCountryCode,
} = useAddressLocationOptions(co.newAddr)

co.newAddr.country = resolveCountryCode(co.newAddr.country)

// ── Derived address state ──────────────────────────────────────────────────
// Bridges the saved address list (from useAddresses) with mode state (from composable).
const currentAddress = computed(() => {
  if (co.addressMode.value === 'saved') {
    return addresses.value.find(a => a.id === co.selectedAddressId.value) ?? null
  }
  return co.newAddr
})

const addressComplete = computed(() => {
  if (co.addressMode.value === 'saved') return !!co.selectedAddressId.value
  const { first_name, last_name, email, address_line_1, city, state, country } = co.newAddr
  return !!(first_name && last_name && email && address_line_1 && city && state && country)
})

const newAddrShippingReady = computed(() =>
  !!(co.newAddr.city && co.newAddr.state && co.newAddr.country)
)

const canPlace = computed(() =>
  cart.items.length > 0 &&
  addressComplete.value &&
  !!co.selectedShipping.value &&
  !!co.selectedPayment.value &&
  !co.placing.value
)

// ── Initialization ─────────────────────────────────────────────────────────
onMounted(async () => {
  const initializers = [cart.fetchCart(), co.loadPaymentMethods()]
  if (authStore.isLoggedIn) {
    initializers.push(fetchAddresses())
  }

  await Promise.all(initializers)
  if (authStore.user?.email && !co.newAddr.email) {
    co.newAddr.email = authStore.user.email
  }

  if (!addresses.value.length) {
    co.addressMode.value = 'new'
    return
  }

  const defaultAddr = addresses.value.find(a => a.is_default) ?? addresses.value[0]
  co.selectedAddressId.value = defaultAddr?.id ?? null
  // The watch below handles shipping load when selectedAddressId changes.
})

// ── Watchers ───────────────────────────────────────────────────────────────
// Load shipping when a saved address is selected.
watch(co.selectedAddressId, async (id) => {
  co.clearShipping()
  if (id && co.addressMode.value === 'saved') {
    await co.loadShipping(currentAddress.value)
  }
})

// Clear shipping when switching address mode.
watch(co.addressMode, () => co.clearShipping())

watch(() => co.newAddr.country, (country, previousCountry) => {
  const countryCode = resolveCountryCode(country)
  if (countryCode && countryCode !== country) {
    co.newAddr.country = countryCode
    return
  }

  if (previousCountry !== undefined && country !== previousCountry) {
    co.newAddr.state = ''
    co.newAddr.city = ''
    co.clearShipping()
  }
})

watch(() => co.newAddr.state, (state, previousState) => {
  if (previousState !== undefined && state !== previousState) {
    co.newAddr.city = ''
    co.clearShipping()
  }
})

watch(() => co.newAddr.city, (city, previousCity) => {
  if (previousCity !== undefined && city !== previousCity) {
    co.clearShipping()
  }
})

// ── Helpers ────────────────────────────────────────────────────────────────
function switchToNew() { co.addressMode.value = 'new' }
function switchToSaved() { co.addressMode.value = 'saved' }

// ── Place order ────────────────────────────────────────────────────────────
async function placeOrder() {
  if (!canPlace.value || co.placing.value) return
  co.placing.value = true
  try {
    if (authStore.isLoggedIn && co.addressMode.value === 'new' && co.saveNewAddress.value) {
      const { email, ...addressData } = co.newAddr
      await createAddress(addressData).catch(() => {})
    }

    const addr = currentAddress.value
    const order = await co.submitOrder({
      full_name: `${addr.first_name} ${addr.last_name}`.trim(),
      email: addr.email ?? authStore.user?.email ?? '',
      phone: addr.phone ?? '',
      country: addr.country,
      state: addr.state,
      city: addr.city,
      line1: addr.address_line_1,
      line2: addr.address_line_2 ?? '',
    })

    const orderId = order?.data?.id ?? order?.id
    const payment = await co.initializePayment(orderId)

    const selectedMethod = co.paymentMethods.value.find(m => m.id === co.selectedPayment.value)

    if (selectedMethod?.supportsVerification) {
      const authorizationUrl = payment?.data?.authorization_url

      if (!authorizationUrl) {
        throw new Error('Payment verification is supported, but no payment URL was returned.')
      }

      await navigateTo(authorizationUrl, { external: true })
    } else {
      await cart.clearCart()
      await navigateTo('/payment/success')
    }
  } catch (e) {
    toast.add({
      title: 'Order failed',
      description: e?.data?.message ?? 'Something went wrong. Please try again.',
      color: 'error',
    })
  } finally {
    co.placing.value = false
  }
}

// ── Mobile summary toggle ──────────────────────────────────────────────────
const summaryOpen = shallowRef(false)
</script>

<template>
  <div>

    <!-- ── Mobile order summary bar ─────────────────────────────────────────── -->
    <div class="lg:hidden sticky top-0 z-30 bg-white border-b border-neutral-200 shadow-sm">
      <LayoutContainer>
        <button
          class="w-full flex items-center justify-between py-4"
          @click="summaryOpen = !summaryOpen"
        >
          <span class="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <UIcon name="i-lucide-shopping-bag" class="w-4 h-4" />
            {{ summaryOpen ? 'Hide' : 'Show' }} order summary
            <span class="text-neutral-400 font-normal">({{ cart.itemCount }})</span>
          </span>
          <span class="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
            {{ co.fmt(co.total.value) }}
            <UIcon
              name="i-lucide-chevron-down"
              class="w-4 h-4 text-neutral-400 transition-transform duration-200"
              :class="summaryOpen ? '-rotate-180' : ''"
            />
          </span>
        </button>
      </LayoutContainer>

      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="summaryOpen" class="border-t border-neutral-100 bg-white pb-3">
          <LayoutContainer>
            <CheckoutOrderSummary
              :shipping-cost="co.shippingCost.value"
              :shipping-name="co.selectedShippingOption.value?.name ?? null"
            />
          </LayoutContainer>
        </div>
      </Transition>
    </div>

    <!-- ── Page content ──────────────────────────────────────────────────────── -->
    <LayoutContainer class="py-7 lg:py-10">
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 xl:gap-14">

        <!-- ── Left: form sections ─────────────────────────────────────── -->
        <div class="space-y-5">

          <!-- Empty cart guard -->
          <div
            v-if="!cart.items.length && !co.placing.value"
            class="py-20 text-center space-y-3 text-neutral-500"
          >
            <UIcon name="i-lucide-shopping-bag" class="w-10 h-10 mx-auto opacity-30" />
            <p class="text-sm">Your cart is empty.</p>
            <NuxtLink
              to="/"
              class="inline-block text-sm font-medium underline underline-offset-2 hover:text-neutral-900 transition-colors"
            >
              Continue shopping
            </NuxtLink>
          </div>

          <template v-else>

            <!-- ════════════════════════════════════════════════════════════
                 1. DELIVERY ADDRESS
            ════════════════════════════════════════════════════════════ -->
            <section class="border border-neutral-200 rounded-xl overflow-hidden">

              <div class="flex items-center gap-2.5 px-5 py-4 bg-neutral-50 border-b border-neutral-200">
                <span class="w-5 h-5 rounded-full bg-[#111111] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <h2 class="text-xs font-semibold uppercase tracking-widest text-neutral-700">
                  Delivery Address
                </h2>
              </div>

              <div class="p-5">

                <!-- Skeleton while addresses load -->
                <div v-if="loadingAddresses" class="space-y-3">
                  <USkeleton v-for="n in 2" :key="n" class="h-24 rounded-lg" />
                </div>

                <!-- ── Saved address list ─────────────────────────────── -->
                <div
                  v-else-if="co.addressMode.value === 'saved' && addresses.length"
                  class="space-y-3"
                >
                  <label
                    v-for="addr in addresses"
                    :key="addr.id"
                    class="flex gap-3 p-4 border rounded-lg cursor-pointer transition-all"
                    :class="co.selectedAddressId.value === addr.id
                      ? 'border-[#111111] bg-neutral-50 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-400'"
                  >
                    <input
                      v-model="co.selectedAddressId.value"
                      type="radio"
                      :value="addr.id"
                      class="mt-1 shrink-0 accent-[#111111]"
                    />
                    <div class="text-sm leading-relaxed min-w-0">
                      <div class="flex flex-wrap items-center gap-1.5 mb-1">
                        <span class="font-medium text-neutral-900">
                          {{ addr.first_name }} {{ addr.last_name }}
                        </span>
                        <span
                          v-if="addr.label"
                          class="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 border border-neutral-200 px-1.5 py-0.5 rounded"
                        >
                          {{ addr.label }}
                        </span>
                        <span
                          v-if="addr.is_default"
                          class="text-[10px] uppercase tracking-wider font-semibold bg-[#111111] text-white px-1.5 py-0.5 rounded"
                        >
                          Default
                        </span>
                      </div>
                      <p class="text-neutral-600 truncate">{{ addr.address_line_1 }}</p>
                      <p v-if="addr.address_line_2" class="text-neutral-600 truncate">
                        {{ addr.address_line_2 }}
                      </p>
                      <p class="text-neutral-600">{{ addr.city }}, {{ addr.state }}</p>
                      <p class="text-neutral-600">{{ addr.country }}</p>
                      <p v-if="addr.phone" class="text-xs text-neutral-400 mt-0.5">{{ addr.phone }}</p>
                    </div>
                  </label>

                  <button
                    class="w-full py-2.5 border border-dashed border-neutral-300 rounded-lg text-sm text-neutral-500 hover:border-neutral-500 hover:text-neutral-700 transition-colors"
                    @click="switchToNew"
                  >
                    + Use a different address
                  </button>
                </div>

                <!-- ── New address form ──────────────────────────────── -->
                <div v-else class="space-y-4">

                  <!-- Back to saved (only if user has saved addresses) -->
                  <button
                    v-if="addresses.length"
                    class="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
                    @click="switchToSaved"
                  >
                    <UIcon name="i-lucide-arrow-left" class="w-3 h-3" />
                    Use a saved address
                  </button>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-neutral-600 mb-1.5">
                        First Name <span class="text-red-500">*</span>
                      </label>
                      <UInput v-model="co.newAddr.first_name" placeholder="Jane" class="w-full" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-neutral-600 mb-1.5">
                        Last Name <span class="text-red-500">*</span>
                      </label>
                      <UInput v-model="co.newAddr.last_name" placeholder="Doe" class="w-full" />
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-neutral-600 mb-1.5">
                      Email <span class="text-red-500">*</span>
                    </label>
                    <UInput
                      v-model="co.newAddr.email"
                      type="email"
                      placeholder="jane@example.com"
                      icon="i-lucide-mail"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-neutral-600 mb-1.5">Phone</label>
                    <UInput
                      v-model="co.newAddr.phone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      icon="i-lucide-phone"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-neutral-600 mb-1.5">
                      Address Line 1 <span class="text-red-500">*</span>
                    </label>
                    <UInput
                      v-model="co.newAddr.address_line_1"
                      placeholder="12 Bode Thomas Street"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-neutral-600 mb-1.5">
                      Address Line 2
                      <span class="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <UInput
                      v-model="co.newAddr.address_line_2"
                      placeholder="Flat 3B, Suite 200..."
                      class="w-full"
                    />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-neutral-600 mb-1.5">
                        Country <span class="text-red-500">*</span>
                      </label>
                      <USelect
                        v-model="co.newAddr.country"
                        :items="countryOptions"
                        placeholder="Select country"
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-neutral-600 mb-1.5">
                        State <span class="text-red-500">*</span>
                      </label>
                      <USelect
                        v-model="co.newAddr.state"
                        :items="stateOptions"
                        :disabled="!co.newAddr.country"
                        placeholder="Select state"
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-neutral-600 mb-1.5">
                        City <span class="text-red-500">*</span>
                      </label>
                      <USelect
                        v-model="co.newAddr.city"
                        :items="cityOptions"
                        :disabled="!co.newAddr.state"
                        placeholder="Select city"
                        class="w-full"
                      />
                    </div>
                  </div>

                  <!-- Save address -->
                  <label
                    v-if="authStore.isLoggedIn"
                    class="flex items-center gap-2.5 cursor-pointer select-none group"
                  >
                    <input
                      v-model="co.saveNewAddress.value"
                      type="checkbox"
                      class="w-4 h-4 rounded accent-[#111111]"
                    />
                    <span class="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">
                      Save this address to my account
                    </span>
                  </label>

                  <!-- Get shipping button: appears once city/state/country are filled -->
                  <Transition
                    enter-active-class="transition-all duration-200 ease-out"
                    enter-from-class="opacity-0 translate-y-1"
                    enter-to-class="opacity-100 translate-y-0"
                  >
                    <button
                      v-if="newAddrShippingReady && !co.shippingOptions.value.length && !co.shippingLoading.value"
                      class="w-full h-10 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium tracking-wide rounded-lg transition-colors flex items-center justify-center gap-2"
                      @click="co.loadShipping(co.newAddr)"
                    >
                      <UIcon name="i-lucide-truck" class="w-3.5 h-3.5" />
                      Get Shipping Options
                    </button>
                  </Transition>
                </div>

              </div>
            </section>

            <!-- ════════════════════════════════════════════════════════════
                 2. SHIPPING METHOD
            ════════════════════════════════════════════════════════════ -->
            <section
              class="border border-neutral-200 rounded-xl overflow-hidden transition-opacity duration-300"
              :class="!addressComplete ? 'opacity-40 pointer-events-none select-none' : ''"
            >

              <div class="flex items-center gap-2.5 px-5 py-4 bg-neutral-50 border-b border-neutral-200">
                <span class="w-5 h-5 rounded-full bg-[#111111] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <h2 class="text-xs font-semibold uppercase tracking-widest text-neutral-700">
                  Shipping Method
                </h2>
              </div>

              <div class="p-5">

                <!-- Loading -->
                <div
                  v-if="co.shippingLoading.value"
                  class="flex items-center gap-2.5 py-2 text-sm text-neutral-500"
                >
                  <span class="w-4 h-4 border-2 border-neutral-200 border-t-neutral-700 rounded-full animate-spin" />
                  Calculating shipping options...
                </div>

                <!-- Error -->
                <div v-else-if="co.shippingError.value" class="flex items-start gap-2.5 py-1">
                  <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p class="text-sm text-red-500">{{ co.shippingError.value }}</p>
                    <button
                      class="text-xs text-neutral-500 underline hover:text-neutral-800 mt-1 transition-colors"
                      @click="co.loadShipping(currentAddress)"
                    >
                      Try again
                    </button>
                  </div>
                </div>

                <!-- Prompt: address not yet complete -->
                <p
                  v-else-if="!addressComplete"
                  class="text-sm text-neutral-400 py-1"
                >
                  Complete your delivery address to see shipping options.
                </p>

                <!-- Shipping options list -->
                <div v-else-if="co.shippingOptions.value.length" class="space-y-3">
                  <label
                    v-for="opt in co.shippingOptions.value"
                    :key="opt.id"
                    class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all"
                    :class="co.selectedShipping.value === opt.id
                      ? 'border-[#111111] bg-neutral-50 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-400'"
                  >
                    <input
                      v-model="co.selectedShipping.value"
                      type="radio"
                      :value="opt.id"
                      class="mt-0.5 shrink-0 accent-[#111111]"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-baseline justify-between gap-3">
                        <span class="text-sm font-medium text-neutral-900">{{ opt.name }}</span>
                        <span class="text-sm font-semibold text-neutral-900 shrink-0">
                          {{ opt.price === 0 ? 'Free' : co.fmt(opt.price) }}
                        </span>
                      </div>
                      <p v-if="opt.description" class="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                        {{ opt.description }}
                      </p>
                      <p v-if="opt.estimated_days_min" class="text-xs text-neutral-400 mt-1">
                        Estimated
                        {{ opt.estimated_days_min === opt.estimated_days_max
                          ? opt.estimated_days_min
                          : `${opt.estimated_days_min}–${opt.estimated_days_max}` }}
                        business {{ opt.estimated_days_max === 1 ? 'day' : 'days' }}
                      </p>
                    </div>
                  </label>
                </div>

                <!-- No options available -->
                <p
                  v-else-if="addressComplete && !co.shippingLoading.value"
                  class="text-sm text-neutral-400 py-1"
                >
                  No shipping options available for this address.
                </p>

              </div>
            </section>

            <!-- ════════════════════════════════════════════════════════════
                 3. PAYMENT METHOD
            ════════════════════════════════════════════════════════════ -->
            <section class="border border-neutral-200 rounded-xl overflow-hidden">

              <div class="flex items-center gap-2.5 px-5 py-4 bg-neutral-50 border-b border-neutral-200">
                <span class="w-5 h-5 rounded-full bg-[#111111] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <h2 class="text-xs font-semibold uppercase tracking-widest text-neutral-700">
                  Payment Method
                </h2>
              </div>

              <div class="p-5 space-y-3">

                <!-- Loading -->
                <div
                  v-if="co.paymentLoading.value"
                  class="flex items-center gap-2.5 py-2 text-sm text-neutral-500"
                >
                  <span class="w-4 h-4 border-2 border-neutral-200 border-t-neutral-700 rounded-full animate-spin" />
                  Loading payment methods...
                </div>

                <!-- Error -->
                <div v-else-if="co.paymentError.value" class="flex items-start gap-2.5 py-1">
                  <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p class="text-sm text-red-500">{{ co.paymentError.value }}</p>
                    <button
                      class="text-xs text-neutral-500 underline hover:text-neutral-800 mt-1 transition-colors"
                      @click="co.loadPaymentMethods()"
                    >
                      Try again
                    </button>
                  </div>
                </div>

                <template v-else>
                  <label
                    v-for="method in co.paymentMethods.value"
                    :key="method.id"
                    class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all"
                    :class="co.selectedPayment.value === method.id
                      ? 'border-[#111111] bg-neutral-50 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-400'"
                  >
                    <input
                      v-model="co.selectedPayment.value"
                      type="radio"
                      :value="method.id"
                      class="mt-1 shrink-0 accent-[#111111]"
                    />
                    <div class="flex items-start gap-3">
                      <div class="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                        <UIcon :name="method.icon" class="w-4 h-4 text-neutral-600" />
                      </div>
                      <div>
                        <p class="text-sm font-medium text-neutral-900">{{ method.label }}</p>
                        <p class="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                          {{ method.description }}
                        </p>
                      </div>
                    </div>
                  </label>
                </template>

                <!-- Bank transfer details panel -->
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 -translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition-all duration-150 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <div
                    v-if="co.selectedPayment.value === 'bank_transfer'"
                    class="ml-3 p-4 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <p class="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-2.5">
                      Bank Details
                    </p>
                    <div class="space-y-1.5 text-sm text-neutral-700">
                      <p><span class="font-medium">Bank:</span> First Bank of Nigeria</p>
                      <p><span class="font-medium">Account Name:</span> Glamrush Stores Ltd</p>
                      <p><span class="font-medium">Account No:</span> 1234567890</p>
                    </div>
                    <p class="text-xs text-neutral-500 mt-3 pt-3 border-t border-amber-200 leading-relaxed">
                      Include your name and email in the transfer narration. Your order will ship within 24 hours of payment confirmation.
                    </p>
                  </div>
                </Transition>
              </div>
            </section>

            <!-- ════════════════════════════════════════════════════════════
                 PLACE ORDER
            ════════════════════════════════════════════════════════════ -->
            <div class="space-y-3 pb-6">
              <button
                class="w-full h-12 bg-[#111111] text-white text-xs tracking-widest uppercase font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
                :disabled="!canPlace"
                @click="placeOrder"
              >
                <span v-if="co.placing.value" class="flex items-center justify-center gap-2">
                  <span class="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                  Placing Order...
                </span>
                <span v-else>
                  Place Order · {{ co.fmt(co.total.value) }}
                </span>
              </button>

              <!-- Contextual hint for why button is disabled -->
              <p v-if="!canPlace && cart.items.length" class="text-xs text-center text-neutral-400">
                <template v-if="!addressComplete">Complete your delivery address</template>
                <template v-else-if="!co.selectedShipping.value">Select a shipping method</template>
                <template v-else>Select a payment method</template>
                to continue.
              </p>

              <p class="text-xs text-center text-neutral-400">
                By placing your order you agree to our
                <NuxtLink
                  to="/terms"
                  class="underline underline-offset-2 hover:text-neutral-700 transition-colors"
                >
                  Terms &amp; Conditions
                </NuxtLink>
              </p>
            </div>

          </template>
        </div>

        <!-- ── Right: order summary (desktop only) ─────────────────────── -->
        <div class="hidden lg:block">
          <div class="sticky top-6">
            <CheckoutOrderSummary
              :shipping-cost="co.shippingCost.value"
              :shipping-name="co.selectedShippingOption.value?.name ?? null"
            />
          </div>
        </div>

      </div>
    </LayoutContainer>

  </div>
</template>
