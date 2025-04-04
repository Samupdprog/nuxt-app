<template>
  <AppLayout>
    <div class="fio-dashboard">
      <!-- Loading overlay -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading transactions...</p>
      </div>
      
      <!-- Error message -->
      <div v-if="errorMessage" class="error-toast toast toast-error show">
        <p>{{ errorMessage }}</p>
        <button class="close-btn" @click="errorMessage = ''">&times;</button>
      </div>
      
      <div class="page-header">
        <div class="header-row">
          <h1 class="page-title">Fio Transactions</h1>
          <button @click="toggleControlPanel" class="btn-toggle-controls">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 15l-6-6-6 6" v-if="showControlPanel"/>
              <path d="M6 9l6 6 6-6" v-else/>
            </svg>
            {{ showControlPanel ? 'Hide Controls' : 'Show Controls' }}
          </button>
        </div>
        
        <!-- Controls Panel -->
        <div v-if="showControlPanel" class="controls-panel">
          <div class="controls-left">
            <!-- Execute 1 day button -->
            <button @click="fetchFirstDay" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Reset & Load Data
            </button>
            
            <!-- Custom days input -->
            <div class="custom-days">
              <span>Max days</span>
              <input 
                type="number" 
                v-model="maxDays" 
                min="1" 
                max="90" 
                placeholder="days" 
                class="input-number"
                aria-label="Maximum number of days"
              />
              <span>days</span>
            </div>
          </div>
          
          <div class="last-update">
            Last update: {{ lastUpdated }}
          </div>
        </div>
      </div>
      
      <!-- Debug info -->
      <div v-if="debug" class="debug-info">
        <p>Current Day: {{ currentDay }}</p>
        <p>Loading: {{ isLoading }}</p>
        <p>Loading More: {{ loadingMore }}</p>
        <p>All Data Loaded: {{ allDataLoaded }}</p>
        <p>Transactions Count: {{ transactions.length }}</p>
      </div>
      
      <!-- Import Summary Section -->
      <div v-if="importSummary" class="import-summary-container">
        <div class="import-summary-header" @click="toggleImportSummary">
          <h2>Import Summary</h2>
          <button class="btn-toggle-info">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 15l-6-6-6 6" v-if="showImportSummary"/>
              <path d="M6 9l6 6 6-6" v-else/>
            </svg>
          </button>
        </div>
        <div v-if="showImportSummary" class="import-summary-content">
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Timestamp:</span>
              <span class="summary-value">{{ formatDateTime(importSummary.timestamp) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Days Back:</span>
              <span class="summary-value">{{ importSummary.daysBack }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Date Range:</span>
              <span class="summary-value">{{ formatDate(importSummary.dateRange?.from) }} - {{ formatDate(importSummary.dateRange?.to) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Successful Transactions:</span>
              <span class="summary-value success">{{ importSummary.transactions?.successful }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Failed Transactions:</span>
              <span class="summary-value error">{{ importSummary.transactions?.failed }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Duplicate Transactions:</span>
              <span class="summary-value warning">{{ importSummary.transactions?.duplicates }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Total Transactions:</span>
              <span class="summary-value">{{ importSummary.transactions?.total }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Info Section -->
      <div v-if="accountInfo" class="account-info-container">
        <div class="account-info-header" @click="toggleAccountInfo">
          <h2>Account Information</h2>
          <button class="btn-toggle-info">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 15l-6-6-6 6" v-if="showAccountInfo"/>
              <path d="M6 9l6 6 6-6" v-else/>
            </svg>
          </button>
        </div>
        <div v-if="showAccountInfo" class="account-info-content">
          <div class="info-item">
            <span class="info-label">Account:</span>
            <span class="info-value">{{ getAccountInfoValue(accountInfo.accountId) }}/{{ getAccountInfoValue(accountInfo.bankId) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">IBAN:</span>
            <span class="info-value">{{ getAccountInfoValue(accountInfo.iban) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Currency:</span>
            <span class="info-value">{{ getAccountInfoValue(accountInfo.currency) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Period:</span>
            <span class="info-value">{{ formatDateDisplay(getAccountInfoValue(accountInfo.dateStart)) }} - {{ formatDateDisplay(getAccountInfoValue(accountInfo.dateEnd)) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Opening Balance:</span>
            <span class="info-value">{{ getAccountInfoValue(accountInfo.openingBalance) }} {{ getAccountInfoValue(accountInfo.currency) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Closing Balance:</span>
            <span class="info-value">{{ getAccountInfoValue(accountInfo.closingBalance) }} {{ getAccountInfoValue(accountInfo.currency) }}</span>
          </div>
        </div>
      </div>

      <!-- DataGrid -->
      <div class="data-grid-container" ref="gridContainer">
        <DxDataGrid
          :data-source="transactions"
          :show-borders="true"
          key-expr="id"
          class="transactions-table"
          :allow-column-reordering="true"
          :allow-column-resizing="true"
          :row-alternation-enabled="true"
          @row-click="onRowClick"
          :no-data-text="'No transactions found'"
        >
          <!-- Import Status column (always visible) -->
          <DxColumn 
            data-field="status" 
            caption="Status" 
            width="60" 
            alignment="center"
            cell-template="statusTemplate"
          />
          
          <DxColumn data-field="id" caption="ID" width="100" alignment="center" />
          <DxColumn data-field="date" caption="Date" data-type="date" width="120" alignment="center" />
          <DxColumn data-field="amount" caption="Amount" width="100" alignment="right" cell-template="amountTemplate" />
          <DxColumn data-field="currency" caption="Currency" width="80" alignment="center" />
          <DxColumn data-field="counterAccount" caption="Counter Account" width="140" alignment="center" />
          <DxColumn data-field="counterName" caption="Counter Name" width="200" alignment="left" />
          <DxColumn data-field="bankCode" caption="Bank Code" width="100" alignment="center" />
          <DxColumn data-field="bankName" caption="Bank Name" width="200" alignment="left" />
          <DxColumn data-field="constantSymbol" caption="KS" width="80" alignment="center" />
          <DxColumn data-field="variableSymbol" caption="VS" width="100" alignment="center" />
          <DxColumn data-field="userId" caption="User ID" width="200" alignment="left" />
          <DxColumn data-field="type" caption="Type" width="150" alignment="center" />
          <DxColumn data-field="comment" caption="Comment" width="250" alignment="left" />
          <DxColumn data-field="paymentOrderId" caption="Payment Order ID" width="150" alignment="center" />

          <template #amountTemplate="{ data }">
            <span :class="{'positive': parseFloat(data.value) > 0, 'negative': parseFloat(data.value) < 0}">
              {{ data.value }} {{ data.data.currency }}
            </span>
          </template>
          
          <!-- Status indicator template -->
          <template #statusTemplate="{ data }">
            <div class="status-indicator-container">
              <div :class="['status-indicator', data.value || 'unknown']" :title="getStatusTitle(data.value)"></div>
            </div>
          </template>

          <DxFilterRow :visible="true" />
          <DxHeaderFilter :visible="true" />
          <DxSearchPanel :visible="true" :highlight-case-sensitive="false" />
          <DxColumnChooser :enabled="true" />
          <DxSelection mode="multiple" />
        </DxDataGrid>
      </div>
      
      <!-- Infinite scroll loading indicator -->
      <div v-if="loadingMore" class="lazy-load-indicator">
        <div class="loading-spinner-small"></div>
        <span>Loading more transactions...</span>
      </div>

      <div v-if="allDataLoaded && transactions.length > 0" class="all-data-loaded">
        <span>All transactions loaded</span>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import {
  DxDataGrid,
  DxColumn,
  DxFilterRow,
  DxHeaderFilter,
  DxSearchPanel,
  DxColumnChooser,
  DxSelection
} from "devextreme-vue/data-grid";

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
      transactions: [],
      importSummary: null,
      accountInfo: null,
      lastUpdated: "",
      maxDays: 3, // Maximum days to fetch (default 3 as per requirements)
      isLoading: false,
      errorMessage: "",
      apiUrl: "http://35.180.124.4:1880", // Base API URL
      showControlPanel: true, // Control panel visibility
      showImportSummary: true, // Import summary visibility
      showAccountInfo: true, // Account info visibility
      detailedTransactions: null, // Store detailed transactions for status determination
      currentDay: 0, // Current day being fetched (0 means no data fetched yet)
      loadingMore: false, // Flag to indicate if more data is being loaded
      allDataLoaded: false, // Flag to indicate if all data has been loaded
      observer: null, // Intersection observer for infinite scrolling
      debug: true, // Enable debug info
    };
  },
  methods: {
    // Toggle control panel visibility
    toggleControlPanel() {
      this.showControlPanel = !this.showControlPanel;
    },
    
    // Toggle import summary visibility
    toggleImportSummary() {
      this.showImportSummary = !this.showImportSummary;
    },
    
    // Toggle account info visibility
    toggleAccountInfo() {
      this.showAccountInfo = !this.showAccountInfo;
    },
    
    // Helper to get account info value (handles array or direct value)
    getAccountInfoValue(value) {
      if (Array.isArray(value)) {
        return value[0] || '';
      }
      return value || '';
    },
    
    // Row click handler - redirects to transaction details page
    onRowClick(e) {
      // Store transaction data in localStorage to access it on the details page
      localStorage.setItem('selectedTransaction', JSON.stringify(e.data));
      
      // Navigate to transaction details page
      this.$router.push({
        path: `/fio/transaction/${e.data.id}`,
        query: { 
          status: e.data.status,
          date: e.data.date
        }
      });
    },
    
    // Get status title based on status value
    getStatusTitle(status) {
      if (!status) return 'Not imported';
      
      const titles = {
        'success': 'Successfully imported',
        'warning': 'Imported with warnings',
        'error': 'Import failed',
        'already-imported': 'Already imported to Pohoda',
        'unknown': 'Unknown status'
      };
      return titles[status.toLowerCase()] || 'Unknown status';
    },
    
    // Format date (remove timezone part)
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    
    // Format date and time
    formatDateTime(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString();
    },
    
    // Format date for display
    formatDateDisplay(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString.split('+')[0]);
      return date.toLocaleDateString();
    },
    
    // Reset and start fetching data from day 1
    fetchFirstDay() {
      console.log("Resetting and fetching first day data");
      this.transactions = [];
      this.currentDay = 0;
      this.allDataLoaded = false;
      this.isLoading = false; // Reset loading state
      this.loadingMore = false; // Reset loading more state
      this.loadNextDay();
    },
    
    // Función para crear un retraso (delay) usando Promise
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Load the next day of data
    async loadNextDay() {
      if (this.loadingMore || this.allDataLoaded) {
        console.log("Skipping loadNextDay - already loading or all data loaded");
        return;
      }
      
      // Increment the current day
      this.currentDay++;
      console.log(`Starting to load data for day ${this.currentDay}`);
      
      // Check if we've reached the maximum days
      if (this.currentDay > this.maxDays) {
        console.log(`Reached maximum days (${this.maxDays}), marking all data as loaded`);
        this.allDataLoaded = true;
        return;
      }
      
      // Set loading state
      if (this.currentDay === 1) {
        console.log("Setting isLoading to true for first day");
        this.isLoading = true;
      } else {
        console.log("Setting loadingMore to true for subsequent days");
        this.loadingMore = true;
      }
      
      try {
        console.log(`Waiting 1 second before fetching data for day ${this.currentDay}`);
        // Esperar 1 segundo antes de hacer la petición
        await this.delay(1000);
        
        console.log(`Fetching data for day ${this.currentDay}`);
        
        // Fetch data for the current day
        const endpoint = `${this.apiUrl}/import-fio-days/${this.currentDay}`;
        console.log(`API endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Received data for day ${this.currentDay}. Response structure:`, Object.keys(data));
        
        // Process import summary and account info only for the first day
        if (this.currentDay === 1) {
          if (data.importSummary) {
            console.log("Setting import summary", data.importSummary);
            this.importSummary = data.importSummary;
          }
          
          if (data.accountInfo) {
            console.log("Setting account info", data.accountInfo);
            this.accountInfo = data.accountInfo;
          }
        }
        
        // Store detailed transactions for status determination
        if (data.detailedTransactions) {
          console.log("Setting detailed transactions", data.detailedTransactions);
          this.detailedTransactions = data.detailedTransactions;
        }
        
        // Extract transactions from the response
        const transactionsData = this.extractTransactionsFromResponse(data);
        
        if (transactionsData && transactionsData.length > 0) {
          console.log(`Found ${transactionsData.length} transactions for day ${this.currentDay}`);
          
          // Map transactions to the format expected by the DataGrid
          const newTransactions = this.mapTransactionsToDataGrid(transactionsData);
          
          // Append new transactions to existing ones
          this.transactions = [...this.transactions, ...newTransactions];
          console.log(`Total transactions after adding day ${this.currentDay}: ${this.transactions.length}`);
          
          // Update last updated time
          this.updateLastUpdatedTime();
        } else {
          console.log(`No transactions found for day ${this.currentDay}`);
        }
        
        // If we've reached the maximum days, mark as all data loaded
        if (this.currentDay >= this.maxDays) {
          console.log(`Reached maximum days (${this.maxDays}), marking all data as loaded`);
          this.allDataLoaded = true;
        }
      } catch (error) {
        console.error(`Error fetching transactions for day ${this.currentDay}:`, error);
        this.errorMessage = `Error loading data: ${error.message}`;
      } finally {
        // Reset loading states
        if (this.currentDay === 1) {
          console.log("Setting isLoading to false for first day");
          this.isLoading = false;
        } else {
          console.log("Setting loadingMore to false for subsequent days");
          this.loadingMore = false;
        }
      }
    },

    // Extract transactions from the API response
    extractTransactionsFromResponse(data) {
      console.log("Extracting transactions from response. Available keys:", Object.keys(data));
      
      // 0. Verificar en data.transactionDetails (nuevo)
      if (
        data.transactionDetails &&
        Array.isArray(data.transactionDetails) &&
        data.transactionDetails.length > 0
      ) {
        console.log(`Found ${data.transactionDetails.length} transactions in data.transactionDetails`);
        return data.transactionDetails;
      }

      // 1. Check in data.detailedTransactions.allTransactions
      if (
        data.detailedTransactions && 
        data.detailedTransactions.allTransactions && 
        Array.isArray(data.detailedTransactions.allTransactions) && 
        data.detailedTransactions.allTransactions.length > 0
      ) {
        console.log("Found transactions in data.detailedTransactions.allTransactions");
        return data.detailedTransactions.allTransactions;
      } 
      // 2. Check in data.allTransactions
      else if (data.allTransactions && Array.isArray(data.allTransactions) && data.allTransactions.length > 0) {
        console.log("Found transactions in data.allTransactions");
        return data.allTransactions;
      } 
      // 3. Check in data.transactions
      else if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
        console.log("Found transactions in data.transactions");
        return data.transactions;
      } 
      // 4. Reconstruct from successful, failed, duplicates
      else if (data.detailedTransactions && 
              (data.detailedTransactions.successful || 
               data.detailedTransactions.failed || 
               data.detailedTransactions.duplicates)) {
        console.log("Reconstructing transactions from successful/failed/duplicates lists");
        const allTransactions = [];
        
        // Add successful transactions
        if (Array.isArray(data.detailedTransactions.successful)) {
          data.detailedTransactions.successful.forEach(tx => {
            if (tx.idFio) {
              allTransactions.push({
                idFio: tx.idFio,
                statementNumber: tx.statementNumber,
                imported: true
              });
            }
          });
        }
        
        // Add failed transactions
        if (Array.isArray(data.detailedTransactions.failed)) {
          data.detailedTransactions.failed.forEach(tx => {
            if (tx.idFio) {
              allTransactions.push({
                idFio: tx.idFio,
                statementNumber: tx.statementNumber,
                imported: false
              });
            }
          });
        }
        
        // Add duplicate transactions
        if (Array.isArray(data.detailedTransactions.duplicates)) {
          data.detailedTransactions.duplicates.forEach(tx => {
            if (tx.idFio) {
              allTransactions.push({
                idFio: tx.idFio,
                statementNumber: tx.statementNumber,
                imported: false
              });
            }
          });
        }
        
        if (allTransactions.length > 0) {
          return allTransactions;
        }
      } 
      // 5. Check if transactions might be in the root of the response
      else {
        console.log("Searching for transactions in the root of the response");
        // Log all keys in the response to help debug
        console.log("Response keys:", Object.keys(data));
        
        const possibleTransactions = Object.values(data).find(
          value => Array.isArray(value) && value.length > 0 && value[0] && (value[0].idFio || value[0].transactionId)
        );
        
        if (possibleTransactions) {
          console.log("Found transactions in root of response");
          return possibleTransactions;
        }
      }
      
      console.log("No transactions found in the response");
      return null;
    },

    // Map transactions to DataGrid format
    mapTransactionsToDataGrid(transactions) {
      console.log("Mapping transactions to DataGrid format. Sample transaction:", transactions[0]);
      
      return transactions.map(tx => {
        // Determine status based on transaction properties and detailedTransactions
        let status = 'unknown';
        
        // Check if the transaction is in the successful list
        if (this.detailedTransactions && 
            this.detailedTransactions.successful && 
            this.detailedTransactions.successful.some(item => item.idFio === tx.idFio)) {
          status = 'success';
        } 
        // Check if it's in the failed list
        else if (this.detailedTransactions && 
                this.detailedTransactions.failed && 
                this.detailedTransactions.failed.some(item => item.idFio === tx.idFio)) {
          status = 'error';
        } 
        // Check if it's in the duplicates list
        else if (this.detailedTransactions && 
                this.detailedTransactions.duplicates && 
                this.detailedTransactions.duplicates.some(item => item.idFio === tx.idFio)) {
          status = 'already-imported';
        }
        // If imported flag is true but not in any detailed list
        else if (tx.imported === true) {
          status = 'success';
        }
        
        // Create a transaction object with all possible fields
        // Verificar todos los posibles nombres de campos
        return {
          id: tx.idFio || tx.transactionId || tx.id || '',
          date: tx.transactionDate || tx.date || '',
          amount: tx.amount || '',
          currency: tx.currency || '',
          counterAccount: tx.counterAccount || tx.counterPartyAccount || '',
          counterName: tx.counterAccountName || tx.counterPartyName || '',
          bankCode: tx.bankCode || '',
          bankName: tx.bankName || '',
          constantSymbol: tx.constantSymbol || tx.ks || '',
          variableSymbol: tx.variableSymbol || tx.vs || '',
          specificSymbol: tx.specificSymbol || tx.ss || '',
          userId: tx.userIdentification || tx.userId || '',
          message: tx.messageForRecipient || tx.message || '',
          type: tx.transactionType || tx.type || '',
          comment: tx.comment || tx.note || '',
          paymentOrderId: tx.instructionId || tx.paymentOrderId || '',
          status: status,
          executor: tx.executedBy || tx.executor || '',
          raw: tx.raw || null
        };
      });
    },
    
    // Set up intersection observer for infinite scrolling
    setupIntersectionObserver() {
      // Disconnect any existing observer
      if (this.observer) {
        this.observer.disconnect();
      }
      
      // Create a new intersection observer
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.loadingMore && !this.allDataLoaded) {
            console.log("Intersection observer triggered, loading next day");
            this.loadNextDay();
          }
        });
      }, {
        root: null, // Use the viewport
        rootMargin: '100px', // Load more when within 100px of the bottom
        threshold: 0.1 // Trigger when 10% of the target is visible
      });
      
      // Observe the grid container
      if (this.$refs.gridContainer) {
        this.observer.observe(this.$refs.gridContainer);
        console.log('Intersection observer set up');
      } else {
        console.warn('No grid container found for intersection observer');
      }
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
    
    // Additional method for scroll event handling (fallback for intersection observer)
    handleScroll() {
      if (this.loadingMore || this.allDataLoaded) return;
      
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.offsetHeight;
      
      // Load more data when user scrolls to the bottom of the page
      if (scrollPosition >= documentHeight - 200) {
        console.log("Scroll event triggered, loading next day");
        this.loadNextDay();
      }
    }
  },
  mounted() {
    console.log("Component mounted");
    // Start loading data
    this.fetchFirstDay();
    
    // Set up the intersection observer for infinite scrolling
    this.$nextTick(() => {
      this.setupIntersectionObserver();
    });
    
    // Add scroll event listener as a fallback for intersection observer
    window.addEventListener('scroll', this.handleScroll);
  },
  
  beforeDestroy() {
    console.log("Component being destroyed");
    // Clean up
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Remove scroll event listener
    window.removeEventListener('scroll', this.handleScroll);
  }
};
</script>

<style>
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --success-color: #10b981;
  --warning-color: #10b981; /* Green color as requested */
  --error-color: #ef4444;
  --already-imported-color: #3b82f6; /* Blue color for already imported status */
  --text-color: #1f2937;
  --text-light: #6b7280;
  --border-color: #e5e7eb;
  --bg-light: #f9fafb;
  --bg-white: #ffffff;
}

/* Debug info */
.debug-info {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
}

.debug-info p {
  margin: 5px 0;
}

/* General styles */
.fio-dashboard {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Header row with toggle button */
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
  background-color: var(--bg-light);
  padding: 16px;
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

/* Custom days input */
.custom-days {
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

/* Last update */
.last-update {
  font-size: 13px;
  color: var(--text-light);
}

/* Import Summary container with toggle */
.import-summary-container {
  margin-bottom: 20px;
  background-color: var(--bg-light);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.3s ease;
}

.import-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-light);
}

.import-summary-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--text-color);
}

.btn-toggle-info {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-toggle-info .icon {
  width: 18px;
  height: 18px;
}

.import-summary-content {
  padding: 16px;
  background-color: var(--bg-white);
  transition: all 0.3s ease;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: var(--text-light);
}

.summary-value {
  font-weight: 600;
  color: var(--text-color);
}

.summary-value.success {
  color: var(--success-color);
}

.summary-value.warning {
  color: var(--warning-color);
}

.summary-value.error {
  color: var(--error-color);
}

/* Account info with toggle */
.account-info-container {
  margin-bottom: 20px;
  background-color: var(--bg-light);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.3s ease;
}

.account-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-light);
}

.account-info-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--text-color);
}

.account-info-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background-color: var(--bg-white);
  transition: all 0.3s ease;
}

.info-item {
  flex: 1 1 200px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--text-light);
}

.info-value {
  font-weight: 600;
  color: var(--text-color);
}

/* Data grid container */
.data-grid-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 400px; /* Asegurar una altura mínima */
  height: 600px; /* Altura fija para pruebas */
}

/* Loading indicator */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1000;
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

/* Transactions table */
.transactions-table {
  height: 100%;
  width: 100%;
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

/* Status indicators */
.status-indicator-container {
  display: flex;
  align-items: center;
  justify-content: center;
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
  background-color: var(--warning-color);
}

.status-indicator.error {
  background-color: var(--error-color);
}

.status-indicator.already-imported {
  background-color: var(--already-imported-color);
}

.status-indicator.unknown {
  background-color: var(--text-light);
}

/* Positive and negative values */
.positive {
  color: var(--success-color);
  font-weight: 600;
}

.negative {
  color: var(--error-color);
  font-weight: 600;
}

/* Error toast */
.error-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  background-color: var(--bg-white);
  color: var(--text-color);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  font-size: 14px;
  max-width: 300px;
  z-index: 9999;
  border-left: 4px solid var(--error-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 18px;
  cursor: pointer;
  margin-left: 10px;
}

/* Lazy loading indicator */
.lazy-load-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: var(--bg-light);
  border-radius: 0 0 8px 8px;
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

.all-data-loaded {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: var(--bg-light);
  border-radius: 0 0 8px 8px;
  border-top: 1px solid var(--border-color);
  font-size: 14px;
  color: var(--text-light);
}

/* Responsive */
@media (max-width: 768px) {
  .controls-panel {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .controls-left {
    width: 100%;
  }
  
  .custom-days {
    margin-top: 10px;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>