<template>
  <div class="transactions-container">
    <!-- Loading overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Waiting for response...</p>
    </div>
    
    <!-- Error message -->
    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
      <button @click="errorMessage = ''">Dismiss</button>
    </div>
    
    <!-- Warning confirmation dialog -->
    <div v-if="showWarningDialog" class="warning-dialog">
      <div class="warning-dialog-content">
        <div class="warning-header">
          <h3>Warning</h3>
        </div>
        <div class="warning-body">
          <p>Today have already imported data. Are you sure you want to do it again?</p>
        </div>
        <div class="warning-actions">
          <button @click="confirmLastTimestampImport" class="confirm-button">Yes, proceed</button>
          <button @click="cancelLastTimestampImport" class="cancel-button">Cancel</button>
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

      <!-- Buttons for Different Queries -->
      <div class="query-buttons">
        <button @click="fetchLast90Days">Execute Last 90 Days</button>
        <button @click="handleLastTimestampClick">Execute From Last Timestamp</button>
      </div>

      <!-- Date Range Form -->
      <div class="date-range">
        <label>
          Date From:
          <input type="date" v-model="dateFrom" />
        </label>
        <label>
          Date To:
          <input type="date" v-model="dateTo" />
        </label>
        <button @click="fetchByRange">Execute By Date Range</button>
      </div>

      <div>
        <button @click="fetchTransactions">Reload Now</button>
      </div>

      <div class="minutes">
        <p>Refresh Every:</p>
        <input type="number" v-model="refreshInterval" min="1" placeholder="minutes" />
        <p>minutes</p>
        <button class="button-rec" @click="startAutoRefresh">Start Auto Refresh</button>
      </div>

      <div>
        <p>Last Update: {{ lastUpdated }}</p>
      </div>
    </div>

    <!-- DataGrid -->
    <DxDataGrid
      :data-source="transactions"
      :show-borders="true"
      key-expr="transactionIdF"
      class="transactions-table"
      :allow-column-reordering="true"
      :allow-column-resizing="true"
      :row-alternation-enabled="true"
      @row-click="onRowClick"
    >
      <!-- Renderizamos las columnas definidas en allColumns -->
      <DxColumn
        v-for="(col, index) in allColumns"
        :key="index"
        :data-field="col.dataField"
        :caption="col.caption"
        :width="col.width"
        :alignment="col.alignment"
        :header-css-class="col.headerCssClass"
        :cell-template="col.cellTemplate"
      />

      <DxFilterRow :visible="true" />
      <DxHeaderFilter :visible="true" />
      <DxSearchPanel :visible="true" :highlight-case-sensitive="false" />
      <DxColumnChooser :enabled="true" />
      <DxSelection mode="multiple" />
      <DxPaging :page-size="100" />
      <DxPager :show-page-size-selector="true" :allowed-page-sizes="[5, 10, 20]" />

      <!-- Plantilla para formatear precios -->
      <template #priceTemplate="{ data }">
        <span>{{ data.value }} CZK</span>
      </template>

      <!-- Plantilla para mostrar el estado de Pohoda como círculo (solo el círculo, sin texto) -->
      <template #pohodaStatusTemplate="{ data }">
        <div :style="statusStyle(data.value)" class="status-indicator"></div>
      </template>
    </DxDataGrid>
    
    <!-- Modal de detalles de transacción -->
    <div v-if="showTransactionDetails" class="transaction-details-modal">
      <div class="transaction-details-content">
        <div class="transaction-details-header">
          <h2>Transaction Details</h2>
          <button class="close-button" @click="showTransactionDetails = false">&times;</button>
        </div>
        
        <div class="transaction-details-body">
          <div class="transaction-summary">
            <div class="transaction-id">
              <strong>Transaction ID:</strong> {{ selectedTransaction.transactionIdF }}
            </div>
            <div class="transaction-date">
              <strong>Date:</strong> {{ selectedTransaction.dateF }}
            </div>
            <div class="transaction-amount">
              <strong>Amount:</strong> {{ selectedTransaction.amountF }} {{ selectedTransaction.currencyF }}
            </div>
            <div class="transaction-statement">
              <strong>Statement Number:</strong> {{ selectedTransaction.statementDisplayP }}
            </div>
          </div>
          
          <div v-if="queryType === 'import'" class="transaction-status">
            <div class="status-header">
              <div class="status-label">Status:</div>
              <div :style="statusStyle(selectedTransaction.pohodaStatusP)" class="status-indicator-large"></div>
              <div class="status-text">{{ selectedTransaction.pohodaStatusP === 'success' ? 'Success' : 'Error' }}</div>
            </div>
            <!-- Solo mostrar logs cuando hay un error -->
            <div v-if="selectedTransaction.pohodaStatusP === 'error'" class="status-log">
              <div class="log-label">Log:</div>
              <div class="log-content">{{ selectedTransaction.pohodaLogP }}</div>
            </div>
          </div>
          
          <div class="transaction-details-sections">
            <div class="details-section">
              <h3>Fio Bank Details</h3>
              <table class="details-table">
                <tbody>
                  <tr>
                    <td>Beneficiary Account:</td>
                    <td>{{ selectedTransaction.beneficiaryAccountF }}</td>
                  </tr>
                  <tr>
                    <td>Beneficiary Name:</td>
                    <td>{{ selectedTransaction.beneficiaryNameF }}</td>
                  </tr>
                  <tr>
                    <td>Bank Code:</td>
                    <td>{{ selectedTransaction.bankCodeF }}</td>
                  </tr>
                  <tr>
                    <td>Bank Name:</td>
                    <td>{{ selectedTransaction.bankNameF }}</td>
                  </tr>
                  <tr>
                    <td>User ID:</td>
                    <td>{{ selectedTransaction.userIdF }}</td>
                  </tr>
                  <tr>
                    <td>Recipient Message:</td>
                    <td>{{ selectedTransaction.recipientMessageF }}</td>
                  </tr>
                  <tr>
                    <td>Transaction Type:</td>
                    <td>{{ selectedTransaction.transactionTypeF }}</td>
                  </tr>
                  <tr>
                    <td>Comment:</td>
                    <td>{{ selectedTransaction.commentF }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="details-section">
              <h3>Pohoda Details</h3>
              <table class="details-table">
                <tbody>
                  <tr>
                    <td>Movement ID:</td>
                    <td>{{ selectedTransaction.movementIdP }}</td>
                  </tr>
                  <tr>
                    <td>Associated Account:</td>
                    <td>{{ selectedTransaction.associatedAccountP }}</td>
                  </tr>
                  <tr>
                    <td>Account Holder Name:</td>
                    <td>{{ selectedTransaction.accountHolderNameP }}</td>
                  </tr>
                  <tr>
                    <td>Bank Type:</td>
                    <td>{{ selectedTransaction.bankTypeP }}</td>
                  </tr>
                  <tr>
                    <td>Variable Symbol:</td>
                    <td>{{ selectedTransaction.variableSymbolP }}</td>
                  </tr>
                  <tr>
                    <td>Specific Symbol:</td>
                    <td>{{ selectedTransaction.specificSymbolP }}</td>
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
      lastUpdated: "",
      refreshInterval: 15,
      queryType: "info", // "info" o "import"
      dateFrom: "",
      dateTo: "",
      isLoading: false,
      errorMessage: "",
      showTransactionDetails: false,
      selectedTransaction: null,
      showWarningDialog: false,
      lastTimestampDate: null
    };
  },
  computed: {
    // Definimos las columnas. Si el modo es import, se añaden dos columnas extra (estado y log de Pohoda)
    allColumns() {
      let columns = [
        // ----------------------
        // Columnas Fio Bank (sufijo F)
        // ----------------------
        {
          dataField: "dateF",
          caption: "Date F",
          width: 120,
          headerCssClass: "fio-header"
        },
        {
          dataField: "amountF",
          caption: "Amount F",
          width: 100,
          alignment: "right",
          headerCssClass: "fio-header",
          cellTemplate: "priceTemplate"
        },
        {
          dataField: "currencyF",
          caption: "Currency F",
          width: 80,
          headerCssClass: "fio-header"
        },
        {
          dataField: "beneficiaryAccountF",
          caption: "Beneficiary Account F",
          width: 140,
          headerCssClass: "fio-header"
        },
        {
          dataField: "beneficiaryNameF",
          caption: "Beneficiary Name F",
          width: 150,
          headerCssClass: "fio-header"
        },
        {
          dataField: "bankCodeF",
          caption: "Bank Code F",
          width: 80,
          headerCssClass: "fio-header"
        },
        {
          dataField: "bankNameF",
          caption: "Bank Name F",
          width: 150,
          headerCssClass: "fio-header"
        },
        {
          dataField: "userIdF",
          caption: "User ID F",
          width: 100,
          headerCssClass: "fio-header"
        },
        {
          dataField: "recipientMessageF",
          caption: "Recipient Message F",
          width: 200,
          headerCssClass: "fio-header"
        },
        {
          dataField: "transactionTypeF",
          caption: "Transaction Type F",
          width: 130,
          headerCssClass: "fio-header"
        },
        {
          dataField: "commentF",
          caption: "Comment F",
          width: 150,
          headerCssClass: "fio-header"
        },
        
        // ----------------------
        // Columnas Pohoda (sufijo P)
        // ----------------------
        {
          dataField: "statementDisplayP",
          caption: "Statement Number P",
          width: 150,
          headerCssClass: "pohoda-header"
        },
      ];

      // Si el modo es "import", añadimos dos columnas extra: estado (con símbolo) y log de Pohoda
      if (this.queryType === "import") {
        columns.push(
          {
            dataField: "pohodaStatusP",
            caption: "Status",
            width: 80,
            headerCssClass: "pohoda-header",
            cellTemplate: "pohodaStatusTemplate"
          },

        );
      }
      return columns;
    }
  },
  methods: {
    // Manejador de clic en fila
    onRowClick(e) {
      this.selectedTransaction = e.data;
      this.showTransactionDetails = true;
    },
    
    // Verificar si una fecha es hoy
    isToday(dateString) {
      const today = new Date();
      const date = new Date(dateString);
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
    },
    
    // Manejador para el botón de último timestamp
    async handleLastTimestampClick() {
      try {
        // Primero verificamos si hay datos del último timestamp
        const checkEndpoint = "http://localhost:1880/get-last-timestamp";
        const response = await fetch(checkEndpoint);
        
        if (!response.ok) {
          throw new Error(`Error checking last timestamp: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.lastTimestamp) {
          // Convertir el timestamp a fecha
          const lastDate = new Date(data.lastTimestamp);
          this.lastTimestampDate = lastDate;
          
          // Si es de hoy y estamos en modo import, mostrar advertencia
          if (this.isToday(lastDate) && this.queryType === "import") {
            this.showWarningDialog = true;
            return;
          }
        }
        
        // Si no es de hoy o estamos en modo info, proceder normalmente
        this.fetchLastTimestamp();
        
      } catch (error) {
        console.error("Error checking last timestamp:", error);
        this.errorMessage = `Error: ${error.message}`;
        // En caso de error, proceder con la importación normal
        this.fetchLastTimestamp();
      }
    },
    
    // Confirmar importación a pesar de la advertencia
    confirmLastTimestampImport() {
      this.showWarningDialog = false;
      this.fetchLastTimestamp();
    },
    
    // Cancelar importación
    cancelLastTimestampImport() {
      this.showWarningDialog = false;
    },
    
    async fetchTransactions() {
      await this.fetchLast90Days();
    },
    
    async fetchLast90Days() {
      const endpoint =
        this.queryType === "info"
          ? "http://localhost:1880/info-fio-last-90-days"
          : "http://localhost:1880/import-fio-last-90-days";
      
      try {
        this.isLoading = true;
        this.errorMessage = "";
        
        const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
        
        if (!response.ok) {
          throw new Error(`Error fetching transactions: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validamos que la estructura de datos sea la esperada
        if (!data.fioImportData?.AccountStatement?.TransactionList) {
          throw new Error("Unexpected API response format: Missing transaction data");
        }
        
        this.mapTransactions(data);
        this.updateLastUpdatedTime();
      } catch (error) {
        console.error("Error fetching transactions:", error);
        this.errorMessage = `Error: ${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },
    
    async fetchLastTimestamp() {
      const endpoint =
        this.queryType === "info"
          ? "http://localhost:1880/info-fio-last-timestamp"
          : "http://localhost:1880/import-fio-last-timestamp";
      
      try {
        this.isLoading = true;
        this.errorMessage = "";
        
        const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
        
        if (!response.ok) {
          throw new Error(`Error fetching transactions by last timestamp: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.fioImportData?.AccountStatement?.TransactionList) {
          throw new Error("Unexpected API response format: Missing transaction data");
        }
        
        this.mapTransactions(data);
        this.updateLastUpdatedTime();
      } catch (error) {
        console.error("Error fetching transactions by last timestamp:", error);
        this.errorMessage = `Error: ${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },
    
    async fetchByRange() {
      const endpoint =
        this.queryType === "info"
          ? "http://localhost:1880/info-fio-range-date"
          : "http://localhost:1880/import-fio-range-date";
      
      try {
        this.isLoading = true;
        this.errorMessage = "";
        
        const url = `${endpoint}?dateFrom=${this.dateFrom}&dateTo=${this.dateTo}`;
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        
        if (!response.ok) {
          throw new Error(`Error fetching range data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.fioImportData?.AccountStatement?.TransactionList) {
          throw new Error("Unexpected API response format: Missing transaction data");
        }
        
        this.mapTransactions(data);
        this.updateLastUpdatedTime();
      } catch (error) {
        console.error("Error fetching range data:", error);
        this.errorMessage = `Error: ${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },
    // Devuelve solo la parte de la fecha (sin hora)
    formatDate(rawDate) {
      return rawDate.split("+")[0];
    },
    // Aplana la estructura anidada de cada transacción
    flattenTransaction(tx) {
      let flat = {};
      for (let key in tx) {
        if (Array.isArray(tx[key])) {
          flat[key] = tx[key].map(item => item._).join(" | ") || "N/A";
        } else {
          flat[key] = tx[key];
        }
      }
      return flat;
    },
    // Método simplificado para extraer el estado general de la respuesta de Pohoda
    getOverallPohodaStatus(pohodaResponse) {
      // Verificar si existe la respuesta de Pohoda
      if (!pohodaResponse || !pohodaResponse["rsp:responsePack"]) {
        return { status: "error", log: "No Pohoda response data available" };
      }
      
      // Verificar el estado general de la respuesta
      const responsePack = pohodaResponse["rsp:responsePack"];
      const overallState = responsePack["$"] && responsePack["$"].state;
      
      if (overallState !== "ok") {
        return { status: "error", log: `Pohoda response error: ${overallState || "Unknown error"}` };
      }
      
      return { status: "success", log: "Pohoda response OK" };
    },
    // Extrae los detalles de la respuesta de Pohoda para una transacción específica
    // Ahora solo devuelve "success" o "error" (los warnings se consideran success)
    extractPohodaDetails(pohodaResponse, transactionId) {
      try {
        // Verificar el estado general de la respuesta
        const overallStatus = this.getOverallPohodaStatus(pohodaResponse);
        if (overallStatus.status !== "success") {
          return overallStatus;
        }
        
        // Buscar el item correspondiente a esta transacción
        const responsePack = pohodaResponse["rsp:responsePack"];
        const responsePackItems = responsePack["rsp:responsePackItem"];
        
        if (!responsePackItems || !Array.isArray(responsePackItems)) {
          return { status: "success", log: "No response items found" };
        }
        
        // Buscar el item por ID
        const matchingItem = responsePackItems.find(item => {
          const itemId = (item["$"] && item["$"].id) || "";
          // Extraer el número de transacción del ID (FIO-XX-YY)
          const parts = itemId.split("-");
          if (parts.length >= 3) {
            const transactionNumber = parts[2].padStart(2, "0");
            // Comparar con los últimos dígitos del ID de transacción
            const lastDigits = transactionId.slice(-2);
            return transactionNumber === lastDigits;
          }
          return false;
        });
        
        if (!matchingItem) {
          return { status: "success", log: `No matching response for transaction ${transactionId}` };
        }
        
        // Verificar el estado del item
        const itemState = (matchingItem["$"] && matchingItem["$"].state) || "";
        if (itemState !== "ok") {
          return { status: "error", log: `Transaction error: ${itemState}` };
        }
        
        // Buscar detalles de importación
        const bankResponse = matchingItem["bnk:bankResponse"];
        if (!bankResponse || !bankResponse[0]) {
          return { status: "success", log: "Transaction processed" };
        }
        
        const importDetails = bankResponse[0]["rdc:importDetails"];
        if (!importDetails || !importDetails[0] || !importDetails[0]["rdc:detail"]) {
          return { status: "success", log: "Transaction processed successfully" };
        }
        
        // Extraer detalles (warnings, errors)
        const details = importDetails[0]["rdc:detail"];
        
        // Buscar errores primero
        const errors = details.filter(d => d["rdc:state"] && d["rdc:state"][0] === "error");
        if (errors.length > 0) {
          const errorMessages = errors.map(e => {
            const code = e["rdc:errno"] ? e["rdc:errno"][0] : "";
            const note = e["rdc:note"] ? e["rdc:note"][0] : "";
            return `${code}: ${note}`;
          });
          return { status: "error", log: errorMessages.join(" | ") };
        }
        
        // Luego buscar warnings (pero los tratamos como success)
        const warnings = details.filter(d => d["rdc:state"] && d["rdc:state"][0] === "warning");
        if (warnings.length > 0) {
          const warningMessages = warnings.map(w => {
            const code = w["rdc:errno"] ? w["rdc:errno"][0] : "";
            const note = w["rdc:note"] ? w["rdc:note"][0] : "";
            return `${code}: ${note}`;
          });
          // Warnings se consideran success, pero mostramos el mensaje
          return { status: "success", log: warningMessages.join(" | ") };
        }
        
        // Si no hay errores ni warnings, es un éxito
        return { status: "success", log: "Transaction processed successfully" };
        
      } catch (error) {
        console.error("Error extracting Pohoda details:", error);
        return { status: "error", log: `Error processing response: ${error.message}` };
      }
    },
    // Mapea los datos de la API a la estructura que usará el DataGrid
    mapTransactions(data) {
      const fioTxs =
        data.fioImportData?.AccountStatement?.TransactionList?.[0]?.Transaction || [];
      let dateCounters = {};

      this.transactions = fioTxs.map(tx => {
        const flatTx = this.flattenTransaction(tx);
        const formattedDate = this.formatDate(flatTx.column_0 || "");

        if (!dateCounters[formattedDate]) {
          dateCounters[formattedDate] = 1;
        } else {
          dateCounters[formattedDate]++;
        }
        const movementIndex = String(dateCounters[formattedDate]).padStart(2, "0");
        const dateForStatement = formattedDate.replace(/-/g, "");
        const statementDisplay = `${dateForStatement}/${movementIndex}`;

        // Determinamos el tipo de banco
        const amount = parseFloat((flatTx.column_1 || "0").replace(",", "."));
        const bankType = amount >= 0 ? "receipt" : "expense";

        let pohodaStatus = "waiting for a response";
        let pohodaLog = "";
        
        if (this.queryType === "import" && data.pohodaResponse) {
          const pohodaDetails = this.extractPohodaDetails(data.pohodaResponse, flatTx.column_22);
          pohodaStatus = pohodaDetails.status;
          pohodaLog = pohodaDetails.log;
        }

        return {
          // Campos Fio
          transactionIdF: flatTx.column_22,
          dateF: formattedDate,
          amountF: flatTx.column_1,
          currencyF: flatTx.column_14,
          beneficiaryAccountF: flatTx.column_2,
          beneficiaryNameF: flatTx.column_10,
          bankCodeF: flatTx.column_3,
          bankNameF: flatTx.column_12,
          constantSymbolF: flatTx.column_4,
          variableSymbolF: flatTx.column_5,
          specificSymbolF: flatTx.column_6,
          userIdF: flatTx.column_7,
          recipientMessageF: flatTx.column_16,
          transactionTypeF: flatTx.column_8,
          commentF: flatTx.column_25,
          paymentOrderIdF: flatTx.column_17,

          // Campos Pohoda
          movementIdP: flatTx.column_22,
          dateP: formattedDate,
          amountP: flatTx.column_1,
          currencyP: flatTx.column_14,
          associatedAccountP: flatTx.column_2,
          accountHolderNameP: flatTx.column_10,
          bankCodeP: flatTx.column_3,
          bankNameP: flatTx.column_12,
          variableSymbolP: flatTx.column_5,
          specificSymbolP: flatTx.column_6,
          userIdP: flatTx.column_7,
          recipientMessageP: flatTx.column_16,
          transactionTypeP: flatTx.column_8,
          commentP: flatTx.column_25,
          paymentOrderIdP: flatTx.column_17,
          statementDisplayP: statementDisplay,
          bankTypeP: bankType,
          // Solo para el modo import
          pohodaStatusP: this.queryType === "import" ? pohodaStatus : undefined,
          pohodaLogP: this.queryType === "import" ? pohodaLog : undefined
        };
      });
    },
    updateLastUpdatedTime() {
      const now = new Date();
      this.lastUpdated = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    },
    // Retorna el estilo del indicador según el estado (solo verde o rojo)
    statusStyle(status) {
      if (status === "success") return { backgroundColor: "#2ecc71", width: "15px", height: "15px", borderRadius: "50%" };
      if (status === "error") return { backgroundColor: "#e74c3c", width: "15px", height: "15px", borderRadius: "50%" };
      return { backgroundColor: "#ccc", width: "15px", height: "15px", borderRadius: "50%" };
    },
    async startAutoRefresh() {
      try {
        this.isLoading = true;
        this.errorMessage = "";
        
        const interval = this.refreshInterval;
        if (interval < 1) {
          this.errorMessage = "Interval must be at least 1 minute.";
          return;
        }
        
        const response = await fetch("http://localhost:1880/start-auto-refresh-fio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes: interval })
        });
        
        if (!response.ok) {
          throw new Error(`Error starting auto refresh: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(data.message);
        alert(`Auto Refresh activated every ${interval} minutes`);
      } catch (error) {
        console.error("Error starting Auto Refresh:", error);
        this.errorMessage = `Error configuring Auto Refresh: ${error.message}`;
      } finally {
        this.isLoading = false;
      }
    }
  },
  mounted() {
    this.fetchLast90Days();
  }
};
</script>

<style>
/* Estilos globales (sin scoped para que afecten a DevExtreme) */
.transactions-container {
  width: 100%;
  min-height: 100vh;
  background: white;
  position: relative;
}
.transactions-table {
  width: 100%;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  margin-bottom: 10px;
  gap: 10px;
}
.query-type label {
  margin-right: 10px;
  font-weight: bold;
}
.query-buttons,
.date-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Encabezados para Fio y Pohoda */
.fio-header .dx-datagrid-text-content {
  background-color: #3498db !important;
  color: white !important;
  font-weight: bold !important;
}

.pohoda-header .dx-datagrid-text-content {
  background-color: #27ae60 !important;
  color: white !important;
  font-weight: bold !important;
}

/* Indicador de estado */
.status-indicator {
  display: inline-block;
}

.status-indicator-large {
  display: inline-block;
  width: 20px !important;
  height: 20px !important;
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

/* Warning dialog */
.warning-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;
}

.warning-dialog-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.warning-header {
  background-color: #f39c12;
  color: white;
  padding: 15px 20px;
}

.warning-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.warning-body {
  padding: 20px;
}

.warning-actions {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  background-color: #f5f5f5;
  gap: 10px;
}

.confirm-button {
  background-color: #f39c12;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-button {
  background-color: #e0e0e0;
  color: #333;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

/* Modal de detalles de transacción */
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
  max-width: 1000px;
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
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 5px;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.status-label, .log-label {
  font-weight: bold;
  min-width: 60px;
}

.status-text {
  font-weight: 500;
}

.status-log {
  display: flex;
  margin-top: 10px;
}

.log-content {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  flex: 1;
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
</style>

