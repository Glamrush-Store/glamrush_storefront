<script setup>
import { z } from "zod";

definePageMeta({ layout: "default" });

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const state = reactive({ email: "", password: "" });
const pending = ref(false);
const toast = useToast();
const { login } = useAuth();
const route = useRoute();

// Show social auth error if redirected back
onMounted(() => {
  if (route.query.error === "social") {
    toast.add({
      title: "Social login failed",
      description: "Please try again.",
      color: "error",
    });
  }
});

async function onSubmit() {
  pending.value = true;
  const res = await login(state.email, state.password);
  pending.value = false;

  if (!res?.success) {
    toast.add({
      title: res?.message ?? "Login failed",
      description: res?.errors
        ? Object.values(res.errors).flat().join(" ")
        : undefined,
      color: "error",
    });
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink
          to="/"
          class="text-2xl font-semibold tracking-tight text-neutral-900"
        >
          Glamrush
        </NuxtLink>
        <p class="mt-2 text-sm text-neutral-500">Sign in to your account</p>
      </div>

      <!-- Card -->
      <div
        class="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 space-y-6"
      >
        <!-- Email/Password form -->
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField name="email" label="Email" required>
            <UInput
              v-model="state.email"
              type="email"
              placeholder="you@example.com"
              icon="i-lucide-mail"
              class="w-full"
            />
          </UFormField>

          <UFormField name="password" label="Password" required>
            <UInput
              v-model="state.password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end">
            <NuxtLink
              to="/auth/forgot-password"
              class="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Forgot password?
            </NuxtLink>
          </div>

          <UButton
            type="submit"
            block
            :loading="pending"
            color="neutral"
            variant="solid"
          >
            Sign in
          </UButton>
        </UForm>

        <!-- Divider -->
        <div class="flex items-center gap-3">
          <div class="flex-1 h-px bg-neutral-200" />
          <span class="text-xs text-neutral-400">or continue with</span>
          <div class="flex-1 h-px bg-neutral-200" />
        </div>

        <!-- Social buttons -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Google — white bg, Google-blue icon -->
          <button
            class="flex items-center justify-center gap-2 h-9 w-full rounded-md border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
            @click="navigateTo('/auth/google')"
          >
            <UIcon
              name="i-simple-icons-google"
              class="w-4 h-4 text-[#4285F4]"
            />
            Google
          </button>
          <!-- Facebook — Facebook blue -->
          <button
            class="flex items-center justify-center gap-2 h-9 w-full rounded-md bg-[#1877F2] px-4 text-sm font-medium text-white hover:bg-[#166FE5] transition-colors cursor-pointer"
            @click="navigateTo('/auth/facebook')"
          >
            <UIcon name="i-simple-icons-facebook" class="w-4 h-4" />
            Facebook
          </button>
        </div>

        <!-- Register link -->
        <p class="text-center text-sm text-neutral-500">
          Don't have an account?
          <NuxtLink
            to="/register"
            class="font-medium text-neutral-900 hover:underline"
          >
            Create one
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
