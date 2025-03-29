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
            <!-- Query Type Selection -->
            <div class="query-type">
              <label class="radio-label">
                <input type="radio" value="info" v-model="queryType" class="radio-input" />
                <span class="radio-text">Info</span>
              </label>
              <label class="radio-label">
                <input type="radio" value="import" v-model="queryType" class="radio-input" />
                <span class="radio-text">Import</span>
              </label>
            </div>

            <!-- Execute 1 day button -->
            <button @click="fetchOneDay" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Execute 1 day
            </button>
            
            <!-- Custom days input -->
            <div class="custom-days">
              <span>Execute</span>
              <input 
                type="number" 
                v-model="customDays" 
                min="1" 
                max="90" 
                placeholder="days" 
                class="input-number"
                aria-label="Number of days"
              />
              <span>days</span>
              <button @click="fetchCustomDays" class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
                Execute
              </button>
            </div>
          </div>
          
          <div class="last-update">
            Last update: {{ lastUpdated }}
          </div>
        </div>
      </div>
      
      <!-- Account Info Summary with toggle -->
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
            <span class="info-value">{{ accountInfo.accountId }}/{{ accountInfo.bankId }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">IBAN:</span>
            <span class="info-value">{{ accountInfo.iban }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Currency:</span>
            <span class="info-value">{{ accountInfo.currency }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Period:</span>
            <span class="info-value">{{ formatDateDisplay(accountInfo.dateStart) }} - {{ formatDateDisplay(accountInfo.dateEnd) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Opening Balance:</span>
            <span class="info-value">{{ accountInfo.openingBalance }} {{ accountInfo.currency }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Closing Balance:</span>
            <span class="info-value">{{ accountInfo.closingBalance }} {{ accountInfo.currency }}</span>
          </div>
        </div>
      </div>

      <!-- DataGrid -->
      <div class="data-grid-container">
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
          <DxPaging :page-size="100" />
          <DxPager :show-page-size-selector="true" :allowed-page-sizes="[10, 20, 50, 100]" />
        </DxDataGrid>
      </div>
      
      <!-- Transaction details modal -->
      <div v-if="showTransactionDetails" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Transaction Details</h2>
            <button class="close-btn" @click="showTransactionDetails = false">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="transaction-section">
              <h3>Transaction Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Transaction ID:</span>
                  <span class="info-value">{{ selectedTransaction.id }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date:</span>
                  <span class="info-value">{{ selectedTransaction.date }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Amount:</span>
                  <span :class="['info-value', {'positive': parseFloat(selectedTransaction.amount) > 0, 'negative': parseFloat(selectedTransaction.amount) < 0}]">
                    {{ selectedTransaction.amount }} {{ selectedTransaction.currency }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Type:</span>
                  <span class="info-value">{{ selectedTransaction.type || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Import Status:</span>
                  <div class="status-with-indicator">
                    <div :class="['status-indicator', selectedTransaction.status || 'unknown']" :title="getStatusTitle(selectedTransaction.status)"></div>
                    <span class="info-value">{{ getStatusTitle(selectedTransaction.status) }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <span class="info-label">Payment Order ID:</span>
                  <span class="info-value">{{ selectedTransaction.paymentOrderId || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="transaction-section">
              <h3>Counter Party Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Counter Account:</span>
                  <span class="info-value">{{ selectedTransaction.counterAccount || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Counter Name:</span>
                  <span class="info-value">{{ selectedTransaction.counterName || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Bank Code:</span>
                  <span class="info-value">{{ selectedTransaction.bankCode || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Bank Name:</span>
                  <span class="info-value">{{ selectedTransaction.bankName || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="transaction-section">
              <h3>Payment Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Variable Symbol:</span>
                  <span class="info-value">{{ selectedTransaction.variableSymbol || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Constant Symbol:</span>
                  <span class="info-value">{{ selectedTransaction.constantSymbol || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Specific Symbol:</span>
                  <span class="info-value">{{ selectedTransaction.specificSymbol || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">User ID:</span>
                  <span class="info-value">{{ selectedTransaction.userId || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="transaction-section">
              <h3>Additional Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Message:</span>
                  <span class="info-value">{{ selectedTransaction.message || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Comment:</span>
                  <span class="info-value">{{ selectedTransaction.comment || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Executed By:</span>
                  <span class="info-value">{{ selectedTransaction.executor || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Status message section (only shown if there's a status message) -->
            <div v-if="selectedTransaction.statusMessage" class="transaction-section">
              <h3>Import Status Details</h3>
              <div class="status-message-container">
                <div :class="['status-message', getStatusMessageClass(selectedTransaction.status)]">
                  {{ selectedTransaction.statusMessage }}
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
import {
  DxDataGrid,
  DxColumn,
  DxPaging,
  DxPager,
  DxFilterRow,
  DxHeaderFilter,
  DxSearchPanel,
  DxColumnChooser,
  DxSelection
} from "devextreme-vue/data-grid";
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
      transactions: [],
      accountInfo: null,
      lastUpdated: "",
      queryType: "info", // "info" or "import"
      customDays: 7, // Default to 7 days
      isLoading: false,
      errorMessage: "",
      showTransactionDetails: false,
      selectedTransaction: null,
      apiUrl: "http://35.180.124.4:1880", // Base API URL
      showControlPanel: true, // Control panel visibility
      showAccountInfo: true // Account info visibility
    };
  },
  methods: {
    // Toggle control panel visibility
    toggleControlPanel() {
      this.showControlPanel = !this.showControlPanel;
    },
    
    // Toggle account info visibility
    toggleAccountInfo() {
      this.showAccountInfo = !this.showAccountInfo;
    },
    
    // Row click handler
    onRowClick(e) {
      this.selectedTransaction = e.data;
      this.showTransactionDetails = true;
    },
    
    // Get status title based on status value
    getStatusTitle(status) {
      if (!status) return 'Not imported';
      
      const titles = {
        'success': 'Successfully imported',
        'warning': 'Imported with warnings',
        'error': 'Import failed',
        'unknown': 'Unknown status'
      };
      return titles[status.toLowerCase()] || 'Unknown status';
    },
    
    // Get status message class based on status
    getStatusMessageClass(status) {
      if (!status) return 'unknown';
      
      switch(status.toLowerCase()) {
        case 'success':
          return 'success';
        case 'warning':
          return 'warning';
        case 'error':
          return 'error';
        default:
          return 'unknown';
      }
    },
    
    // Fetch one day of transactions
    async fetchOneDay() {
      try {
        this.isLoading = true;
        this.errorMessage = "";
        
        const endpoint = this.queryType === "info" 
          ? `${this.apiUrl}/info-fio-days/1`
          : `${this.apiUrl}/import-fio-days/1`;
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        this.processApiResponse(data);
        
      } catch (error) {
        console.error("Error fetching transactions:", error);
        this.errorMessage = `Error: ${error.message}`;
        
        // For demo purposes, use sample data if API fails
        if (this.queryType === "import") {
          this.processSampleImportData();
        } else {
          this.processSampleInfoData();
        }
      } finally {
        this.isLoading = false;
        this.updateLastUpdatedTime();
      }
    },
    
    // Fetch custom number of days
    async fetchCustomDays() {
      // Validate input
      const days = parseInt(this.customDays);
      if (isNaN(days) || days < 1 || days > 90) {
        this.errorMessage = "Please enter a number between 1 and 90";
        return;
      }
      
      try {
        this.isLoading = true;
        this.errorMessage = "";
        
        const endpoint = this.queryType === "info" 
          ? `${this.apiUrl}/info-fio-days/${days}`
          : `${this.apiUrl}/import-fio-days/${days}`;
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        this.processApiResponse(data);
        
      } catch (error) {
        console.error("Error fetching transactions:", error);
        this.errorMessage = `Error: ${error.message}`;
        
        // For demo purposes, use sample data if API fails
        if (this.queryType === "import") {
          this.processSampleImportData();
        } else {
          this.processSampleInfoData();
        }
      } finally {
        this.isLoading = false;
        this.updateLastUpdatedTime();
      }
    },
    
    // Process API response
    processApiResponse(data) {
      if (data.accountStatement) {
        this.mapTransactions(data);
      } else if (data.fioImportData) {
        this.mapTransactionsWithStatus(data);
      } else {
        throw new Error("Unexpected API response format");
      }
    },
    
    // Format date (remove timezone part)
    formatDate(dateString) {
      if (!dateString) return '';
      return dateString.split("+")[0];
    },
    
    // Format date for display
    formatDateDisplay(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString.split('+')[0]);
      return date.toLocaleDateString();
    },
    
    // Process sample import data for testing
    processSampleImportData() {
      const sampleData = {
        fioImportData: {
          AccountStatement: {
            Info: [
              {
                accountId: ["2101909941"],
                bankId: ["2010"],
                currency: ["CZK"],
                iban: ["CZ2320100000002101909941"],
                bic: ["FIOBCZPPXXX"],
                openingBalance: ["2568.28"],
                closingBalance: ["2444.31"],
                dateStart: ["2025-03-27+01:00"],
                dateEnd: ["2025-03-29+01:00"],
                idFrom: ["26979026236"],
                idTo: ["26981622930"]
              }
            ],
            TransactionList: [
              {
                Transaction: [
                  {
                    column_22: [{"_": "26979026236", "$": {"name": "ID pohybu", "id": "22"}}],
                    column_0: [{"_": "2025-03-27+01:00", "$": {"name": "Datum", "id": "0"}}],
                    column_1: [{"_": "2031.46", "$": {"name": "Objem", "id": "1"}}],
                    column_14: [{"_": "CZK", "$": {"name": "Měna", "id": "14"}}],
                    column_2: [{"_": "2533960302", "$": {"name": "Protiúčet", "id": "2"}}],
                    column_10: [{"_": "STRIPE TECHNOLOGY EU", "$": {"name": "Název protiúčtu", "id": "10"}}],
                    column_3: [{"_": "2600", "$": {"name": "Kód banky", "id": "3"}}],
                    column_12: [{"_": "Citibank Europe plc, organizační složka", "$": {"name": "Název banky", "id": "12"}}],
                    column_4: [{"_": "0000", "$": {"name": "KS", "id": "4"}}],
                    column_5: [{"_": "0", "$": {"name": "VS", "id": "5"}}],
                    column_7: [{"_": "STRIPE TECHNOLOGY EU", "$": {"name": "Uživatelská identifikace", "id": "7"}}],
                    column_16: [{"_": "STRIPE", "$": {"name": "Zpráva pro příjemce", "id": "16"}}],
                    column_8: [{"_": "Bezhotovostní příjem", "$": {"name": "Typ", "id": "8"}}],
                    column_25: [{"_": "STRIPE TECHNOLOGY EU", "$": {"name": "Komentář", "id": "25"}}],
                    column_17: [{"_": "37542066533", "$": {"name": "ID pokynu", "id": "17"}}]
                  }
                ]
              }
            ]
          }
        },
        pohodaResponse: {
          "rsp:responsePack": {
            "$": {
              "version": "2.0",
              "id": "FIOImport",
              "state": "ok"
            },
            "rsp:responsePackItem": [
              {
                "$": {"version": "2.0", "id": "FIO-086-001", "state": "ok"},
                "bnk:bankResponse": [
                  {
                    "$": {"version": "2.0", "state": "ok"},
                    "rdc:importDetails": [
                      {
                        "rdc:detail": [
                          {
                            "rdc:state": ["warning"],
                            "rdc:errno": ["603"],
                            "rdc:note": ["Hodnota prvku musela být upravena."]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      };
      
      this.mapTransactionsWithStatus(sampleData);
    },
    
    // Process sample info data for testing
    processSampleInfoData() {
      const sampleData = {
        accountStatement: {
          info: {
            accountId: "2101909941",
            bankId: "2010",
            currency: "CZK",
            iban: "CZ2320100000002101909941",
            bic: "FIOBCZPPXXX",
            openingBalance: "2568.28",
            closingBalance: "2444.31",
            dateStart: "2025-03-27+01:00",
            dateEnd: "2025-03-29+01:00",
            idFrom: "26979026236",
            idTo: "26981622930"
          },
          transactionList: {
            transaction: [
              {
                column22: { value: "26979026236" },
                column0: { value: "2025-03-27+01:00" },
                column1: { value: "2031.46" },
                column14: { value: "CZK" },
                column2: { value: "2533960302" },
                column10: { value: "STRIPE TECHNOLOGY EU" },
                column3: { value: "2600" },
                column12: { value: "Citibank Europe plc, organizační složka" },
                column4: { value: "0000" },
                column5: { value: "0" },
                column7: { value: "STRIPE TECHNOLOGY EU" },
                column16: { value: "STRIPE" },
                column8: { value: "Bezhotovostní příjem" },
                column25: { value: "STRIPE TECHNOLOGY EU" },
                column17: { value: "37542066533" }
              }
            ]
          }
        }
      };
      
      this.mapTransactions(sampleData);
    },
    
    // Map API data to DataGrid structure (for info mode)
    mapTransactions(data) {
      // Extract account info
      if (data.accountStatement?.info) {
        const info = data.accountStatement.info;
        this.accountInfo = {
          accountId: info.accountId,
          bankId: info.bankId,
          currency: info.currency,
          iban: info.iban,
          bic: info.bic,
          openingBalance: info.openingBalance,
          closingBalance: info.closingBalance,
          dateStart: info.dateStart,
          dateEnd: info.dateEnd,
          idFrom: info.idFrom,
          idTo: info.idTo
        };
      }
      
      // Process transactions
      const transactions = data.accountStatement?.transactionList?.transaction || [];
      
      this.transactions = transactions.map(tx => {
        return {
          id: tx.column22?.value,
          date: this.formatDate(tx.column0?.value),
          amount: tx.column1?.value,
          currency: tx.column14?.value,
          counterAccount: tx.column2?.value,
          counterName: tx.column10?.value,
          bankCode: tx.column3?.value,
          bankName: tx.column12?.value,
          constantSymbol: tx.column4?.value,
          variableSymbol: tx.column5?.value,
          specificSymbol: tx.column6?.value,
          userId: tx.column7?.value,
          message: tx.column16?.value,
          type: tx.column8?.value,
          executor: tx.column9?.value,
          comment: tx.column25?.value,
          paymentOrderId: tx.column17?.value,
          bic: tx.column26?.value,
          status: null // No status in info mode
        };
      });
    },
    
    // Map API data to DataGrid structure (for import mode with status)
    mapTransactionsWithStatus(data) {
      // Extract account info
      if (data.fioImportData?.AccountStatement?.Info && data.fioImportData.AccountStatement.Info.length > 0) {
        const info = data.fioImportData.AccountStatement.Info[0];
        this.accountInfo = {
          accountId: info.accountId ? info.accountId[0] : '',
          bankId: info.bankId ? info.bankId[0] : '',
          currency: info.currency ? info.currency[0] : '',
          iban: info.iban ? info.iban[0] : '',
          bic: info.bic ? info.bic[0] : '',
          openingBalance: info.openingBalance ? info.openingBalance[0] : '',
          closingBalance: info.closingBalance ? info.closingBalance[0] : '',
          dateStart: info.dateStart ? info.dateStart[0] : '',
          dateEnd: info.dateEnd ? info.dateEnd[0] : '',
          idFrom: info.idFrom ? info.idFrom[0] : '',
          idTo: info.idTo ? info.idTo[0] : ''
        };
      }
      
      // Process transactions
      const transactions = data.fioImportData?.AccountStatement?.TransactionList?.[0]?.Transaction || [];
      
      this.transactions = transactions.map((tx, index) => {
        // Extract transaction ID
        const txId = tx.column_22 && tx.column_22[0] ? tx.column_22[0]._ : '';
        
        // Get status from Pohoda response
        let status = 'unknown';
        let statusMessage = '';
        
        if (data.pohodaResponse && data.pohodaResponse["rsp:responsePack"]) {
          const responseItems = data.pohodaResponse["rsp:responsePack"]["rsp:responsePackItem"] || [];
          
          // Find matching response item (using index as a simple way to match)
          if (responseItems[index]) {
            const itemState = responseItems[index].$ ? responseItems[index].$.state : '';
            
            if (itemState === 'ok') {
              // Check for warnings or errors in details
              const bankResponse = responseItems[index]["bnk:bankResponse"];
              if (bankResponse && bankResponse[0] && bankResponse[0]["rdc:importDetails"]) {
                const details = bankResponse[0]["rdc:importDetails"][0]["rdc:detail"] || [];
                
                // Check for errors first
                const hasErrors = details.some(detail => 
                  detail["rdc:state"] && detail["rdc:state"][0] === "error"
                );
                
                if (hasErrors) {
                  status = 'error';
                  // Get first error message
                  const errorDetail = details.find(detail => 
                    detail["rdc:state"] && detail["rdc:state"][0] === "error"
                  );
                  if (errorDetail && errorDetail["rdc:note"]) {
                    statusMessage = errorDetail["rdc:note"][0];
                  }
                } 
                // Then check for warnings
                else if (details.some(detail => 
                  detail["rdc:state"] && detail["rdc:state"][0] === "warning"
                )) {
                  status = 'warning';
                  // Get first warning message
                  const warningDetail = details.find(detail => 
                    detail["rdc:state"] && detail["rdc:state"][0] === "warning"
                  );
                  if (warningDetail && warningDetail["rdc:note"]) {
                    statusMessage = warningDetail["rdc:note"][0];
                  }
                } 
                // If no errors or warnings, it's a success
                else {
                  status = 'success';
                }
              } else {
                status = 'success';
              }
            } else {
              status = 'error';
              statusMessage = 'Transaction processing failed';
            }
          }
        }
        
        return {
          id: txId,
          date: tx.column_0 && tx.column_0[0] ? this.formatDate(tx.column_0[0]._) : '',
          amount: tx.column_1 && tx.column_1[0] ? tx.column_1[0]._ : '',
          currency: tx.column_14 && tx.column_14[0] ? tx.column_14[0]._ : '',
          counterAccount: tx.column_2 && tx.column_2[0] ? tx.column_2[0]._ : '',
          counterName: tx.column_10 && tx.column_10[0] ? tx.column_10[0]._ : '',
          bankCode: tx.column_3 && tx.column_3[0] ? tx.column_3[0]._ : '',
          bankName: tx.column_12 && tx.column_12[0] ? tx.column_12[0]._ : '',
          constantSymbol: tx.column_4 && tx.column_4[0] ? tx.column_4[0]._ : '',
          variableSymbol: tx.column_5 && tx.column_5[0] ? tx.column_5[0]._ : '',
          specificSymbol: tx.column_6 && tx.column_6[0] ? tx.column_6[0]._ : '',
          userId: tx.column_7 && tx.column_7[0] ? tx.column_7[0]._ : '',
          message: tx.column_16 && tx.column_16[0] ? tx.column_16[0]._ : '',
          type: tx.column_8 && tx.column_8[0] ? tx.column_8[0]._ : '',
          executor: tx.column_9 && tx.column_9[0] ? tx.column_9[0]._ : '',
          comment: tx.column_25 && tx.column_25[0] ? tx.column_25[0]._ : '',
          paymentOrderId: tx.column_17 && tx.column_17[0] ? tx.column_17[0]._ : '',
          status: status,
          statusMessage: statusMessage
        };
      });
    },
    
    // Update last updated time
    updateLastUpdatedTime() {
      const now = new Date();
      this.lastUpdated = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }
  },
  mounted() {
    // Load initial data (1 day)
    this.fetchOneDay();
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

/* Panel de controles */
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

/* Radio buttons */
.query-type {
  display: flex;
  align-items: center;
  gap: 16px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.radio-input {
  margin: 0;
}

.radio-text {
  font-size: 14px;
  color: var(--text-color);
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

/* Última actualización */
.last-update {
  font-size: 13px;
  color: var(--text-light);
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

/* Contenedor de la tabla */
.data-grid-container {
  flex: 1;
  overflow: hidden;
  position: relative;
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

/* Tabla de transacciones */
.transactions-table {
  height: 100%;
  width: 100%;
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

.status-indicator.unknown {
  background-color: var(--text-light);
}

.status-text {
  font-size: 12px;
  color: var(--text-color);
  margin-left: 6px;
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

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--bg-white);
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background-color: var(--bg-white);
  z-index: 10;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--text-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-light);
  padding: 0;
  line-height: 1;
}

.modal-body {
  padding: 20px;
}

/* Transaction sections in modal */
.transaction-section {
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.transaction-section h3 {
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

.status-with-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Status message container */
.status-message-container {
  padding: 16px;
}

.status-message {
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
}

.status-message.success {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.status-message.warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
}

.status-message.error {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
}

.status-message.unknown {
  background-color: rgba(107, 114, 128, 0.1);
  color: var(--text-light);
}

/* Error toast */
.error-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
  border-radius: 6px;
  background-color: var(--bg-white);
  border-left: 4px solid var(--error-color);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
}

.error-toast p {
  margin: 0 0 10px 0;
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
  
  .query-type {
    margin-bottom: 10px;
  }
  
  .custom-days {
    margin-top: 10px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }
}
</style>

