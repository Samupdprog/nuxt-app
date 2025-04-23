<template>
  <div class="container mx-auto p-4 max-w-xxl">
    <h1 class="text-2xl font-bold mb-6">Creating Invoice</h1>

    <div class="flex items-center gap-2 mb-4">
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" v-model="createAndDownloadPDF" class="sr-only peer">
        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        <span class="ml-3 text-sm font-medium text-gray-700">Create and Download PDF</span>
      </label>
    </div>

    <form @submit.prevent="handleSearch" class="mb-6">
      <div class="flex gap-2">
        <input
          id="variable-symbol"
          type="text"
          v-model="variableSymbol"
          placeholder="Enter variable symbol"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ref="inputField"
        />
        <button 
          type="submit" 
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          :disabled="loading"
        >
          {{ loading ? "Searching..." : "Search" }}
        </button>
      </div>
    </form>

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

    <!-- Warning for duplicate variable symbol -->
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

        <!-- Admin Controls -->
        <div class="flex gap-4 mb-6">
      <button 
        @click="deleteAllLogs" 
        class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        :disabled="loading"
      >
        Delete All Logs
      </button>
      <div class="flex gap-2">
        <input
          type="text"
          v-model="deleteVariableSymbol"
          placeholder="Enter variable symbol to delete"
          class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          @click="deleteSingleLog" 
          class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          :disabled="loading || !deleteVariableSymbol"
        >
          Delete Log
        </button>
      </div>
    </div>

    <div class="text-sm text-gray-500 mt-8">
      <p>Scan a barcode or enter a variable symbol and press Enter to search.</p>
    </div>

    <!-- Tabla de facturas procesadas -->
    <div class="mt-8">
      <h2 class="text-xl font-semibold mb-4">Processed Invoices</h2>
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
            <tr v-for="invoice in processedInvoices" :key="invoice.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ invoice.variableSymbol }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ invoice.invoiceNumber }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ invoice.customer.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatCurrency(invoice.parsedInfo.total) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(invoice.timestamp) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="`px-5 inline-flex text-xs leading-7 font-semibold rounded-full ${invoice.status === 'ok' ? 'bg-green-200 text-green-900' : 'bg-red-100 text-red-800'}`">
                  {{ invoice.status === 'ok' ? 'OK' : 'Error' }}
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
      lastProcessedSymbol: null
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
      if (!this.variableSymbol.trim()) return
      
      this.loading = true
      this.error = ""
      this.duplicateWarning = false
      
      try {
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

        // Refresh the processed invoices list
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
      this.loadingInvoices = true;
      try {
        const response = await fetch('http://35.180.124.4:1880/logbilling/');
        const data = await response.json();
        this.processedInvoices = data;
      } catch (err) {
        console.error('Error fetching processed invoices:', err);
      } finally {
        this.loadingInvoices = false;
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
      if (!this.deleteVariableSymbol.trim()) return;
      
      this.loading = true;
      this.error = ""; // Limpiar cualquier error anterior
      try {
        const response = await fetch(`http://35.180.124.4:1880/logbilling/${this.deleteVariableSymbol.trim()}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
          this.processedInvoices = this.processedInvoices.filter(
            invoice => invoice.variableSymbol !== this.deleteVariableSymbol.trim()
          );
          this.deleteVariableSymbol = '';
          this.error = "Log deleted successfully";
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
    }
  },
  mounted() {
    // Focus the input field when the component is mounted
    this.focusInput()
    
    // Add global event listener for keyboard input
    document.addEventListener('keydown', this.handleKeyDown)

    // Fetch processed invoices
    this.fetchProcessedInvoices()

    // Initialize sounds
    try {
      // Usar rutas absolutas
      const baseUrl = window.location.origin;
      this.successSound = new Audio(`${baseUrl}/sounds/success.mp3`);
      this.errorSound = new Audio(`${baseUrl}/sounds/error.mp3`);
      
      // Precargar los sonidos
      this.successSound.load();
      this.errorSound.load();
      
      // Añadir event listeners para depuración
      this.successSound.addEventListener('canplaythrough', () => {
        console.log('Success sound loaded');
      });
      this.errorSound.addEventListener('canplaythrough', () => {
        console.log('Error sound loaded');
      });
      
      this.successSound.addEventListener('error', (e) => {
        console.error('Error loading success sound:', e);
      });
      this.errorSound.addEventListener('error', (e) => {
        console.error('Error loading error sound:', e);
      });
    } catch (error) {
      console.error('Error initializing sounds:', error);
    }
  },
  beforeDestroy() {
    // Remove event listener when component is destroyed
    document.removeEventListener('keydown', this.handleKeyDown)
  }
}
</script>

<style scoped>
/* You can add any additional custom styles here */
</style>