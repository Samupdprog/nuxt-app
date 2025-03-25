<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card elevation="10" class="pa-5">
          <v-card-title>Dashboard</v-card-title>
          <v-card-text>
            <p>Welcome! Select an option from the sidebar.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row class="mt-5">
      <v-col cols="12" md="4">
        <v-card class="pa-3" @click="$router.push('/ecommerce/products/products_table')">
          <v-card-title>E-commerce Products</v-card-title>
          <v-card-text>View and manage imported products</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-3" @click="$router.push('/ecommerce/orders_table')">
          <v-card-title>E-commerce orders</v-card-title>
          <v-card-text>View and manage imported orders</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-3" @click="$router.push('/preforma/products')">
          <v-card-title>Preforma Invoice</v-card-title>
          <v-card-text>Manage invoices and settings</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-3" @click="$router.push('/fio/fio_table')">
          <v-card-title>Fio Transactions</v-card-title>
          <v-card-text>Check financial transactions</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  mounted() {
    const token = localStorage.getItem("token");
    if (!token) this.$router.push("/login");
  }
};
</script>