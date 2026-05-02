export function useCmsBlocks(blocks) {
  const resolvedBlocks = computed(() => {
    if (!blocks.value) return []
    return blocks.value.map((block) => ({
      ...block,
      _resolved: true,
    }))
  })

  return { resolvedBlocks }
}
