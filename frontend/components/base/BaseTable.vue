<template>
  <div class="border rounded overflow-x-auto">
    <div class="p-2">
      <slot name="toolbar" />
    </div>
    <table class="table-auto w-full text-left">
      <slot />
    </table>
    <div class="p-2">
      <slot name="pagination" />
    </div>
  </div>
</template>
