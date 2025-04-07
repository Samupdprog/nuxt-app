<!-- /pages/fio/LoadMoreTrigger.vue -->
<template>
    <div class="load-more-trigger" ref="trigger"></div>
  </template>
  
  <script>
  export default {
    mounted() {
  const el = this.$refs.trigger;
  console.log("📌 LoadMoreTrigger mounted, emitting 'ready'", el);
  this.$emit('ready', el);
}

  };
  </script>
  
  <style scoped>
  .load-more-trigger {
    height: 20px;
    width: 100%;
    margin-top: 10px;
  }
  </style>
  