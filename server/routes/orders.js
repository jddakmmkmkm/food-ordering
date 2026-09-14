import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ORDERS_FILE = path.join(__dirname, '../data/orders.json')

// 读取订单数据
function readOrders() {
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

// 写入订单数据
function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8')
}

// 确保 data 目录和文件存在
function ensureFile() {
  const dir = path.dirname(ORDERS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    writeOrders([])
  }
}

ensureFile()

// 创建订单
router.post('/', (req, res) => {
  const { items, remark, tableNo } = req.body || {}

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.jsonErr('请至少选择一道菜品')
  }

  // 校验菜品字段
  for (const item of items) {
    if (!item.id || !item.name || !item.price || !item.quantity) {
      return res.jsonErr('菜品信息不完整')
    }
  }

  const orders = readOrders()
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)

  const order = {
    id: Date.now(),
    orderNo: 'NO' + Date.now(),
    items,
    totalAmount,
    totalQuantity,
    remark: remark || '',
    tableNo: tableNo || '',
    status: 'pending', // pending / paid / completed / cancelled
    createdAt: new Date().toISOString()
  }

  orders.unshift(order)
  writeOrders(orders)

  res.jsonOk(order, '下单成功')
})

// 获取订单列表
router.get('/', (req, res) => {
  const orders = readOrders()
  res.jsonOk({
    total: orders.length,
    list: orders
  })
})

// 获取单个订单
router.get('/:id', (req, res) => {
  const id = Number(req.params.id)
  const orders = readOrders()
  const order = orders.find(o => o.id === id)
  if (!order) {
    return res.jsonErr('订单不存在', 404, 404)
  }
  res.jsonOk(order)
})

// 更新订单状态
router.patch('/:id/status', (req, res) => {
  const id = Number(req.params.id)
  const { status } = req.body || {}
  const validStatus = ['pending', 'paid', 'completed', 'cancelled']

  if (!status || !validStatus.includes(status)) {
    return res.jsonErr(`状态必须是: ${validStatus.join(', ')}`)
  }

  const orders = readOrders()
  const idx = orders.findIndex(o => o.id === id)
  if (idx === -1) {
    return res.jsonErr('订单不存在', 404, 404)
  }

  orders[idx].status = status
  orders[idx].updatedAt = new Date().toISOString()
  writeOrders(orders)

  res.jsonOk(orders[idx], '状态已更新')
})

export default router
