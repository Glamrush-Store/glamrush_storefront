<script setup>
const props = defineProps({
  block: { type: Object, required: true },
});

const config = useRuntimeConfig();

const mediaBase = config.public.strapiUrl.replace(/\/api$/, "");

const bgImageUrl = computed(() =>
  props.block.backgroundImage?.[0]?.url
    ? `${mediaBase}${props.block.backgroundImage[0].url}`
    : null,
);
</script>

<template>
  <section
    class="relative w-full h-[40vh] flex items-center overflow-hidden"
    :style="
      bgImageUrl
        ? `background-image: url('${bgImageUrl}'); background-size: cover; background-position: center;`
        : ''
    "
  >
    <!-- Dark overlay -->
    <div class="absolute inset-0 bg-black/40" />

    <!-- Content -->
    <LayoutContainer class="relative z-10">
      <div class="flex flex-col gap-4 max-w-lg">
        <span
          class="text-xs font-semibold uppercase tracking-widest text-white/80"
        >
          {{ block.subtitle }}
        </span>
        <h1 class="hero-font text-4xl font-bold text-white leading-tight">
          {{ block.title }}
        </h1>
        <UButton
          v-if="block.cta"
          :to="block.cta.url"
          :label="block.cta.Label"
          color="primary"
          size="lg"
          class="self-start"
        />
      </div>
    </LayoutContainer>
  </section>
</template>
