<template>
  <AppLayout>
    <div class="fio-dashboard">
      <!-- Loading overlay - only show for initial load -->
      <div v-if="isLoading && currentDay === 1" class="loading-container">
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
          ref="dataGrid"
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
          <DxPaging :enabled="false" />
          <!-- Import Status column (always visible) -->
          <DxColumn 
            data-field="status" 
            caption="Status" 
            width="60" 
            alignment="center"
            cell-template="statusTemplate"
          />
          
          <DxColumn data-field="id" caption="ID" width="100" alignment="center" />
          <DxColumn data-field="date" caption="Date" data-type="date" sort-order="desc" :sort-index="0" width="120" alignment="center" />
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

          <!-- Añadimos una columna especial para el loadMoreTrigger -->
          <DxColumn
            :visible="false"
            cell-template="loadMoreTemplate"
            :fixed="true"
            :width="0"
          />
          
          <template #loadMoreTemplate="{ rowIndex }">
            <div 
              v-if="rowIndex === transactions.length - 1" 
              ref="loadMoreTrigger" 
              class="load-more-trigger"
            ></div>
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
  DxSelection,
  DxPaging
} from "devextreme-vue/data-grid";

// Constantes para localStorage
const STORAGE_KEY_CONTROL_PANEL = 'fio-transactions-control-panel';
const STORAGE_KEY_IMPORT_SUMMARY = 'fio-transactions-import-summary';
const STORAGE_KEY_ACCOUNT_INFO = 'fio-transactions-account-info';

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
      transactions: [],
      importSummary: null,
      accountInfo: null,
      lastUpdated: "",
      maxDays: 90, // Maximum days to fetch
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
      debug: true, // Habilitar debug info para diagnóstico
    };
  },
  methods: {
    // Toggle control panel visibility y guardar estado
    toggleControlPanel() {
      this.showControlPanel = !this.showControlPanel;
      localStorage.setItem(STORAGE_KEY_CONTROL_PANEL, this.showControlPanel);
    },
    
    // Toggle import summary visibility y guardar estado
    toggleImportSummary() {
      this.showImportSummary = !this.showImportSummary;
      localStorage.setItem(STORAGE_KEY_IMPORT_SUMMARY, this.showImportSummary);
    },
    
    // Toggle account info visibility y guardar estado
    toggleAccountInfo() {
      this.showAccountInfo = !this.showAccountInfo;
      localStorage.setItem(STORAGE_KEY_ACCOUNT_INFO, this.showAccountInfo);
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
    
    // Function to create a delay using Promise
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    async loadNextDay(retryCount = 0) {
      const API_TIMEOUT = 5000; // Aumentado a 5 segundos
      const MAX_RETRIES = 3;
      
      if (this.isLoading || this.loadingMore || this.allDataLoaded) return;

      const dayToFetch = this.currentDay + 1;

      if (this.maxDays && dayToFetch > this.maxDays) {
        this.allDataLoaded = true;
        console.log("✅ Reached maxDays limit, stopping.");
        return;
      }

      if (this.currentDay === 0) this.isLoading = true;
      else this.loadingMore = true;

      try {
        // Esperar antes del fetch para evitar sobrecarga
        await this.delay(500);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        const response = await fetch(`${this.apiUrl}/import-fio-days/${dayToFetch}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`API error: ${response.statusText}`);

        const data = await response.json();
        const transactionsData = this.extractTransactionsFromResponse(data);

        if (this.currentDay === 0) {
          if (data.importSummary) this.importSummary = data.importSummary;
          if (data.accountInfo) this.accountInfo = data.accountInfo;
        }

        if (data.detailedTransactions) {
          this.detailedTransactions = data.detailedTransactions;
        }

        if (transactionsData?.length > 0) {
          const newTransactions = this.mapTransactionsToDataGrid(transactionsData);
          this.transactions = [...this.transactions, ...newTransactions];
          this.updateLastUpdatedTime();
          this.currentDay = dayToFetch;
          console.log(`📦 Day ${this.currentDay}: ${newTransactions.length} transactions loaded.`);
          
          // Configurar el observer para el nuevo elemento de carga
          this.$nextTick(() => {
            this.setupIntersectionObserver();
          });
        } else {
          console.log(`📭 Day ${dayToFetch} has no transactions. Loading next day...`);
          this.currentDay = dayToFetch;
          
          // Si no hay transacciones, intentamos cargar el siguiente día automáticamente
          // pero con un pequeño retraso para evitar sobrecarga
          setTimeout(() => {
            this.loadNextDay();
          }, 500);
        }

        // Solo marcamos como completado si llegamos al máximo de días
        if (this.currentDay >= this.maxDays) {
          this.allDataLoaded = true;
          console.log("✅ Reached maxDays limit, stopping.");
        }

      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`Request timed out (${API_TIMEOUT/1000}s), retrying... [attempt ${retryCount + 1}]`);
          if (retryCount < MAX_RETRIES) {
            console.warn(`🔁 Retry ${retryCount + 1} for day ${dayToFetch}`);
            return this.loadNextDay(retryCount + 1);
          } else {
            this.errorMessage = 'API request timed out multiple times.';
          }
        } else {
          console.error('API error:', error);
          this.errorMessage = `Error loading data: ${error.message}`;
        }
      } finally {
        if (this.currentDay === 1) this.isLoading = false;
        else this.loadingMore = false;
      }
    },

    // Extract transactions from the API response
    extractTransactionsFromResponse(data) {
      console.log("Extracting transactions from response. Available keys:", Object.keys(data));
      
      // 1. Check in detailedTransactions.allTransactions
      if (
        data.detailedTransactions &&
        Array.isArray(data.detailedTransactions.allTransactions) &&
        data.detailedTransactions.allTransactions.length > 0
      ) {
        console.log("✅ Found transactions in detailedTransactions.allTransactions");
        return data.detailedTransactions.allTransactions;
      }

      // 2. Check in allTransactions
      if (Array.isArray(data.allTransactions) && data.allTransactions.length > 0) {
        console.log("✅ Found transactions in allTransactions");
        return data.allTransactions;
      }

      // 3. Check in transactions
      if (Array.isArray(data.transactions) && data.transactions.length > 0) {
        console.log("✅ Found transactions in transactions");
        return data.transactions;
      }

      // 4. Reconstruct from detailedTransactions.successful/failed/duplicates
      if (data.detailedTransactions &&
        (Array.isArray(data.detailedTransactions.successful) ||
         Array.isArray(data.detailedTransactions.failed) ||
         Array.isArray(data.detailedTransactions.duplicates))) {

        console.log("🛠 Reconstructing transactions from detailedTransactions");

        const allTransactions = [];

        const pushTx = (list, status) => {
          (data.detailedTransactions[list] || []).forEach(tx => {
            if (tx.idFio) {
              allTransactions.push({
                ...tx,
                imported: status === 'success'
              });
            }
          });
        };

        pushTx('successful', 'success');
        pushTx('failed', 'error');
        pushTx('duplicates', 'already-imported');

        if (allTransactions.length > 0) return allTransactions;
      }

      // 5. Fallback: root-level array with transaction-like objects
      const possibleTransactions = Object.values(data).find(
        value => Array.isArray(value) && value.length > 0 && (value[0].idFio || value[0].transactionId)
      );

      if (possibleTransactions) {
        console.log("⚠️ Fallback: Found array of transactions in root object");
        return possibleTransactions;
      }

      // 6. FINAL fallback: transactionDetails
      if (
        data.transactionDetails &&
        Array.isArray(data.transactionDetails) &&
        data.transactionDetails.length > 0
      ) {
        console.log("❗ Final fallback: using transactionDetails (likely incomplete)");
        return data.transactionDetails;
      }

      console.log("❌ No transactions found in the response");
      return null;
    },

    // Helper method to get a value from a transaction field or raw data
    getValue(tx, path, defaultValue = '') {
      // Función auxiliar para extraer valores de columnas raw
      const getColumnValue = (column) => {
        if (!column) return null;
        if (Array.isArray(column) && column.length > 0 && column[0]._) {
          return column[0]._;
        }
        return null;
      };
      
      // Primero intentamos obtener el valor directamente del objeto
      if (tx[path] !== undefined && tx[path] !== null) {
        return tx[path];
      }
      
      // Si hay datos raw, intentamos extraer de ahí
      if (tx.raw) {
        // Intentar obtener de columnas numeradas (column_0, column_1, etc.)
        const columnMatch = path.match(/^column_(\d+)$/);
        if (columnMatch) {
          const columnIndex = parseInt(columnMatch[1]);
          const columnKey = `column_${columnIndex}`;
          const value = getColumnValue(tx.raw[columnKey]);
          if (value !== null) return value;
        }
        
        // Intentar obtener de propiedades específicas en raw
        if (tx.raw[path] !== undefined) {
          const value = getColumnValue(tx.raw[path]);
          if (value !== null) return value;
        }
      }
      
      return defaultValue;
    },

    // Get transaction status
    getTransactionStatus(tx) {
      if (!this.detailedTransactions) return 'unknown';
      
      const match = (list) =>
        Array.isArray(this.detailedTransactions[list]) &&
        this.detailedTransactions[list].some(t => t.idFio === tx.idFio);
      
      if (match('successful')) return 'success';
      if (match('failed')) return 'error';
      if (match('duplicates')) return 'already-imported';
      if (tx.imported === true) return 'success';
      return 'unknown';
    },

    // Map transactions to DataGrid format
    mapTransactionsToDataGrid(transactions) {
      console.log("Mapping transactions to DataGrid format. Sample transaction:", transactions[0]);
      
      // Asegurarnos de que cada transacción tenga un ID único
      const usedIds = new Set();
      
      return transactions.map((tx, index) => {
        // Generar un ID único si no existe o está duplicado
        let id = tx.idFio || tx.transactionId || tx.id || tx.statementNumber;
        
        // Si el ID ya existe o no hay ID, generar uno único
        if (!id || usedIds.has(id)) {
          id = `tx-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
        }
        
        usedIds.add(id);
        
        // Determinar los campos de la transacción
        const mappedTransaction = {
          id: id,
          date: tx.transactionDate || tx.date || this.getValue(tx, 'column_0') || '',
          amount: tx.amount || this.getValue(tx, 'column_1') || '',
          currency: tx.currency || this.getValue(tx, 'column_14') || '',
          counterAccount: tx.counterAccount || tx.counterPartyAccount || this.getValue(tx, 'column_2') || '',
          counterName: tx.counterAccountName || tx.counterPartyName || this.getValue(tx, 'column_10') || '',
          bankCode: tx.bankCode || this.getValue(tx, 'column_3') || '',
          bankName: tx.bankName || this.getValue(tx, 'column_12') || '',
          constantSymbol: tx.constantSymbol || tx.ks || this.getValue(tx, 'column_4') || '',
          variableSymbol: tx.variableSymbol || tx.vs || this.getValue(tx, 'column_5') || '',
          specificSymbol: tx.specificSymbol || tx.ss || this.getValue(tx, 'column_6') || '',
          userId: tx.userIdentification || tx.userId || this.getValue(tx, 'column_7') || '',
          message: tx.messageForRecipient || tx.message || this.getValue(tx, 'column_16') || '',
          type: tx.transactionType || tx.type || this.getValue(tx, 'column_8') || '',
          comment: tx.comment || tx.note || this.getValue(tx, 'column_25') || '',
          paymentOrderId: tx.instructionId || tx.paymentOrderId || this.getValue(tx, 'column_17') || '',
          status: this.getTransactionStatus(tx),
          executor: tx.executedBy || tx.executor || this.getValue(tx, 'column_9') || '',
          raw: tx.raw || tx
        };
        
        return mappedTransaction;
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
          if (entry.isIntersecting && !this.isLoading && !this.loadingMore && !this.allDataLoaded) {
            console.log("Intersection observer triggered, loading next day");
            this.loadNextDay();
          }
        });
      }, {
        root: null, // Use the viewport
        rootMargin: '400px', // Trigger when 400px from the bottom
        threshold: 0.1 // Trigger when 10% of the target is visible
      });
      
      // Observe the load more trigger element
      const loadMoreTrigger = this.$refs.loadMoreTrigger;
      if (loadMoreTrigger) {
        this.observer.observe(loadMoreTrigger);
        console.log("✅ Observer set on load more trigger element");
      } else {
        console.warn("⚠️ Load more trigger element not found");
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
    
    // Método para configurar el listener de scroll en el contenedor de DataGrid
    setupGridScrollListener() {
      this.$nextTick(() => {
        setTimeout(() => {
          const gridContent = this.$el.querySelector('.dx-scrollable-container');
          if (gridContent) {
            console.log('Setting up scroll listener on grid container');
            gridContent.addEventListener('scroll', () => {
              const nearBottom = gridContent.scrollTop + gridContent.clientHeight >= gridContent.scrollHeight - 50;
              if (nearBottom && !this.isLoading && !this.loadingMore && !this.allDataLoaded) {
                console.log("Grid scroll listener triggered, loading next day");
                this.loadNextDay();
              }
            });
          } else {
            console.warn('No grid content found for scroll listener');
          }
        }, 1000); // Dar tiempo a que se renderice el grid
      });
    },
    
    // Cargar estados guardados de los paneles
    loadSavedPanelStates() {
      // Cargar estado del panel de control
      const controlPanelState = localStorage.getItem(STORAGE_KEY_CONTROL_PANEL);
      if (controlPanelState !== null) {
        this.showControlPanel = controlPanelState === 'true';
      }
      
      // Cargar estado del panel de resumen de importación
      const importSummaryState = localStorage.getItem(STORAGE_KEY_IMPORT_SUMMARY);
      if (importSummaryState !== null) {
        this.showImportSummary = importSummaryState === 'true';
      }
      
      // Cargar estado del panel de información de cuenta
      const accountInfoState = localStorage.getItem(STORAGE_KEY_ACCOUNT_INFO);
      if (accountInfoState !== null) {
        this.showAccountInfo = accountInfoState === 'true';
      }
    }
  },
  mounted() {
    console.log("Component mounted");
    
    // Cargar estados guardados de los paneles
    this.loadSavedPanelStates();
    
    // Start loading data
    this.fetchFirstDay();
    
    // Set up the intersection observer for infinite scrolling
    this.setupIntersectionObserver();
    
    // Configurar el listener de scroll como plan B
    this.setupGridScrollListener();
  },
  
  beforeDestroy() {
    console.log("Component being destroyed");
    // Clean up
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Remove scroll event listener from grid container
    const gridContent = this.$el.querySelector('.dx-scrollable-container');
    if (gridContent) {
      gridContent.removeEventListener('scroll', this.handleScroll);
    }
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

/* Debug info */
.debug-info {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: monospace;
  font-size: 14px;
}

.debug-info h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #334155;
}

.debug-info p {
  margin: 4px 0;
  color: #475569;
}

/* Data grid container */
.data-grid-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 400px;
  height: auto;
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
.dx-datagrid {
  background-color: var(--bg-white);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.dx-datagrid-headers {
  background-color: var(--bg-light);
  color: var(--text-color);
  font-weight: 600;
}

.dx-datagrid-rowsview {
  border-top: 1px solid var(--border-color);
}

.dx-datagrid-headers .dx-datagrid-table .dx-row > td {
  padding: 12px 16px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dx-datagrid-rowsview .dx-row > td {
  padding: 12px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--border-color);
}

.dx-datagrid-rowsview .dx-row:hover {
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

/* Load more trigger element - invisible but used for intersection observer */
.load-more-trigger {
  height: 20px;
  width: 100%;
  margin-top: 10px;
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