export function useCheckoutState() {
  const { request } = useApi()
  const cart = useCartStore()

  // ── Address ────────────────────────────────────────────────────────────────
  const addressMode = shallowRef('saved') // 'saved' | 'new'
  const selectedAddressId = shallowRef(null)
  const saveNewAddress = shallowRef(false)

  const newAddr = reactive({
    first_name: '',
    last_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Nigeria',
  })

  // ── Shipping ───────────────────────────────────────────────────────────────
  const shippingOptions = ref([])
  const shippingLoading = shallowRef(false)
  const shippingError = shallowRef(null)
  const selectedShipping = shallowRef(null)

  const selectedShippingOption = computed(() =>
    shippingOptions.value.find(o => o.id === selectedShipping.value) ?? null
  )

  function clearShipping() {
    shippingOptions.value = []
    selectedShipping.value = null
    shippingError.value = null
  }

  async function loadShipping(addressObj) {
    if (!addressObj?.city || !addressObj?.state || !addressObj?.country) return
    shippingLoading.value = true
    shippingError.value = null
    shippingOptions.value = []
    selectedShipping.value = null
    try {
      const res = await request('/shipping/getoptions', {
        method: 'POST',
        body: {
          city: addressObj.city,
          state: addressObj.state,
          country: addressObj.country,
          ...(addressObj.postal_code ? { postal_code: addressObj.postal_code } : {}),
        },
      })
      const opts = Array.isArray(res?.data) ? res.data.map(r => ({
        id: r.rate_id,
        name: r.method?.name ?? r.rate_id,
        description: r.method?.description ?? null,
        price: r.amount ?? 0,
        estimated_days_min: r.estimated_days_min ?? null,
        estimated_days_max: r.estimated_days_max ?? null,
      })) : []
      shippingOptions.value = opts
      if (opts.length) selectedShipping.value = opts[0].id
    } catch {
      shippingError.value = 'Unable to load shipping options. Please try again.'
    } finally {
      shippingLoading.value = false
    }
  }

  // ── Payment ────────────────────────────────────────────────────────────────
  const ICON_MAP = {
    pod: 'i-lucide-wallet',
    cash: 'i-lucide-wallet',
    bank_transfer: 'i-lucide-building-2',
    card: 'i-lucide-credit-card',
    paystack: 'i-lucide-credit-card',
    flutterwave: 'i-lucide-credit-card',
  }

  const paymentMethods = ref([])
  const paymentLoading = shallowRef(false)
  const paymentError = shallowRef(null)
  const selectedPayment = shallowRef(null)

  async function loadPaymentMethods() {
    paymentLoading.value = true
    paymentError.value = null
    try {
      const res = await request('/payment-methods')
      const methods = Array.isArray(res?.data) ? res.data.map(m => ({
        id: m.code,
        label: m.name,
        description: m.description ?? '',
        icon: ICON_MAP[m.code] ?? 'i-lucide-credit-card',
        requiresRedirect: m.public_config?.requires_redirect ?? false,
      })) : []
      paymentMethods.value = methods
      if (methods.length) selectedPayment.value = methods[0].id
    } catch {
      paymentError.value = 'Unable to load payment methods. Please try again.'
    } finally {
      paymentLoading.value = false
    }
  }

  // ── Totals ─────────────────────────────────────────────────────────────────
  function fmt(n) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(n ?? 0)
  }

  const subtotal = computed(() => cart.subtotal)
  const shippingCost = computed(() => selectedShippingOption.value?.price ?? 0)
  const total = computed(() => subtotal.value + shippingCost.value)

  // ── Order submission ───────────────────────────────────────────────────────
  async function submitOrder(shippingAddress) {
    return request('/checkout/cart', {
      method: 'POST',
      body: {
        shipping_rate_id: selectedShipping.value,
        payment_method: selectedPayment.value,
        shipping_address: shippingAddress,
        billing_address: { same_as_shipping: true },
      },
    })
  }

  async function initializePayment(orderId) {
    return request('/payments/initialize', {
      method: 'POST',
      body: {
        order_id: orderId,
        payment_method: selectedPayment.value,
      },
    })
  }

  // ── Placing state ──────────────────────────────────────────────────────────
  const placing = shallowRef(false)

  return {
    // Address
    addressMode,
    selectedAddressId,
    newAddr,
    saveNewAddress,
    // Shipping
    shippingOptions,
    shippingLoading,
    shippingError,
    selectedShipping,
    selectedShippingOption,
    loadShipping,
    clearShipping,
    // Payment
    paymentMethods,
    paymentLoading,
    paymentError,
    loadPaymentMethods,
    selectedPayment,
    // Totals
    fmt,
    subtotal,
    shippingCost,
    total,
    // Order
    submitOrder,
    initializePayment,
    placing,
  }
}
