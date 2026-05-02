<script setup>
import { z } from 'zod'

definePageMeta({ layout: 'default' })

const route = useRoute()
const toast = useToast()
const { verifyCode, resetPassword } = useAuth()

const email = computed(() => route.query.email ?? '')
const step = ref(1)
const pending = ref(false)

// Step 1 — verify code
const codeSchema = z.object({
  code: z.string().length(6, 'Please enter the 6-digit code'),
})
const codeState = reactive({ code: '' })

async function onVerifyCode() {
  pending.value = true
  const res = await verifyCode(email.value, codeState.code)
  pending.value = false

  if (res?.success) {
    step.value = 2
  } else {
    toast.add({ title: res?.message ?? 'Invalid code', color: 'error' })
  }
}

// Step 2 — reset password
const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirmation: z.string(),
}).refine(data => data.password === data.passwordConfirmation, {
  message: 'Passwords do not match',
  path: ['passwordConfirmation'],
})

const passwordState = reactive({ password: '', passwordConfirmation: '' })

async function onResetPassword() {
  pending.value = true
  const res = await resetPassword(email.value, passwordState.password, passwordState.passwordConfirmation)
  pending.value = false

  if (res?.success) {
    toast.add({ title: 'Password reset successfully', color: 'success' })
    await navigateTo('/login')
  } else {
    toast.add({ title: res?.message ?? 'Reset failed', color: 'error' })
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

        <!-- Step 1: Enter code -->
        <template v-if="step === 1">
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-neutral-900">Enter reset code</h2>
            <p class="mt-1 text-sm text-neutral-500">
              Enter the 6-digit code sent to <strong>{{ email }}</strong>
            </p>
          </div>

          <UForm :schema="codeSchema" :state="codeState" class="space-y-4" @submit="onVerifyCode">
            <UFormField name="code" label="Reset code" required>
              <UInput
                v-model="codeState.code"
                placeholder="000000"
                maxlength="6"
                class="w-full tracking-widest text-center"
              />
            </UFormField>

            <UButton type="submit" block :loading="pending" color="neutral">
              Verify code
            </UButton>
          </UForm>

          <div class="mt-4 text-center">
            <NuxtLink
              :to="`/auth/forgot-password`"
              class="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Resend code
            </NuxtLink>
          </div>
        </template>

        <!-- Step 2: New password -->
        <template v-else>
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-neutral-900">Set new password</h2>
            <p class="mt-1 text-sm text-neutral-500">Choose a strong password for your account.</p>
          </div>

          <UForm :schema="passwordSchema" :state="passwordState" class="space-y-4" @submit="onResetPassword">
            <UFormField name="password" label="New password" required>
              <UInput
                v-model="passwordState.password"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock"
                class="w-full"
              />
            </UFormField>

            <UFormField name="passwordConfirmation" label="Confirm password" required>
              <UInput
                v-model="passwordState.passwordConfirmation"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock"
                class="w-full"
              />
            </UFormField>

            <UButton type="submit" block :loading="pending" color="neutral">
              Reset password
            </UButton>
          </UForm>
        </template>

      </div>
    </div>
  </div>
</template>
