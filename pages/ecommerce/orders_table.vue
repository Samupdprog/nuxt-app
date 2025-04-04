<template>
  <AppLayout>
    <div class="orders-dashboard">
      <div class="page-header">
        <div class="header-row">
          <h1 class="page-title">Imported Orders</h1>
          <div class="header-actions">
            <button @click="toggleControlPanel" class="btn-toggle-controls">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 15l-6-6-6 6" v-if="showControlPanel"/>
                <path d="M6 9l6 6 6-6" v-else/>
              </svg>
              {{ showControlPanel ? 'Hide Controls' : 'Show Controls' }}
            </button>
            <button v-if="isCachedData" @click="refreshData" class="btn-refresh" title="Refresh data from server">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
              </svg>
              Refresh Data
            </button>
          </div>
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
            <span v-if="isCachedData" class="cached-indicator">(Cached)</span>
          </div>
        </div>
      </div>

      <div class="data-grid-container">
        <div v-if="isLoading && !orders.length" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading orders...</p>
        </div>
        
        <DxDataGrid
          :data-source="orders"
          :show-borders="true"
          key-expr="order_number"
          class="orders-table"
          :allow-column-reordering="true"
          :allow-column-resizing="true"
          :row-alternation-enabled="true"
          :no-data-text="'No orders found'"
          :scrolling="{ mode: 'virtual' }" 
          @row-click="navigateToOrderDetails"
          @content-ready="onContentReady"
          @scroll="onScroll"
          ref="dataGrid"
        >
          <DxColumn data-field="importStatus" caption="Import Status" cell-template="statusIndicatorTemplate" width="50" alignment="center" />
          <DxColumn data-field="proformaInvoiceStatus" caption="Preforma Invoice" cell-template="proformaStatusTemplate" width="50" alignment="center" />
          <DxColumn data-field="order_number" caption="Order Number" width="100" alignment="center" />
          <DxColumn data-field="creation_time" caption="Creation Date" data-type="date" width="85" alignment="center" />
          <DxColumn data-field="last_update_time" caption="Last Update" data-type="date" width="85" alignment="center" />
          <DxColumn data-field="status" caption="Status" width="110" alignment="center" cell-template="statusTemplate" />
          <DxColumn data-field="order_total" caption="Total Price" width="82" alignment="right" cell-template="priceTemplate" />
          <DxColumn data-field="customer.email" caption="Customer Email" width="200" alignment="left" />
          <DxColumn data-field="customer.phone" caption="Phone" width="120" alignment="center" />
          <DxColumn data-field="shipment.name" caption="Shipping Method" width="145" alignment="center" />
          <DxColumn data-field="payment.name" caption="Payment Method" width="150" alignment="center" />
          <DxColumn data-field="products" caption="Products" cell-template="productsTemplate" width="370" alignment="left" />
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
        </DxDataGrid>
        
        <!-- Add loading indicator for infinite scroll -->
        <div v-if="isLoadingMore" class="loading-more-container">
          <div class="loading-spinner-small"></div>
          <p class="loading-more-text">Loading more orders...</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import { DxDataGrid, DxColumn, DxFilterRow, DxHeaderFilter, DxSearchPanel, DxColumnChooser, DxSelection } from 'devextreme-vue/data-grid';

export default {
  components: {
    DxDataGrid,
    DxColumn,
    DxFilterRow,
    DxHeaderFilter,
    DxSearchPanel,
    DxColumnChooser,
    DxSelection,
  },
  data() {
    return {
      orders: [],
      lastUpdated: "",
      refreshInterval: 15,
      refreshTimer: null,
      isLoading: true,
      isLoadingMore: false,
      currentPage: 1,
      hasMoreData: true,
      gridInstance: null,
      scrollThreshold: 0.8, // Load more when scrolled 80% down
      dateRange: {
        from: "2025-03-01",
        to: "2025-03-31"
      },
      showControlPanel: true,
      isCachedData: false,
      scrollPosition: 0
    };
  },
  methods: {
    toggleControlPanel() {
      this.showControlPanel = !this.showControlPanel;
    },
    
    // Store grid instance on content ready
    onContentReady(e) {
      this.gridInstance = e.component;
      
      // Restaurar la posición de desplazamiento si existe
      if (this.scrollPosition > 0 && this.gridInstance) {
        const scrollable = this.gridInstance.getScrollable();
        if (scrollable) {
          setTimeout(() => {
            scrollable.scrollTo(this.scrollPosition);
          }, 100);
        }
      }
    },
    
    // Handle scroll event
    onScroll(e) {
      if (!this.gridInstance || !this.hasMoreData || this.isLoadingMore || this.isLoading) return;
      
      const scrollable = this.gridInstance.getScrollable();
      if (!scrollable) return;
      
      const scrollHeight = scrollable.scrollHeight();
      const scrollTop = scrollable.scrollTop();
      const clientHeight = scrollable.clientHeight();
      
      // Guardar la posición de desplazamiento actual
      this.scrollPosition = scrollTop;
      
      // Calculate scroll position as percentage
      const scrollPosition = (scrollTop + clientHeight) / scrollHeight;
      
      // If scrolled past threshold, load more data
      if (scrollPosition > this.scrollThreshold) {
        this.loadMoreOrders();
      }
      
      // Guardar el estado actual en sessionStorage
      this.saveTableState();
    },
    
    // Guardar el estado actual de la tabla en sessionStorage
    saveTableState() {
      const tableState = {
        orders: this.orders,
        currentPage: this.currentPage,
        hasMoreData: this.hasMoreData,
        scrollPosition: this.scrollPosition,
        lastUpdated: this.lastUpdated,
        dateRange: this.dateRange
      };
      
      sessionStorage.setItem('ordersTableState', JSON.stringify(tableState));
    },
    
    // Cargar el estado de la tabla desde sessionStorage
    loadTableState() {
      try {
        const savedState = sessionStorage.getItem('ordersTableState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          this.orders = parsedState.orders || [];
          this.currentPage = parsedState.currentPage || 1;
          this.hasMoreData = parsedState.hasMoreData !== undefined ? parsedState.hasMoreData : true;
          this.scrollPosition = parsedState.scrollPosition || 0;
          this.lastUpdated = parsedState.lastUpdated || this.getCurrentTime();
          this.dateRange = parsedState.dateRange || this.dateRange;
          
          this.isLoading = false;
          this.isCachedData = true;
          
          console.log("Datos de la tabla cargados desde caché:", this.orders.length, "pedidos");
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error al cargar el estado de la tabla desde sessionStorage:", error);
        return false;
      }
    },
    
    // Refrescar los datos desde el servidor
    refreshData() {
      this.isCachedData = false;
      this.fetchOrders();
    },
    
    // Load more orders (for infinite scroll)
    async loadMoreOrders() {
      if (!this.hasMoreData || this.isLoadingMore) return;
      
      this.currentPage++;
      this.isLoadingMore = true;
      
      try {
        const endpoint = `http://35.180.124.4:1880/import-orders?creation_time_from=${this.dateRange.from}&creation_time_to=${this.dateRange.to}&page=${this.currentPage}`;
        
        console.log(`Fetching page ${this.currentPage} from ${endpoint}`);
        
        const response = await fetch(endpoint);
        
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
          throw new Error("Invalid JSON response from server");
        }
        
        if (data && data.processedOrders && Array.isArray(data.processedOrders)) {
          // If no more orders, set hasMoreData to false
          if (data.processedOrders.length === 0) {
            this.hasMoreData = false;
            this.saveTableState();
            return;
          }
          
          // Process and add new orders
          const newOrders = data.processedOrders.map(order => {
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
                importStatus = "success";
                importLog = warnings.join("\n");
              }
            }

            // Check proforma invoice status
            let proformaInvoiceStatus = 'Pending';
            
            if (order.invoice_number) {
              proformaInvoiceStatus = 'Issued';
            }
            
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
              showLog: false
            };
          });

          // Append new orders to existing orders
          this.orders = [...this.orders, ...newOrders];
          console.log(`Added ${newOrders.length} more orders. Total: ${this.orders.length}`);
          
          // Guardar el estado actualizado
          this.saveTableState();
        } else {
          console.error("Invalid data structure:", data);
          this.$toast({
            message: "Invalid data structure received from server",
            type: 'error',
            duration: 3000
          });
          this.hasMoreData = false;
          this.saveTableState();
        }
      } catch (error) {
        console.error("Error loading more orders:", error);
        this.$toast({
          message: "Error loading more orders: " + (error.message || "Unknown error"),
          type: 'error',
          duration: 3000
        });
        this.hasMoreData = false;
        this.saveTableState();
      } finally {
        this.isLoadingMore = false;
      }
    },
    
    async fetchOrders() {
      // Reset pagination state
      this.currentPage = 1;
      this.hasMoreData = true;
      this.orders = [];
      this.scrollPosition = 0;
      
      this.isLoading = true;
      try {
        const endpoint = `http://35.180.124.4:1880/import-orders?creation_time_from=${this.dateRange.from}&creation_time_to=${this.dateRange.to}&page=${this.currentPage}`;
        
        const response = await fetch(endpoint);
        
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
          
          this.updateLastUpdatedTime();
          this.isCachedData = false;
          
          // Guardar el estado actualizado
          this.saveTableState();
        } else {
          console.error("Invalid data structure:", data);
          this.$toast({
            message: "Invalid data structure received from server",
            type: 'error',
            duration: 3000
          });
          this.orders = [];
        }
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
      this.lastUpdated = this.getCurrentTime();
    },
    getCurrentTime() {
      const now = new Date();
      return now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
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
    // Modificado para navegar a la página de detalles con los datos del pedido
    navigateToOrderDetails(e) {
      const order = e.data;
      
      // Guardar el pedido completo en sessionStorage (más seguro que localStorage para datos sensibles)
      sessionStorage.setItem('currentOrder', JSON.stringify(order));
      
      // Navegar a la página de detalles
      this.$router.push(`/ecommerce/Order/${order.order_number}`);
    },
    toggleLogVisibility(order) {
      order.showLog = !order.showLog;
      // Forzar actualización de la matriz de pedidos para reflejar cambios en la cuadrícula
      this.orders = [...this.orders];
      
      // Actualizar el estado en caché
      this.saveTableState();
    },
    getProformaIndicatorClass(status) {
      if (!status) return 'error';
      if (status.toLowerCase() === 'error') return 'error';
      return 'success'; // Both 'Issued' and 'Pending' will show as success
    },
  },
  mounted() {
    // Intentar cargar el estado de la tabla desde sessionStorage
    if (!this.loadTableState()) {
      // Si no hay estado guardado, cargar los datos desde la API
      this.fetchOrders();
    }
  },
  beforeUnmount() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Guardar el estado actual antes de desmontar el componente
    if (this.gridInstance) {
      const scrollable = this.gridInstance.getScrollable();
      if (scrollable) {
        this.scrollPosition = scrollable.scrollTop();
        this.saveTableState();
      }
    }
  }
};
</script>

<style>
/* Estilos existentes */
.orders-dashboard {
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 30px;
  padding-top:10px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
  background-color: var(--bg-white);
  color: var(--text-color);
}

.btn-refresh:hover {
  background-color: var(--bg-light);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-refresh .icon {
  width: 16px;
  height: 16px;
}

.cached-indicator {
  font-size: 12px;
  color: var(--warning-color);
  margin-left: 6px;
  font-style: italic;
}

/* Loading more indicator for infinite scroll */
.loading-more-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: var(--bg-light);
  border-top: 1px solid var(--border-color);
  font-size: 14px;
  color: var(--text-light);
  gap: 10px;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid var(--bg-light);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
}

.loading-more-text {
  font-size: 14px;
  color: var(--text-light);
  margin: 0;
}

/* Make sure the grid takes full height for proper scrolling */
.orders-table {
  height: 100%;
  width: 100%;
}

/* Ensure the container has proper height for scrolling */
.data-grid-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* Important for flex child to respect parent height */
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>