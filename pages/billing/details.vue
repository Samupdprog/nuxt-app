<template>
    <div class="container mx-auto p-4 max-w-3xl">
      <div class="flex items-center mb-6">
        <button 
          @click="$router.back()" 
          class="mr-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </button>
        <h1 class="text-2xl font-bold">Invoice Details</h1>
      </div>
  
      <div v-if="!invoiceData" class="text-center py-8">
        <p>Loading...</p>
      </div>
  
      <template v-else>
        <div class="bg-white border border-gray-200 rounded-md shadow-sm mb-6">
          <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold">Invoice Status</h2>
            <div :class="`rounded-full p-2 ${invoiceData.status === 'ok' ? 'bg-green-100' : 'bg-red-100'}`">
              <svg v-if="invoiceData.status === 'ok'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-y-2">
              <div class="text-sm text-gray-500">Invoice ID:</div>
              <div class="text-sm font-medium">{{ invoiceData.invoiceId }}</div>
  
              <div class="text-sm text-gray-500">Invoice Number:</div>
              <div class="text-sm font-medium">{{ invoiceData.invoiceNumber }}</div>
  
              <div class="text-sm text-gray-500">Variable Symbol:</div>
              <div class="text-sm font-medium">{{ invoiceData.variableSymbol }}</div>
  
              <template v-if="invoiceData.parsedInfo">
                <div class="text-sm text-gray-500">Due Date:</div>
                <div class="text-sm font-medium">{{ invoiceData.parsedInfo.dateDue }}</div>
  
                <div class="text-sm text-gray-500">Total:</div>
                <div class="text-sm font-medium">{{ formatCurrency(invoiceData.parsedInfo.total) }}</div>
              </template>
            </div>
          </div>
        </div>
  
        <div v-if="invoiceData.parsedInfo && invoiceData.parsedInfo.items" class="bg-white border border-gray-200 rounded-md shadow-sm mb-6">
          <div class="border-b border-gray-200 px-6 py-4">
            <h2 class="text-xl font-semibold">Invoice Items</h2>
          </div>
          <div class="p-6">
            <div v-for="(item, index) in invoiceData.parsedInfo.items" :key="index" class="mb-4">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h3 class="font-medium">{{ item.name }}</h3>
                  <p v-if="item.note && item.note !== item.name" class="text-sm text-gray-500">{{ item.note }}</p>
                </div>
                <div class="text-right">
                  <div class="font-medium">{{ formatCurrency(item.priceSum) }}</div>
                  <div class="text-sm text-gray-500">
                    {{ item.quantity }} × {{ formatCurrency(item.unitPrice) }}
                  </div>
                </div>
              </div>
              <hr v-if="index < invoiceData.parsedInfo.items.length - 1" class="my-4 border-gray-200" />
            </div>
          </div>
        </div>
  
        <div v-if="invoiceData.customer" class="bg-white border border-gray-200 rounded-md shadow-sm mb-6">
          <div class="border-b border-gray-200 px-6 py-4">
            <h2 class="text-xl font-semibold">Customer Information</h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-y-2">
              <div class="text-sm text-gray-500">Name:</div>
              <div class="text-sm font-medium">{{ invoiceData.customer.name }}</div>
  
              <div class="text-sm text-gray-500">Address:</div>
              <div class="text-sm font-medium">
                {{ invoiceData.customer.street }}<br />
                {{ invoiceData.customer.zip }} {{ invoiceData.customer.city }}<br />
                {{ invoiceData.customer.country }}
              </div>
  
              <div class="text-sm text-gray-500">Email:</div>
              <div class="text-sm font-medium">{{ invoiceData.customer.email }}</div>
  
              <div class="text-sm text-gray-500">Phone:</div>
              <div class="text-sm font-medium">{{ invoiceData.customer.phone }}</div>
            </div>
          </div>
        </div>
  
        <div v-if="invoiceData.warnings && invoiceData.warnings.length > 0" class="bg-white border border-gray-200 rounded-md shadow-sm">
          <div class="border-b border-gray-200 px-6 py-4">
            <h2 class="text-xl font-semibold">Warnings</h2>
          </div>
          <div class="p-6">
            <div v-for="(warning, index) in invoiceData.warnings" :key="index" class="mb-2 p-2 bg-yellow-50 rounded-md">
              <div class="text-sm font-medium">
                Error {{ warning.errno }}: {{ warning.note }}
              </div>
              <div v-if="warning.xpath" class="text-xs text-gray-500">Path: {{ warning.xpath }}</div>
              <div v-if="warning.valueRequested" class="text-xs text-gray-500">
                Requested: {{ warning.valueRequested }}, Produced: {{ warning.valueProduced }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </template>
  
  <script>
  export default {
    name: "BillingDetails",
    data() {
      return {
        invoiceData: null,
      }
    },
    methods: {
      formatCurrency(amount) {
        const num = Number.parseFloat(amount)
        return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK" }).format(num)
      },
    },
    mounted() {
      const dataParam = this.$route.query.data
      if (dataParam) {
        try {
          this.invoiceData = JSON.parse(dataParam)
        } catch (err) {
          console.error("Failed to parse invoice data", err)
          this.$router.push("/billing")
        }
      } else {
        this.$router.push("/billing")
      }
    },
  }
  </script>
  
  <style scoped>
  /* You can add any additional custom styles here */
  </style>