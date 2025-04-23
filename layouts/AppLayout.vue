<template>
    <div class="app-container">
      <!-- Sidebar -->
      <aside v-if="!isLoginPage" class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <div class="sidebar-header">
          <div class="logo-container">
            <img src="https://tlusty-praha.s23.cdn-upgates.com/_cache/d/6/d6a5fcfb0be6589e080ed53ffb09eb44-tlusty-logo-new-png.png" alt="Logo" class="logo" />
          </div>
          <button @click="toggleSidebar" class="toggle-btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path v-if="sidebarCollapsed" d="M13 17l5-5-5-5M6 17l5-5-5-5"></path>
              <path v-else d="M11 17l-5-5 5-5M18 17l-5-5 5-5"></path>
            </svg>
          </button>
        </div>
  
        <div class="user-profile" v-if="!sidebarCollapsed">
          <img src="https://tlusty-praha.s23.cdn-upgates.com/_cache/d/6/d6a5fcfb0be6589e080ed53ffb09eb44-tlusty-logo-new-png.png" alt="User Avatar" class="avatar" />
          <div class="user-info">
            <div class="user-name">Admin</div>
            <div class="user-email">admin@example.com</div>
          </div>
        </div>
        
        <div class="user-profile-collapsed" v-else>
          <img src="https://tlusty-praha.s23.cdn-upgates.com/_cache/d/6/d6a5fcfb0be6589e080ed53ffb09eb44-tlusty-logo-new-png.png" alt="User Avatar" class="avatar-small" />
        </div>
  
        <div class="sidebar-divider"></div>
  
        <nav class="sidebar-nav">
          <NuxtLink to="/dashboard" class="nav-item" active-class="active">
            <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span v-if="!sidebarCollapsed">Dashboard</span>
          </NuxtLink>
  
          <div class="nav-group">
            <div class="nav-group-header" @click="toggleEcommerceMenu">
              <div class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span v-if="!sidebarCollapsed">E-commerce to Pohoda</span>
              </div>
              <svg v-if="!sidebarCollapsed" xmlns="http://www.w3.org/2000/svg" class="arrow-icon" :class="{ 'arrow-down': ecommerceMenuOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            <div class="nav-group-items" v-if="ecommerceMenuOpen || sidebarCollapsed">
              <NuxtLink to="/ecommerce/products/products_table" class="nav-subitem" active-class="active">
                <span v-if="!sidebarCollapsed">Products</span>
                <span v-else class="tooltip">Products</span>
              </NuxtLink>
              <NuxtLink to="/ecommerce/orders_table" class="nav-subitem" active-class="active">
                <span v-if="!sidebarCollapsed">Orders</span>
                <span v-else class="tooltip">Orders</span>
              </NuxtLink>
              <NuxtLink to="/ecommerce/config" class="nav-subitem" active-class="active">
                <span v-if="!sidebarCollapsed">Configuration</span>
                <span v-else class="tooltip">Configuration</span>
              </NuxtLink>
              <NuxtLink to="/ecommerce/logs" class="nav-subitem" active-class="active">
                <span v-if="!sidebarCollapsed">Logs</span>
                <span v-else class="tooltip">Logs</span>
              </NuxtLink>
            </div>
          </div>
  
          <div class="nav-group">
            <div class="nav-group-header" @click="toggleFioMenu">
              <div class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                <span v-if="!sidebarCollapsed">Fio</span>
              </div>
              <svg v-if="!sidebarCollapsed" xmlns="http://www.w3.org/2000/svg" class="arrow-icon" :class="{ 'arrow-down': fioMenuOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            <div class="nav-group-items" v-if="fioMenuOpen || sidebarCollapsed">
              <NuxtLink to="/fio/fio_table" class="nav-subitem" active-class="active">
                <span v-if="!sidebarCollapsed">Transactions</span>
                <span v-else class="tooltip">Transactions</span>
              </NuxtLink>
              <NuxtLink to="/fio/logs" class="nav-subitem" active-class="active">
                <span v-if="!sidebarCollapsed">Error Logs</span>
                <span v-else class="tooltip">Error Logs</span>
              </NuxtLink>
            </div>
          </div>
  
          <!-- New Billing Section -->
          <div class="nav-group">
            <div class="nav-group-header" @click="toggleBillingMenu">
              <div class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span v-if="!sidebarCollapsed">Billing</span>
              </div>
              <svg v-if="!sidebarCollapsed" xmlns="http://www.w3.org/2000/svg" class="arrow-icon" :class="{ 'arrow-down': billingMenuOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            <div class="nav-group-items" v-if="billingMenuOpen || sidebarCollapsed">
              <NuxtLink to="/billing" class="nav-subitem" active-class="active">
                <span v-if="!sidebarCollapsed">Invoice Lookup</span>
                <span v-else class="tooltip">Invoice Lookup</span>
              </NuxtLink>
            </div>
          </div>
        </nav>
      </aside>
  
      <!-- Main Content -->
      <main class="main-content" :class="{ 'main-expanded': sidebarCollapsed }">
        <slot></slot>
      </main>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AppLayout',
    data() {
      return {
        sidebarCollapsed: false,
        ecommerceMenuOpen: true,
        fioMenuOpen: true,
        billingMenuOpen: true,
        isLoginPage: false
      };
    },
    methods: {
      toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        // Guardar preferencia en localStorage
        localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);
      },
      toggleEcommerceMenu() {
        if (!this.sidebarCollapsed) {
          this.ecommerceMenuOpen = !this.ecommerceMenuOpen;
        }
      },
      toggleFioMenu() {
        if (!this.sidebarCollapsed) {
          this.fioMenuOpen = !this.fioMenuOpen;
        }
      },
      toggleBillingMenu() {
        if (!this.sidebarCollapsed) {
          this.billingMenuOpen = !this.billingMenuOpen;
        }
      }
    },
    mounted() {
      // Recuperar preferencia de localStorage
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        this.sidebarCollapsed = savedState === 'true';
      }
      
      // Verificar si estamos en la página de login
      this.isLoginPage = this.$route.path === '/login';
    },
    watch: {
      '$route'(to) {
        // Actualizar isLoginPage cuando cambia la ruta
        this.isLoginPage = to.path === '/login';
      }
    }
  };
  </script>
  
  <style scoped>
  :root {
    --primary-color: #3b82f6;
    --primary-hover: #2563eb;
    --primary-light: rgba(59, 130, 246, 0.1);
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    --text-color: #1f2937;
    --text-light: #6b7280;
    --border-color: #e5e7eb;
    --bg-light: #f9fafb;
    --bg-white: #ffffff;
    --sidebar-width: 120px;
    --sidebar-collapsed-width: 70px;
    --sidebar-bg: #ffffff;
    --sidebar-hover: #f3f4f6;
    --sidebar-active: var(--primary-light);
    --sidebar-active-border: var(--primary-color);
    --transition-speed: 0.3s;
  }
  
  .app-container {
    display: flex;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  /* Sidebar */
  .sidebar {
    width: var(--sidebar-width);
    height: 100%;
    background-color: var(--sidebar-bg);
    border-right: 1px solid var(--border-color);
    transition: width var(--transition-speed) ease;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 100;
  }
  
  .sidebar-collapsed {
    width: var(--sidebar-collapsed-width);
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    height: 64px;
  }
  
  .logo-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .logo {
    width: 32px;
    height: 32px;
    border-radius: 6px;
  }
  
  .logo-text {
    font-weight: 600;
    font-size: 16px;
    color: var(--text-color);
  }
  
  .toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-light);
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .toggle-btn:hover {
    background-color: var(--sidebar-hover);
  }
  
  .toggle-btn .icon {
    width: 18px;
    height: 18px;
  }
  
  .user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .user-profile-collapsed {
    display: flex;
    justify-content: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--border-color);
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .avatar-small {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
  }
  
  .user-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--text-color);
  }
  
  .user-email {
    font-size: 12px;
    color: var(--text-light);
  }
  
  .sidebar-divider {
    height: 1px;
    background-color: var(--border-color);
    margin: 8px 0;
  }
  
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    padding: 5px;
    overflow-y: auto;
    flex: 1;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 6px;
    color: var(--text-color);
    text-decoration: none;
    margin-bottom: 4px;
    transition: background-color 0.2s;
    position: relative;
  }
  
  .nav-item:hover {
    background-color: var(--sidebar-hover);
  }
  
  .nav-item.active {
    background-color: var(--sidebar-active);
    color: var(--primary-color);
    font-weight: 500;
    border-left: 3px solid var(--sidebar-active-border);
  }
  
  .nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  .nav-group {
    margin-bottom: 4px;
  }
  
  .nav-group-header {
    cursor: pointer;
  }
  
  .arrow-icon {
    width: 16px;
    height: 16px;
    transition: transform 0.2s;
  }
  
  .arrow-down {
    transform: rotate(180deg);
  }
  
  .nav-group-items {
    padding-left: 12px;
    margin-top: 4px;
    display: flex;
    flex-direction: column;
  }
  
  .nav-subitem {
    display: flex;
    align-items: center;
    padding: 8px 12px 8px 32px;
    border-radius: 6px;
    color: var(--text-light);
    text-decoration: none;
    margin-bottom: 2px;
    transition: background-color 0.2s;
    position: relative;
  }
  
  .nav-subitem:hover {
    background-color: var(--sidebar-hover);
  }
  
  .nav-subitem.active {
    background-color: var(--sidebar-active);
    color: var(--primary-color);
    font-weight: 500;
  }
  
  /* Tooltip para el menú colapsado */
  .tooltip {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.2s, visibility 0.2s;
    z-index: 1000;
    margin-left: 10px;
  }
  
  .tooltip::before {
    content: '';
    position: absolute;
    top: 50%;
    right: 100%;
    margin-top: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent rgba(0, 0, 0, 0.8) transparent transparent;
  }
  
  .nav-subitem:hover .tooltip,
  .nav-item:hover .tooltip {
    visibility: visible;
    opacity: 1;
  }
  
  /* Main Content */
  .main-content {
    flex: 1;
    overflow: auto;
    transition: margin-left var(--transition-speed) ease;
    margin-left: 0;
  }
  
  .main-content:not(:has(+ .sidebar)) {
    margin-left: 0;
  }
  
  .main-expanded {
    margin-left: calc(var(--sidebar-collapsed-width) - var(--sidebar-width));
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
      transform: translateX(0);
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    }
    
    .sidebar-collapsed {
      transform: translateX(calc(-1 * var(--sidebar-width) + var(--sidebar-collapsed-width)));
    }
    
    .main-content {
      margin-left: 0;
    }
    
    .main-expanded {
      margin-left: var(--sidebar-collapsed-width);
    }
  }
  </style>