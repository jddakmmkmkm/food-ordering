// 前端 API 请求封装
// 本地开发：/api → Vite proxy → Express 后端
// GitHub Pages：直接请求 Cloudflare Workers 后端
const IS_GITHUB_PAGES = import.meta.env.GITHUB_PAGES === 'true'
const WORKERS_API = 'https://food-ordering-api.ska680229.workers.dev/api'
const BASE_URL = IS_GITHUB_PAGES ? WORKERS_API : '/api'

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

export function fetchCategories() {
  return request('/dishes/categories')
}

export function fetchDishes({ category, keyword } = {}) {
  const parts = []
  if (category) parts.push(`category=${encodeURIComponent(category)}`)
  if (keyword) {
    const encoded = btoa(unescape(encodeURIComponent(keyword)))
    parts.push(`keyword=${encoded}`)
  }
  const qs = parts.join('&')
  return request(`/dishes${qs ? '?' + qs : ''}`)
}

export function createOrder(payload) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function fetchOrders() {
  return request('/orders')
}
