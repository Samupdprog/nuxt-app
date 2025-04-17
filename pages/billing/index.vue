<template>
    <div class="container mx-auto p-4 max-w-xl">
      <h1 class="text-2xl font-bold mb-6">Invoice Lookup</h1>
  
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
  
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p class="text-red-700">{{ error }}</p>
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
      }
    },
    methods: {
      async handleSearch() {
        if (!this.variableSymbol.trim()) return
  
        this.loading = true
        this.error = ""
  
        try {
          const response = await fetch(`http://35.180.124.4:1880/billing/final/${this.variableSymbol}`)
          const data = await response.json()
  
          this.result = data
          
          // Clear the input field after successful search
          this.variableSymbol = ""
          
          // Focus the input field for the next scan
          this.focusInput()
        } catch (err) {
          this.error = "Failed to fetch invoice data"
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
      }
    },
    mounted() {
      // Focus the input field when the component is mounted
      this.focusInput()
      
      // Add global event listener for keyboard input
      document.addEventListener('keydown', this.handleKeyDown)
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