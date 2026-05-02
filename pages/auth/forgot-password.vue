<script setup>
import { z } from 'zod'

definePageMeta({ layout: 'default' })

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
})

const state = reactive({ email: '' })
const pending = ref(false)
const submitted = ref(false)
const toast = useToast()
const { forgotPassword } = useAuth()

async function onSubmit() {
  pending.value = true
  const res = await forgotPassword(state.email)
  pending.value = false

  if (res?.success) {
    submitted.value = true
  } else {
    toast.add({
      title: res?.message ?? 'Something went wrong',
      color: 'error',
    })
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
    <div class="w-full max-w-md">

      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="text-2xl font-semibold tracking-tight text-neutral-900">
          Glamrush
        </NuxtLink>
      </div>

      <div class="bg-white rounded-xl border border-neutral-200 shadow-sm p-8">

        <!-- Success state -->
        <div v-if="submitted" class="text-center space-y-4">
          <div class="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <UIcon name="i-lucide-mail-check" class="w-6 h-6 text-green-600" />
          </div>
          <h2 class="text-lg font-semibold text-neutral-900">Check your email</h2>
          <p class="text-sm text-neutral-500">
            We sent a reset code to <strong>{{ state.email }}</strong>
          </p>
          <UButton
            :to="`/auth/reset-password?email=${encodeURIComponent(state.email)}`"
            block
            color="neutral"
          >
            Enter reset code
          </UButton>
        </div>

        <!-- Form state -->
        <template v-else>
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-neutral-900">Forgot password?</h2>
            <p class="mt-1 text-sm text-neutral-500">Enter your email and we'll send you a reset code.</p>
          </div>

          <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
            <UFormField name="email" label="Email" required>
              <UInput
                v-model="state.email"
                type="email"
                placeholder="you@example.com"
                icon="i-lucide-mail"
                class="w-full"
              />
            </UFormField>

            <UButton type="submit" block :loading="pending" color="neutral">
              Send reset code
            </UButton>
          </UForm>

          <div class="mt-4 text-center">
            <NuxtLink to="/login" class="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              Back to login
            </NuxtLink>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>
