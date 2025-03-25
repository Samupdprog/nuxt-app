<template>
    <div>
      <h1>Node-Red-Web</h1>
      <NuxtLink to="/login">Login</NuxtLink>
    </div>
</template>
  
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
router.push('/dashboard')
</script>
