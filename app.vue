<template>
  <AppLayout>
    <NuxtPage />
  </AppLayout>
</template>



<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from './layouts/AppLayout.vue';

const router = useRouter();

// Only run on client-side
onMounted(() => {
  const token = localStorage.getItem("token");
  if (!token && window.location.pathname !== '/login') {
    router.push('/login');
  }
});
</script>

