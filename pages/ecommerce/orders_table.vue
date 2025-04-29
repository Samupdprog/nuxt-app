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
            <button @click="clearCacheAndFetchOrders" class="btn btn-primary">
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
            <span v-if="autoRefreshActive" class="auto-refresh-indicator">(Auto refresh active)</span>
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
          :scrolling="{ mode: 'standard' }"
          @row-click="navigateToOrderDetails"
          @content-ready="onContentReady"
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
                <img :src="product.imageUrl || 'https://via.placeholder.com/50'" class="product-image" />
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
          <DxColumnChooser :enabled="true" mode="select" />
          <DxSelection mode="multiple" />
          <DxPaging :enabled="false" />
        </DxDataGrid>
        
        <!-- Loading indicator for infinite scroll -->
        <div v-if="isLoadingMore" class="loading-more-container">
          <div class="loading-spinner-small"></div>
          <p class="loading-more-text">Loading more orders...</p>
        </div>
        
        <!-- Floating loading indicator -->
        <div v-if="isLoadingMore" class="floating-loading-indicator">
          <div class="loading-spinner-small"></div>
        </div>
        
        <!-- Load More Button -->
        <div v-if="!isLoadingMore && hasMoreData && orders.length > 0" class="load-more-container">
          <button @click="loadMoreOrders" class="btn-load-more">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Load More Orders
          </button>
        </div>
        
        <!-- All Data Loaded Indicator -->
        <div v-if="!hasMoreData && orders.length > 0" class="all-data-loaded">
          All orders loaded
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import { DxDataGrid, DxColumn, DxFilterRow, DxHeaderFilter, DxSearchPanel, DxColumnChooser, DxSelection, DxPaging } from 'devextreme-vue/data-grid';

// Mock data for testing when API returns 401
const MOCK_ORDERS = [
  {
    order_number: "12345",
    creation_time: "2025-03-15",
    last_update_time: "2025-03-16",
    status: "Completed",
    order_total: 1250,
    customer: { email: "test@example.com", phone: "123-456-7890" },
    shipment: { name: "Express Delivery" },
    payment: { name: "Credit Card" },
    products: [
      { title: "Test Product 1", quantity: 2, price: 500, imageUrl: "https://via.placeholder.com/50" },
      { title: "Test Product 2", quantity: 1, price: 250, imageUrl: "https://via.placeholder.com/50" }
    ],
    importStatus: "success",
    importLog: "Successful Import",
    proformaInvoiceStatus: "Issued",
    showLog: false
  },
  {
    order_number: "12346",
    creation_time: "2025-03-14",
    last_update_time: "2025-03-15",
    status: "Processing",
    order_total: 750,
    customer: { email: "customer@example.com", phone: "987-654-3210" },
    shipment: { name: "Standard Shipping" },
    payment: { name: "PayPal" },
    products: [
      { title: "Test Product 3", quantity: 3, price: 250, imageUrl: "https://via.placeholder.com/50" }
    ],
    importStatus: "success",
    importLog: "Successful Import",
    proformaInvoiceStatus: "Pending",
    showLog: false
  }
];

// Generate more mock orders for testing
for (let i = 0; i < 20; i++) {
  MOCK_ORDERS.push({
    order_number: `${12347 + i}`,
    creation_time: "2025-03-10",
    last_update_time: "2025-03-12",
    status: i % 2 === 0 ? "Completed" : "Processing",
    order_total: 500 + (i * 100),
    customer: { email: `user${i}@example.com`, phone: `555-${i}${i}${i}-${i}${i}${i}${i}` },
    shipment: { name: i % 2 === 0 ? "Express Delivery" : "Standard Shipping" },
    payment: { name: i % 3 === 0 ? "Credit Card" : (i % 3 === 1 ? "PayPal" : "Bank Transfer") },
    products: [
      { title: `Product ${i}`, quantity: i % 3 + 1, price: 250, imageUrl: "https://via.placeholder.com/50" }
    ],
    importStatus: "success",
    importLog: "Successful Import",
    proformaInvoiceStatus: i % 3 === 0 ? "Issued" : "Pending",
    showLog: false
  });
}

export default {
  components: {
    DxDataGrid,
    DxColumn,
    DxFilterRow,
    DxHeaderFilter,
    DxSearchPanel,
    DxColumnChooser,
    DxSelection,
    DxPaging
  },
  data() {
    return {
      orders: [],
      lastUpdated: "",
      refreshInterval: 5, // Default to 5 minutes
      refreshTimer: null,
      isLoading: true,
      isLoadingMore: false,
      hasMoreData: true,
      gridInstance: null,
      scrollThreshold: 0.8, // Load more when scrolled 80% down
      dateRange: {
        from: "2025-03-01",
        to: "2025-03-31"
      },
      showControlPanel: true,
      isCachedData: false,
      scrollPosition: 0,
      // Pagination properties
      pageSize: 10,
      currentPage: 0,
      maxPages: 10, // Máximo de páginas a cargar (0-9, 10-19, ..., 90-99)
      // Auto refresh tracking
      autoRefreshActive: false,
      lastOrderCount: 0,
      // Flag to use mock data (for testing)
      useMockData: false,
      errorMessage: null
    };
  },
  methods: {
    // Modificar el método fetchWithTimeout
    fetchWithTimeout(url, options = {}, timeout = 10000) {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("The api is taking too long to respond")), timeout)
        )
      ]);
    },
    
    toggleControlPanel() {
      this.showControlPanel = !this.showControlPanel;
    },

    // Separate scroll handler function for better cleanup
    handleScroll(event) {
      const container = event.target;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      const scrollRatio = scrollTop / (scrollHeight - clientHeight);
      this.scrollPosition = scrollTop;

      if (scrollRatio > this.scrollThreshold && !this.isLoadingMore && this.hasMoreData) {
        console.log(`ScrollRatio: ${scrollRatio.toFixed(2)} — loading more...`);
        this.loadMoreOrders();
      }
    },
    
    // Store grid instance on content ready
    onContentReady(e) {
      this.gridInstance = e.component;

      this.$nextTick(() => {
        const scrollable = this.gridInstance.getScrollable();
        if (scrollable) {
          const container = scrollable.container();

          // Remove any previous scroll listener
          container.removeEventListener('scroll', this.handleScroll);

          // Add real scroll listener
          container.addEventListener('scroll', this.handleScroll);
          
          // Restore scroll position if exists
          if (this.scrollPosition > 0) {
            setTimeout(() => {
              scrollable.scrollTo(this.scrollPosition);
            }, 100);
          }
        }

        // Asegurar que las columnas de la izquierda sean visibles inicialmente
        const visibleColumns = this.gridInstance.getVisibleColumns();
        if (visibleColumns.length > 0) {
          this.gridInstance.scrollTo(0);
        }
      });
    },
    
    // Clear cache and force fetch new orders
    clearCacheAndFetchOrders() {
      console.log("Clearing cache and fetching new orders...");
      // Clear session storage
      sessionStorage.removeItem('ordersTableState');
      
      // Reset state
      this.isCachedData = false;
      this.currentPage = 0;
      this.hasMoreData = true;
      this.orders = [];
      this.scrollPosition = 0;
      
      // Fetch new orders
      this.fetchOrders();
    },
    
    // Save current table state to sessionStorage
    saveTableState() {
      const tableState = {
        orders: this.orders,
        currentPage: this.currentPage,
        maxPages: this.maxPages,
        hasMoreData: this.hasMoreData,
        scrollPosition: this.scrollPosition,
        lastUpdated: this.lastUpdated,
        dateRange: this.dateRange,
        autoRefreshActive: this.autoRefreshActive,
        refreshInterval: this.refreshInterval
      };
      
      sessionStorage.setItem('ordersTableState', JSON.stringify(tableState));
    },
    
    // Load table state from sessionStorage
    loadTableState() {
      try {
        const savedState = sessionStorage.getItem('ordersTableState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          this.orders = parsedState.orders || [];
          this.currentPage = parsedState.currentPage || 0;
          this.maxPages = parsedState.maxPages || 10;
          this.hasMoreData = parsedState.hasMoreData !== undefined ? parsedState.hasMoreData : true;
          this.scrollPosition = parsedState.scrollPosition || 0;
          this.lastUpdated = parsedState.lastUpdated || this.getCurrentTime();
          this.dateRange = parsedState.dateRange || this.dateRange;
          this.autoRefreshActive = parsedState.autoRefreshActive || false;
          this.refreshInterval = parsedState.refreshInterval || 5;
          
          // Store the current order count for comparison during auto-refresh
          this.lastOrderCount = this.orders.length;
          
          this.isLoading = false;
          this.isCachedData = true;
          
          console.log("Table data loaded from cache:", this.orders.length, "orders");
          
          // If auto refresh was active, restart it
          if (this.autoRefreshActive) {
            this.setupAutoRefresh();
          }
          
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error loading table state from sessionStorage:", error);
        return false;
      }
    },
    
    // Refresh data from server
    refreshData() {
      this.isCachedData = false;
      this.currentPage = 0;
      this.hasMoreData = true;
      this.orders = [];
      this.scrollPosition = 0;
      
      this.isLoading = true;
      console.log("Fetching initial orders...");
      
      this.fetchOrders();
    },
    
    // Load more orders (for infinite scroll)
    async loadMoreOrders() {
      if (!this.hasMoreData || this.isLoadingMore) return;
      
      this.isLoadingMore = true;
      this.errorMessage = null;
      this.currentPage++;
      
      if (this.currentPage >= this.maxPages) {
        this.hasMoreData = false;
        this.isLoadingMore = false;
        return;
      }
      
      const fromIndex = this.currentPage * this.pageSize;
      const toIndex = fromIndex + this.pageSize - 1;
      
      try {
        const endpoint = `http://35.180.124.4:1880/import-orders/${fromIndex}/${toIndex}`;
        const response = await this.fetchWithTimeout(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });

        // Ignorar error 401 y continuar con el procesamiento
        const data = await response.json();
        
        if (!data || !data.processedOrders || !Array.isArray(data.processedOrders)) {
          throw new Error("Formato de datos inválido de la API");
        }

        const newOrders = this.processOrdersData(data);
        
        if (newOrders.length === 0) {
          this.hasMoreData = false;
        } else {
          this.orders = [...this.orders, ...newOrders];
        }
        
      } catch (error) {
        console.error("Error loading more orders:", error);
        // Solo mostrar error si no es 401
        if (!error.message.includes('401')) {
          this.errorMessage = error.message || "Error al cargar más pedidos";
          this.$toast({
            message: this.errorMessage,
            type: 'error',
            duration: 5000
          });
          this.hasMoreData = false;
        }
      } finally {
        this.isLoadingMore = false;
      }
    },
    
    // Simulate API delay for testing
    simulateApiDelay() {
      return new Promise(resolve => setTimeout(resolve, 500));
    },
    
    // Process orders data from API response
    processOrdersData(data) {
      return data.processedOrders.map(order => {
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
          ? order.products.map(product => {
              const processed = {
                ...product,
                imageUrl: product.image_url || 'https://via.placeholder.com/50'
              };
              return processed;
            })
          : [];

        // Debug first product if available
        if (processedProducts.length > 0) {
          console.log("Sample processed product:", processedProducts[0]);
        }

        return {
          ...order,
          products: processedProducts,
          importStatus,
          importLog,
          proformaInvoiceStatus,
          showLog: false
        };
      });
    },
    
    async fetchOrders() {
      this.isLoading = true;
      this.errorMessage = null;
      console.log("Fetching initial orders...");
      
      try {
        const endpoint = `http://35.180.124.4:1880/import-orders/0/9`;
        console.log("Fetching from endpoint:", endpoint);
        
        const response = await this.fetchWithTimeout(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });

        // Ignorar error 401 y continuar con el procesamiento
        const data = await response.json();
        
        if (!data || !data.processedOrders || !Array.isArray(data.processedOrders)) {
          throw new Error("Formato de datos inválido de la API");
        }

        this.orders = this.processOrdersData(data);
        this.currentPage = 0;
        this.hasMoreData = true;
        this.updateLastUpdatedTime();
        
      } catch (error) {
        console.error("Error fetching orders:", error);
        // Solo mostrar error si no es 401
        if (!error.message.includes('401')) {
          this.errorMessage = error.message || "Error al cargar los pedidos";
          this.$toast({
            message: this.errorMessage,
            type: 'error',
            duration: 5000
          });
        }
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
    
    // Setup auto refresh timer
    setupAutoRefresh() {
      // Clear any existing timer
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
      }
      
      // Convert minutes to milliseconds
      const intervalMs = this.refreshInterval * 60 * 1000;
      
      // Set up new timer
      this.refreshTimer = setInterval(() => {
        this.checkForNewOrders();
      }, intervalMs);
      
      this.autoRefreshActive = true;
      this.saveTableState();
      
      console.log(`Auto refresh set up to run every ${this.refreshInterval} minutes`);
    },
    
    // Check for new orders without resetting the table
    async checkForNewOrders() {
      console.log("Auto refresh: Checking for new orders...");
      
      try {
        // If using mock data (for testing)
        if (this.useMockData) {
          await this.simulateApiDelay();
          
          // Generate some random new orders for testing
          const newMockOrders = [
            {
              order_number: `NEW-${Date.now()}`,
              creation_time: new Date().toISOString().split('T')[0],
              last_update_time: new Date().toISOString().split('T')[0],
              status: "New",
              order_total: Math.floor(Math.random() * 1000) + 500,
              customer: { email: `new-customer@example.com`, phone: "555-NEW-CUST" },
              shipment: { name: "Express Delivery" },
              payment: { name: "Credit Card" },
              products: [
                { title: "New Product", quantity: 1, price: 250, imageUrl: "https://via.placeholder.com/50" }
              ],
              importStatus: "success",
              importLog: "Successful Import",
              proformaInvoiceStatus: "Pending",
              showLog: false
            }
          ];
          
          // Add new orders to the beginning of the array
          this.orders = [...newMockOrders, ...this.orders];
          
          // Update last updated time
          this.updateLastUpdatedTime();
          
          // Save updated state
          this.saveTableState();
          
          // Notify user
          this.$toast({
            message: `${newMockOrders.length} new orders have been added`,
            type: 'success',
            duration: 3000
          });
          
          return;
        }
        
        // We'll always check the first page for new orders
        const endpoint = `http://35.180.124.4:1880/import-orders/0/${this.pageSize - 1}`;
        
        const response = await this.fetchWithTimeout(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          cache: 'no-store' // Prevent caching
        });
        
        // Try to parse response even if status is not 200
        if (!response.ok) {
          console.warn(`API returned ${response.status}. Trying to parse response anyway...`);
          
          const rawText = await response.text();
          try {
            const data = JSON.parse(rawText);
            const newOrders = this.processOrdersData(data);
            
            // Check for new orders by comparing order numbers
            const existingOrderNumbers = new Set(this.orders.map(order => order.order_number));
            const newOrdersToAdd = newOrders.filter(order => !existingOrderNumbers.has(order.order_number));
            
            if (newOrdersToAdd.length > 0) {
              // Add new orders to the beginning of the array
              this.orders = [...newOrdersToAdd, ...this.orders];
              
              // Update last updated time
              this.updateLastUpdatedTime();
              
              // Save updated state
              this.saveTableState();
              
              // Notify user
              this.$toast({
                message: `${newOrdersToAdd.length} new orders have been added`,
                type: 'success',
                duration: 3000
              });
            } else {
              console.log("Auto refresh: No new orders found");
            }
            return;
          } catch (err) {
            console.error("Error parsing auto-refresh response", err);
            return;
          }
        }
        
        const rawText = await response.text();
        const sanitizedText = rawText
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
          .replace(/\\"/g, '\\"')
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t");
        
        let data;
        try {
          data = JSON.parse(sanitizedText);
        } catch (parseError) {
          console.error("Auto refresh: JSON Parse Error:", parseError);
          return;
        }
        
        if (data && data.processedOrders && Array.isArray(data.processedOrders)) {
          // Process the new orders
          const newOrders = this.processOrdersData(data);
          
          // Check if there are any new orders by comparing order numbers
          const existingOrderNumbers = new Set(this.orders.map(order => order.order_number));
          const newOrdersToAdd = newOrders.filter(order => !existingOrderNumbers.has(order.order_number));
          
          if (newOrdersToAdd.length > 0) {
            console.log(`Auto refresh: Found ${newOrdersToAdd.length} new orders`);
            
            // Add new orders to the beginning of the array
            this.orders = [...newOrdersToAdd, ...this.orders];
            
            // Update last updated time
            this.updateLastUpdatedTime();
            
            // Save updated state
            this.saveTableState();
            
            // Notify user
            this.$toast({
              message: `${newOrdersToAdd.length} new orders have been added`,
              type: 'success',
              duration: 3000
            });
          } else {
            console.log("Auto refresh: No new orders found");
          }
        }
      } catch (error) {
        console.error("Auto refresh: Error checking for new orders:", error);
      }
    },
    
    // Start auto refresh with better UI feedback
    async startAutoRefresh() {
      try {
        const interval = this.refreshInterval;

        if (interval < 1) {
          alert("El intervalo debe ser al menos 1 minuto.");
          return;
        }

        // Set up client-side auto refresh
        this.setupAutoRefresh();
        
        // Also try to set up server-side auto refresh if the endpoint exists
        try {
          const response = await fetch("http://35.180.124.4:1880/start-auto-refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ minutes: interval })
          });

          const data = await response.json();
          console.log(data.message);
        } catch (serverError) {
          console.log("Server-side auto refresh not available, using client-side only");
        }

        this.$toast({
          message: `Auto Refresh activated: checking every ${interval} minutes`,
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
      
      // Enhanced status mapping for better extensibility
      const map = {
        storno: 'status-cancelled',
        odeslána: 'status-shipped',
        completed: 'status-active'
      };
      return map[status.toLowerCase()] || 'status-default';
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
    
    // Navigate to order details page
    navigateToOrderDetails(e) {
      const order = e.data;
      
      // Save complete order in sessionStorage
      sessionStorage.setItem('currentOrder', JSON.stringify(order));
      
      // Navigate to details page
      this.$router.push(`/ecommerce/Order/${order.order_number}`);
    },
    
    toggleLogVisibility(order) {
      order.showLog = !order.showLog;
      // Force update of orders array to reflect changes in the grid
      this.orders = [...this.orders];
      
      // Update cached state
      this.saveTableState();
    },
    
    getProformaIndicatorClass(status) {
      if (!status) return 'error';
      if (status.toLowerCase() === 'error') return 'error';
      return 'success'; // Both 'Issued' and 'Pending' will show as success
    }
  },
  mounted() {
    // Try to load table state from sessionStorage
    if (!this.loadTableState()) {
      // If no saved state, load data from API
      this.fetchOrders();
    }
  },
  beforeUnmount() {
    // Clean up resources
    if (this.refreshTimer) clearInterval(this.refreshTimer);

    if (this.gridInstance) {
      const scrollable = this.gridInstance.getScrollable();
      const container = scrollable?.container?.();
      if (container) {
        // Remove event listener to prevent memory leaks
        container.removeEventListener('scroll', this.handleScroll);
        this.scrollPosition = container.scrollTop;
        this.saveTableState();
      }
    }
  }
};
</script>

<style>
/* Existing styles */
.orders-dashboard {
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 0px;
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

/* Auto refresh indicator */
.auto-refresh-indicator {
  font-size: 12px;
  color: var(--success-color);
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
  min-height: 0;
  height: calc(100vh - 200px); /* Ajustado para ocupar más espacio */
  margin-top: 20px;
}

/* Ajuste cuando el panel de control está oculto */
.orders-dashboard:not(.show-controls) .data-grid-container {
  height: calc(100vh - 100px);
}

/* Ajuste responsivo para pantallas más pequeñas */
@media (max-width: 768px) {
  .data-grid-container {
    height: calc(100vh - 250px);
  }
  
  .orders-dashboard:not(.show-controls) .data-grid-container {
    height: calc(100vh - 120px);
  }
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

/* Loading container styles */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: var(--bg-light);
  border-radius: 8px;
  margin: 20px 0;
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
  margin: 0;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background-color: var(--bg-light);
  border-top: 1px solid var(--border-color);
}

.btn-load-more {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-load-more:hover {
  background-color: var(--primary-color-dark);
  transform: translateY(-1px);
}

.btn-load-more .icon {
  width: 16px;
  height: 16px;
}

.all-data-loaded {
  text-align: center;
  padding: 20px;
  color: var(--text-light);
  font-style: italic;
  background-color: var(--bg-light);
  border-top: 1px solid var(--border-color);
}

.floating-loading-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Ajuste para asegurar que la tabla muestre las columnas de la izquierda inicialmente */
.orders-table {
  width: 100%;
  height: 100%;
  overflow-x: auto;
}

.orders-table .dx-datagrid-headers {
  position: sticky;
  top: 0;
  z-index: 1;
}

.orders-table .dx-datagrid-rowsview {
  overflow-x: auto;
}
</style>