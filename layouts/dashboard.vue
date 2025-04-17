<template>
  <AppLayout>
  <div class="app-container">
  

    <!-- Main Content -->
    <main class="main-content">
      <header class="main-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <div class="user-dropdown">
            <button class="user-dropdown-toggle">
              <img 
                :src="uiStore.userInfo.avatar || 'https://randomuser.me/api/portraits/men/85.jpg'" 
                alt="User avatar" 
                class="user-avatar-small"
              />
              <span>{{ uiStore.userInfo.name || 'Admin' }}</span>
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="user-dropdown-menu">
              <a href="#" class="dropdown-item">Profile</a>
              <a href="#" class="dropdown-item">Settings</a>
              <div class="dropdown-divider"></div>
              <a href="#" class="dropdown-item" @click.prevent="logout">Logout</a>
            </div>
          </div>
        </div>
      </header>
      
      <div class="content-wrapper">
        <slot />
      </div>
    </main>

    <!-- Right Panel (optional) -->
    <aside class="right-panel" v-if="uiStore.rightDrawerOpen">
      <div class="right-panel-header">
        <h3>Recent Pages</h3>
        <button class="close-panel" @click="uiStore.toggleRightDrawer">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="right-panel-content">
        <div class="recent-sites">
          <h4>Quick Access</h4>
          <ul>
            <li v-for="(site, index) in recentSites" :key="index">
              <router-link :to="site.path">{{ site.name }}</router-link>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  </div>
  </AppLayout>
</template>

<script>
import AppLayout from './AppLayout.vue';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUIStore } from '../stores/ui';

export default {
  components: {
    AppLayout
  }
}
const router = useRouter();
const route = useRoute();
const uiStore = useUIStore();

const sidebarCollapsed = ref(false);
const ecommerceMenuOpen = ref(true);

const recentSites = ref([
  { name: 'E-commerce Products', path: '/ecommerce/products/products_table' },
  { name: 'Orders', path: '/ecommerce/orders_table' },
  { name: 'Fio Transactions', path: '/fio/fio_table' }
]);

const pageTitle = computed(() => {
  // Extract page title from route
  const path = route.path;
  if (path.includes('dashboard')) return 'Dashboard';
  if (path.includes('products_table')) return 'Imported Products';
  if (path.includes('orders_table')) return 'Orders';
  if (path.includes('config')) return 'Configuration';
  if (path.includes('logs')) return 'Logs';
  if (path.includes('fio_table')) return 'Fio Transactions';
  return 'Dashboard';
});

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

function toggleEcommerceMenu() {
  ecommerceMenuOpen.value = !ecommerceMenuOpen.value;
}

// Only run on client-side
onMounted(() => {
  if (process.client) {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Load user info
    uiStore.loadUserInfo();
    
    // Add event listener for the right panel toggle
    window.addEventListener('keydown', handleKeyDown);
  }
});

onBeforeUnmount(() => {
  if (process.client) {
    window.removeEventListener('keydown', handleKeyDown);
  }
});

function handleKeyDown(e) {
  // Toggle right panel with Ctrl+B or Cmd+B
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    uiStore.toggleRightDrawer();
  }
}

function logout() {
  if (process.client) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
  router.push("/login");
}
</script>

<style scoped>
/* Base styles */
:root {
  --primary-color: #4f46e5;
  --primary-hover: #4338ca;
  --secondary-color: #f3f4f6;
  --text-color: #1f2937;
  --text-light: #6b7280;
  --border-color: #e5e7eb;
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 70px;
  --header-height: 64px;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --transition: all 0.3s ease;
}

.app-container {
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb;
  color: var(--text-color);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

/* Sidebar styles */
.sidebar {
  width: var(--sidebar-width);
  background-color: #fff;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: var(--transition);
  z-index: 10;
  box-shadow: var(--shadow-sm);
}

.sidebar-collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  overflow: hidden;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-light);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toggle-sidebar {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.toggle-sidebar:hover {
  background-color: var(--secondary-color);
}

.sidebar-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 0;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  gap: 0.75rem;
  transition: var(--transition);
  border-radius: 0.25rem;
  margin: 0 0.5rem 0.25rem 0.5rem;
}

.nav-item:hover {
  background-color: var(--secondary-color);
}

.nav-item.active {
  background-color: rgba(79, 70, 229, 0.1);
  color: var(--primary-color);
  font-weight: 500;
}

.nav-item i {
  font-size: 1rem;
  width: 20px;
  text-align: center;
}

.nav-group {
  margin-bottom: 0.5rem;
}

.nav-group-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  cursor: pointer;
  gap: 0.75rem;
  transition: var(--transition);
  border-radius: 0.25rem;
  margin: 0 0.5rem 0.25rem 0.5rem;
}

.nav-group-header:hover {
  background-color: var(--secondary-color);
}

.nav-group-header i:first-child {
  font-size: 1rem;
  width: 20px;
  text-align: center;
}

.nav-group-header i:last-child {
  margin-left: auto;
  font-size: 0.75rem;
}

.nav-group-items {
  margin-left: 1rem;
}

.sub-item {
  font-size: 0.9rem;
  padding: 0.6rem 1rem 0.6rem 1.75rem;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
}

.logout-button:hover {
  background-color: var(--secondary-color);
}

/* Main content styles */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  background-color: #fff;
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.user-dropdown {
  position: relative;
}

.user-dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
}

.user-dropdown-toggle:hover {
  background-color: var(--secondary-color);
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background-color: #fff;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  box-shadow: var(--shadow-md);
  margin-top: 0.5rem;
  z-index: 20;
  display: none;
}

.user-dropdown:hover .user-dropdown-menu {
  display: block;
}

.dropdown-item {
  display: block;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  transition: var(--transition);
}

.dropdown-item:hover {
  background-color: var(--secondary-color);
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 0.5rem 0;
}

.content-wrapper {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

/* Right panel styles */
.right-panel {
  width: 280px;
  background-color: #fff;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
}

.right-panel-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.right-panel-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.close-panel {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-panel:hover {
  background-color: var(--secondary-color);
}

.right-panel-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.recent-sites h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: var(--text-light);
}

.recent-sites ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recent-sites li {
  margin-bottom: 0.5rem;
}

.recent-sites a {
  display: block;
  padding: 0.5rem;
  color: var(--text-color);
  text-decoration: none;
  border-radius: 0.25rem;
  transition: var(--transition);
}

.recent-sites a:hover {
  background-color: var(--secondary-color);
}

/* Responsive styles */
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    height: 100%;
    transform: translateX(0);
  }
  
  .sidebar-collapsed {
    transform: translateX(calc(-1 * var(--sidebar-width)));
  }
  
  .right-panel {
    position: fixed;
    right: 0;
    height: 100%;
  }
}

@media (max-width: 768px) {
  .main-header {
    padding: 0 1rem;
  }
  
  .content-wrapper {
    padding: 1rem;
  }
}
</style>