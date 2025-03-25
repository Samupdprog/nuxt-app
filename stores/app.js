import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    isSidebarOpen: true,
    apiConfig: {},
    orders: [],
    logs: []
  }),
  actions: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    setApiConfig(config) {
      this.apiConfig = config;
    },
    setOrders(orders) {
      this.orders = orders;
    },
    setLogs(logs) {
      this.logs = logs;
    }
  }
});