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
})

const form = reactive({
  label: props.initialData?.label ?? '',
  first_name: props.initialData?.first_name ?? '',
  last_name: props.initialData?.last_name ?? '',
  phone: props.initialData?.phone ?? '',
  address_line_1: props.initialData?.address_line_1 ?? '',
  address_line_2: props.initialData?.address_line_2 ?? '',
  country: props.initialData?.country ?? 'NG',
  state: props.initialData?.state ?? '',
  city: props.initialData?.city ?? '',
})

const {
  countryOptions,
  stateOptions,
  cityOptions,
  resolveCountryCode,
} = useAddressLocationOptions(form)

form.country = resolveCountryCode(form.country)

watch(() => form.country, (country, previousCountry) => {
  const countryCode = resolveCountryCode(country)
  if (countryCode && countryCode !== country) {
    form.country = countryCode
    return
  }

  if (previousCountry !== undefined && country !== previousCountry) {
    form.state = ''
    form.city = ''
  }
})

watch(() => form.state, (state, previousState) => {
  if (previousState !== undefined && state !== previousState) {
    form.city = ''
  }
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

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <UFormField name="country" label="Country" required>
        <USelect
          v-model="form.country"
          :items="countryOptions"
          placeholder="Select country"
          class="w-full"
        />
      </UFormField>

      <UFormField name="state" label="State" required>
        <USelect
          v-model="form.state"
          :items="stateOptions"
          :disabled="!form.country"
          placeholder="Select state"
          class="w-full"
        />
      </UFormField>

      <UFormField name="city" label="City" required>
        <USelect
          v-model="form.city"
          :items="cityOptions"
          :disabled="!form.state"
          placeholder="Select city"
          class="w-full"
        />
      </UFormField>
    </div>

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
