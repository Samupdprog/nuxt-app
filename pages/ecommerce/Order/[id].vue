<template>
    <AppLayout>
      <div class="order-detail-page">
        <div class="page-header">
          <div class="header-actions">
            <button @click="goBack" class="btn-back">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Orders
            </button>
          </div>
          <h1 class="page-title">Order Details: {{ order ? order.order_number : 'Loading...' }}</h1>
        </div>
  
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading order details...</p>
        </div>
  
        <div v-else-if="!order" class="error-container">
          <p class="error-message">Order not found or could not be loaded.</p>
          <button @click="goBack" class="btn btn-primary">Return to Orders</button>
        </div>
  
        <div v-else class="order-content">
          <div class="order-section">
            <h3>Order Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Order Number:</span>
                <span class="info-value">{{ order.order_number }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status:</span>
                <span :class="['status-badge', getStatusClass(order.status)]">{{ order.status }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Created:</span>
                <span class="info-value">{{ order.creation_time }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Last Update:</span>
                <span class="info-value">{{ order.last_update_time }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Amount:</span>
                <span class="info-value price-value">{{ order.order_total }} CZK</span>
              </div>
              <div class="info-item">
                <span class="info-label">Preforma Invoice:</span>
                <div class="proforma-status">
                  <div :class="['status-indicator', getProformaIndicatorClass(order.proformaInvoiceStatus)]"></div>
                  <span>{{ order.proformaInvoiceStatus }}</span>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Invoice Number:</span>
                <span class="info-value">{{ order.invoice_number || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Import Status:</span>
                <div class="status-with-indicator">
                  <div :class="['status-indicator', order.importStatus]" :title="getStatusTitle(order.importStatus)"></div>
                  <span class="info-value">{{ getStatusTitle(order.importStatus) }}</span>
                </div>
              </div>
            </div>
          </div>
  
          <div class="order-section">
            <h3>Customer Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">{{ order.customer.firstname_invoice }} {{ order.customer.surname_invoice }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">{{ order.customer.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">{{ order.customer.phone }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Address:</span>
                <span class="info-value">{{ order.customer.street_invoice }}, {{ order.customer.city_invoice }}, {{ order.customer.zip_invoice }}</span>
              </div>
            </div>
          </div>
  
          <div class="order-section">
            <h3>Products</h3>
            <div class="product-list-detail">
              <div v-for="(product, index) in order.products" :key="index" class="product-item-detail">
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
                <span class="info-value">{{ order.shipment ? order.shipment.name : 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">{{ order.payment ? order.payment.name : 'N/A' }}</span>
              </div>
            </div>
          </div>
  
          <div class="order-section">
            <h3>Import Log</h3>
            <div class="import-log-detail">
              <div 
                v-if="order.showLog" 
                v-for="(line, index) in order.importLog.split('\n')" 
                :key="index"
                :class="getLogLineClass(line)"
              >
                {{ line }}
              </div>
              <button 
                v-if="!order.showLog" 
                @click="toggleLogVisibility(order)" 
                class="btn-show-log"
              >
                Show Log
              </button>
              <button 
                v-else 
                @click="toggleLogVisibility(order)" 
                class="btn-hide-log"
              >
                Hide Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  </template>
  
  <script>
  import AppLayout from '~/layouts/AppLayout.vue';
  
  export default {
    components: {
      AppLayout
    },
    data() {
      return {
        order: null,
        isLoading: true
      };
    },
    computed: {
      orderId() {
        return this.$route.params.id;
      }
    },
    methods: {
      goBack() {
        this.$router.push('/ecommerce/orders_table');
      },
      async fetchOrderDetails() {
        this.isLoading = true;
        try {
          // Fetch all orders and find the specific one
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
            throw new Error("Invalid JSON response from server");
          }
          
          if (data && data.processedOrders && Array.isArray(data.processedOrders)) {
            // Find the order with matching ID
            const foundOrder = data.processedOrders.find(order => order.order_number === this.orderId);
            
            if (foundOrder) {
              // Process the order data similar to the orders_table component
              let importStatus = "success"; 
              let importLog = "Successful Import";
  
              // Process warnings and errors if they exist
              if (data.importResults) {
                const errors = data.importResults.errors && Array.isArray(data.importResults.errors)
                  ? data.importResults.errors
                      .filter(e => e.id && e.id.includes(foundOrder.order_number))
                      .map(e => `Error: ${e.reason}`)
                  : [];
  
                const warnings = data.importResults.warnings && Array.isArray(data.importResults.warnings)
                  ? data.importResults.warnings
                      .filter(w => w.id && w.id.includes(foundOrder.order_number))
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
              
              if (foundOrder.invoice_number) {
                proformaInvoiceStatus = 'Issued';
              }
              
              if (data.proformaInvoices && data.proformaInvoices.errors) {
                const proformaErrors = data.proformaInvoices.errors
                  .filter(e => e.id && e.id.includes(foundOrder.order_number));
                  
                if (proformaErrors.length > 0) {
                  proformaInvoiceStatus = 'Error';
                }
              }
  
              // Process products and add image URLs
              const processedProducts = foundOrder.products && Array.isArray(foundOrder.products)
                ? foundOrder.products.map(product => ({
                    ...product,
                    imageUrl: product.image_url || 'https://via.placeholder.com/50'
                  }))
                : [];
  
              this.order = {
                ...foundOrder,
                products: processedProducts,
                importStatus,
                importLog,
                proformaInvoiceStatus,
                showLog: false
              };
            } else {
              console.error("Order not found:", this.orderId);
              this.order = null;
            }
          } else {
            console.error("Invalid data structure:", data);
            this.$toast({
              message: "Invalid data structure received from server",
              type: 'error',
              duration: 3000
            });
            this.order = null;
          }
        } catch (error) {
          console.error("Error loading order details:", error);
          this.$toast({
            message: "Error loading order details: " + (error.message || "Unknown error"),
            type: 'error',
            duration: 3000
          });
          this.order = null;
        } finally {
          this.isLoading = false;
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
      getProformaIndicatorClass(status) {
        if (!status) return 'error';
        if (status.toLowerCase() === 'error') return 'error';
        return 'success';
      },
      toggleLogVisibility(order) {
        order.showLog = !order.showLog;
      }
    },
    mounted() {
      this.fetchOrderDetails();
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
  
  .order-detail-page {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .page-header {
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    display: flex;
    justify-content: flex-start;
  }
  
  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color);
    background-color: var(--bg-white);
    color: var(--text-color);
  }
  
  .btn-back:hover {
    background-color: var(--bg-light);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .btn-back .icon {
    width: 16px;
    height: 16px;
  }
  
  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
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
  
  .error-container {
    text-align: center;
    padding: 40px 0;
  }
  
  .error-message {
    font-size: 16px;
    color: var(--error-color);
    margin-bottom: 20px;
  }
  
  .order-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .order-section {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--bg-white);
  }
  
  .order-section h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    padding: 16px;
    background-color: var(--bg-light);
    border-bottom: 1px solid var(--border-color);
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    padding: 20px;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .info-label {
    font-size: 13px;
    color: var(--text-light);
    font-weight: 500;
  }
  
  .info-value {
    font-size: 15px;
    color: var(--text-color);
  }
  
  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    width: fit-content;
  }
  
  .status-cancelled {
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--error-color);
  }
  
  .status-active {
    background-color: rgba(16, 185, 129, 0.1);
    color: var(--success-color);
  }
  
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
  
  .proforma-status, .status-with-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .product-list-detail {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .product-item-detail {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: 8px;
    background-color: var(--bg-light);
  }
  
  .product-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid var(--border-color);
  }
  
  .product-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .product-header {
    display: flex;
    align-items: center;
    gap: 8px;
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
  
  .import-log-detail {
    padding: 20px;
    font-family: monospace;
    font-size: 14px;
    line-height: 1.6;
    background-color: var(--bg-light);
    border-radius: 4px;
    margin: 0 20px 20px;
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
  
  .btn-show-log, .btn-hide-log {
    font-size: 12px;
    padding: 6px 12px;
    border-radius: 4px;
    background-color: var(--bg-light);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 8px;
  }
  
  .btn-show-log:hover, .btn-hide-log:hover {
    background-color: var(--primary-color);
    color: white;
  }
  
  .price-value {
    font-weight: 600;
    color: var(--text-color);
  }
  
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
  
  @media (max-width: 768px) {
    .info-grid {
      grid-template-columns: 1fr;
    }
  }
  </style>