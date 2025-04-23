<template>
  <AppLayout>
    <div class="products-dashboard">
      <div class="page-header">
        <div class="header-row">
          <h1 class="page-title">Products</h1>
          <div class="header-actions">
            <button @click="toggleControlPanel" class="btn-toggle-controls">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 15l-6-6-6 6" v-if="showControlPanel"/>
                <path d="M6 9l6 6 6-6" v-else/>
              </svg>
              {{ showControlPanel ? 'Hide Controls' : 'Show Controls' }}
            </button>
            <button v-if="isCachedData" @click="clearCacheAndFetch" class="btn-refresh" title="Clear cache and refresh data">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
              </svg>
              Clear Cache
            </button>
          </div>
        </div>
        <div v-if="showControlPanel" class="controls-panel">
          <div class="controls-left">
            <button @click="fetchProducts" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
              </svg>
              Refresh Products
            </button>
            
            <div class="filter-controls">
              <span>Show:</span>
              <select v-model="filterActive" class="select-input" aria-label="Filter by status">
                <option value="all">All Products</option>
                <option value="active">Active Only</option>
                <option value="action">On Sale Only</option>
              </select>
              <button @click="applyFilters" class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                Apply Filters
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
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading products...</p>
        </div>
        
        <DxDataGrid
          v-else
          :data-source="products"
          :show-borders="true"
          key-expr="product_id"
          class="products-table"
          :allow-column-reordering="true"
          :allow-column-resizing="true"
          :row-alternation-enabled="true"
          :no-data-text="'No products found'"
          :scrolling="{ mode: 'standard' }"
          @row-click="viewProductDetails"
          @content-ready="onContentReady"
          ref="dataGrid"
        >
          <!-- Image Column -->
          <DxColumn data-field="imageUrl" caption="Image" width="80" alignment="center" cell-template="imageTemplate" />
          
          <!-- Product Code -->
          <DxColumn data-field="code" caption="Code" width="100" alignment="center" />
          
          <!-- Product Name -->
          <DxColumn data-field="name" caption="Name" width="250" alignment="left" />
          
          <!-- Price -->
          <DxColumn data-field="price" caption="Price" width="120" alignment="right" cell-template="priceTemplate" />
          
          <!-- Discount -->
          <DxColumn data-field="discount" caption="Discount" width="100" alignment="center" cell-template="discountTemplate" />
          
          <!-- Availability -->
          <DxColumn data-field="availability" caption="Availability" width="120" alignment="center" />
          
          <!-- Categories -->
          <DxColumn data-field="categories" caption="Categories" width="200" alignment="left" cell-template="categoriesTemplate" />
          
          <!-- Actions -->
          <DxColumn caption="Actions" width="120" cell-template="actionsTemplate" alignment="center" />

          <!-- Image Template -->
          <template #imageTemplate="{ data }">
            <img :src="data.value" class="product-image" alt="Product thumbnail" />
          </template>

          <!-- Price Template -->
          <template #priceTemplate="{ data }">
            <div class="price-container">
              <span v-if="data.data.price_original !== data.data.price_sale && data.data.price_sale" class="price-original">{{ formatPrice(data.data.price_original) }}</span>
              <span class="price-value">{{ formatPrice(data.data.price_sale || data.data.price_original) }} {{ data.data.currency }}</span>
            </div>
          </template>

          <!-- Discount Template -->
          <template #discountTemplate="{ data }">
            <div v-if="data.value" class="discount-badge">
              -{{ data.value }}%
            </div>
          </template>

          <!-- Categories Template -->
          <template #categoriesTemplate="{ data }">
            <div class="categories-list">
              <span v-for="(category, index) in data.value" :key="index" class="category-badge">
                {{ category.name }}
              </span>
            </div>
          </template>

          <!-- Actions Template -->
          <template #actionsTemplate="{ data }">
            <div class="actions">
              <button class="btn-action" @click.stop="viewProductDetails(data)">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                View
              </button>
            </div>
          </template>

          <DxFilterRow :visible="true" />
          <DxHeaderFilter :visible="true" />
          <DxSearchPanel :visible="true" :highlight-case-sensitive="false" />
          <DxColumnChooser :enabled="true" mode="select" />
          <DxSelection mode="multiple" />
          <DxPaging :enabled="false" />
        </DxDataGrid>
      </div>

      <!-- Product Details Modal -->
      <div v-if="showProductModal" class="product-modal-overlay" @click.self="showProductModal = false">
        <div class="product-modal">
          <div class="product-modal-header">
            <h2>{{ selectedProduct.name }}</h2>
            <button class="close-button" @click="showProductModal = false">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="product-modal-content">
            <div class="product-section product-header-section">
              <div class="product-images">
                <div class="main-image-container">
                  <img :src="selectedProduct.mainImage" alt="Product main image" class="main-image" />
                </div>
                <div class="thumbnail-images" v-if="selectedProduct.images && selectedProduct.images.length > 1">
                  <img 
                    v-for="(image, index) in selectedProduct.images" 
                    :key="index" 
                    :src="image.url" 
                    alt="Product thumbnail" 
                    class="thumbnail-image" 
                    @click="selectedProduct.mainImage = image.url"
                    :class="{ 'active': selectedProduct.mainImage === image.url }"
                  />
                </div>
              </div>
              <div class="product-summary">
                <div class="product-info-item">
                  <span class="info-label">Product Code:</span>
                  <span class="info-value">{{ selectedProduct.code }}</span>
                </div>
                <div class="product-info-item">
                  <span class="info-label">Product ID:</span>
                  <span class="info-value">{{ selectedProduct.product_id }}</span>
                </div>
                <div class="product-info-item">
                  <span class="info-label">Price:</span>
                  <div class="price-container">
                    <span v-if="selectedProduct.price_original !== selectedProduct.price_sale && selectedProduct.price_sale" class="price-original">{{ formatPrice(selectedProduct.price_original) }}</span>
                    <span class="price-value">{{ formatPrice(selectedProduct.price_sale || selectedProduct.price_original) }} {{ selectedProduct.currency }}</span>
                  </div>
                </div>
                <div class="product-info-item" v-if="selectedProduct.discount">
                  <span class="info-label">Discount:</span>
                  <span class="discount-badge">-{{ selectedProduct.discount }}%</span>
                </div>
                <div class="product-info-item">
                  <span class="info-label">Availability:</span>
                  <span class="info-value">{{ selectedProduct.availability }}</span>
                </div>
                <div class="product-info-item" v-if="selectedProduct.categories && selectedProduct.categories.length">
                  <span class="info-label">Categories:</span>
                  <div class="categories-list">
                    <span v-for="(category, index) in selectedProduct.categories" :key="index" class="category-badge">
                      {{ category.name }}
                    </span>
                  </div>
                </div>
                <div class="product-info-item" v-if="selectedProduct.manufacturer">
                  <span class="info-label">Manufacturer:</span>
                  <span class="info-value">{{ selectedProduct.manufacturer }}</span>
                </div>
                <div class="product-info-item">
                  <span class="info-label">Status:</span>
                  <span class="status-badge" :class="{'status-active': selectedProduct.active_yn, 'status-inactive': !selectedProduct.active_yn}">
                    {{ selectedProduct.active_yn ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="product-info-item" v-if="selectedProduct.action_currently_yn">
                  <span class="info-label">On Sale:</span>
                  <span class="status-badge status-sale">Yes</span>
                </div>
              </div>
            </div>

            <div class="product-section" v-if="selectedProduct.short_description || selectedProduct.long_description">
              <h3>Description</h3>
              <div class="product-description">
                <div v-if="selectedProduct.short_description" class="short-description">
                  <p>{{ selectedProduct.short_description }}</p>
                </div>
                <div v-if="selectedProduct.long_description" class="long-description" v-html="selectedProduct.long_description"></div>
              </div>
            </div>

            <div class="product-section" v-if="selectedProduct.seo_title || selectedProduct.seo_description || selectedProduct.seo_url">
              <h3>SEO Information</h3>
              <div class="seo-info">
                <div class="product-info-item" v-if="selectedProduct.seo_title">
                  <span class="info-label">SEO Title:</span>
                  <span class="info-value">{{ selectedProduct.seo_title }}</span>
                </div>
                <div class="product-info-item" v-if="selectedProduct.seo_description">
                  <span class="info-label">SEO Description:</span>
                  <span class="info-value">{{ selectedProduct.seo_description }}</span>
                </div>
                <div class="product-info-item" v-if="selectedProduct.seo_url">
                  <span class="info-label">SEO URL:</span>
                  <span class="info-value">{{ selectedProduct.seo_url }}</span>
                </div>
              </div>
            </div>

            <div class="product-section" v-if="selectedProduct.creation_time || selectedProduct.last_update_time">
              <h3>Additional Information</h3>
              <div class="additional-info">
                <div class="product-info-item" v-if="selectedProduct.creation_time">
                  <span class="info-label">Created:</span>
                  <span class="info-value">{{ formatDate(selectedProduct.creation_time) }}</span>
                </div>
                <div class="product-info-item" v-if="selectedProduct.last_update_time">
                  <span class="info-label">Last Updated:</span>
                  <span class="info-value">{{ formatDate(selectedProduct.last_update_time) }}</span>
                </div>
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
  },
  data() {
    return {
      products: [],
      lastUpdated: "",
      isLoading: true,
      selectedProduct: null,
      showProductModal: false,
      showControlPanel: true,
      filterActive: 'all',
      originalProducts: [],
      apiUrl: "http://35.180.124.4:1880/get-all-products",
      gridInstance: null,
      isCachedData: false
    };
  },
  methods: {
    // Toggle control panel visibility
    toggleControlPanel() {
      this.showControlPanel = !this.showControlPanel;
    },
    
    // Format price with thousands separator
    formatPrice(price) {
      if (!price) return '0';
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },
    
    // Format date
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    onContentReady(e) {
      this.gridInstance = e.component;
      this.$nextTick(() => {
        // Asegurar que las columnas de la izquierda sean visibles inicialmente
        const visibleColumns = this.gridInstance.getVisibleColumns();
        if (visibleColumns.length > 0) {
          this.gridInstance.scrollTo(0);
        }
      });
    },

    // Save current state to sessionStorage
    saveTableState() {
      const tableState = {
        products: this.products,
        originalProducts: this.originalProducts,
        lastUpdated: this.lastUpdated,
        filterActive: this.filterActive
      };
      
      sessionStorage.setItem('productsTableState', JSON.stringify(tableState));
    },

    // Load table state from sessionStorage
    loadTableState() {
      try {
        const savedState = sessionStorage.getItem('productsTableState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          this.products = parsedState.products || [];
          this.originalProducts = parsedState.originalProducts || [];
          this.lastUpdated = parsedState.lastUpdated || this.getCurrentTime();
          this.filterActive = parsedState.filterActive || 'all';
          
          this.isLoading = false;
          this.isCachedData = true;
          
          console.log("Table data loaded from cache:", this.products.length, "products");
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error loading table state from sessionStorage:", error);
        return false;
      }
    },

    // Clear cache and fetch new data
    clearCacheAndFetch() {
      console.log("Clearing cache and fetching new data...");
      sessionStorage.removeItem('productsTableState');
      this.isCachedData = false;
      this.fetchProducts();
    },

    async fetchProducts() {
      this.isLoading = true;
      this.products = [];
      
      try {
        const response = await fetch(this.apiUrl);
        const data = await response.json();
        
        if (data && data.products && Array.isArray(data.products)) {
          this.originalProducts = this.processProducts(data.products);
          this.products = [...this.originalProducts];
          this.applyFilters();
          this.updateLastUpdatedTime();
          
          // Save to cache after successful fetch
          this.saveTableState();
          this.isCachedData = true;
        }
      } catch (error) {
        console.error("Error loading products:", error);
        this.$toast({
          message: "Error loading products: " + (error.message || "Unknown error"),
          type: 'error',
          duration: 3000
        });
      } finally {
        this.isLoading = false;
      }
    },
    
    // Process products data
    processProducts(productsData) {
      return productsData.map(product => {
        // Get the main image URL
        const mainImage = product.images && product.images.length > 0 
          ? product.images.find(img => img.main_yn)?.url || product.images[0].url 
          : 'https://via.placeholder.com/100';
        
        // Get the product name
        const name = product.descriptions && product.descriptions.length > 0 
          ? product.descriptions[0].title 
          : 'Unnamed Product';
        
        // Get the short description
        const short_description = product.descriptions && product.descriptions.length > 0 
          ? product.descriptions[0].short_description 
          : '';
        
        // Get the long description
        const long_description = product.descriptions && product.descriptions.length > 0 
          ? product.descriptions[0].long_description 
          : '';
        
        // Get the SEO information
        const seo_title = product.descriptions && product.descriptions.length > 0 
          ? product.descriptions[0].seo_title 
          : '';
        
        const seo_description = product.descriptions && product.descriptions.length > 0 
          ? product.descriptions[0].seo_description 
          : '';
        
        const seo_url = product.descriptions && product.descriptions.length > 0 
          ? product.descriptions[0].seo_url 
          : '';
        
        // Get the price information
        const price_original = product.prices && product.prices.length > 0 && product.prices[0].pricelists && product.prices[0].pricelists.length > 0
          ? product.prices[0].pricelists[0].price_original
          : 0;
        
        const price_sale = product.prices && product.prices.length > 0 && product.prices[0].pricelists && product.prices[0].pricelists.length > 0
          ? product.prices[0].pricelists[0].price_sale
          : null;
        
        const currency = product.prices && product.prices.length > 0 
          ? product.prices[0].currency 
          : 'CZK';
        
        // Calculate discount percentage
        const discount = product.prices && product.prices.length > 0 && product.prices[0].pricelists && product.prices[0].pricelists.length > 0
          ? product.prices[0].pricelists[0].product_discount_real || 0
          : 0;
        
        return {
          ...product,
          imageUrl: mainImage,
          mainImage: mainImage,
          name,
          short_description,
          long_description,
          seo_title,
          seo_description,
          seo_url,
          price_original,
          price_sale,
          currency,
          discount,
          price: price_sale || price_original
        };
      });
    },
    
    // Apply filters
    applyFilters() {
      if (this.filterActive === 'all') {
        this.products = [...this.originalProducts];
      } else if (this.filterActive === 'active') {
        this.products = this.originalProducts.filter(product => product.active_yn);
      } else if (this.filterActive === 'action') {
        this.products = this.originalProducts.filter(product => product.action_currently_yn);
      }
    },
    
    // View product details
    viewProductDetails(e) {
      this.selectedProduct = e.data;
      this.showProductModal = true;
    },
    
    // Update last updated time
    updateLastUpdatedTime() {
      const now = new Date();
      this.lastUpdated = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    },
    
    // Toast notification
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

    getCurrentTime() {
      const now = new Date();
      return now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    }
  },
  mounted() {
    // Try to load from cache first
    if (!this.loadTableState()) {
      // If no cache, fetch from API
      this.fetchProducts();
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

/* General styles */
.products-dashboard {
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

/* Controls panel */
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

/* Buttons */
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

/* Filter controls */
.filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-light);
}

.select-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  background-color: var(--bg-white);
}

.select-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* Last update */
.last-update {
  font-size: 13px;
  color: var(--text-light);
}

/* Data grid container */
.data-grid-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: calc(100vh - 200px);
  margin-top: 20px;
}

/* Products table */
.products-table {
  height: 100%;
  width: 100%;
  min-height: 500px;
}

.products-dashboard:not(.show-controls) .data-grid-container {
  height: calc(100vh - 100px);
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

/* DevExtreme customization */
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

/* Product image */
.product-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

/* Price display */
.price-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price-original {
  font-size: 12px;
  color: var(--text-light);
  text-decoration: line-through;
}

.price-value {
  font-weight: 600;
  color: var(--text-color);
}

/* Discount badge */
.discount-badge {
  display: inline-block;
  padding: 2px 8px;
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* Categories list */
.categories-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.category-badge {
  display: inline-block;
  padding: 2px 8px;
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
  border-radius: 12px;
  font-size: 11px;
  white-space: nowrap;
}

/* Action buttons */
.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
  background-color: var(--bg-white);
  color: var(--text-color);
}

.btn-action:hover {
  background-color: var(--bg-light);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-action .icon {
  width: 14px;
  height: 14px;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.status-inactive {
  background-color: rgba(107, 114, 128, 0.1);
  color: var(--text-light);
}

.status-sale {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
}

/* Product modal */
.product-modal-overlay {
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

.product-modal {
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

.product-modal-header {
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

.product-modal-header h2 {
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

.product-modal-content {
  padding: 20px;
  overflow-y: auto;
}

/* Product sections */
.product-section {
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.product-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  padding: 12px 16px;
  background-color: var(--bg-light);
  border-bottom: 1px solid var(--border-color);
}

/* Product header section */
.product-header-section {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.product-images {
  flex: 1;
  min-width: 300px;
  padding: 16px;
}

.main-image-container {
  margin-bottom: 16px;
  text-align: center;
}

.main-image {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.thumbnail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.thumbnail-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.thumbnail-image:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.thumbnail-image.active {
  border: 2px solid var(--primary-color);
}

.product-summary {
  flex: 1;
  min-width: 300px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-info-item {
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

/* Product description */
.product-description {
  padding: 16px;
}

.short-description {
  font-weight: 500;
  margin-bottom: 16px;
}

.long-description {
  font-size: 14px;
  line-height: 1.6;
}

/* SEO info */
.seo-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Additional info */
.additional-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

/* Responsive */
@media (max-width: 768px) {
  .product-header-section {
    flex-direction: column;
  }
  
  .product-images, 
  .product-summary {
    width: 100%;
  }
  
  .controls-panel {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .controls-left {
    width: 100%;
  }
  
  .filter-controls {
    margin-top: 10px;
  }
  
  .product-modal {
    width: 95%;
    max-height: 95vh;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .data-grid-container {
    height: calc(100vh - 250px);
  }
  
  .products-dashboard:not(.show-controls) .data-grid-container {
    height: calc(100vh - 120px);
  }
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
</style>