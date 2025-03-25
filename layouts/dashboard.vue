<template>
  <v-app>
    <!-- Left Navigation Drawer -->
    <v-navigation-drawer expand-on-hover rail app>
      <v-list>
        <v-list-item
          prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg"
          :title="uiStore.userInfo.name || 'Admin'"
          :subtitle="uiStore.userInfo.email || 'admin@example.com'"
        ></v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard" title="Dashboard"></v-list-item>
        
        <v-list-group prepend-icon="mdi-cart" value="ecommerce">
          <template v-slot:activator>
            <v-list-item-title>E-commerce to Pohoda</v-list-item-title>
          </template>
          <v-list-item to="/ecommerce/products/products_table" title="Imported Products"></v-list-item>
          <v-list-item to="/ecommerce/orders_table" title="Orders"></v-list-item>
          <v-list-item to="/ecommerce/config" title="Configuration"></v-list-item>
          <v-list-item to="/ecommerce/logs" title="Logs"></v-list-item>
        </v-list-group>
        
        <v-list-item to="/preforma/products" prepend-icon="mdi-file-document" title="Preforma Invoice"></v-list-item>
        <v-list-item to="/fio/fio_table" prepend-icon="mdi-bank" title="Fio Transactions"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <slot />
    </v-main>

    <!-- Right Side Panel -->
    <v-navigation-drawer
      v-model="uiStore.rightDrawerOpen"
      location="right"
      temporary
      width="300"
    >
      <v-list>
        <v-list-item
          prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg"
          :title="uiStore.userInfo.name || 'Admin'"
          :subtitle="uiStore.userInfo.email || 'admin@example.com'"
        ></v-list-item>
        
        <v-divider class="my-2"></v-divider>
        
        <v-list-item prepend-icon="mdi-account" title="Profile" to="/profile"></v-list-item>
        <v-list-item prepend-icon="mdi-cog" title="Settings" to="/settings"></v-list-item>
        
        <v-divider class="my-2"></v-divider>
        
        <v-list-subheader>Recent Sites</v-list-subheader>
        <v-list-item
          v-for="(site, index) in recentSites"
          :key="index"
          :title="site.name"
          :to="site.path"
          prepend-icon="mdi-web"
        ></v-list-item>
        
        <v-divider class="my-2"></v-divider>
        
        <v-list-item prepend-icon="mdi-logout" title="Logout" @click="logout"></v-list-item>
      </v-list>
    </v-navigation-drawer>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
// Fix the import path
import { useUIStore } from '../stores/ui';

const router = useRouter();
const uiStore = useUIStore();

const recentSites = ref([
  { name: 'E-commerce Products', path: '/ecommerce/products/products_table' },
  { name: 'Orders', path: '/ecommerce/orders_table' },
  { name: 'Preforma Invoice', path: '/preforma/products' },
  { name: 'Fio Transactions', path: '/fio/fio_table' }
]);

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

