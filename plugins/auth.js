import { defineNuxtPlugin, addRouteMiddleware, navigateTo } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  // Only add the middleware on the client side
  if (process.client) {
    addRouteMiddleware('auth', (to) => {
      // Skip middleware for login page
      if (to.path === '/login') return;
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        return navigateTo('/login');
      }
    }, { global: true });
  }
  
  return {
    provide: {
      logout: () => {
        // Only run on client
        if (process.client) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        return navigateTo('/login');
      },
      getUser: () => {
        // Only run on client
        if (process.client) {
          try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
          } catch (e) {
            console.error('Error parsing user data', e);
          }
        }
        return null;
      },
      isAuthenticated: () => {
        // Only run on client
        if (process.client) {
          return !!localStorage.getItem('token');
        }
        return false;
      }
    }
  };
});
