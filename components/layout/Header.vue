<script setup>
const navLinks = [
  { label: 'New', to: '/new' },
  { label: 'Collections', to: '/collections' },
  { label: 'Under 5K', to: '/under-5k' },
  { label: 'On Sale', to: '/sale' },
]

const searchOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)
const { logout } = useAuth()
const authStore = useAuthStore()
const { animationType } = useSaveAnimation()
const cart = useCartStore()
const { bumping } = useCartAnimation()
const cartOpen = ref(false)
const mobileMenuOpen = ref(false)
const accountMenuOpen = ref(false)

async function openSearch() {
  searchOpen.value = true
  await nextTick()
  searchInput.value?.focus()
}

const buttonIcon = computed(() =>
  (animationType.value === 'unsaved' || animationType.value === 'failed') ? 'i-lucide-x' : 'i-lucide-user'
)

const guestMenuItems = [
  [
    { label: 'Log in', icon: 'i-lucide-log-in', to: '/login' },
    { label: 'Sign up', icon: 'i-lucide-user-plus', to: '/register' },
  ],
]

const loggedInMenuItems = computed(() => [
  [
    { label: 'My Account', icon: 'i-lucide-user', to: '/account' },
    { label: 'Saved items', icon: 'i-lucide-heart', to: '/account/saved-items' },
    { label: 'Orders', icon: 'i-lucide-package', to: '/account/orders' },
  ],
  [
    { label: 'Log out', icon: 'i-lucide-log-out', onSelect: logout },
  ],
])

const menuItems = computed(() => authStore.isLoggedIn ? loggedInMenuItems.value : guestMenuItems)
</script>

<template>
  <!-- Promo bar -->
  <div class="bg-[#111111] text-white text-xs text-center py-2 tracking-wide font-medium">
    FREE SHIPPING ON ORDERS OVER ₦50,000
  </div>

  <header class="sticky top-0 z-50 bg-white border-b border-neutral-200">

    <!-- Search overlay -->
    <Transition name="search-fade">
      <div
        v-if="searchOpen"
        class="absolute inset-0 z-10 bg-white flex items-center px-4 gap-3"
      >
        <UIcon name="i-lucide-search" class="w-5 h-5 text-neutral-400 shrink-0" />
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Search products..."
          class="flex-1 text-sm outline-none placeholder:text-neutral-400"
          @keydown.escape="searchOpen = false"
        />
        <button
          class="shrink-0 text-neutral-500 hover:text-neutral-900 transition-colors"
          @click="searchOpen = false"
        >
          <UIcon name="i-lucide-x" class="w-5 h-5" />
        </button>
      </div>
    </Transition>

    <LayoutContainer>
      <div class="flex items-center h-14 gap-6">

        <!-- Mobile: hamburger -->
        <button
          class="md:hidden flex items-center justify-center w-9 h-9 -ml-1 text-neutral-700 hover:text-neutral-900 transition-colors"
          @click="mobileMenuOpen = true"
        >
          <UIcon name="i-lucide-menu" class="w-5 h-5" />
        </button>

        <!-- Logo -->
        <NuxtLink
          to="/"
          class="shrink-0 text-lg font-bold tracking-widest uppercase text-neutral-900"
        >
          Glamrush
        </NuxtLink>

        <!-- Nav — desktop only, centred -->
        <nav class="hidden md:flex flex-1 items-center justify-center gap-7">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="text-xs font-semibold tracking-widest uppercase text-neutral-600 hover:text-neutral-900 transition-colors"
            active-class="text-neutral-900"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <!-- Right actions -->
        <div class="ml-auto md:ml-0 shrink-0 flex items-center">

          <!-- Search icon -->
          <button
            class="w-9 h-9 flex items-center justify-center text-neutral-700 hover:text-neutral-900 transition-all duration-200 cursor-pointer"
            aria-label="Search"
            @click="openSearch"
          >
            <UIcon name="i-lucide-search" class="w-[18px] h-[18px]" />
          </button>

          <!-- Account -->
          <div class="relative">
            <UDropdownMenu v-model:open="accountMenuOpen" :items="menuItems" :content="{ align: 'end' }">
              <button class="h-9 flex items-center gap-1.5 px-1 text-neutral-700 hover:text-neutral-900 transition-all duration-200 cursor-pointer">
                <UIcon :name="buttonIcon" class="w-[18px] h-[18px] transition-all" />
                <span v-if="authStore.isLoggedIn && authStore.user?.name" class="text-xs font-bold uppercase tracking-wide">
                  {{ authStore.user.name }}
                </span>
                <UIcon
                  name="i-lucide-chevron-down"
                  class="w-3.5 h-3.5 transition-transform duration-200"
                  :class="accountMenuOpen ? '-rotate-180' : 'rotate-0'"
                />
              </button>
            </UDropdownMenu>

            <!-- Save animation overlay -->
            <span
              v-if="animationType !== null"
              class="absolute inset-0 flex items-center justify-center pointer-events-none"
              :style="animationType === 'failed'
                ? 'animation: heartFail 1.6s ease-in-out forwards;'
                : 'animation: heartFly 0.8s ease-in-out forwards;'"
            >
              <template v-if="animationType !== 'failed'">
                <UIcon
                  name="i-lucide-heart"
                  class="w-5 h-5"
                  :class="animationType === 'saved' ? 'text-red-500 fill-red-500' : 'text-[#111111] fill-[#111111]'"
                />
              </template>
              <template v-else>
                <UIcon
                  name="i-lucide-heart"
                  class="w-5 h-5 text-red-500 fill-red-500 absolute"
                  style="animation: fadeOutHalf 1.6s ease-in-out forwards;"
                />
                <UIcon
                  name="i-lucide-x"
                  class="w-5 h-5 text-[#111111] absolute"
                  style="animation: fadeInHalf 1.6s ease-in-out forwards;"
                />
              </template>
            </span>
          </div>

          <!-- Saved items (logged in only) -->
          <NuxtLink
            v-if="authStore.isLoggedIn"
            to="/account/saved-items"
            class="w-9 h-9 flex items-center justify-center text-neutral-700 hover:text-neutral-900 transition-all duration-200 cursor-pointer"
            aria-label="Saved items"
          >
            <UIcon name="i-lucide-heart" class="w-[18px] h-[18px]" />
          </NuxtLink>

          <!-- Cart -->
          <div class="relative">
            <button
              class="w-9 h-9 flex items-center justify-center text-neutral-700 hover:text-neutral-900 transition-all duration-200 cursor-pointer"
              aria-label="Cart"
              @click="cartOpen = true"
            >
              <UIcon name="i-lucide-shopping-bag" class="w-[18px] h-[18px]" />
            </button>
            <span
              v-if="cart.itemCount > 0"
              :class="['absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center bg-[#111111] text-white text-[9px] font-bold rounded-full pointer-events-none leading-none', bumping ? 'cart-badge-bump' : '']"
            >
              {{ cart.itemCount > 99 ? '99+' : cart.itemCount }}
            </span>
          </div>

        </div>
      </div>
    </LayoutContainer>
  </header>

  <!-- Mobile nav drawer -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 bg-black/40 z-40 md:hidden"
        @click="mobileMenuOpen = false"
      />
    </Transition>
    <Transition name="slide-in">
      <div
        v-if="mobileMenuOpen"
        class="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-xl overflow-y-auto md:hidden flex flex-col"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <span class="text-sm font-bold tracking-widest uppercase">Glamrush</span>
          <button
            class="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
            @click="mobileMenuOpen = false"
          >
            <UIcon name="i-lucide-x" class="w-4 h-4" />
          </button>
        </div>
        <nav class="flex flex-col py-4">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-5 py-3 text-sm font-semibold tracking-widest uppercase text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            @click="mobileMenuOpen = false"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>
    </Transition>
  </Teleport>

  <!-- Cart drawer -->
  <CartDrawer :open="cartOpen" @close="cartOpen = false" />
</template>

<style scoped>
.search-fade-enter-active, .search-fade-leave-active { transition: opacity 0.15s ease; }
.search-fade-enter-from, .search-fade-leave-to       { opacity: 0; }

.fade-enter-active, .fade-leave-active  { transition: opacity 0.2s ease; }
.fade-enter-from,  .fade-leave-to       { opacity: 0; }

.slide-in-enter-active, .slide-in-leave-active { transition: transform 0.26s ease; }
.slide-in-enter-from,   .slide-in-leave-to     { transform: translateX(-100%); }
</style>
