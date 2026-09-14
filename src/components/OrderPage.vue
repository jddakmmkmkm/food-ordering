<template>
  <div class="order-page" :class="{ mobile: isMobile }">
    <!-- 顶部栏 -->
    <header class="header">
      <div class="header-left">
        <span class="logo">🍜</span>
        <h1 class="title">美味点餐</h1>
        <n-tag size="small" type="success" round>营业中</n-tag>
      </div>
      <div class="header-right">
        <n-input v-model:value="searchText" placeholder="搜索菜品..." clearable style="width: 220px">
          <template #prefix>
            <n-icon :component="Search" />
          </template>
        </n-input>
      </div>
    </header>

    <div class="body">
      <!-- 左侧分类导航（桌面端） -->
      <aside v-if="!isMobile" class="category-nav">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-name">{{ cat.name }}</span>
        </div>
      </aside>

      <!-- 中间菜品列表 -->
      <main class="dish-area">
        <!-- 移动端：顶部横向分类标签 -->
        <div v-if="isMobile" class="category-tabs">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="tab-item"
            :class="{ active: activeCategory === cat.id }"
            @click="activeCategory = cat.id"
          >
            <span class="tab-icon">{{ cat.icon }}</span>
            <span class="tab-name">{{ cat.name }}</span>
          </div>
        </div>

        <div class="dish-header">
          <h2>{{ currentCategoryName }}</h2>
          <span class="dish-count">共 {{ filteredDishes.length }} 道</span>
        </div>
        <n-spin :show="loading">
          <div class="dish-grid" :class="{ single: isMobile }">
            <n-card
              v-for="dish in filteredDishes"
              :key="dish.id"
              hoverable
              class="dish-card"
              :class="{ horizontal: isMobile }"
            >
              <div class="dish-emoji">{{ dish.img }}</div>
              <div class="dish-info">
                <div class="dish-name">{{ dish.name }}</div>
                <div class="dish-desc">{{ dish.desc }}</div>
                <div class="dish-meta">
                  <span class="sales">已售 {{ dish.sales }}</span>
                </div>
                <div class="dish-bottom">
                  <span class="price">¥{{ dish.price }}</span>
                  <n-button
                    circle
                    size="small"
                    type="primary"
                    :icon="Add"
                    @click="addToCart(dish)"
                  />
                </div>
              </div>
            </n-card>
            <n-empty v-if="!loading && filteredDishes.length === 0" description="没有找到相关菜品" />
          </div>
        </n-spin>
        <!-- 移动端底部占位，防止被悬浮购物车遮挡 -->
        <div v-if="isMobile" class="bottom-placeholder"></div>
      </main>

      <!-- 桌面端：右侧购物车面板 -->
      <ShoppingCart
        v-if="!isMobile"
        :cart="cart"
        @remove="removeFromCart"
        @clear="clearCart"
        @checkout="checkout"
      />
    </div>

    <!-- 移动端：底部悬浮购物车栏 -->
    <div v-if="isMobile" class="mobile-cart-bar" @click="cartDrawer = true">
      <div class="cart-bar-left">
        <div class="cart-bar-icon">
          🛒
          <span v-if="totalQuantity > 0" class="cart-badge">{{ totalQuantity }}</span>
        </div>
        <div class="cart-bar-info">
          <span v-if="totalQuantity > 0" class="cart-bar-price">¥{{ totalPrice }}</span>
          <span v-else class="cart-bar-empty">购物车是空的</span>
        </div>
      </div>
      <n-button
        type="primary"
        round
        size="large"
        :disabled="totalQuantity === 0"
        @click.stop="checkout"
      >
        去结算
      </n-button>
    </div>

    <!-- 移动端：购物车抽屉 -->
    <n-drawer v-model:show="cartDrawer" placement="bottom" :height="60">
      <n-drawer-content title="购物车" closable>
        <ShoppingCart
          :cart="cart"
          mode="mobile"
          @remove="removeFromCart"
          @clear="clearCart"
          @checkout="() => { cartDrawer = false; checkout() }"
        />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useMessage, NTag, NInput, NIcon, NCard, NButton, NEmpty, NDrawer, NDrawerContent, NSpin } from 'naive-ui'
import { Add, Search } from '@vicons/ionicons5'
import { fetchCategories, fetchDishes, createOrder } from '../api/index.js'
import ShoppingCart from './ShoppingCart.vue'

const message = useMessage()
const activeCategory = ref('hot')
const searchText = ref('')
const cart = ref([])
const isMobile = ref(false)
const cartDrawer = ref(false)
const loading = ref(false)
const categories = ref([])
const dishList = ref([])

let mql = null

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  // 优先使用 matchMedia（响应更及时），降级到 resize
  if (window.matchMedia) {
    mql = window.matchMedia('(max-width: 767px)')
    isMobile.value = mql.matches
    const handler = (e) => { isMobile.value = e.matches }
    if (mql.addEventListener) {
      mql.addEventListener('change', handler)
    } else if (mql.addListener) {
      mql.addListener(handler)
    }
  }
  window.addEventListener('resize', checkMobile)
  // 加载后端数据
  loadCategories()
  loadDishes()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})

const currentCategoryName = computed(() => {
  return categories.value.find(c => c.id === activeCategory.value)?.name || ''
})

const totalQuantity = computed(() => cart.value.reduce((sum, i) => sum + i.quantity, 0))
const totalPrice = computed(() => cart.value.reduce((sum, i) => sum + i.price * i.quantity, 0))

// 菜品列表（来自后端，搜索时走全局搜索）
const filteredDishes = computed(() => dishList.value)

// 加载菜品
async function loadDishes() {
  loading.value = true
  try {
    const res = await fetchDishes({
      category: searchText.value.trim() ? undefined : activeCategory.value,
      keyword: searchText.value.trim() || undefined
    })
    dishList.value = res.list || []
  } catch (e) {
    message.error(e.message || '加载菜品失败')
  } finally {
    loading.value = false
  }
}

// 加载分类
async function loadCategories() {
  try {
    categories.value = await fetchCategories()
  } catch (e) {
    message.error(e.message || '加载分类失败')
  }
}

// 监听分类和搜索变化（手动防抖）
let searchTimer = null
watch([activeCategory, searchText], () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadDishes(), 300)
})

function addToCart(dish) {
  const item = cart.value.find(i => i.id === dish.id)
  if (item) {
    item.quantity += 1
  } else {
    cart.value.push({ ...dish, quantity: 1 })
  }
  message.success(`已加入 ${dish.name}`)
}

function removeFromCart(id) {
  const idx = cart.value.findIndex(i => i.id === id)
  if (idx !== -1) {
    cart.value.splice(idx, 1)
  }
}

function clearCart() {
  cart.value = []
  message.info('购物车已清空')
}

async function checkout() {
  if (cart.value.length === 0) {
    message.warning('购物车是空的哦~')
    return
  }
  const items = cart.value.map(i => ({
    id: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity
  }))
  try {
    const order = await createOrder({ items })
    message.success(`下单成功！订单号：${order.orderNo}，合计：¥${order.totalAmount}`)
    cart.value = []
    cartDrawer.value = false
  } catch (e) {
    message.error(e.message || '下单失败，请重试')
  }
}
</script>

<style scoped>
.order-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* ===== 顶部栏 ===== */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 10;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 30px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ===== 左侧分类（桌面端） ===== */
.category-nav {
  width: 140px;
  background: #fff;
  overflow-y: auto;
  border-right: 1px solid #eee;
  flex-shrink: 0;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 18px 10px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.category-item:hover {
  background: #fff5f0;
}

.category-item.active {
  background: #fff5f0;
  border-left-color: #ff6b35;
  color: #ff6b35;
  font-weight: 600;
}

.cat-icon {
  font-size: 24px;
}

.cat-name {
  font-size: 13px;
}

/* ===== 中间菜品区 ===== */
.dish-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.dish-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 18px;
}

.dish-header h2 {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.dish-count {
  color: #999;
  font-size: 13px;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.dish-card {
  overflow: hidden;
  padding: 0 !important;
}

.dish-emoji {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56px;
  background: linear-gradient(135deg, #fff5f0 0%, #ffe8d9 100%);
}

.dish-info {
  padding: 14px;
}

.dish-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.dish-desc {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
  line-height: 1.5;
  min-height: 36px;
}

.dish-meta {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 10px;
}

.dish-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price {
  font-size: 18px;
  color: #ff6b35;
  font-weight: 700;
}

/* ===== 移动端样式 ===== */
.order-page.mobile .header {
  padding: 12px 16px;
}

.order-page.mobile .header-right {
  flex: 1;
  margin-left: 12px;
}

.order-page.mobile .header-right :deep(.n-input) {
  width: 100% !important;
}

.order-page.mobile .logo {
  font-size: 24px;
}

.order-page.mobile .title {
  font-size: 18px;
}

/* 移动端：顶部横向分类标签 */
.category-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  background: #fff;
  border-radius: 12px;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #eee;
}

.tab-item.active {
  background: #ff6b35;
  color: #fff;
  border-color: #ff6b35;
}

.tab-icon {
  font-size: 22px;
}

.tab-name {
  font-size: 12px;
  white-space: nowrap;
}

/* 移动端：菜品单列 + 横向卡片 */
.dish-grid.single {
  grid-template-columns: 1fr;
  gap: 12px;
}

.dish-card.horizontal {
  display: flex;
  flex-direction: row;
}

.dish-card.horizontal .dish-emoji {
  width: 100px;
  height: auto;
  flex-shrink: 0;
  font-size: 40px;
}

.dish-card.horizontal .dish-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.dish-card.horizontal .dish-desc {
  min-height: 0;
}

.order-page.mobile .dish-area {
  padding: 14px 14px 0;
}

.bottom-placeholder {
  height: 80px;
}

/* ===== 移动端底部购物车栏 ===== */
.mobile-cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.cart-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cart-bar-icon {
  position: relative;
  font-size: 28px;
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #ff6b35;
  color: #fff;
  font-size: 11px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.cart-bar-price {
  font-size: 20px;
  font-weight: 700;
  color: #ff6b35;
}

.cart-bar-empty {
  font-size: 14px;
  color: #999;
}
</style>
