<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <OrderPage />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import OrderPage from './components/OrderPage.vue'

const themeOverrides = {
  common: {
    primaryColor: '#ff6b35',
    primaryColorHover: '#ff8552',
    primaryColorPressed: '#e55a2b',
    borderRadius: '10px'
  }
}
</script>
