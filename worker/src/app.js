// Cloudflare Workers 入口（只导出 Hono app）
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { listOrders, saveOrder, getOrder, getSales, incrementSales } from './store.js'

const CATEGORIES = [
  { id: 'beer', name: '啤酒', icon: '🍺' }
]

const DISHES = [
  { id: 1, name: '啤酒', price: 10, category: 'beer', desc: '冰爽啤酒，畅饮无限', img: '🍺', sales: 0 }
]

function ok(c, data) { return c.json({ code: 0, message: 'success', data }) }
function fail(c, message, status = 400) { return c.json({ code: 1, message }, status) }

// 根路由
const root = new Hono()
root.get('/', (c) => c.text('Food Ordering API'))

// API 子路由，统一挂在 /api 下
const api = new Hono()
api.use('*', cors())

api.get('/health', (c) => ok(c, { status: 'ok', version: '3.0.0', platform: c.env?.ORDERS_KV ? 'cloudflare-workers' : 'node-local' }))
api.get('/dishes/categories', (c) => ok(c, CATEGORIES))

api.get('/dishes', async (c) => {
  const category = c.req.query('category')
  let keyword = c.req.query('keyword')

  // 动态销量：从 KV / JSON 读
  const salesMap = await getSales(c.env)
  let list = DISHES.map(d => ({ ...d, sales: salesMap[d.id] ?? d.sales }))

  if (keyword) {
    try { keyword = decodeURIComponent(escape(atob(keyword))) } catch {}
    list = list.filter(d => d.name.includes(keyword) || d.desc.includes(keyword))
  } else if (category) {
    list = list.filter(d => d.category === category)
  }
  return ok(c, { total: list.length, list })
})

api.post('/orders', async (c) => {
  const body = await c.req.json()
  const items = body.items || []
  if (!items.length) return fail(c, '购物车是空的')
  const orderNo = 'ORD' + Date.now()
  const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const order = { orderNo, totalAmount, status: 'pending', createdAt: new Date().toISOString(), items }

  // 累加销量（每个菜品的 quantity 累加上去）
  for (const it of items) {
    if (it.id != null && it.quantity) {
      await incrementSales(c.env, it.id, it.quantity)
    }
  }

  await saveOrder(c.env, orderNo, order)
  return ok(c, order)
})

api.get('/orders', async (c) => ok(c, await listOrders(c.env)))
api.get('/orders/:id', async (c) => {
  const order = await getOrder(c.env, c.req.param('id'))
  return order ? ok(c, order) : fail(c, '订单不存在', 404)
})

// 组合：根 + /api/*
const app = new Hono()
app.route('/', root)
app.route('/api', api)

export default app
