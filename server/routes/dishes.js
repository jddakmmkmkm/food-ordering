import { Router } from 'express'
import { categories, dishes } from '../../src/data/dishes.js'

const router = Router()

// 获取所有分类
router.get('/categories', (req, res) => {
  res.jsonOk(categories)
})

// 获取菜品列表，支持按分类筛选和关键词搜索
router.get('/', (req, res) => {
  const { category, keyword } = req.query
  let list = [...dishes]

  if (category) {
    list = list.filter(d => d.category === category)
  }
  if (keyword) {
    // 前端对关键词做了 base64 编码，这里解码（兼容未编码的情况）
    let kw = String(keyword).trim()
    try {
      const decoded = Buffer.from(kw, 'base64').toString('utf-8')
      // 如果解码后是有效中文/文字，使用解码结果
      if (decoded && !/^[\x00-\x7F]+$/.test(kw) || decoded.length < kw.length) {
        kw = decoded
      }
    } catch (e) {
      // 解码失败，使用原始值
    }
    kw = kw.toLowerCase()
    if (kw) {
      list = list.filter(d =>
        d.name.toLowerCase().includes(kw) || d.desc.toLowerCase().includes(kw)
      )
    }
  }

  res.jsonOk({
    total: list.length,
    list
  })
})

// 获取单个菜品
router.get('/:id', (req, res) => {
  const id = Number(req.params.id)
  const dish = dishes.find(d => d.id === id)
  if (!dish) {
    return res.jsonErr('菜品不存在', 404, 404)
  }
  res.jsonOk(dish)
})

export default router
