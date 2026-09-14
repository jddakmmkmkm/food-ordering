// 统一存储层：Workers 用 KV / 本地 Node 用 JSON 文件
// Workers 中 c.env.ORDERS_KV 存在；本地不存在，走 fs 分支

let _fs = null
let _path = null
let _dirname = null

async function loadFs() {
  if (_fs) return
  const mod = await import('node:fs')
  const p = await import('node:path')
  const url = await import('node:url')
  _fs = mod
  _path = p
  _dirname = _path.dirname(url.fileURLToPath(import.meta.url))
}

async function ensureLocalFile() {
  await loadFs()
  const dataDir = _path.join(_dirname, '..', 'data')
  const dataFile = _path.join(dataDir, 'orders.json')
  if (!_fs.existsSync(dataDir)) _fs.mkdirSync(dataDir, { recursive: true })
  if (!_fs.existsSync(dataFile)) _fs.writeFileSync(dataFile, '{}')
  return dataFile
}

export async function listOrders(env) {
  if (env?.ORDERS_KV) {
    const keys = await env.ORDERS_KV.list()
    const orders = []
    for (const k of keys.keys) {
      const v = await env.ORDERS_KV.get(k.name)
      if (v) orders.push(JSON.parse(v))
    }
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  const dataFile = await ensureLocalFile()
  const all = JSON.parse(_fs.readFileSync(dataFile, 'utf8'))
  return Object.values(all).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function saveOrder(env, orderNo, order) {
  if (env?.ORDERS_KV) {
    await env.ORDERS_KV.put(orderNo, JSON.stringify(order))
    return
  }
  const dataFile = await ensureLocalFile()
  const all = JSON.parse(_fs.readFileSync(dataFile, 'utf8'))
  all[orderNo] = order
  _fs.writeFileSync(dataFile, JSON.stringify(all, null, 2))
}

export async function getOrder(env, orderNo) {
  if (env?.ORDERS_KV) {
    const v = await env.ORDERS_KV.get(orderNo)
    return v ? JSON.parse(v) : null
  }
  const dataFile = await ensureLocalFile()
  const all = JSON.parse(_fs.readFileSync(dataFile, 'utf8'))
  return all[orderNo] || null
}

// ========== 销量（KV / JSON）==========
const SALES_KEY = 'sales'

async function ensureSalesFile() {
  await loadFs()
  const dataDir = _path.join(_dirname, '..', 'data')
  const salesFile = _path.join(dataDir, 'sales.json')
  if (!_fs.existsSync(dataDir)) _fs.mkdirSync(dataDir, { recursive: true })
  if (!_fs.existsSync(salesFile)) _fs.writeFileSync(salesFile, '{}')
  return salesFile
}

export async function getSales(env) {
  if (env?.ORDERS_KV) {
    const v = await env.ORDERS_KV.get(SALES_KEY)
    return v ? JSON.parse(v) : {}
  }
  const salesFile = await ensureSalesFile()
  return JSON.parse(_fs.readFileSync(salesFile, 'utf8'))
}

export async function incrementSales(env, dishId, amount) {
  const sales = await getSales(env)
  sales[dishId] = (sales[dishId] || 0) + amount
  if (env?.ORDERS_KV) {
    await env.ORDERS_KV.put(SALES_KEY, JSON.stringify(sales))
  } else {
    const salesFile = await ensureSalesFile()
    _fs.writeFileSync(salesFile, JSON.stringify(sales, null, 2))
  }
  return sales[dishId]
}
