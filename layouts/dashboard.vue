<template>
    <v-layout>
      <v-navigation-drawer expand-on-hover rail app>
        <v-list>
          <v-list-item
            prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg"
            subtitle="admin@example.com"
            title="Admin"
          ></v-list-item>
        </v-list>
  
        <v-divider></v-divider>
  
        <v-list density="compact" nav>
          <v-list-group prepend-icon="mdi-cart" value="ecommerce">
            <template v-slot:activator>
              <v-list-item-title>E-commerce to Pohoda</v-list-item-title>
            </template>
            <v-list-item to="/ecommerce/products" title="Imported Products"></v-list-item>
            <v-list-item to="/ecommerce/config" title="Configuration"></v-list-item>
            <v-list-item to="/ecommerce/logs" title="Logs"></v-list-item>
          </v-list-group>
        </v-list>
      </v-navigation-drawer>
  
      <v-main>
        <NuxtPage />
      </v-main>
    </v-layout>
  </template>
  