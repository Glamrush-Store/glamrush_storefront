<script setup>
const toast = useToast()
const { addresses, loading, fetchAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddresses()

const modalOpen = shallowRef(false)
const editingAddress = shallowRef(null)
const saving = shallowRef(false)

const confirmDeleteOpen = shallowRef(false)
const deletingId = shallowRef(null)
const deleting = shallowRef(false)

onMounted(fetchAddresses)

function openAdd() {
  editingAddress.value = null
  modalOpen.value = true
}

function openEdit(address) {
  editingAddress.value = address
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
}

function openDeleteConfirm(id) {
  deletingId.value = id
  confirmDeleteOpen.value = true
}

async function onFormSubmit(data) {
  saving.value = true
  const res = editingAddress.value
    ? await updateAddress(editingAddress.value.id, data)
    : await createAddress(data)
  saving.value = false

  if (res?.success) {
    toast.add({
      title: editingAddress.value ? 'Address updated' : 'Address added',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
    closeModal()
    await fetchAddresses()
  } else {
    toast.add({
      title: res?.message ?? 'Something went wrong',
      description: res?.errors ? Object.values(res.errors).flat().join(' ') : undefined,
      color: 'error',
    })
  }
}

async function onDelete() {
  deleting.value = true
  const res = await deleteAddress(deletingId.value)
  deleting.value = false
  confirmDeleteOpen.value = false

  const failed = res && !res.success && res.message
  if (!failed) {
    addresses.value = addresses.value.filter(a => a.id !== deletingId.value)
    toast.add({ title: 'Address deleted', color: 'success', icon: 'i-lucide-check-circle' })
  } else {
    toast.add({ title: res.message ?? 'Delete failed', color: 'error' })
  }
}

async function onSetDefault(id) {
  const res = await setDefaultAddress(id)

  // Error responses are { message, errors? } — no data or success field
  if (res?.message && !res?.data && !res?.success) {
    toast.add({ title: res.message, color: 'error' })
    return
  }

  addresses.value = addresses.value.map(a => ({ ...a, is_default: a.id === id }))
  toast.add({ title: 'Default address updated', color: 'success', icon: 'i-lucide-check-circle' })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold">Address Book</h1>
      <UButton icon="i-lucide-plus" color="neutral" size="sm" @click="openAdd">
        Add Address
      </UButton>
    </div>

    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <USkeleton v-for="n in 2" :key="n" class="h-40 rounded-lg" />
    </div>

    <div v-else-if="!addresses.length" class="text-center py-16 text-neutral-400">
      <UIcon name="i-lucide-map-pin" class="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p class="text-sm">No saved addresses yet.</p>
      <UButton class="mt-4" size="sm" color="neutral" variant="outline" @click="openAdd">
        Add your first address
      </UButton>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <AccountAddressCard
        v-for="address in addresses"
        :key="address.id"
        :address="address"
        @edit="openEdit"
        @delete="openDeleteConfirm"
        @set-default="onSetDefault"
      />
    </div>

    <UModal
      v-model:open="modalOpen"
      :title="editingAddress ? 'Edit Address' : 'Add Address'"
      :prevent-close="saving"
    >
      <template #body>
        <AccountAddressForm
          :key="editingAddress?.id ?? 'new'"
          :initial-data="editingAddress"
          :loading="saving"
          @submit="onFormSubmit"
          @cancel="closeModal"
        />
      </template>
    </UModal>

    <UModal
      v-model:open="confirmDeleteOpen"
      title="Delete Address"
      :prevent-close="deleting"
    >
      <template #body>
        <p class="text-sm text-neutral-600 mb-6">
          Are you sure you want to delete this address? This cannot be undone.
        </p>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" :disabled="deleting" @click="confirmDeleteOpen = false">
            Cancel
          </UButton>
          <UButton color="error" :loading="deleting" @click="onDelete">
            Delete
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
