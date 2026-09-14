// 菜品数据：分类 + 菜品列表
export const categories = [
  { id: 'hot', name: '热销推荐', icon: '🔥' },
  { id: 'mj', name: 'mj 菜', icon: '👨‍🍳' }
]

export const dishes = [
  // 热销推荐
  { id: 1, name: '宫保鸡丁', price: 38, category: 'hot', desc: '经典川菜，鸡肉鲜嫩，花生酥脆', img: '🍗', sales: 1280 },
  { id: 2, name: '麻婆豆腐', price: 28, category: 'hot', desc: '麻辣鲜香，豆腐嫩滑入味', img: '🥘', sales: 980 },
  { id: 3, name: '红烧肉', price: 48, category: 'hot', desc: '肥而不腻，入口即化', img: '🍖', sales: 1560 },

  // mj 菜（招牌菜）
  { id: 101, name: 'mj 秘制小龙虾', price: 88, category: 'mj', desc: '十三香秘制，麻鲜入味', img: '🦞', sales: 680 },
  { id: 102, name: 'mj 招牌炒饭', price: 26, category: 'mj', desc: '独门配方，粒粒分明', img: '🍛', sales: 520 },
  { id: 103, name: 'mj 手打牛肉丸', price: 45, category: 'mj', desc: '手工捶打，Q弹多汁', img: '🥩', sales: 390 },
  { id: 104, name: 'mj 家传酸梅汤', price: 15, category: 'mj', desc: '古法熬制，冰爽解腻', img: '🥤', sales: 740 }
]
