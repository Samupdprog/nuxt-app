<template>
  <div class="products-container">
    <DxDataGrid
      :data-source="products"
      :show-borders="true"
      key-expr="product_id"
      class="products-table"
      :allow-column-reordering="true"
      :allow-column-resizing="true"
      :row-alternation-enabled="true"
    >
      <!-- Image Column -->
      <DxColumn data-field="imageUrl" caption="Image" width="100" alignment="center" cell-template="imageTemplate" />
      
      <!-- Product Code -->
      <DxColumn data-field="code" caption="Code" width="120" alignment="center" />
      
      <!-- Product ID -->
      <DxColumn data-field="product_id" caption="Product ID" width="120" alignment="center" />
      
      <!-- Name (Editable) -->
      <DxColumn data-field="name" caption="Name" width="200" alignment="left" />
      
      <!-- SEO URL -->
      <DxColumn data-field="seo_url" caption="SEO URL" width="200" alignment="left" />
      
      <!-- SEO Title (Editable) -->
      <DxColumn data-field="seo_title" caption="SEO Title" width="200" alignment="left" />
      
      <!-- SEO Description (Editable) -->
      <DxColumn data-field="seo_description" caption="SEO Description" width="300" alignment="left" />

      <!-- Actions -->
      <DxColumn caption="Actions" width="200" cell-template="actionsTemplate" alignment="center" />

      <!-- Image Template -->
      <template #imageTemplate="{ data }">
        <img :src="data.value || 'https://via.placeholder.com/50'" class="product-image" />
      </template>

      <!-- Actions Template -->
      <template #actionsTemplate="{ data }">
        <div class="actions">
          <DxButton text="View" type="normal" styling-mode="outlined" @click="viewProduct(data.data)" />
          <DxButton v-if="editMode" text="Save" type="success" styling-mode="contained" class="ml-2" @click="editProduct(data.data)" />
        </div>
      </template>

      <DxFilterRow :visible="true" />
      <DxHeaderFilter :visible="true" />
      <DxSearchPanel :visible="true" :highlight-case-sensitive="false" />
      <DxColumnChooser :enabled="true" />
      <DxSelection mode="multiple" />
      <DxPaging :page-size="10" />
      <DxPager :show-page-size-selector="true" :allowed-page-sizes="[5, 10, 20]" />
    </DxDataGrid>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  DxDataGrid,
  DxColumn,
  DxPaging,
  DxPager,
  DxFilterRow,
  DxHeaderFilter,
  DxSearchPanel,
  DxColumnChooser,
  DxSelection,
} from "devextreme-vue/data-grid";
import { DxButton } from "devextreme-vue/button";

export default {
  components: {
    DxDataGrid,
    DxColumn,
    DxPaging,
    DxPager,
    DxFilterRow,
    DxHeaderFilter,
    DxSearchPanel,
    DxColumnChooser,
    DxSelection,
    DxButton,
  },
  setup() {
    const router = useRouter();
    const products = ref([]);
    const editMode = ref(false);

    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:1880/get-all-products");
        if (!response.ok) throw new Error("Error retrieving products");
        const data = await response.json();
        products.value = Array.isArray(data)
          ? data.map((product) => ({
              ...product,
              imageUrl: product.imageUrl || "https://via.placeholder.com/50",
            }))
          : [];
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    const editProduct = async (product) => {
      try {
        const response = await fetch("http://localhost:1880/update-product", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(product),
        });
        if (!response.ok) throw new Error("Error updating product");
        const result = await response.json();
        console.log("Product updated:", result);
      } catch (error) {
        console.error("Error updating product:", error);
      }
    };

    const viewProduct = (product) => {
      router.push(`/ecommerce/products/${product.code}`);
    };

    onMounted(fetchProducts);

    return {
      products,
      editMode,
      fetchProducts,
      editProduct,
      viewProduct,
    };
  },
};
</script>

<style scoped>
.products-container {
  padding: 20px;
  max-width: 100%;
}

.products-table {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 15px;
}

.product-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 5px;
  border: 1px solid #ddd;
}

.actions {
  display: flex;
  gap: 10px;
}
</style>
