// Cloudflare Workers 入口（只导出 Hono app）
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { listOrders, saveOrder, getOrder } from './store.js'

const CATEGORIES = [
  { id: 'hot', name: '热销推荐', icon: '🔥' },
  { id: 'mj', name: 'mj 菜', icon: '👨‍🍳' }
]

const DISHES = [
  { id: 1, name: '宫保鸡丁', price: 38, category: 'hot', desc: '经典川菜，鸡肉鲜嫩，花生酥脆', img: '🍗', sales: 1280 },
  { id: 2, name: '麻婆豆腐', price: 28, category: 'hot', desc: '麻辣鲜香，豆腐嫩滑入味', img: '🥘', sales: 980 },
  { id: 3, name: '红烧肉', price: 48, category: 'hot', desc: '肥而不腻，入口即化', img: '🍖', sales: 1560 },
  { id: 101, name: 'mj 秘制小龙虾', price: 88, category: 'mj', desc: '十三香秘制，麻鲜入味', img: '🦞', sales: 680 },
  { id: 102, name: 'mj 招牌炒饭', price: 26, category: 'mj', desc: '独门配方，粒粒分明', img: '🍛', sales: 520 },
  { id: 103, name: 'mj 手打牛肉丸', price: 45, category: 'mj', desc: '手工捶打，Q弹多汁', img: '🥩', sales: 390 },
  { id: 104, name: 'mj 家传酸梅汤', price: 15, category: 'mj', desc: '古法熬制，冰爽解腻', img: '🥤', sales: 740 }
]

function ok(c, data) { return c.json({ code: 0, message: 'success', data }) }
function fail(c, message, status = 400) { return c.json({ code: 1, message }, status) }

// 根路由
const root = new Hono()
root.get('/', (c) => c.text('Food Ordering API'))

// API 子路由，统一挂在 /api 下
const api = new Hono()
api.use('*', cors())

api.get('/health', (c) => ok(c, { status: 'ok', version: '2.0.0', platform: c.env?.ORDERS_KV ? 'cloudflare-workers' : 'node-local' }))
api.get('/dishes/categories', (c) => ok(c, CATEGORIES))

api.get('/dishes', (c) => {
  let list = [...DISHES]
  const category = c.req.query('category')
  let keyword = c.req.query('keyword')
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
