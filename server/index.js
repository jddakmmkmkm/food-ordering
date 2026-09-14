import express from 'express'
import cors from 'cors'
import dishRoutes from './routes/dishes.js'
import orderRoutes from './routes/orders.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// 统一响应格式
app.use((req, res, next) => {
  res.jsonOk = (data, message = 'success') => {
    res.json({ code: 0, message, data })
  }
  res.jsonErr = (message = 'error', code = 1, status = 400) => {
    res.status(status).json({ code, message })
  }
  next()
})

// 路由
app.use('/api/dishes', dishRoutes)
app.use('/api/orders', orderRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.jsonOk({ status: 'ok', time: new Date().toISOString() })
})

// 404
app.use((req, res) => {
  res.jsonErr(`接口不存在: ${req.method} ${req.path}`, 404, 404)
})

app.listen(PORT, () => {
  console.log(`🍜 点餐后端服务已启动: http://localhost:${PORT}`)
  console.log(`   接口前缀: http://localhost:${PORT}/api`)
})
