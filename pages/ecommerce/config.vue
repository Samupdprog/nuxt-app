<template>
  <v-container>
    <v-card elevation="10" class="pa-5">
      <v-card-title class="d-flex justify-space-between align-center">
        <span>API Configuration</span>
        <v-btn color="info" @click="$router.push('./orders_table')">⬅ Go Back</v-btn>
      </v-card-title>

      <v-card-text>
        <v-alert v-if="loading" type="info">Loading API configuration...</v-alert>
        <v-alert v-if="errorMessage" type="error">{{ errorMessage }}</v-alert>

        <v-card class="mb-4 pa-3" outlined>
          <h3>Current API Configuration</h3>
          <v-list dense>
            <v-list-item>
              <strong>API URL:</strong> {{ apiConfig.url }}
            </v-list-item>
            <v-list-item>
              <strong>API Key:</strong> {{ apiConfig.apiKey }}
            </v-list-item>
            <v-list-item>
              <strong>API Password:</strong> ••••••••
            </v-list-item>
          </v-list>
        </v-card>

        <v-divider></v-divider>

        <h3 class="mt-4">Update Configuration</h3>

        <v-form>
          <v-text-field label="API URL" v-model="form.url" required></v-text-field>
          <v-text-field label="API Key" v-model="form.apiKey" required></v-text-field>
          <v-text-field
            label="API Password"
            v-model="form.apiPassword"
            type="password"
            hint="Leave empty to keep the current password"
          ></v-text-field>

          <v-btn
            color="primary"
            @click="updateConfig"
            :disabled="!hasChanges"
            class="mt-3"
          >
            Save Configuration
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from "vue";

export default {
  setup() {
    const form = ref({
      url: "",
      apiKey: "",
      apiPassword: ""
    });

    const apiConfig = ref({});
    const originalConfig = ref(null);
    const loading = ref(true);
    const errorMessage = ref("");

    // Función para obtener la configuración actual de la API desde Node-RED
    async function fetchApiConfig() {
      try {
        const response = await fetch("http://localhost:1880/get-api-request-config");
        if (!response.ok) throw new Error("Failed to fetch API configuration");

        const data = await response.json();
        apiConfig.value = { ...data }; // Guardamos la configuración actual
        originalConfig.value = { ...data }; // Guardamos los valores originales para detectar cambios
        form.value = {
          url: data.url || "",
          apiKey: data.apiKey || "",
          apiPassword: "" // Dejamos la contraseña vacía por seguridad
        };
      } catch (error) {
        console.error("Error fetching API configuration:", error);
        errorMessage.value = "Failed to load API configuration.";
      } finally {
        loading.value = false;
      }
    }

    // Función para actualizar la configuración de la API
    async function updateConfig() {
      if (!form.value.url || !form.value.apiKey) {
        alert("⚠ API URL and API Key are required.");
        return;
      }

      const payload = {
        url: form.value.url,
        apiKey: form.value.apiKey
      };

      // Solo enviamos la contraseña si el usuario la ha cambiado
      if (form.value.apiPassword) {
        payload.apiPassword = form.value.apiPassword;
      }

      try {
        const response = await fetch("http://localhost:1880/update-api-request-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Failed to update configuration");

        alert("✔ Configuration updated successfully!");
        fetchApiConfig(); // Recargar la configuración
      } catch (error) {
        console.error("Error updating API configuration:", error);
        alert("Error updating configuration.");
      }
    }

    const hasChanges = computed(() => {
      return (
        form.value.url !== originalConfig.value?.url ||
        form.value.apiKey !== originalConfig.value?.apiKey ||
        form.value.apiPassword !== ""
      );
    });

    onMounted(fetchApiConfig);

    return {
      form,
      apiConfig,
      loading,
      errorMessage,
      updateConfig,
      hasChanges
    };
  }
};
definePageMeta({
  layout: "dashboard",
});
</script>
