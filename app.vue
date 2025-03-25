<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Only run on client-side
onMounted(() => {
  const token = localStorage.getItem("token");
  if (!token && window.location.pathname !== '/login') {
    router.push('/login');
  }
});
</script>

