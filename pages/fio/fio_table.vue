<template>
  <div class="transactions-container">
    <!-- Loading overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading data...</p>
    </div>
    
    <!-- Error message -->
    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
      <button @click="errorMessage = ''">Close</button>
    </div>
    
    <!-- Account Info Summary -->
    <div v-if="accountInfo" class="account-info">
      <div class="account-info-header">
        <h2>Account Information</h2>
      </div>
      <div class="account-info-content">
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
    
    <div class="controls">
      <!-- Query Type Selection -->
      <div class="query-type">
        <label>
          <input type="radio" value="info" v-model="queryType" /> Info
        </label>
        <label>
          <input type="radio" value="import" v-model="queryType" /> Import
        </label>
      </div>

      <!-- Execute 1 day button -->
      <div class="query-buttons">
        <button @click="fetchOneDay">Execute 1 day</button>
      </div>

      <!-- Custom days input -->
      <div class="custom-days">
        <label>
          Execute
          <input 
            type="number" 
            v-model="customDays" 
            min="1" 
            max="90" 
            placeholder="days" 
          />
          days
        </label>
        <button @click="fetchCustomDays">Execute</button>
      </div>

      <div>
        <p>Last Update: {{ lastUpdated }}</p>
      </div>
    </div>

    <!-- DataGrid -->
    <DxDataGrid
      :data-source="transactions"
      :show-borders="true"
      key-expr="id"
      class="transactions-table"
      :allow-column-reordering="true"
      :allow-column-resizing="true"
      :row-alternation-enabled="true"
      @row-click="onRowClick"
    >
      <DxColumn data-field="id" caption="ID" width="100" alignment="center" />
      <DxColumn data-field="date" caption="Date" data-type="date" width="120" alignment="center" />
      <DxColumn data-field="amount" caption="Amount" width="100" alignment="right" cell-template="amountTemplate" />
      <DxColumn data-field="currency" caption="Currency" width="80" alignment="center" />
      <DxColumn data-field="counterAccount" caption="Counter Account" width="140" alignment="center" />
      <DxColumn data-field="counterName" caption="Counter Name" width="200" alignment="left" />
      <DxColumn data-field="bankCode" caption="Bank Code" width="100" alignment="center" />
      <DxColumn data-field="bankName" caption="Bank Name" width="200" alignment="left" />
      <DxColumn data-field="variableSymbol" caption="VS" width="100" alignment="center" />
      <DxColumn data-field="message" caption="Message" width="250" alignment="left" />
      <DxColumn data-field="type" caption="Type" width="150" alignment="center" />
      <DxColumn data-field="executor" caption="Executed By" width="150" alignment="left" />
      <DxColumn data-field="comment" caption="Comment" width="250" alignment="left" />
      
      <!-- Status column (only visible in import mode) -->
      <DxColumn 
        v-if="queryType === 'import'" 
        data-field="status" 
        caption="Status" 
        width="80" 
        alignment="center"
        cell-template="statusTemplate"
      />

      <template #amountTemplate="{ data }">
        <span :class="{'positive': parseFloat(data.value) > 0, 'negative': parseFloat(data.value) < 0}">
          {{ data.value }} {{ data.data.currency }}
        </span>
      </template>
      
      <!-- Status indicator template -->
      <template #statusTemplate="{ data }">
        <div class="status-indicator-container">
          <div :class="getStatusClass(data.value)" class="status-indicator"></div>
          <span class="status-text">{{ getStatusText(data.value) }}</span>
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
    
    <!-- Transaction details modal -->
    <div v-if="showTransactionDetails" class="transaction-details-modal">
      <div class="transaction-details-content">
        <div class="transaction-details-header">
          <h2>Transaction Details</h2>
          <button class="close-button" @click="showTransactionDetails = false">&times;</button>
        </div>
        
        <div class="transaction-details-body">
          <div class="transaction-summary">
            <div class="transaction-id">
              <strong>Transaction ID:</strong> {{ selectedTransaction.id }}
            </div>
            <div class="transaction-date">
              <strong>Date:</strong> {{ selectedTransaction.date }}
            </div>
            <div class="transaction-amount">
              <strong>Amount:</strong> 
              <span :class="{'positive': parseFloat(selectedTransaction.amount) > 0, 'negative': parseFloat(selectedTransaction.amount) < 0}">
                {{ selectedTransaction.amount }} {{ selectedTransaction.currency }}
              </span>
            </div>
            
            <!-- Status indicator in details (only in import mode) -->
            <div v-if="queryType === 'import'" class="transaction-status">
              <strong>Status:</strong>
              <div class="status-detail">
                <div :class="getStatusClass(selectedTransaction.status)" class="status-indicator"></div>
                <span class="status-text">{{ getStatusText(selectedTransaction.status) }}</span>
              </div>
              <div v-if="selectedTransaction.statusMessage" class="status-message">
                {{ selectedTransaction.statusMessage }}
              </div>
            </div>
          </div>
          
          <div class="transaction-details-sections">
            <div class="details-section">
              <h3>Transaction Details</h3>
              <table class="details-table">
                <tbody>
                  <tr>
                    <td>Counter Account:</td>
                    <td>{{ selectedTransaction.counterAccount || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>Counter Name:</td>
                    <td>{{ selectedTransaction.counterName || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>Bank Code:</td>
                    <td>{{ selectedTransaction.bankCode || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>Bank Name:</td>
                    <td>{{ selectedTransaction.bankName || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>Variable Symbol:</td>
                    <td>{{ selectedTransaction.variableSymbol || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>Constant Symbol:</td>
                    <td>{{ selectedTransaction.constantSymbol || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>Specific Symbol:</td>
                    <td>{{ selectedTransaction.specificSymbol || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>User ID:</td>
                    <td>{{ selectedTransaction.userId || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>Message:</td>
                    <td>{{ selectedTransaction.message || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>Transaction Type:</td>
                    <td>{{ selectedTransaction.type || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>Executed By:</td>
                    <td>{{ selectedTransaction.executor || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>Comment:</td>
                    <td>{{ selectedTransaction.comment || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>Payment Order ID:</td>
                    <td>{{ selectedTransaction.paymentOrderId || 'N/A' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
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
      transactions: [],
      accountInfo: null,
      lastUpdated: "",
      queryType: "info", // "info" or "import"
      customDays: 7, // Default to 7 days
      isLoading: false,
      errorMessage: "",
      showTransactionDetails: false,
      selectedTransaction: null,
      apiUrl: "http://localhost:1880" // Base API URL
    };
  },
  methods: {
    // Row click handler
    onRowClick(e) {
      this.selectedTransaction = e.data;
      this.showTransactionDetails = true;
    },
    
    // Get status class based on status value
    getStatusClass(status) {
      if (!status) return 'status-unknown';
      
      switch(status.toLowerCase()) {
        case 'success':
          return 'status-success';
        case 'warning':
          return 'status-warning';
        case 'error':
          return 'status-error';
        default:
          return 'status-unknown';
      }
    },
    
    // Get status text based on status value
    getStatusText(status) {
      if (!status) return 'Unknown';
      
      switch(status.toLowerCase()) {
        case 'success':
          return 'Success';
        case 'warning':
          return 'Warning';
        case 'error':
          return 'Error';
        default:
          return status;
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
        const sampleData = this.parseTransactionData();
        this.mapTransactions(sampleData);
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
        const sampleData = this.parseTransactionData();
        this.mapTransactions(sampleData);
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
    
    // Sample data for testing
    parseTransactionData() {
      // In a real application, this would come from your API
      return {
        fioImportData: {
          AccountStatement: {
            Info: [
              {
                accountId: ["2101909941"],
                bankId: ["2010"],
                currency: ["CZK"],
                iban: ["CZ2320100000002101909941"],
                bic: ["FIOBCZPPXXX"],
                openingBalance: ["3734.28"],
                closingBalance: ["4343.63"],
                dateStart: ["2025-03-22+01:00"],
                dateEnd: ["2025-03-24+01:00"],
                idFrom: ["26973776676"],
                idTo: ["26975570925"]
              }
            ],
            TransactionList: [
              {
                Transaction: [
                  {
                    column_22: [{"_": "26973776676", "$": {"name": "ID pohybu", "id": "22"}}],
                    column_0: [{"_": "2025-03-22+01:00", "$": {"name": "Datum", "id": "0"}}],
                    column_1: [{"_": "-151.50", "$": {"name": "Objem", "id": "1"}}],
                    column_14: [{"_": "CZK", "$": {"name": "Měna", "id": "14"}}],
                    column_5: [{"_": "9833", "$": {"name": "VS", "id": "5"}}],
                    column_7: [{"_": "Nákup: BOLT.EU/O/2503210913, Tallinn, EE, dne 21.3.2025, částka  151.50 CZK", "$": {"name": "Uživatelská identifikace", "id": "7"}}],
                    column_16: [{"_": "Nákup: BOLT.EU/O/2503210913, Tallinn, EE, dne 21.3.2025, částka  151.50 CZK", "$": {"name": "Zpráva pro příjemce", "id": "16"}}],
                    column_8: [{"_": "Platba kartou", "$": {"name": "Typ", "id": "8"}}],
                    column_9: [{"_": "Petrův, Ivan", "$": {"name": "Provedl", "id": "9"}}],
                    column_25: [{"_": "Nákup: BOLT.EU/O/2503210913, Tallinn, EE, dne 21.3.2025, částka  151.50 CZK", "$": {"name": "Komentář", "id": "25"}}],
                    column_17: [{"_": "37521058142", "$": {"name": "ID pokynu", "id": "17"}}]
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
              "state": "ok",
              "programVersion": "13802.10 SQL (5.11.2024)"
            },
            "rsp:responsePackItem": [
              {
                "$": {"version": "2.0", "id": "FIO-081-001", "state": "ok"},
                "bnk:bankResponse": [
                  {
                    "$": {"version": "2.0", "state": "ok"},
                    "rdc:importDetails": [
                      {
                        "rdc:detail": [
                          {
                            "rdc:state": ["warning"],
                            "rdc:errno": ["603"],
                            "rdc:note": ["Hodnota prvku musela bďż˝t upravena."]
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
          bic: tx.column26?.value
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
/* Global styles (not scoped to affect DevExtreme) */
.transactions-container {
  width: 100%;
  min-height: 100vh;
  background: white;
  position: relative;
}

.transactions-table {
  width: 100%;
  margin-top: 20px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  margin-bottom: 10px;
  gap: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
  align-items: center;
}

.query-type label {
  margin-right: 15px;
  font-weight: bold;
}

.query-buttons {
  display: flex;
  align-items: center;
}

.custom-days {
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-days input {
  width: 60px;
  text-align: center;
  margin: 0 5px;
  padding: 5px;
}

button {
  padding: 8px 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #2980b9;
}

/* Status indicators */
.status-indicator-container {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-indicator {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: inline-block;
}

.status-success {
  background-color: #2ecc71; /* Green */
}

.status-warning {
  background-color: #f39c12; /* Orange */
}

.status-error {
  background-color: #e74c3c; /* Red */
}

.status-unknown {
  background-color: #95a5a6; /* Gray */
}

.status-text {
  font-size: 12px;
}

.status-detail {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: 10px;
}

.status-message {
  margin-top: 5px;
  font-size: 12px;
  color: #7f8c8d;
  font-style: italic;
}

/* Loading overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: white;
}

.loading-spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid white;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error message */
.error-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #e74c3c;
  color: white;
  padding: 15px;
  border-radius: 5px;
  z-index: 1000;
  max-width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.error-message button {
  align-self: flex-end;
  background-color: white;
  color: #e74c3c;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  margin-top: 10px;
  cursor: pointer;
}

/* Transaction details modal */
.transaction-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.transaction-details-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.transaction-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.transaction-details-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.transaction-details-body {
  padding: 20px;
}

.transaction-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 5px;
  margin-bottom: 20px;
}

.transaction-summary > div {
  flex: 1 1 200px;
}

.transaction-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 10px;
}

.transaction-details-sections {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.details-section {
  flex: 1 1 400px;
}

.details-section h3 {
  margin-top: 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #eee;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
}

.details-table td {
  padding: 8px 5px;
  border-bottom: 1px solid #eee;
}

.details-table td:first-child {
  font-weight: bold;
  width: 40%;
}

/* Styles for positive and negative values */
.positive {
  color: #27ae60;
  font-weight: bold;
}

.negative {
  color: #e74c3c;
  font-weight: bold;
}

/* Account info styles */
.account-info {
  margin: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
  border-left: 4px solid #3498db;
}

.account-info-header h2 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.account-info-content {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.info-item {
  flex: 1 1 200px;
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.info-value {
  font-weight: bold;
  color: #2c3e50;
}
</style>