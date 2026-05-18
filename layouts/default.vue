<template>
  <div class="min-h-screen w-full min-w-0 overflow-x-hidden flex flex-col">
    <LayoutHeader />
    <LayoutCategoryBar />
    <main class="flex-1 min-w-0">
      <slot />
    </main>
    <LayoutFooter />
  </div>
</template>
