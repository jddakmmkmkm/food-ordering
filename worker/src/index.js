// 本地 Node.js 启动入口
// 用内置 http 模块 + Hono app.fetch，零依赖
import { createServer } from 'node:http'
import app from './app.js'

const port = parseInt(process.env.PORT || '3000')
const server = createServer(async (req, res) => {
  // 直接透传原始 URL（Hono app 路由已带 /api 前缀）
  const pathname = req.url || '/'
  const opts = { method: req.method, headers: req.headers }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    opts.body = req
    opts.duplex = 'half'
  }
  const fetchReq = new Request('http://localhost' + pathname, opts)
  try {
    const resp = await app.fetch(fetchReq, {})
    res.statusCode = resp.status
    for (const [k, v] of resp.headers) res.setHeader(k, v)
    const buf = Buffer.from(await resp.arrayBuffer())
    res.end(buf)
  } catch (e) {
    res.statusCode = 500
    res.end(JSON.stringify({ code: 1, message: e.message }))
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log()
  console.log('🚀 点餐系统后端已启动')
  console.log(`📡 API 地址: http://localhost:${port}/api`)
  console.log(`💾 模式: 本地 Node.js + JSON 文件存储 (worker/data/orders.json)`)
  console.log()
  console.log('可用接口:')
  console.log('  GET  /api/health              健康检查')
  console.log('  GET  /api/dishes/categories   菜品分类')
  console.log('  GET  /api/dishes              菜品列表 (category / keyword)')
  console.log('  POST /api/orders              下单')
  console.log('  GET  /api/orders              订单列表')
  console.log('  GET  /api/orders/:id          订单详情')
  console.log()
  console.log('Cloudflare Workers 部署: wrangler deploy')
})
