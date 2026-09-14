// Cloudflare Workers 入口（只导出 Hono app）
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { listOrders, saveOrder, getOrder } from './store.js'

const CATEGORIES = [
  { id: 'hot', name: '热销推荐', icon: '🔥' },
  { id: 'meat', name: '荤菜', icon: '🍖' },
  { id: 'vegetable', name: '素菜', icon: '🥬' },
  { id: 'soup', name: '汤品', icon: '🍲' },
  { id: 'staple', name: '主食', icon: '🍚' },
  { id: 'drink', name: '饮品', icon: '🥤' }
]

const DISHES = [
  { id: 1, name: '宫保鸡丁', price: 38, category: 'hot', desc: '经典川菜，鸡肉鲜嫩，花生酥脆', img: '🍗', sales: 1280 },
  { id: 2, name: '麻婆豆腐', price: 28, category: 'hot', desc: '麻辣鲜香，豆腐嫩滑入味', img: '🥘', sales: 980 },
  { id: 3, name: '红烧肉', price: 48, category: 'hot', desc: '肥而不腻，入口即化', img: '🍖', sales: 1560 },
  { id: 4, name: '鱼香肉丝', price: 36, category: 'meat', desc: '酸甜微辣，肉丝滑嫩', img: '🥩', sales: 860 },
  { id: 5, name: '回锅肉', price: 42, category: 'meat', desc: '蒜苗配五花肉，香辣下饭', img: '🍳', sales: 720 },
  { id: 6, name: '糖醋里脊', price: 45, category: 'meat', desc: '外酥里嫩，酸甜可口', img: '🍖', sales: 650 },
  { id: 7, name: '水煮牛肉', price: 58, category: 'meat', desc: '麻辣鲜香，牛肉嫩滑', img: '🌶️', sales: 540 },
  { id: 8, name: '干煸四季豆', price: 26, category: 'vegetable', desc: '干香入味，脆嫩爽口', img: '🫛', sales: 430 },
  { id: 9, name: '蒜蓉西兰花', price: 24, category: 'vegetable', desc: '清淡健康，蒜香浓郁', img: '🥦', sales: 380 },
  { id: 10, name: '地三鲜', price: 30, category: 'vegetable', desc: '土豆茄子青椒，经典东北菜', img: '🍆', sales: 510 },
  { id: 11, name: '醋溜土豆丝', price: 18, category: 'vegetable', desc: '爽脆开胃，酸辣可口', img: '🥔', sales: 620 },
  { id: 12, name: '酸辣汤', price: 22, category: 'soup', desc: '酸辣开胃，料足味美', img: '🍜', sales: 290 },
  { id: 13, name: '番茄蛋花汤', price: 18, category: 'soup', desc: '酸甜可口，营养丰富', img: '🍅', sales: 340 },
  { id: 14, name: '紫菜蛋花汤', price: 16, category: 'soup', desc: '清淡鲜美，简单美味', img: '🥣', sales: 210 },
  { id: 15, name: '蛋炒饭', price: 20, category: 'staple', desc: '粒粒分明，蛋香浓郁', img: '🍚', sales: 880 },
  { id: 16, name: '牛肉面', price: 32, category: 'staple', desc: '汤浓肉烂，面条筋道', img: '🍜', sales: 760 },
  { id: 17, name: '扬州炒饭', price: 26, category: 'staple', desc: '配料丰富，色香味俱全', img: '🍛', sales: 540 },
  { id: 18, name: '葱油拌面', price: 18, category: 'staple', desc: '葱香四溢，简单美味', img: '🍝', sales: 410 },
  { id: 19, name: '酸梅汤', price: 12, category: 'drink', desc: '酸甜解腻，消暑佳品', img: '🥤', sales: 320 },
  { id: 20, name: '柠檬水', price: 8, category: 'drink', desc: '清新爽口，补充维C', img: '🍋', sales: 280 },
  { id: 21, name: '鲜榨橙汁', price: 18, category: 'drink', desc: '100%鲜榨，维C满满', img: '🍊', sales: 190 },
  { id: 22, name: '可乐', price: 6, category: 'drink', desc: '冰镇畅爽', img: '🥤', sales: 450 }
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
