<template>
  <div class="orders-container">
    <div class="controls">
      <div>
        <button @click="fetchOrders">Recharge Now</button>
      </div>

      <div class="minutes">
        <p>Every:</p>
        <input type="number" v-model="refreshInterval" min="1" placeholder="minutes" />
        <p>minutes</p>
        <button class="button-rec" @click="startAutoRefresh">Auto Recharge</button>
      </div>

      <div>
        <p>Last update: {{ lastUpdated }}</p>
      </div>
    </div>

    <DxDataGrid
      :data-source="orders"
      :show-borders="true"
      key-expr="orderNumber"
      class="orders-table"
      :allow-column-reordering="true"
      :allow-column-resizing="true"
      :row-alternation-enabled="true"
    >
      <DxColumn data-field="orderNumber" caption="Order Number" width="95" alignment="center" />
      <DxColumn data-field="createdAt" caption="Creation Date" data-type="date" width="100" alignment="center" />
      <DxColumn data-field="updatedAt" caption="Last Update" data-type="date" width="100" alignment="center" />
      <DxColumn data-field="status" caption="Status" width="110" alignment="center" />
      <DxColumn data-field="totalAmount" caption="Total Price" width="85" alignment="right" cell-template="priceTemplate" />
      <DxColumn data-field="customer.email" caption="Customer Email" width="200" alignment="left" />
      <DxColumn data-field="customer.phone" caption="Phone" width="120" alignment="center" />
      <DxColumn data-field="shipment" caption="Shipping Method" width="150" alignment="center" />
      <DxColumn data-field="payment" caption="Payment Method" width="150" alignment="center" />
      <DxColumn data-field="products" caption="Products" cell-template="productsTemplate" width="350" alignment="left" />
      <DxColumn data-field="importStatus" caption="Import Status" cell-template="statusTemplate" width="50" alignment="center" />
      <DxColumn data-field="importLog" caption="Import Log" cell-template="logTemplate" width="250" alignment="left" />

      <template #productsTemplate="{ data }">
        <div class="product-list">
          <ul>
            <li v-for="(product, index) in data.value" :key="index" class="product-item">
              <img :src="product.imageUrl" class="product-image" />
              <div class="product-info">
                <span class="product-quantity">{{ product.quantity }}x</span>
                <span class="product-title">{{ product.title }} - </span>
                <span class="product-price">{{ product.totalPrice }} CZK</span>
              </div>
            </li>
          </ul>
        </div>
      </template>

      <template #statusTemplate="{ data }">
        <div :class="['status-indicator', data.value]"></div>
      </template>

      <template #logTemplate="{ data }">
        <div class="import-log">{{ data.value }}</div>
      </template>

      <template #priceTemplate="{ data }">
        <span>{{ data.value }} CZK</span>
      </template> 

      <DxFilterRow :visible="true" />
      <DxHeaderFilter :visible="true" />
      <DxSearchPanel :visible="true" :highlight-case-sensitive="false" />
      <DxColumnChooser :enabled="true" />
      <DxSelection mode="multiple" />

      <DxPaging :page-size="100" />
      <DxPager :show-page-size-selector="true" :allowed-page-sizes="[5, 10, 20]" />
    </DxDataGrid>
  </div>
</template>

<script>
import { DxDataGrid, DxColumn, DxPaging, DxPager, DxFilterRow, DxHeaderFilter, DxSearchPanel, DxColumnChooser, DxSelection } from 'devextreme-vue/data-grid';

export default {
  components: {
    DxDataGrid,
    DxColumn,
    DxPaging,
    DxPager,
    DxFilterRow,
    DxHeaderFilter,
    DxSearchPanel,
    DxColumnChooser,
    DxSelection
  },
  data() {
    return {
      orders: [],
      lastUpdated: "",
      refreshInterval: 15,
      refreshTimer: null
    };
  },
  methods: {
    async fetchOrders() {
      try {
        const response = await fetch("http://localhost:1880/get-all-orders");
        const data = await response.json();

        this.orders = data.processedOrders.map(order => {
          let importStatus = "success"; 
          let importLog = "Successful Import";

          const errors = data.importResults.errors
            .filter(e => e.id.includes(order.orderNumber))
            .map(e => `Error: ${e.reason}`);

          const warnings = data.importResults.warnings
            .filter(w => w.id.includes(order.orderNumber))
            .map(w => `Warning: ${w.reason}`);

          if (errors.length > 0) {
            importStatus = "error";
            importLog = errors.join("\n");
          } else if (warnings.length > 0) {
            importStatus = "warning";
            importLog = warnings.join("\n");
          }

          return {
            ...order,
            products: order.products.map(product => ({
              ...product,
              imageUrl: product.imageUrl || 'https://via.placeholder.com/50'
            })),
            importStatus,
            importLog
          };
        });

        this.updateLastUpdatedTime();
      } catch (error) {
        console.error("Error loading orders:", error);
      }
    },
    updateLastUpdatedTime() {
      const now = new Date();
      this.lastUpdated = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    },
    async startAutoRefresh() {
      try {
        const interval = this.refreshInterval;

        if (interval < 1) {
          alert("El intervalo debe ser al menos 1 minuto.");
          return;
        }

        const response = await fetch("http://localhost:1880/start-auto-refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes: interval })
        });

        const data = await response.json();
        console.log(data.message);

        alert(`Auto Refresh activado cada ${interval} minutos`);
      } catch (error) {
        console.error("Error al iniciar Auto Refresh:", error);
        alert("Error al configurar Auto Refresh");
      }
    }
  },
  mounted() {
    this.fetchOrders(); 
  },
  beforeUnmount() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
};
</script>

<style scoped>
.orders-container {
  position: absolute;
  left: 0;
  width: 100vw;
  height: 100vh;
  padding: 0;
  margin: 0;
  overflow: hidden;
  background: white;
}

.orders-table {
  width: 98%;
  height: 90%;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-list ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.product-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 5px;
  border: 1px solid #ddd;
}

.product-info {
  display: flex;
  flex-direction: column;
}

.product-quantity {
  font-weight: bold;
  color: #333;
}

.product-title {
  font-weight: 600;
}

.product-price {
  color: #27ae60;
  font-weight: bold;
}

.status-indicator {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.success {
  background-color: #2ecc71;
}

.status-indicator.warning {
  background-color: #f1c40f;
}

.status-indicator.error {
  background-color: #e74c3c;
}

.import-log {
  white-space: pre-wrap;
  font-size: 12px;
  color: #444;
}

.controls {
  display: flex;
  gap: 10px;
  margin: 10px;
  align-items: end;
  width: 97%;
  justify-content: space-between;
}

.controls button {
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}

.controls input {
  width: 50px;
  padding: 5px;
  text-align: center;
}

.controls p {
  font-size: 14px;
  color: #555;
}

.minutes{
  margin-top: 1em;
  display:flex;
  align-items:center;

}

.button-rec {
  margin-left: 2em
}
</style>
