// 前端 API 请求封装
// GitHub Pages 部署时无后端，自动降级为本地 Mock 数据
import { categories as mockCategories, dishes as mockDishes } from '../data/dishes.js'

const BASE_URL = '/api'
const USE_MOCK = import.meta.env.GITHUB_PAGES === 'true'

// 简单的本地订单存储
let mockOrders = []

async function request(url, options = {}) {
  const res = await fetch(BASE_URL + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  const json = await res.json()
  if (json.code !== 0) {
    throw new Error(json.message || '请求失败')
  }
  return json.data
}

// 获取分类列表
export function fetchCategories() {
  if (USE_MOCK) {
    return Promise.resolve(mockCategories)
  }
  return request('/dishes/categories')
}

// 获取菜品列表
export function fetchDishes({ category, keyword } = {}) {
  if (USE_MOCK) {
    let list = [...mockDishes]
    if (keyword) {
      const kw = decodeURIComponent(escape(atob(keyword)))
      list = list.filter(d => d.name.includes(kw) || d.desc.includes(kw))
    } else if (category) {
      list = list.filter(d => d.category === category)
    }
    return Promise.resolve({ total: list.length, list })
  }
  const parts = []
  if (category) parts.push(`category=${encodeURIComponent(category)}`)
  if (keyword) {
    const encoded = btoa(unescape(encodeURIComponent(keyword)))
    parts.push(`keyword=${encoded}`)
  }
  const qs = parts.join('&')
  return request(`/dishes${qs ? '?' + qs : ''}`)
}

// 下单
export function createOrder(payload) {
  if (USE_MOCK) {
    const orderNo = 'ORD' + Date.now()
    const totalAmount = payload.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const order = {
      orderNo,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      items: payload.items
    }
    mockOrders.push(order)
    return Promise.resolve(order)
  }
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

// 获取订单列表
export function fetchOrders() {
  if (USE_MOCK) {
    return Promise.resolve(mockOrders)
  }
  return request('/orders')
}
