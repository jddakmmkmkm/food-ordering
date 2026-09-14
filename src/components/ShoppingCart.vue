<template>
  <aside class="cart-panel" :class="{ 'is-mobile': mode === 'mobile' }">
    <div v-if="mode !== 'mobile'" class="cart-header">
      <h3>购物车</h3>
      <n-button v-if="cart.length" quaternary size="small" @click="$emit('clear')">
        清空
      </n-button>
    </div>

    <div v-else class="cart-header-mobile">
      <n-button v-if="cart.length" quaternary size="small" @click="$emit('clear')">
        清空购物车
      </n-button>
    </div>

    <div class="cart-body">
      <div v-if="cart.length === 0" class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p>购物车是空的</p>
        <span>快去挑选美味吧~</span>
      </div>

      <div v-else class="cart-list">
        <div v-for="item in cart" :key="item.id" class="cart-item">
          <div class="cart-item-left">
            <span class="cart-emoji">{{ item.img }}</span>
            <div class="cart-item-info">
              <div class="cart-item-name">{{ item.name }}</div>
              <div class="cart-item-price">¥{{ item.price }}</div>
            </div>
          </div>
          <div class="cart-item-right">
            <n-input-number
              v-model:value="item.quantity"
              :min="1"
              size="small"
              style="width: 90px"
            />
            <n-button circle size="tiny" type="error" quaternary :icon="Trash" @click="$emit('remove', item.id)" />
          </div>
        </div>
      </div>
    </div>

    <div class="cart-footer">
      <div class="cart-summary">
        <div class="summary-row">
          <span>菜品数量</span>
          <span>{{ totalQuantity }} 份</span>
        </div>
        <div class="summary-row total">
          <span>合计</span>
          <span class="total-price">¥{{ totalPrice }}</span>
        </div>
      </div>
      <n-button type="primary" block size="large" @click="$emit('checkout')">
        去结算
      </n-button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { NButton, NInputNumber } from 'naive-ui'
import { Trash } from '@vicons/ionicons5'

const props = defineProps({
  cart: { type: Array, required: true },
  mode: { type: String, default: 'desktop' } // 'desktop' | 'mobile'
})

defineEmits(['remove', 'clear', 'checkout'])

const totalQuantity = computed(() => props.cart.reduce((sum, i) => sum + i.quantity, 0))
const totalPrice = computed(() => props.cart.reduce((sum, i) => sum + i.price * i.quantity, 0))
</script>

<style scoped>
.cart-panel {
  width: 340px;
  background: #fff;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #eee;
  flex-shrink: 0;
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.cart-header h3 {
  margin: 0;
  font-size: 17px;
  color: #333;
}

.cart-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #bbb;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 12px;
}

.empty-cart p {
  font-size: 15px;
  margin: 0 0 4px;
  color: #888;
}

.empty-cart span {
  font-size: 12px;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #fafafa;
  border-radius: 10px;
}

.cart-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.cart-emoji {
  font-size: 28px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff5f0;
  border-radius: 8px;
  flex-shrink: 0;
}

.cart-item-info {
  min-width: 0;
}

.cart-item-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-item-price {
  font-size: 13px;
  color: #ff6b35;
  margin-top: 2px;
}

.cart-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cart-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

.cart-summary {
  margin-bottom: 14px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.summary-row.total {
  font-size: 15px;
  font-weight: 700;
  color: #333;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #eee;
}

.total-price {
  color: #ff6b35;
  font-size: 20px;
}

/* ===== 移动端抽屉模式 ===== */
.cart-panel.is-mobile {
  width: 100%;
  border-left: none;
  height: 100%;
}

.cart-header-mobile {
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px 12px;
}
</style>
