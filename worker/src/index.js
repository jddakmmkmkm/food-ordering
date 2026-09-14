// Cloudflare Workers 后端
// 点餐系统 API - 原生 fetch handler，无外部依赖

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

function json(data, status = 200) {
  return new Response(JSON.stringify({ code: 0, message: 'success', data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

function error(message, status = 400) {
  return new Response(JSON.stringify({ code: 1, message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    const url = new URL(request.url)
    const path = url.pathname.replace(/^\/api/, '')
    const method = request.method

    try {
      // GET /health
      if (path === '/health' && method === 'GET') {
        return json({ status: 'ok', version: '1.0.0' })
      }

      // GET /dishes/categories
      if (path === '/dishes/categories' && method === 'GET') {
        return json(CATEGORIES)
      }

      // GET /dishes?category=&keyword=
      if (path === '/dishes' && method === 'GET') {
        let list = [...DISHES]
        const category = url.searchParams.get('category')
        const keyword = url.searchParams.get('keyword')

        if (keyword) {
          // keyword 是 base64 编码（前端的设计）
          let kw = keyword
          try { kw = decodeURIComponent(escape(atob(keyword))) } catch {}
          list = list.filter(d => d.name.includes(kw) || d.desc.includes(kw))
        } else if (category) {
          list = list.filter(d => d.category === category)
        }

        return json({ total: list.length, list })
      }

      // POST /orders
      if (path === '/orders' && method === 'POST') {
        const payload = await request.json()
        const items = payload.items || []
        if (!items.length) return error('购物车是空的')

        const orderNo = 'ORD' + Date.now()
        const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0)
        const order = {
          orderNo,
          totalAmount,
          status: 'pending',
          createdAt: new Date().toISOString(),
          items
        }

        // 存 KV（如果可用）
        try {
          if (env.ORDERS_KV) {
            await env.ORDERS_KV.put(orderNo, JSON.stringify(order))
          }
        } catch {}

        return json(order)
      }

      // GET /orders
      if (path === '/orders' && method === 'GET') {
        try {
          if (env.ORDERS_KV) {
            const keys = await env.ORDERS_KV.list()
            const orders = []
            for (const k of keys.keys) {
              const v = await env.ORDERS_KV.get(k.name)
              if (v) orders.push(JSON.parse(v))
            }
            return json(orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
          }
        } catch {}
        return json([])
      }

      // GET /orders/:id
      const orderMatch = path.match(/^\/orders\/(.+)$/)
      if (orderMatch && method === 'GET') {
        try {
          if (env.ORDERS_KV) {
            const v = await env.ORDERS_KV.get(orderMatch[1])
            if (v) return json(JSON.parse(v))
          }
        } catch {}
        return error('订单不存在', 404)
      }

      return error('Not Found', 404)
    } catch (e) {
      return error(e.message || '服务器内部错误', 500)
    }
  }
}
