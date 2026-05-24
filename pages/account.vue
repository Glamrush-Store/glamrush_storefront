<script setup>
definePageMeta({ middleware: 'auth' })

const mobileOpen = ref(false)

const sidebarLinks = [
  { label: 'Saved Items', to: '/account/saved-items', icon: 'i-lucide-heart' },
  { label: 'Orders', to: '/account/orders', icon: 'i-lucide-package' },
  { label: 'Edit Account', to: '/account/edit', icon: 'i-lucide-user' },
  { label: 'Address Book', to: '/account/addresses', icon: 'i-lucide-map-pin' },
  { label: 'Vouchers', to: '/account/vouchers', icon: 'i-lucide-ticket' },
]
</script>

<template>
  <div class="w-full max-w-4xl mx-auto px-4 py-10 overflow-x-hidden">

    <!-- Mobile burger -->
    <button
      class="md:hidden mb-4 flex items-center gap-2 text-sm font-medium text-neutral-700"
      @click="mobileOpen = !mobileOpen"
    >
      <UIcon name="i-lucide-menu" class="w-5 h-5" />
      Account Menu
    </button>

    <div class="md:grid md:grid-cols-[200px_1fr] md:gap-8">

      <!-- Sidebar -->
      <aside :class="['mb-6 md:mb-0', mobileOpen ? 'block' : 'hidden md:block']">
        <nav class="space-y-1">
          <NuxtLink
            v-for="link in sidebarLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-2.5 px-3 py-2 rounded text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            active-class="bg-neutral-100 text-neutral-900 font-medium"
          >
            <UIcon :name="link.icon" class="w-4 h-4 shrink-0" />
            {{ link.label }}
          </NuxtLink>
        </nav>
      </aside>

      <!-- Child page content -->
      <main class="min-w-0">
        <NuxtPage />
      </main>

    </div>
  </div>
</template>
