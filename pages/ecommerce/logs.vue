<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Orders Error Logs</span>
        <v-spacer></v-spacer>
        <v-btn
          color="error"
          :loading="isDeleting"
          :disabled="isLoading || errors.length === 0"
          @click="confirmDelete"
        >
          <v-icon left>mdi-delete-sweep</v-icon>
          Clear All Errors
        </v-btn>
      </v-card-title>
      
      <v-card-subtitle>
        Errors found in Orders transaction processing
      </v-card-subtitle>
      
      <v-card-text>
        <v-alert
          v-if="apiError"
          type="error"
          closable
          @click:close="apiError = ''"
        >
          {{ apiError }}
        </v-alert>
        
        <v-alert
          v-if="deleteSuccess"
          type="success"
          closable
          @click:close="deleteSuccess = false"
        >
          Successfully deleted {{ deletedCount }} error(s)
        </v-alert>
        
        <div v-if="isLoading" class="d-flex flex-column align-center my-6">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <span class="mt-4 text-body-1">Loading errors...</span>
        </div>
        
        <div v-else-if="errors.length === 0" class="text-center my-6">
          <v-icon size="64" color="success">mdi-check-circle</v-icon>
          <div class="text-h6 mt-2">No errors found</div>
          <div class="text-body-2 text-grey">All Orders are importing correctly</div>
        </div>
        
        <v-data-table
          v-else
          :headers="headers"
          :items="errors"
          :items-per-page="10"
          :footer-props="{
            'items-per-page-options': [5, 10, 20, 50],
          }"
          class="elevation-1"
        >
          <template v-slot:item.timestamp="{ item }">
            {{ formatDate(item.timestamp) }}
          </template>
          
          <template v-slot:item.error="{ item }">
            <div class="error-message">
              {{ item.error }}
            </div>
          </template>
          
          <template v-slot:item.details="{ item }">
            <v-btn
              v-if="item.details"
              small
              text
              color="primary"
              @click="showDetails(item)"
            >
              View Details
            </v-btn>
            <span v-else class="text-caption text-grey">No details</span>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    
    <!-- Error Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="800px">
      <v-card>
        <v-card-title>
          Error Details
          <v-spacer></v-spacer>
          <v-btn icon @click="detailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-alert type="error" class="mb-4">
            {{ selectedError?.error }}
          </v-alert>
          
          <v-tabs v-model="activeTab">
            <v-tab>Formatted</v-tab>
            <v-tab>Raw JSON</v-tab>
          </v-tabs>
          
          <v-tabs-items v-model="activeTab">
            <v-tab-item>
              <v-card flat>
                <v-card-text>
                  <div v-if="selectedError?.details?.transactionId" class="mb-2">
                    <strong>Transaction ID:</strong> {{ selectedError.details.transactionId }}
                  </div>
                  <div v-if="selectedError?.details?.date" class="mb-2">
                    <strong>Date:</strong> {{ formatDate(selectedError.details.date) }}
                  </div>
                  <div v-if="selectedError?.details?.amount" class="mb-2">
                    <strong>Amount:</strong> {{ selectedError.details.amount }}
                  </div>
                  <div v-if="selectedError?.details?.message" class="mb-2">
                    <strong>Message:</strong> {{ selectedError.details.message }}
                  </div>
                  <div v-if="selectedError?.details?.code" class="mb-2">
                    <strong>Error Code:</strong> {{ selectedError.details.code }}
                  </div>
                  <div v-if="selectedError?.details?.stack" class="mb-2">
                    <strong>Stack Trace:</strong>
                    <pre class="error-stack">{{ selectedError.details.stack }}</pre>
                  </div>
                </v-card-text>
              </v-card>
            </v-tab-item>
            <v-tab-item>
              <v-card flat>
                <v-card-text>
                  <pre class="json-code">{{ JSON.stringify(selectedError?.details || {}, null, 2) }}</pre>
                </v-card-text>
              </v-card>
            </v-tab-item>
          </v-tabs-items>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete all {{ errors.length }} error logs? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteAllErrors">Delete All</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// State
const errors = ref([]);
const isLoading = ref(true);
const isDeleting = ref(false);
const apiError = ref('');
const deleteSuccess = ref(false);
const deletedCount = ref(0);
const deleteDialog = ref(false);
const detailsDialog = ref(false);
const selectedError = ref(null);
const activeTab = ref(0);

// Table headers
const headers = [
  { text: 'Timestamp', value: 'timestamp', sortable: true },
  { text: 'Error', value: 'error', sortable: false },
  { text: 'Transaction ID', value: 'transactionId', sortable: true },
  { text: 'Details', value: 'details', sortable: false, align: 'center' }
];

// Fetch errors on component mount
onMounted(async () => {
  await fetchErrors();
});

// Fetch errors from API
async function fetchErrors() {
  isLoading.value = true;
  apiError.value = '';
  
  try {
    const response = await fetch('http://35.180.124.4:1880/order-errors');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process the data
    if (Array.isArray(data)) {
      errors.value = data.map(error => {
        // Extraer transactionId si está disponible en details
        const transactionId = error.details?.transactionId || 
                             error.details?.transaction?.idFio || 
                             error.details?.transaction?.transactionId || 
                             'N/A';
        
        return {
          ...error,
          transactionId
        };
      });
    } else {
      errors.value = [];
      console.warn('API did not return an array:', data);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    apiError.value = `Failed to load errors: ${error.message}`;
    errors.value = [];
  } finally {
    isLoading.value = false;
  }
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

// Show error details
function showDetails(error) {
  selectedError.value = error;
  detailsDialog.value = true;
}

// Confirm delete
function confirmDelete() {
  deleteDialog.value = true;
}

// Delete all errors
async function deleteAllErrors() {
  deleteDialog.value = false;
  isDeleting.value = true;
  apiError.value = '';
  
  try {
    const response = await fetch('http://35.180.124.4:1880/delete-order-errors');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.deletedAll) {
      deletedCount.value = errors.value.length;
      deleteSuccess.value = true;
      errors.value = [];
    } else {
      throw new Error('Failed to delete all errors');
    }
  } catch (error) {
    console.error('Error deleting data:', error);
    apiError.value = `Failed to delete errors: ${error.message}`;
  } finally {
    isDeleting.value = false;
  }
}
</script>

<style scoped>
.error-message {
  max-width: 400px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.error-stack, .json-code {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.json-code {
  color: #333;
}
</style>
