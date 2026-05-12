<script setup>
import { z } from 'zod'

const props = defineProps({
  initialData: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'cancel'])

const schema = z.object({
  label: z.string(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string(),
  address_line_1: z.string().min(1, 'Address line 1 is required'),
  address_line_2: z.string(),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State / province is required'),
  city: z.string().min(1, 'City is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
})

const form = reactive({
  label: props.initialData?.label ?? '',
  first_name: props.initialData?.first_name ?? '',
  last_name: props.initialData?.last_name ?? '',
  phone: props.initialData?.phone ?? '',
  address_line_1: props.initialData?.address_line_1 ?? '',
  address_line_2: props.initialData?.address_line_2 ?? '',
  country: props.initialData?.country ?? '',
  state: props.initialData?.state ?? '',
  city: props.initialData?.city ?? '',
  postal_code: props.initialData?.postal_code ?? '',
})

function onSubmit() {
  const payload = { ...form }
  if (!payload.label) delete payload.label
  if (!payload.phone) delete payload.phone
  if (!payload.address_line_2) delete payload.address_line_2
  emit('submit', payload)
}
</script>

<template>
  <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
    <UFormField name="label" label="Label" hint="e.g. Home, Office">
      <UInput v-model="form.label" placeholder="Home" class="w-full" />
    </UFormField>

    <div class="grid grid-cols-2 gap-3">
      <UFormField name="first_name" label="First Name" required>
        <UInput v-model="form.first_name" placeholder="Jane" class="w-full" />
      </UFormField>
      <UFormField name="last_name" label="Last Name" required>
        <UInput v-model="form.last_name" placeholder="Doe" class="w-full" />
      </UFormField>
    </div>

    <UFormField name="phone" label="Phone">
      <UInput v-model="form.phone" type="tel" placeholder="+2348000000001" icon="i-lucide-phone" class="w-full" />
    </UFormField>

    <UFormField name="address_line_1" label="Address Line 1" required>
      <UInput v-model="form.address_line_1" placeholder="12 Bode Thomas Street" class="w-full" />
    </UFormField>

    <UFormField name="address_line_2" label="Address Line 2" hint="Optional">
      <UInput v-model="form.address_line_2" placeholder="Flat 3B" class="w-full" />
    </UFormField>

    <div class="grid grid-cols-3 gap-3">
      <UFormField name="city" label="City" required>
        <UInput v-model="form.city" placeholder="Surulere" class="w-full" />
      </UFormField>
      <UFormField name="state" label="State" required>
        <UInput v-model="form.state" placeholder="Lagos" class="w-full" />
      </UFormField>
      <UFormField name="postal_code" label="Postal Code" required>
        <UInput v-model="form.postal_code" placeholder="101212" class="w-full" />
      </UFormField>
    </div>

    <UFormField name="country" label="Country" required>
      <UInput v-model="form.country" placeholder="Nigeria" class="w-full" />
    </UFormField>

    <div class="flex justify-end gap-3 pt-2">
      <UButton type="button" variant="ghost" color="neutral" :disabled="loading" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="neutral" :loading="loading">
        {{ initialData ? 'Save Changes' : 'Add Address' }}
      </UButton>
    </div>
  </UForm>
</template>
