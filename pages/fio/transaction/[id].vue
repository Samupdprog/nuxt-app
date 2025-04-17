<template>
  <AppLayout>
    <div class="transaction-details-page">
      <div class="page-header">
        <div class="header-row">
          <h1 class="page-title">Transaction Details</h1>
          <button @click="goBack" class="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Transactions
          </button>
        </div>
      </div>

      <div v-if="transaction" class="transaction-content">
        <div class="transaction-section">
          <h3>Transaction Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">{{ transaction.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date:</span>
              <span class="info-value">{{ transaction.date }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Amount:</span>
              <span :class="['info-value', {'positive': parseFloat(transaction.amount) > 0, 'negative': parseFloat(transaction.amount) < 0}]">
                {{ transaction.amount }} {{ transaction.currency }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Type:</span>
              <span class="info-value">{{ transaction.type || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Import Status:</span>
              <div class="status-with-indicator">
                <div :class="['status-indicator', transaction.status || 'unknown']" :title="getStatusTitle(transaction.status)"></div>
                <span class="info-value">{{ getStatusTitle(transaction.status) }}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">Payment Order ID:</span>
              <span class="info-value">{{ transaction.paymentOrderId || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div class="transaction-section">
          <h3>Counter Party Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Counter Account:</span>
              <span class="info-value">{{ transaction.counterAccount || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Counter Name:</span>
              <span class="info-value">{{ transaction.counterName || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Bank Code:</span>
              <span class="info-value">{{ transaction.bankCode || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Bank Name:</span>
              <span class="info-value">{{ transaction.bankName || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div class="transaction-section">
          <h3>Payment Details</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Variable Symbol:</span>
              <span class="info-value">{{ transaction.variableSymbol || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Constant Symbol:</span>
              <span class="info-value">{{ transaction.constantSymbol || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Specific Symbol:</span>
              <span class="info-value">{{ transaction.specificSymbol || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">User ID:</span>
              <span class="info-value">{{ transaction.userId || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div class="transaction-section">
          <h3>Additional Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Message:</span>
              <span class="info-value">{{ transaction.message || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Comment:</span>
              <span class="info-value">{{ transaction.comment || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Executed By:</span>
              <span class="info-value">{{ transaction.executor || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Status message section (only shown if there's a status message) -->
        <div v-if="transaction.statusMessage" class="transaction-section">
          <h3>Import Status Details</h3>
          <div class="status-message-container">
            <div :class="['status-message', getStatusMessageClass(transaction.status)]">
              {{ transaction.statusMessage }}
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-transaction">
        <p>Transaction not found. Please go back to the transactions list.</p>
        <button @click="goBack" class="btn btn-primary">
          Back to Transactions
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script>
export default {
  data() {
    return {
      transaction: null
    };
  },
  methods: {
    // Navigate back to transactions list
    goBack() {
      this.$router.push('/fio/fio_table');
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
    
    // Get status message class based on status
    getStatusMessageClass(status) {
      if (!status) return 'unknown';
      
      switch(status.toLowerCase()) {
        case 'success':
          return 'success';
        case 'warning':
          return 'success'; // Changed to success (green) as requested
        case 'error':
          return 'error';
        case 'already-imported':
          return 'already-imported';
        default:
          return 'unknown';
      }
    }
  },
  mounted() {
    // Get transaction data from localStorage
    const transactionData = localStorage.getItem('selectedTransaction');
    if (transactionData) {
      this.transaction = JSON.parse(transactionData);
    } else {
      // If no data in localStorage, try to fetch it based on route params
      // This would require an API call to get the transaction by ID
      // For now, we'll just set transaction to null
      this.transaction = null;
    }
  }
};
</script>

<style scoped>
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --success-color: #10b981;
  --warning-color: #10b981; /* Changed to green as requested */
  --error-color: #ef4444;
  --already-imported-color: #3b82f6; /* Blue color for already imported status */
  --text-color: #1f2937;
  --text-light: #6b7280;
  --border-color: #e5e7eb;
  --bg-light: #f9fafb;
  --bg-white: #ffffff;
}

.transaction-details-page {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 24px;
}

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

.transaction-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.transaction-section {
  background-color: var(--bg-white);
  border-radius: 8px;
  border: 1px solid var(--border-color);
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

.info-item {
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

.status-with-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
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

.positive {
  color: var(--success-color);
  font-weight: 600;
}

.negative {
  color: var(--error-color);
  font-weight: 600;
}

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
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--warning-color);
}

.status-message.error {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
}

.status-message.already-imported {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--already-imported-color);
  font-weight: 600;
  border-left: 4px solid var(--already-imported-color);
}

.status-message.unknown {
  background-color: rgba(107, 114, 128, 0.1);
  color: var(--text-light);
}

.no-transaction {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
  text-align: center;
  background-color: var(--bg-white);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

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

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>