<script setup>
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
    <div>
      <slot />
    </div>
    <div>
      <OrderSummary />
    </div>
  </div>
</template>
