<template>
  <v-container>
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1 class="text-h4">Dashboard</h1>
        <v-btn icon @click="uiStore.toggleRightDrawer">
          <v-icon>mdi-account-circle</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12">
        <v-card elevation="10" class="pa-5">
          <v-card-title>Welcome to Node-Red-Web</v-card-title>
          <v-card-text>
            <p>Select an option from the sidebar or use the quick access cards below.</p>
            <p class="text-caption mt-2">Tip: Press Ctrl+B (or Cmd+B) to toggle the user panel.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row class="mt-5">
      <v-col cols="12" md="4">
        <v-card class="pa-3" hover @click="$router.push('/ecommerce/products/products_table')">
          <v-card-title>E-commerce Products</v-card-title>
          <v-card-text>View and manage imported products</v-card-text>
          <v-card-actions>
            <v-btn variant="text" color="primary">Open</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-3" hover @click="$router.push('/ecommerce/orders_table')">
          <v-card-title>E-commerce Orders</v-card-title>
          <v-card-text>View and manage imported orders</v-card-text>
          <v-card-actions>
            <v-btn variant="text" color="primary">Open</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-3" hover @click="$router.push('/preforma/products')">
          <v-card-title>Preforma Invoice</v-card-title>
          <v-card-text>Manage invoices and settings</v-card-text>
          <v-card-actions>
            <v-btn variant="text" color="primary">Open</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-3" hover @click="$router.push('/fio/fio_table')">
          <v-card-title>Fio Transactions</v-card-title>
          <v-card-text>Check financial transactions</v-card-text>
          <v-card-actions>
            <v-btn variant="text" color="primary">Open</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';
// Fix the import path - use relative path instead of alias
import { useUIStore } from '../stores/ui';

definePageMeta({
  layout: 'dashboard'
});

const router = useRouter();
const uiStore = useUIStore();

onMounted(() => {
  // Load user info on mount
  uiStore.loadUserInfo();
  
  // Check authentication
  if (process.client && !localStorage.getItem('token')) {
    router.push('/login');
  }
});
</script>

