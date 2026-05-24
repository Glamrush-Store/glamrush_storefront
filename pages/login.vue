<script setup>
import { z } from "zod";

definePageMeta({ layout: "default" });

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const state = reactive({ email: "", password: "" });
const pending = shallowRef(false);
const formError = shallowRef("");
const toast = useToast();
const { login } = useAuth();
const route = useRoute();

const errorDescription = computed(() => formError.value || "We could not sign you in with those details.");

watch(
  [() => state.email, () => state.password],
  () => {
    formError.value = "";
  }
);

onMounted(() => {
  if (route.query.error === "social") {
    formError.value = "Social login failed. Please try again.";
    toast.add({
      title: "Social login failed",
      description: "Please try again.",
      color: "error",
    });
  }
});

async function onSubmit() {
  if (pending.value) return;

  pending.value = true;
  formError.value = "";

  try {
    const res = await login(state.email, state.password);

    if (!res?.success) {
      formError.value = res?.errors
        ? Object.values(res.errors).flat().join(" ")
        : res?.message ?? "Login failed. Please check your details and try again.";

      toast.add({
        title: "Login failed",
        description: formError.value,
        color: "error",
      });
    }
  } catch (error) {
    formError.value = error?.data?.message ?? "Login failed. Please check your details and try again.";
    toast.add({
      title: "Login failed",
      description: formError.value,
      color: "error",
    });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] bg-[#f7f4ef]">
    <LayoutContainer>
      <div class="grid min-h-[calc(100vh-112px)] items-stretch py-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:py-10">
        <section class="relative hidden overflow-hidden bg-[#15130f] lg:block">
          <div class="absolute inset-0 login-texture" />
          <div class="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/50 to-transparent" />
          <div class="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 to-transparent" />

          <div class="relative flex h-full min-h-[680px] flex-col justify-between p-10 text-white">
            <NuxtLink to="/" class="inline-flex w-fit items-center gap-3 text-sm font-semibold tracking-[0.38em] uppercase">
              <span class="h-px w-10 bg-white/70" />
              Glamrush
            </NuxtLink>

            <div class="max-w-xl">
              <p class="mb-4 text-xs font-semibold tracking-[0.34em] text-[#d8b566] uppercase">
                Private wardrobe access
              </p>
              <h1 class="hero-font text-6xl leading-[0.95] tracking-normal">
                Step back into your edit.
              </h1>
              <p class="mt-6 max-w-md text-sm leading-6 text-white/72">
                Saved pieces, order history, delivery details, and a smoother checkout are waiting.
              </p>
            </div>

            <div class="grid max-w-xl grid-cols-3 border border-white/18 bg-white/8 backdrop-blur-sm">
              <div class="border-r border-white/18 p-5">
                <p class="text-2xl font-semibold">24h</p>
                <p class="mt-1 text-xs leading-5 text-white/62">Priority order updates</p>
              </div>
              <div class="border-r border-white/18 p-5">
                <p class="text-2xl font-semibold">1-click</p>
                <p class="mt-1 text-xs leading-5 text-white/62">Saved checkout details</p>
              </div>
              <div class="p-5">
                <p class="text-2xl font-semibold">Fresh</p>
                <p class="mt-1 text-xs leading-5 text-white/62">New drops in your feed</p>
              </div>
            </div>
          </div>
        </section>

        <section class="flex items-center bg-white px-5 py-8 sm:px-8 lg:px-10">
          <div class="mx-auto w-full max-w-md">
            <div class="mb-8 lg:hidden">
              <NuxtLink to="/" class="text-xl font-bold tracking-[0.24em] uppercase text-neutral-950">
                Glamrush
              </NuxtLink>
            </div>

            <div class="mb-8">
              <p class="text-[11px] font-semibold tracking-[0.28em] text-[#9b7528] uppercase">
                Account access
              </p>
              <h2 class="mt-3 text-3xl font-semibold tracking-normal text-neutral-950">
                Welcome back
              </h2>
              <p class="mt-3 text-sm leading-6 text-neutral-500">
                Sign in to continue shopping with your saved cart, wishlists, and delivery details.
              </p>
            </div>

            <div
              v-if="formError"
              class="mb-5 flex gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              <UIcon name="i-lucide-circle-alert" class="mt-0.5 h-4 w-4 shrink-0" />
              <p>{{ errorDescription }}</p>
            </div>

            <UForm
              :schema="schema"
              :state="state"
              class="space-y-5"
              @submit="onSubmit"
            >
              <UFormField name="email" label="Email address" required>
                <UInput
                  v-model="state.email"
                  type="email"
                  placeholder="you@example.com"
                  icon="i-lucide-mail"
                  size="xl"
                  class="w-full"
                  :disabled="pending"
                />
              </UFormField>

              <UFormField name="password" label="Password" required>
                <UInput
                  v-model="state.password"
                  type="password"
                  placeholder="Enter your password"
                  icon="i-lucide-lock"
                  size="xl"
                  class="w-full"
                  :disabled="pending"
                />
              </UFormField>

              <div class="flex justify-end">
                <NuxtLink
                  to="/auth/forgot-password"
                  class="text-sm font-medium text-neutral-700 underline-offset-4 hover:text-neutral-950 hover:underline"
                >
                  Forgot password?
                </NuxtLink>
              </div>

              <UButton
                type="submit"
                block
                :loading="pending"
                :disabled="pending"
                color="neutral"
                size="xl"
                class="h-12 justify-center rounded-none text-xs font-semibold tracking-[0.22em] uppercase"
              >
                Sign in
              </UButton>
            </UForm>

            <div class="my-7 flex items-center gap-3">
              <div class="h-px flex-1 bg-neutral-200" />
              <span class="text-[11px] font-medium tracking-[0.24em] text-neutral-400 uppercase">or</span>
              <div class="h-px flex-1 bg-neutral-200" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button
                class="flex h-11 w-full items-center justify-center gap-2 border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="pending"
                @click="navigateTo('/auth/google')"
              >
                <UIcon name="i-simple-icons-google" class="h-4 w-4 text-[#4285F4]" />
                Google
              </button>
              <button
                class="flex h-11 w-full items-center justify-center gap-2 border border-[#1877F2] bg-[#1877F2] px-4 text-sm font-medium text-white transition-colors hover:bg-[#166FE5] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="pending"
                @click="navigateTo('/auth/facebook')"
              >
                <UIcon name="i-simple-icons-facebook" class="h-4 w-4" />
                Facebook
              </button>
            </div>

            <p class="mt-8 text-center text-sm text-neutral-500">
              New to Glamrush?
              <NuxtLink to="/register" class="font-semibold text-neutral-950 underline-offset-4 hover:underline">
                Create an account
              </NuxtLink>
            </p>
          </div>
        </section>
      </div>
    </LayoutContainer>
  </div>
</template>

<style scoped>
.login-texture {
  background:
    linear-gradient(135deg, rgba(216, 181, 102, 0.22), transparent 34%),
    linear-gradient(215deg, transparent 20%, rgba(255, 255, 255, 0.1) 21%, transparent 22%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    #15130f;
  background-size: auto, auto, 84px 84px, 84px 84px, auto;
}
</style>
