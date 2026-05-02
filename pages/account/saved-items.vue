<script setup>
const { savedItemsList, fetchSavedItems, removeSaved } = useSavedItems()

const removingIds = ref([])

onMounted(fetchSavedItems)

async function handleRemove(productId) {
  removingIds.value = [...removingIds.value, productId]
  await removeSaved(productId)
  removingIds.value = removingIds.value.filter(id => id !== productId)
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold mb-6">Saved Items</h1>

    <div v-if="savedItemsList.length === 0" class="text-neutral-500 text-sm">
      No saved items yet.
      <NuxtLink to="/" class="underline hover:text-neutral-900">Browse products</NuxtLink>
    </div>

    <ul v-else class="divide-y divide-neutral-100">
      <li
        v-for="item in savedItemsList"
        :key="item.id"
        class="flex items-center gap-4 py-4"
      >
        <NuxtLink :to="`/products/${item.slug}`" class="shrink-0">
          <img
            :src="item.thumb"
            :alt="item.name"
            class="w-[60px] h-[75px] object-cover bg-neutral-100"
          />
        </NuxtLink>

        <div class="flex-1 min-w-0">
          <NuxtLink
            :to="`/products/${item.slug}`"
            class="text-sm font-medium text-neutral-900 hover:text-[#c89b3c] transition-colors line-clamp-2"
          >
            {{ item.name }}
          </NuxtLink>
          <p class="text-xs text-neutral-400 mt-0.5">{{ item.slug }}</p>
        </div>

        <button
          :disabled="removingIds.includes(item.product_id)"
          class="shrink-0 p-1.5 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
          aria-label="Remove saved item"
          @click="handleRemove(item.product_id)"
        >
          <UIcon
            :name="removingIds.includes(item.product_id) ? 'i-lucide-loader-2' : 'i-lucide-trash-2'"
            class="w-4 h-4"
            :class="{ 'animate-spin': removingIds.includes(item.product_id) }"
          />
        </button>
      </li>
    </ul>
  </div>
</template>
