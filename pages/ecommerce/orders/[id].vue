<template>
  <v-container>
    <v-card elevation="10" class="pa-5">
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Order Details - {{ order?.order_number || "N/A" }}</span>
        <v-btn color="info" @click="$router.push('/ecommerce/products')">
          ⬅ Go Back to Orders
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-switch v-model="editMode" label="Enable Edit Mode" class="mb-3"></v-switch>

        <v-alert v-if="loading" type="info">Loading order...</v-alert>
        <v-alert v-if="errorMessage" type="error">{{ errorMessage }}</v-alert>

        <v-form v-if="order">
          <!-- Datos Principales del Pedido -->
          <h3 class="mt-3">Order Information</h3>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field v-model="order.order_number" label="Order Number" readonly></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="order.status" label="Status" :readonly="!editMode"></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="order.tracking_code" label="Tracking Code" :readonly="!editMode"></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                :value="order.payment?.name || 'N/A'"
                label="Payment Method"
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                :value="order.shipment?.name || 'N/A'"
                label="Shipment Method"
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="order.order_total" :label="`Total Price (${order.currency})`" readonly></v-text-field>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <!-- Información del Cliente -->
          <h3>Customer Information</h3>
          <v-row dense v-if="order.customer">
            <v-col cols="12" md="4">
              <v-text-field v-model="order.customer.firstname_invoice" label="First Name" :readonly="!editMode"></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="order.customer.surname_invoice" label="Last Name" :readonly="!editMode"></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="order.customer.email" label="Email" :readonly="!editMode"></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="order.customer.phone" label="Phone" :readonly="!editMode"></v-text-field>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <!-- Productos -->
          <h3>Products</h3>
          <v-list dense v-if="order.products?.length">
            <v-list-item v-for="(product, index) in order.products" :key="index" class="d-flex align-center">
              <v-img v-if="product.image_url" :src="product.image_url" max-width="60" class="mr-3"></v-img>
              <div>
                <v-text-field v-model="product.title" label="Product Name" :readonly="!editMode"></v-text-field>
                <v-row dense>
                  <v-col cols="6">
                    <v-text-field v-model="product.quantity" type="number" label="Quantity" :readonly="!editMode"></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field :value="formatCurrency(product.price, order.currency)" label="Price" readonly></v-text-field>
                  </v-col>
                </v-row>
              </div>
            </v-list-item>
          </v-list>

          <v-divider class="my-4"></v-divider>

          <!-- notes -->
          <h3>Notes</h3>
          <v-textarea v-if="order.internal_note" v-model="order.internal_note" label="Internal Note" :readonly="!editMode"></v-textarea>
          <v-textarea v-if="order.customer?.customer_note" v-model="order.customer.customer_note" label="Customer Note" :readonly="!editMode"></v-textarea>
        </v-form>

        <v-divider class="my-4"></v-divider>

        <v-btn v-if="editMode" color="success" @click="saveOrder">Save</v-btn>
        <v-btn v-if="editMode" color="error" class="ml-2" @click="cancelEdit">Cancel</v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      order: null,
      editMode: false,
      loading: true,
      errorMessage: "",
    };
  },
  methods: {
    
    async fetchOrder() {
      this.loading = true;
      this.errorMessage = "";

      try {
        const response = await fetch(`http://localhost:1880/get-order/${this.$route.params.id}`);
        if (!response.ok) throw new Error("Order not found");
        this.order = await response.json();
      } catch (error) {
        this.errorMessage = "Order not found.";
      } finally {
        this.loading = false;
      }
    },
    async saveOrder() {
      console.log("Saving order:", this.order);
    },
    cancelEdit() {
      this.fetchOrder();
      this.editMode = false;
    },
    formatCurrency(value, currency) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
    }
  },
  mounted() {
    this.fetchOrder();
  }
};

definePageMeta({
  layout: "dashboard",
});
</script>
