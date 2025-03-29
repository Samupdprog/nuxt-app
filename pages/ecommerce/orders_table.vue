<template>
  <AppLayout>
    <div class="orders-dashboard">
      <div class="page-header">
        <div class="header-row">
          <h1 class="page-title">Imported Orders</h1>
          <button @click="toggleControlPanel" class="btn-toggle-controls">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 15l-6-6-6 6" v-if="showControlPanel"/>
              <path d="M6 9l6 6 6-6" v-else/>
            </svg>
            {{ showControlPanel ? 'Hide Controls' : 'Show Controls' }}
          </button>
        </div>
        <div v-if="showControlPanel" class="controls-panel">
          <div class="controls-left">
            <button @click="fetchOrders" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
              </svg>
              Recharge Now
            </button>
            
            <div class="refresh-controls">
              <span>Every:</span>
              <input type="number" v-model="refreshInterval" min="1" class="input-number" aria-label="Refresh interval in minutes"/>
              <span>minutes</span>
              <button @click="startAutoRefresh" class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Auto Recharge
              </button>
            </div>
          </div>
          
          <div class="last-update">
            Last update: {{ lastUpdated }}
          </div>
        </div>
      </div>

      <div class="data-grid-container">
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading orders...</p>
        </div>
        
        <DxDataGrid
          v-else
          :data-source="orders"
          :show-borders="true"
          key-expr="order_number"
          class="orders-table"
          :allow-column-reordering="true"
          :allow-column-resizing="true"
          :row-alternation-enabled="true"
          :no-data-text="'No orders found'"
          @row-click="showOrderDetails"
        >
          <DxColumn data-field="importStatus" caption="Import Status" cell-template="statusIndicatorTemplate" width="30" alignment="center" />
          <DxColumn data-field="proformaInvoiceStatus" caption="Preforma Invoice" cell-template="proformaStatusTemplate" width="120" alignment="center" />
          <DxColumn data-field="order_number" caption="Order Number" width="100" alignment="center" />
          <DxColumn data-field="creation_time" caption="Creation Date" data-type="date" width="85" alignment="center" />
          <DxColumn data-field="last_update_time" caption="Last Update" data-type="date" width="85" alignment="center" />
          <DxColumn data-field="status" caption="Status" width="110" alignment="center" cell-template="statusTemplate" />
          <DxColumn data-field="order_total" caption="Total Price" width="82" alignment="right" cell-template="priceTemplate" />
          <DxColumn data-field="customer.email" caption="Customer Email" width="200" alignment="left" />
          <DxColumn data-field="customer.phone" caption="Phone" width="120" alignment="center" />
          <DxColumn data-field="shipment.name" caption="Shipping Method" width="145" alignment="center" />
          <DxColumn data-field="payment.name" caption="Payment Method" width="150" alignment="center" />
          <DxColumn data-field="products" caption="Products" cell-template="productsTemplate" width="360" alignment="left" />
          <DxColumn data-field="importLog" caption="Import Log" cell-template="logTemplate" width="250" alignment="left" />

          <template #productsTemplate="{ data }">
            <div class="product-list">
              <div v-for="(product, index) in data.value" :key="index" class="product-item">
                <img :src="product.imageUrl" class="product-image" />
                <div class="product-info">
                  <div class="product-header">
                    <span class="product-quantity">{{ product.quantity }}x</span>
                    <span class="product-title">{{ product.title }}</span>
                  </div>
                  <span class="product-price">{{ product.price }} CZK</span>
                </div>
              </div>
            </div>
          </template>

          <template #statusTemplate="{ data }">
            <div :class="['status-badge', getStatusClass(data.value)]">
              {{ data.value }}
            </div>
          </template>

          <template #statusIndicatorTemplate="{ data }">
            <div :class="['status-indicator', data.value]" :title="getStatusTitle(data.value)"></div>
          </template>

          <template #logTemplate="{ data }">
            <div class="import-log">
              <div 
                v-if="data.row.data.showLog" 
                v-for="(line, index) in data.value.split('\n')" 
                :key="index"
                :class="getLogLineClass(line)"
              >
                {{ line }}
              </div>
              <button 
                v-if="!data.row.data.showLog" 
                @click.stop="toggleLogVisibility(data.row.data)" 
                class="btn-show-log"
              >
                Show Log
              </button>
              <button 
                v-else 
                @click.stop="toggleLogVisibility(data.row.data)" 
                class="btn-hide-log"
              >
                Hide Log
              </button>
            </div>
          </template>

          <template #priceTemplate="{ data }">
            <span class="price-value">{{ data.value }} CZK</span>
          </template> 

          <template #proformaStatusTemplate="{ data }">
              <div :class="['status-indicator', getProformaIndicatorClass(data.value)]" :title="data.value || 'N/A'"></div>
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

      <!-- Order Details Modal -->
      <div v-if="showOrderModal" class="order-modal-overlay" @click.self="showOrderModal = false">
        <div class="order-modal">
          <div class="order-modal-header">
            <h2>Order Details: {{ selectedOrder.order_number }}</h2>
            <button class="close-button" @click="showOrderModal = false">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="order-modal-content">
            <div class="order-section">
              <h3>Order Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Order Number:</span>
                  <span class="info-value">{{ selectedOrder.order_number }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span :class="['status-badge', getStatusClass(selectedOrder.status)]">{{ selectedOrder.status }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Created:</span>
                  <span class="info-value">{{ selectedOrder.creation_time }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Last Update:</span>
                  <span class="info-value">{{ selectedOrder.last_update_time }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total Amount:</span>
                  <span class="info-value price-value">{{ selectedOrder.order_total }} CZK</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Preforma Invoice:</span>
                  <div class="proforma-status">
                    <div :class="['status-indicator', getProformaIndicatorClass(selectedOrder.proformaInvoiceStatus)]"></div>
                  </div>
                </div>
                <div class="info-item">
                  <span class="info-label">Invoice Number:</span>
                  <span class="info-value">{{ selectedOrder.invoice_number || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Import Status:</span>
                  <div class="status-with-indicator">
                    <div :class="['status-indicator', selectedOrder.importStatus]" :title="getStatusTitle(selectedOrder.importStatus)"></div>
                    <span class="info-value">{{ getStatusTitle(selectedOrder.importStatus) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="order-section">
              <h3>Customer Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">{{ selectedOrder.customer.firstname_invoice }} {{ selectedOrder.customer.surname_invoice }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">{{ selectedOrder.customer.email }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">{{ selectedOrder.customer.phone }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Address:</span>
                  <span class="info-value">{{ selectedOrder.customer.street_invoice }}, {{ selectedOrder.customer.city_invoice }}, {{ selectedOrder.customer.zip_invoice }}</span>
                </div>
              </div>
            </div>

            <div class="order-section">
              <h3>Products</h3>
              <div class="product-list-modal">
                <div v-for="(product, index) in selectedOrder.products" :key="index" class="product-item-modal">
                  <img :src="product.imageUrl" class="product-image" />
                  <div class="product-info">
                    <div class="product-header">
                      <span class="product-quantity">{{ product.quantity }}x</span>
                      <span class="product-title">{{ product.title }}</span>
                    </div>
                    <span class="product-price">{{ product.price }} CZK</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="order-section">
              <h3>Shipping & Payment</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Shipping Method:</span>
                  <span class="info-value">{{ selectedOrder.shipment ? selectedOrder.shipment.name : 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Payment Method:</span>
                  <span class="info-value">{{ selectedOrder.payment ? selectedOrder.payment.name : 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="order-section">
              <h3>Import Log</h3>
              <div class="import-log-modal">
                <div 
                  v-if="selectedOrder.showLog" 
                  v-for="(line, index) in selectedOrder.importLog.split('\n')" 
                  :key="index"
                  :class="getLogLineClass(line)"
                >
                  {{ line }}
                </div>
                <button 
                  v-if="!selectedOrder.showLog" 
                  @click="toggleLogVisibility(selectedOrder)" 
                  class="btn-show-log"
                >
                  Show Log
                </button>
                <button 
                  v-else 
                  @click="toggleLogVisibility(selectedOrder)" 
                  class="btn-hide-log"
                >
                  Hide Log
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import { DxDataGrid, DxColumn, DxPaging, DxPager, DxFilterRow, DxHeaderFilter, DxSearchPanel, DxColumnChooser, DxSelection } from 'devextreme-vue/data-grid';
import AppLayout from '~/layouts/AppLayout.vue';

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
    DxSelection,
    AppLayout
  },
  data() {
    return {
      orders: [],
      lastUpdated: "",
      refreshInterval: 15,
      refreshTimer: null,
      isLoading: true,
      selectedOrder: null,
      showOrderModal: false,
      showControlPanel: true // New state to control panel visibility
    };
  },
  methods: {
    // Add method to toggle control panel visibility
    toggleControlPanel() {
      this.showControlPanel = !this.showControlPanel;
    },
    async fetchOrders() {
      this.isLoading = true;
      try {
        const response = await fetch("http://35.180.124.4:1880/get-all-orders");
        
        // Get the raw text first
        const rawText = await response.text();
        
        // Try to sanitize the JSON by replacing invalid control characters
        const sanitizedText = rawText
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
          .replace(/\\"/g, '\\"') // Fix escaped quotes
          .replace(/\n/g, "\\n") // Properly escape newlines
          .replace(/\r/g, "\\r") // Properly escape carriage returns
          .replace(/\t/g, "\\t"); // Properly escape tabs
        
        // Parse the sanitized JSON
        let data;
        try {
          data = JSON.parse(sanitizedText);
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);
          console.log("Problematic JSON:", sanitizedText.substring(8150, 8170)); // Show the area around the error
          throw new Error("Invalid JSON response from server");
        }
        
        console.log("API Response:", data); // Log the response to see the structure
        
        if (data && data.processedOrders && Array.isArray(data.processedOrders)) {
          this.orders = data.processedOrders.map(order => {
            let importStatus = "success"; 
            let importLog = "Successful Import";

            // Process warnings and errors if they exist
            if (data.importResults) {
              const errors = data.importResults.errors && Array.isArray(data.importResults.errors)
                ? data.importResults.errors
                    .filter(e => e.id && e.id.includes(order.order_number))
                    .map(e => `Error: ${e.reason}`)
                : [];

              const warnings = data.importResults.warnings && Array.isArray(data.importResults.warnings)
                ? data.importResults.warnings
                    .filter(w => w.id && w.id.includes(order.order_number))
                    .map(w => `Warning: ${w.reason}`)
                : [];

              if (errors.length > 0) {
                importStatus = "error";
                importLog = errors.join("\n");
              } else if (warnings.length > 0) {
                // Still success status but store warnings in the log
                importStatus = "success";
                importLog = warnings.join("\n");
              }
            }

            // Check proforma invoice status
            let proformaInvoiceStatus = 'Pending';
            
            // If invoice_number exists, it means the proforma invoice has been issued
            if (order.invoice_number) {
              proformaInvoiceStatus = 'Issued';
            }
            
            // Check if there are any errors in proformaInvoices
            if (data.proformaInvoices && data.proformaInvoices.errors) {
              const proformaErrors = data.proformaInvoices.errors
                .filter(e => e.id && e.id.includes(order.order_number));
                
              if (proformaErrors.length > 0) {
                proformaInvoiceStatus = 'Error';
              }
            }

            // Process products and add image URLs
            const processedProducts = order.products && Array.isArray(order.products)
              ? order.products.map(product => ({
                  ...product,
                  imageUrl: product.image_url || 'https://via.placeholder.com/50'
                }))
              : [];

            return {
              ...order,
              products: processedProducts,
              importStatus,
              importLog,
              proformaInvoiceStatus,
              showLog: false // Add a property to control log visibility
            };
          });

          console.log("Processed Orders:", this.orders); // Log the processed orders
        } else {
          console.error("Invalid data structure:", data);
          this.$toast({
            message: "Invalid data structure received from server",
            type: 'error',
            duration: 3000
          });
          this.orders = [];
        }

        this.updateLastUpdatedTime();
      } catch (error) {
        console.error("Error loading orders:", error);
        this.$toast({
          message: "Error loading orders: " + (error.message || "Unknown error"),
          type: 'error',
          duration: 3000
        });
        this.orders = [];
      } finally {
        this.isLoading = false;
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

        const response = await fetch("http://35.180.124.4:1880/start-auto-refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes: interval })
        });

        const data = await response.json();
        console.log(data.message);

        this.$toast({
          message: `Auto Refresh every ${interval} minutes`,
          type: 'success',
          duration: 3000
        });
      } catch (error) {
        console.error("Error al iniciar Auto Refresh:", error);
        this.$toast({
          message: "Error al configurar Auto Refresh",
          type: 'error',
          duration: 3000
        });
      }
    },
    getStatusClass(status) {
      if (!status) return '';
      return status.toLowerCase() === 'storno' ? 'status-cancelled' : 'status-active';
    },
    getStatusTitle(status) {
      const titles = {
        'success': 'Successfully imported',
        'warning': 'Successfully imported',
        'error': 'Import failed'
      };
      return titles[status] || '';
    },
    getLogLineClass(line) {
      if (line.includes('Error')) return 'log-error';
      if (line.includes('Warning')) return 'log-warning';
      return 'log-normal';
    },
    $toast(options) {
      // Simple toast implementation
      const toast = document.createElement('div');
      toast.className = `toast toast-${options.type || 'info'}`;
      toast.textContent = options.message;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, options.duration || 3000);
    },
    getProformaStatusClass(status) {
      if (!status) return 'status-na';
      if (status.toLowerCase() === 'error') return 'status-cancelled';
      return status.toLowerCase() === 'issued' ? 'status-active' : 'status-pending';
    },
    showOrderDetails(e) {
      const order = e.data;
      this.selectedOrder = order;
      this.showOrderModal = true;
    },
    // Add a method to toggle log visibility
    toggleLogVisibility(order) {
      // Toggle the showLog property for this specific order
      order.showLog = !order.showLog;
      // Force a re-render
      this.orders = [...this.orders];
    },
    // Update the getProformaIndicatorClass method to only use success or error (no warning)
    getProformaIndicatorClass(status) {
      if (!status) return 'error';
      if (status.toLowerCase() === 'error') return 'error';
      return 'success'; // Both 'Issued' and 'Pending' will show as success
    },
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

<style>
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --text-color: #1f2937;
  --text-light: #6b7280;
  --border-color: #e5e7eb;
  --bg-light: #f9fafb;
  --bg-white: #ffffff;
}

/* Estilos generales */
.orders-dashboard {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 20px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

/* Toggle button for control panel */
.btn-toggle-controls {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
  background-color: var(--bg-white);
  color: var(--text-color);
}

.btn-toggle-controls:hover {
  background-color: var(--bg-light);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-toggle-controls .icon {
  width: 16px;
  height: 16px;
}

/* Panel de controles */
.controls-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background-color: var(--bg-light);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

/* Botones */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-outline {
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  color: var(--text-color);
}

.btn-outline:hover {
  background-color: var(--bg-light);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.icon {
  width: 16px;
  height: 16px;
}

/* Controles de refresco */
.refresh-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-light);
}

.input-number {
  width: 60px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
  transition: border-color 0.2s;
}

.input-number:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* Última actualización */
.last-update {
  font-size: 13px;
  color: var(--text-light);
}

/* Contenedor de la tabla */
.data-grid-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Tabla de órdenes */
.orders-table {
  height: 100%;
  width: 100%;
}

/* Loading indicator */
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-white);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--bg-light);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  font-size: 16px;
  color: var(--text-color);
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Personalización de DevExtreme */
:deep(.dx-datagrid) {
  background-color: var(--bg-white);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

:deep(.dx-datagrid-headers) {
  background-color: var(--bg-light);
  color: var(--text-color);
  font-weight: 600;
}

:deep(.dx-datagrid-rowsview) {
  border-top: 1px solid var(--border-color);
}

:deep(.dx-datagrid-headers .dx-datagrid-table .dx-row > td) {
  padding: 12px 16px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:deep(.dx-datagrid-rowsview .dx-row > td) {
  padding: 12px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--border-color);
}

:deep(.dx-datagrid-rowsview .dx-row:hover) {
  background-color: var(--bg-light);
}

:deep(.dx-datagrid-pager) {
  padding: 12px;
  background-color: var(--bg-white);
  border-top: 1px solid var(--border-color);
}

:deep(.dx-button) {
  border-radius: 6px;
}

/* Productos */
.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 8px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  background-color: var(--bg-light);
  transition: transform 0.2s;
}

.product-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.product-image {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.product-quantity {
  font-weight: 600;
  color: var(--text-color);
}

.product-title {
  font-weight: 500;
  color: var(--text-color);
}

.product-price {
  color: var(--success-color);
  font-weight: 600;
}

/* Estado */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.status-cancelled {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
}

.status-active {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

/* Indicador de estado de importación */
.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.success {
  background-color: var(--success-color);
}

.status-indicator.warning {
  background-color: var(--success-color);
}

.status-indicator.error {
  background-color: var(--error-color);
}

/* Log de importación */
.import-log {
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.log-normal {
  color: var(--text-light);
}

.log-warning {
  color: var(--warning-color);
}

.log-error {
  color: var(--error-color);
}

/* Precio */
.price-value {
  font-weight: 600;
  color: var(--text-color);
}

/* Toast notifications */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  background-color: var(--bg-white);
  color: var(--text-color);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  font-size: 14px;
  max-width: 300px;
  z-index: 9999;
  transform: translateY(100px);
  opacity: 0;
  transition: transform 0.3s, opacity 0.3s;
}

.toast.show {
  transform: translateY(0);
  opacity: 1;
}

.toast-success {
  border-left: 4px solid var(--success-color);
}

.toast-error {
  border-left: 4px solid var(--error-color);
}

.toast-warning {
  border-left: 4px solid var(--warning-color);
}

.toast-info {
  border-left: 4px solid var(--primary-color);
}

/* Order Modal */
.order-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.order-modal {
  background-color: var(--bg-white);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.order-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background-color: var(--bg-white);
  z-index: 10;
  border-radius: 8px 8px 0 0;
}

.order-modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-button:hover {
  background-color: var(--bg-light);
}

.close-button .icon {
  width: 20px;
  height: 20px;
}

.order-modal-content {
  padding: 20px;
  overflow-y: auto;
}

.order-section {
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.order-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  padding: 12px 16px;
  background-color: var(--bg-light);
  border-bottom: 1px solid var(--border-color);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  padding: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--text-light);
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: var(--text-color);
}

.product-list-modal {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.product-item-modal {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  background-color: var(--bg-light);
}

.import-log-modal {
  padding: 16px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  background-color: #f8f9fa;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.status-na {
  background-color: rgba(107, 114, 128, 0.1);
  color: var(--text-light);
}

.status-pending {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
}

/* Make sure warnings are green as requested */
.status-indicator.warning {
  background-color: var(--success-color);
}

.log-warning {
  color: var(--warning-color);
}

.proforma-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-with-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .order-modal {
    width: 95%;
    max-height: 95vh;
  }
}

/* Custom styles for the log buttons */
.btn-show-log,
.btn-hide-log {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 5px;
}

.btn-show-log, .btn-hide-log {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: var(--bg-light);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-show-log:hover, .btn-hide-log:hover {
  background-color: var(--primary-color);
  color: white;
}

.btn-show-log:hover,
.btn-hide-log:hover {
  background-color: var(--primary-hover);
}
</style>

