<script setup>
defineProps({
  address: { type: Object, required: true },
})

const emit = defineEmits(['edit', 'delete', 'set-default'])
</script>

<template>
  <div
    class="relative border rounded-lg p-4 space-y-2 transition-colors"
    :class="address.is_default ? 'border-neutral-900' : 'border-neutral-200'"
  >
    <span
      v-if="address.is_default"
      class="absolute top-3 right-3 text-xs font-medium bg-neutral-900 text-white px-2 py-0.5 rounded-full"
    >
      Default
    </span>

    <p v-if="address.label" class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
      {{ address.label }}
    </p>

    <p class="text-sm font-medium text-neutral-900">
      {{ address.first_name }} {{ address.last_name }}
    </p>

    <div class="text-sm text-neutral-600 space-y-0.5">
      <p>{{ address.address_line_1 }}</p>
      <p v-if="address.address_line_2">{{ address.address_line_2 }}</p>
      <p>{{ address.city }}, {{ address.state }} {{ address.postal_code }}</p>
      <p>{{ address.country }}</p>
    </div>

    <p v-if="address.phone" class="text-sm text-neutral-500">
      {{ address.phone }}
    </p>

    <div class="flex flex-wrap items-center gap-1 pt-2 border-t border-neutral-100">
      <UButton
        v-if="!address.is_default"
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-lucide-star"
        @click="emit('set-default', address.id)"
      >
        Set as default
      </UButton>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-lucide-pencil"
        @click="emit('edit', address)"
      >
        Edit
      </UButton>
      <UButton
        size="xs"
        variant="ghost"
        color="error"
        icon="i-lucide-trash-2"
        @click="emit('delete', address.id)"
      >
        Delete
      </UButton>
    </div>
  </div>
</template>
