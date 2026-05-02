<script setup>
const { footer } = await useFooter()

const socialIconMap = {
  facebook: 'i-lucide-facebook',
  twitter: 'i-lucide-twitter',
  instagram: 'i-lucide-instagram',
  tiktok: 'i-lucide-music-2',
  youtube: 'i-lucide-youtube',
  pinterest: 'i-lucide-pin',
}

const email = ref('')
</script>

<template>
  <footer v-if="footer" class="bg-neutral-900 text-neutral-300">

    <!-- Newsletter strip -->
    <div class="bg-neutral-800 border-b border-neutral-700">
      <LayoutContainer>
        <div class="py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p class="text-white font-semibold text-lg">{{ footer.newsletterTitle }}</p>
            <p class="text-sm text-neutral-400 mt-1">{{ footer.newsletterDescription }}</p>
          </div>
          <div class="flex gap-2 w-full sm:w-auto">
            <UInput
              v-model="email"
              :placeholder="footer.newsletterPlaceholder"
              size="md"
              class="flex-1 sm:w-64"
            />
            <UButton
              color="primary"
              size="md"
              :label="footer.newsletterButtonLabel"
            />
          </div>
        </div>
      </LayoutContainer>
    </div>

    <!-- Main columns -->
    <LayoutContainer>
      <div class="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        <!-- Brand + social -->
        <div class="flex flex-col gap-5">
          <NuxtLink to="/" class="text-white text-xl font-semibold tracking-tight self-start">
            Glamrush
          </NuxtLink>
          <p class="text-sm text-neutral-400 leading-relaxed">
            Style that speaks before you do.
          </p>
          <div v-if="footer.socialLinks?.length" class="flex gap-1">
            <UButton
              v-for="social in footer.socialLinks"
              :key="social.id"
              :to="social.url"
              :icon="socialIconMap[social.platform] ?? 'i-lucide-globe'"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="social.platform"
              target="_blank"
              rel="noopener noreferrer"
            />
          </div>
        </div>

        <!-- Dynamic link columns from Strapi -->
        <div
          v-for="col in footer.columns"
          :key="col.id"
          class="flex flex-col gap-4"
        >
          <p class="text-white text-sm font-semibold uppercase tracking-widest">
            {{ col.title }}
          </p>
          <ul class="flex flex-col gap-2">
            <li v-for="link in col.links" :key="link.id">
              <NuxtLink
                :to="link.url"
                class="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

      </div>
    </LayoutContainer>

    <!-- Bottom bar -->
    <div class="border-t border-neutral-800">
      <LayoutContainer>
        <div class="py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>&copy; {{ new Date().getFullYear() }} Glamrush. All rights reserved.</p>
          <nav class="flex flex-wrap gap-4 justify-center">
            <NuxtLink
              v-for="link in footer.bottomLinks"
              :key="link.id"
              :to="link.url"
              class="hover:text-neutral-300 transition-colors"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
        </div>
      </LayoutContainer>
    </div>

  </footer>
</template>
