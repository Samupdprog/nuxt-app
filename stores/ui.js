import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    rightDrawerOpen: false,
    userInfo: {
      name: '',
      email: ''
    }
  }),
  actions: {
    toggleRightDrawer() {
      this.rightDrawerOpen = !this.rightDrawerOpen;
    },
    loadUserInfo() {
      if (process.client) {
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            this.userInfo = JSON.parse(userStr);
          }
        } catch (e) {
          console.error('Error loading user info', e);
        }
      }
    }
  }
});
