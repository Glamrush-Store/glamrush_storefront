<template>
  <div class="min-h-screen flex flex-col">
    <LayoutHeader />
    <LayoutCategoryBar />
    <main class="flex-1">
      <slot />
    </main>
    <LayoutFooter />
  </div>
</template>
