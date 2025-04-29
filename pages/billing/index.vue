<template>
  <div class="container mx-auto p-4 max-w-xxl">
    <h1 class="text-2xl font-bold mb-6">Creating Invoice</h1>

    <!-- Panel de búsqueda y acciones principales -->
    <div class="bg-white p-6 rounded-lg shadow-sm mb-6">
      <div class="flex flex-col gap-4">
        <!-- Campo de búsqueda -->
        <div class="flex flex-col gap-4">
          <input
            id="variable-symbol"
            type="text"
            v-model="variableSymbol"
            placeholder="Enter variable symbol"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ref="inputField"
            @keyup.enter="handleSearch"
          />

          <!-- Acciones principales -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Acciones de procesamiento -->
            <div class="flex flex-wrap items-center gap-2">
              <button 
                @click="handleSearch"
                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[100px]"
                :disabled="loading || !variableSymbol"
              >
                <span v-if="loading" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing
                </span>
                <span v-else>Process</span>
              </button>

              <button 
                @click="generateModifiedPDF"
                class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                :disabled="loading || !variableSymbol"
              >
                Generate Modified PDF
              </button>

              <div class="flex items-center gap-2">
                <label class="inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="createAndDownloadPDF" class="sr-only peer">
                  <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span class="ml-2 text-sm font-medium text-gray-700">Download PDF</span>
                </label>
              </div>
            </div>

            <div class="h-8 w-px bg-gray-300 mx-2"></div>

            <!-- Acciones de administración -->
            <div class="flex flex-wrap items-center gap-2">
              <button 
                @click="deleteSingleLog"
                class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
                :disabled="loading || !variableSymbol"
              >
                Delete Current
              </button>

              <button 
                @click="deleteAllLogs" 
                class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
                :disabled="loading"
              >
                Delete All
              </button>
            </div>

            <div class="h-8 w-px bg-gray-300 mx-2"></div>

            <!-- Acciones de filtrado -->
            <div class="flex items-center gap-2">
              <button
                @click="filterSymbol = variableSymbol"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                :disabled="!variableSymbol"
              >
                Filter List
              </button>
              <button
                v-if="filterSymbol"
                @click="clearFilter"
                class="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                title="Clear filter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensajes de estado -->
    <div v-if="error" class="bg-green-50 border border-darkgreen-200 rounded-md p-4 mb-6">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p class="text-green-700">{{ error }}</p>
      </div>
    </div>

    <div v-if="duplicateWarning" class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p class="text-yellow-700">This variable symbol has already been imported.</p>
      </div>
    </div>

    <!-- Resultado de búsqueda -->
    <div v-if="result" class="bg-white border border-gray-200 rounded-md shadow-sm mb-6">
      <div class="p-6">
        <div class="flex items-start gap-4">
          <div :class="`rounded-full p-2 ${result.status === 'ok' ? 'bg-green-100' : 'bg-red-100'}`">
            <svg v-if="result.status === 'ok'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>

          <div class="flex-1">
            <div class="grid grid-cols-2 gap-2">
              <div class="text-sm text-gray-500">Invoice Number:</div>
              <div class="text-sm font-medium">{{ result.invoiceNumber }}</div>

              <div class="text-sm text-gray-500">Variable Symbol:</div>
              <div class="text-sm font-medium">{{ result.variableSymbol }}</div>

              <template v-if="result.parsedInfo">
                <div class="text-sm text-gray-500">Due Date:</div>
                <div class="text-sm font-medium">{{ result.parsedInfo.dateDue }}</div>

                <div class="text-sm text-gray-500">Total:</div>
                <div class="text-sm font-medium">{{ formatCurrency(result.parsedInfo.total) }}</div>
              </template>
            </div>

            <button 
              class="mt-4 w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="viewDetails"
            >
              More Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de facturas procesadas -->
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold">Processed Invoices</h2>
        <div class="flex items-center gap-4">
          <span v-if="filterSymbol" class="text-sm text-gray-600">
            Filtered by: {{ filterSymbol }}
          </span>
          <button 
            @click="refreshLogs"
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center space-x-2"
            :disabled="loadingInvoices"
          >
            <span v-if="loadingInvoices" class="inline-block animate-spin h-5 w-5">
              <svg class="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <span v-else class="inline-block h-5 w-5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </span>
            <span>{{ loadingInvoices ? 'Refreshing...' : 'Refresh' }}</span>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variable Symbol</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="invoice in filteredInvoices" :key="invoice.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ invoice.variableSymbol }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ getInvoiceNumber(invoice) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ invoice?.parsedInfo?.customer?.name || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatCurrency(invoice.parsedInfo?.total || 0) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(invoice.timestamp) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="`px-5 inline-flex text-xs leading-7 font-semibold rounded-full ${
                  invoice.status === 'ok' ? 'bg-green-200 text-green-900' : 
                  invoice.status === 'modified' ? 'bg-blue-200 text-blue-900' :
                  'bg-red-100 text-red-800'
                }`">
                  {{ invoice.status === 'modified' ? 'MODIFIED' : invoice.status === 'ok' ? 'OK' : 'Error' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button 
                  @click="viewInvoiceDetails(invoice)"
                  class="text-blue-600 hover:text-blue-900 focus:outline-none focus:underline"
                >
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="text-sm text-gray-500 mt-8">
      <p>Scan a barcode or enter a variable symbol and press Enter to search.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "BillingSearch",
  data() {
    return {
      variableSymbol: "",
      result: null,
      loading: false,
      error: "",
      processedInvoices: [],
      loadingInvoices: false,
      duplicateWarning: false,
      deleteVariableSymbol: "",
      createAndDownloadPDF: false,
      successSound: null,
      errorSound: null,
      lastProcessedSymbol: null,
      modifiedSymbol: "",
      filterSymbol: ""
    }
  },
  watch: {
    duplicateWarning(newVal) {
      if (newVal && this.errorSound) {
        console.log('Playing error sound for duplicate warning');
        this.errorSound.play().catch(error => {
          console.error('Error playing sound:', error);
        });
      }
    }
  },
  computed: {
    filteredInvoices() {
      if (!this.filterSymbol) {
        return this.processedInvoices;
      }
      const searchTerm = this.filterSymbol.toLowerCase().trim();
      return this.processedInvoices.filter(invoice => 
        invoice.variableSymbol?.toLowerCase().includes(searchTerm)
      );
    }
  },
  methods: {
    // New method to strip characters after special symbols
    stripSpecialCharacters(input) {
      // Define the special characters to check for
      const specialChars = ["'", ".", "-", "_", "*", "/"];
      
      // Find the first occurrence of any special character
      let firstSpecialCharIndex = -1;
      
      for (const char of specialChars) {
        const index = input.indexOf(char);
        if (index !== -1 && (firstSpecialCharIndex === -1 || index < firstSpecialCharIndex)) {
          firstSpecialCharIndex = index;
        }
      }
      
      // If a special character was found, return the substring before it
      if (firstSpecialCharIndex !== -1) {
        return input.substring(0, firstSpecialCharIndex);
      }
      
      // Otherwise, return the original input
      return input;
    },
    
    async handleSearch() {
      if (!this.variableSymbol.trim()) return;
      
      this.loading = true;
      this.error = "";
      this.duplicateWarning = false;
      
      try {
        // Actualizar la lista antes de la búsqueda
        await this.fetchProcessedInvoices();
        
        // Check if variable symbol already exists
        const exists = this.processedInvoices.some(
          invoice => invoice.variableSymbol === this.variableSymbol.trim()
        );
        
        if (exists) {
          this.duplicateWarning = true;
          this.loading = false;
          // Reproducir sonido de error incluso si es el mismo symbol
          if (this.errorSound) {
            this.errorSound.play().catch(error => {
              console.error('Error playing sound:', error);
            });
          }
          return;
        }

        // Process the variable symbol to strip characters after special symbols
        const processedSymbol = this.stripSpecialCharacters(this.variableSymbol.trim());
        
        if (this.createAndDownloadPDF) {
          // Si el switch está activado, solo descargamos el PDF
          const pdfResponse = await fetch(`http://35.180.124.4:1880/billing/final/${processedSymbol}/pdf`);
          if (!pdfResponse.ok) {
            console.log('Playing error sound for PDF error');
            this.errorSound.play().catch(error => {
              console.error('Error playing sound:', error);
            });
            throw new Error('Failed to generate PDF');
          }
          
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice_${processedSymbol}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          // Actualizamos el resultado con datos básicos para mostrar en la interfaz
          this.result = {
            status: 'ok',
            variableSymbol: processedSymbol,
            invoiceNumber: processedSymbol
          };
          console.log('Playing success sound for PDF success');
          this.successSound.play().catch(error => {
            console.error('Error playing sound:', error);
          });
        } else {
          // Si el switch está desactivado, obtenemos los datos completos
          const response = await fetch(`http://35.180.124.4:1880/billing/final/${processedSymbol}`)
          this.result = await response.json()
          if (this.result.status === 'ok') {
            console.log('Playing success sound for success');
            this.successSound.play().catch(error => {
              console.error('Error playing sound:', error);
            });
          } else {
            console.log('Playing error sound for error');
            this.errorSound.play().catch(error => {
              console.error('Error playing sound:', error);
            });
          }
        }
        
        // Clear the input field after successful search
        this.variableSymbol = ""
        
        // Focus the input field for the next scan
        this.focusInput()

        // Actualizar la lista después de la búsqueda
        await this.fetchProcessedInvoices()
      } catch (err) {
        this.error = "Failed to fetch invoice data"
        console.log('Playing error sound for general error');
        this.errorSound.play().catch(error => {
          console.error('Error playing sound:', error);
        });
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    viewDetails() {
      if (this.result) {
        this.$router.push({
          path: "/billing/details",
          query: { data: JSON.stringify(this.result) },
        })
      }
    },
    formatCurrency(amount) {
      const num = Number.parseFloat(amount)
      return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK" }).format(num)
    },
    focusInput() {
      this.$nextTick(() => {
        if (this.$refs.inputField) {
          this.$refs.inputField.focus()
        }
      })
    },
    handleKeyDown(e) {
      // If the input is not focused and the key is a printable character or Ctrl+V
      const isPrintableKey = e.key.length === 1 || (e.ctrlKey && e.key.toLowerCase() === 'v')
      const isInputFocused = document.activeElement === this.$refs.inputField
      
      if (!isInputFocused && isPrintableKey) {
        // Focus the input field
        this.focusInput()
      }
    },
    async fetchProcessedInvoices() {
      try {
        const response = await fetch('http://35.180.124.4:1880/logbilling/');
        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }
        const data = await response.json();
        
        // Validar y limpiar los datos antes de procesarlos
        const validData = data.filter(invoice => {
          // Asegurarse de que invoice y parsedInfo existan
          if (!invoice || !invoice.parsedInfo) return false;
          
          // Asegurarse de que los campos requeridos existan
          return invoice.variableSymbol && 
                 invoice.timestamp && 
                 invoice.status;
        });
        
        // Procesar los datos antes de asignarlos
        const processedData = [...validData].sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        // Marcar los duplicados
        const seen = new Set();
        processedData.forEach(invoice => {
          if (seen.has(invoice.variableSymbol)) {
            if (invoice.status === 'ok') {
              // Mantener el estado original
            }
          } else {
            seen.add(invoice.variableSymbol);
            if (invoice.status === 'generated') {
              invoice.status = 'modified';
            }
          }
        });
        
        // Asignar los datos procesados
        this.processedInvoices = processedData;
        console.log('Logs updated, found:', processedData.length, 'invoices');
      } catch (err) {
        console.error('Error fetching processed invoices:', err);
        this.error = "Failed to fetch invoice logs";
      }
    },
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    async deleteAllLogs() {
      if (!confirm('Are you sure you want to delete all logs? This action cannot be undone.')) return;
      
      this.loading = true;
      this.error = ""; // Limpiar cualquier error anterior
      try {
        const response = await fetch('http://35.180.124.4:1880/logbilling/delete/all', {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
          this.processedInvoices = [];
          this.error = "All logs have been deleted successfully";
          // Actualizar la lista después de borrar todo
          await this.fetchProcessedInvoices();
        } else {
          throw new Error(data.message || 'Failed to delete logs');
        }
      } catch (err) {
        this.error = err.message || "Failed to delete logs";
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    async deleteSingleLog() {
      if (!this.variableSymbol.trim()) return;
      
      if (!confirm(`Are you sure you want to delete logs for variable symbol: ${this.variableSymbol.trim()}?`)) return;
      
      this.loading = true;
      this.error = "";
      
      try {
        const response = await fetch(`http://35.180.124.4:1880/logbilling/${this.variableSymbol.trim()}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
          this.error = "Log deleted successfully";
          // Actualizar la lista después de borrar
          await this.fetchProcessedInvoices();
        } else {
          throw new Error(data.message || 'Failed to delete log');
        }
      } catch (err) {
        this.error = err.message || "Failed to delete log";
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    viewInvoiceDetails(invoice) {
      this.$router.push({
        path: "/billing/details",
        query: { data: JSON.stringify(invoice) }
      });
    },
    async generateModifiedPDF() {
      if (!this.variableSymbol.trim()) return;
      
      this.loading = true;
      this.error = "";
      this.duplicateWarning = false;
      
      try {
        await this.fetchProcessedInvoices();
        
        const matches = this.processedInvoices
          .filter(invoice => invoice.variableSymbol === this.variableSymbol.trim())
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (matches.length === 0) {
          throw new Error('Variable symbol not found in database');
        }

        const mostRecentInvoice = matches[0];
        console.log('Using most recent invoice:', mostRecentInvoice);

        // En lugar de abrir directamente, primero intentamos obtener el PDF
        const pdfUrl = `http://35.180.124.4:1880/billing/final/${this.variableSymbol.trim()}/pdfm`;
        
        // Mostrar mensaje de que se está procesando
        this.error = "Processing PDF, please wait...";
        
        // Crear un enlace temporal
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Esperar un momento y actualizar los logs
        setTimeout(async () => {
          await this.fetchProcessedInvoices();
          this.loading = false;
          this.variableSymbol = "";
          this.error = "Modified PDF processed successfully";
          
          if (this.successSound) {
            this.successSound.play().catch(error => {
              console.error('Error playing success sound:', error);
            });
          }
        }, 2000);
        
      } catch (error) {
        console.error('Error generating modified PDF:', error);
        this.error = `Failed to generate modified PDF: ${error.message}`;
        
        if (this.errorSound) {
          this.errorSound.play().catch(error => {
            console.error('Error playing error sound:', error);
          });
        }
        this.loading = false;
      }
    },
    async refreshLogs() {
      if (this.loadingInvoices) return;
      
      this.loadingInvoices = true;
      try {
        // Limpiar los datos actuales antes de la actualización
        this.processedInvoices = [];
        
        // Pequeña pausa para asegurar que la UI se actualice
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await this.fetchProcessedInvoices();
        
        // Mostrar mensaje de éxito temporal
        this.error = "Logs refreshed successfully";
        setTimeout(() => {
          if (this.error === "Logs refreshed successfully") {
            this.error = "";
          }
        }, 2000);
      } catch (err) {
        console.error('Error refreshing logs:', err);
        this.error = "Failed to refresh logs";
      } finally {
        this.loadingInvoices = false;
      }
    },
    getInvoiceNumber(invoice) {
      if (typeof invoice.invoiceNumber === 'string') {
        return invoice.invoiceNumber;
      }
      if (typeof invoice.invoiceNumber === 'object' && invoice.invoiceNumber['typ:numberRequested']) {
        return invoice.invoiceNumber['typ:numberRequested'];
      }
      if (invoice.parsedInfo?.numberRequested) {
        return invoice.parsedInfo.numberRequested;
      }
      return 'N/A';
    },
    clearFilter() {
      this.filterSymbol = "";
    }
  },
  mounted() {
    // Focus the input field when the component is mounted
    this.focusInput();
    
    // Add global event listener for keyboard input
    document.addEventListener('keydown', this.handleKeyDown);

    // Fetch processed invoices
    this.fetchProcessedInvoices();

    // Initialize sounds
    try {
      // Usar rutas absolutas
      const baseUrl = window.location.origin;
      this.successSound = new Audio(`${baseUrl}/sounds/success.mp3`);
      this.errorSound = new Audio(`${baseUrl}/sounds/error.mp3`);
      
      // Precargar los sonidos
      this.successSound.load();
      this.errorSound.load();
    } catch (error) {
      console.error('Error initializing sounds:', error);
    }

    // Configurar un intervalo para actualizar los logs periódicamente
    this.logsInterval = setInterval(() => {
      if (!this.loading) {
        this.fetchProcessedInvoices();
      }
    }, 5000); // Actualizar cada 5 segundos si no hay operaciones en curso
  },
  beforeDestroy() {
    // Remove event listener when component is destroyed
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // Clear the logs update interval
    if (this.logsInterval) {
      clearInterval(this.logsInterval);
    }
  }
}
</script>

<style scoped>
/* You can add any additional custom styles here */
</style>