// Login Page: pages/login.vue
<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card elevation="10" class="pa-5">
          <v-card-title class="text-center">Login</v-card-title>
          <v-card-text>
            <v-form ref="loginForm" v-model="valid">
              <v-text-field v-model="username" label="Username" prepend-icon="mdi-account" required></v-text-field>
              <v-text-field v-model="password" label="Password" prepend-icon="mdi-lock" type="password" required></v-text-field>
              <v-btn color="primary" block class="mt-4" :disabled="!valid" @click="login">Login</v-btn>
              <v-alert v-if="error" type="error" class="mt-3">{{ error }}</v-alert>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      username: "",
      password: "",
      valid: false,
      error: ""
    };
  },
  methods: {
    async login() {
      try {
        const response = await fetch("http://localhost:1880/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: this.username, password: this.password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Login failed");
        localStorage.setItem("token", data.token);
        this.$router.push("/dashboard");
      } catch (err) {
        this.error = err.message;
      }
    }
  }
};
</script>