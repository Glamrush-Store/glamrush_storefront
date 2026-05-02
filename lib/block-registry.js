import { defineAsyncComponent } from 'vue'

/**
 * Maps CMS block `type` strings to their Vue component implementations.
 * Use resolveBlock(type) to get the component for a given block type.
 */
const registry = {
  hero: defineAsyncComponent(() => import('~/components/blocks/HeroBlock.vue')),
  product_carousel: defineAsyncComponent(() => import('~/components/blocks/ProductCarouselBlock.vue')),
  rich_text: defineAsyncComponent(() => import('~/components/blocks/RichTextBlock.vue')),
  banner: defineAsyncComponent(() => import('~/components/blocks/BannerBlock.vue')),
}

export function resolveBlock(type) {
  return registry[type] ?? null
}

export default registry
