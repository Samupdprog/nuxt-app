<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card elevation="10" class="pa-5">
          <v-card-title class="text-center">Login</v-card-title>
          <v-card-text>
            <v-form ref="loginForm" v-model="valid" @submit.prevent="login">
              <v-text-field 
                v-model="username" 
                label="Username" 
                prepend-icon="mdi-account" 
                :rules="usernameRules"
                required
                @keyup.enter="handleEnter"
              ></v-text-field>
              <v-text-field 
                v-model="password" 
                label="Password" 
                prepend-icon="mdi-lock" 
                type="password" 
                :rules="passwordRules"
                required
                @keyup.enter="handleEnter"
              ></v-text-field>
              <v-btn 
                color="primary" 
                block 
                class="mt-4" 
                :disabled="!valid" 
                @click="login"
                :loading="loading"
                :class="{ 'btn-pressed': isPressed }"
              >
                Login
              </v-btn>
              <v-alert v-if="error" type="error" class="mt-3">{{ error }}</v-alert>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const valid = ref(false);
const loading = ref(false);
const error = ref('');
const loginForm = ref(null);
const isPressed = ref(false);

const usernameRules = [
  v => !!v || 'Username is required',
  v => v.length >= 3 || 'Username must be at least 3 characters'
];

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 6 || 'Password must be at least 6 characters'
];

const handleEnter = () => {
  if (valid.value) {
    isPressed.value = true;
    setTimeout(() => {
      isPressed.value = false;
    }, 200);
    login();
  }
};

onMounted(() => {
  // Check if already logged in
  if (process.client) {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }
});

async function login() {
  if (!loginForm.value.validate()) return;
  
  loading.value = true;
  error.value = "";
  
  try {
    const response = await fetch("http://35.180.124.4:1880/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.value, password: password.value })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Invalid username or password");
    }
    
    // Store token and user info
    if (process.client) {
      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    }
    
    router.push("/dashboard");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.btn-pressed {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}
</style>

