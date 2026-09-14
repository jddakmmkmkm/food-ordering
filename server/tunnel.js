// 启动 localtunnel 并打印公网地址
import localtunnel from 'localtunnel'

const tunnel = await localtunnel({ port: 5173 })

console.log('✅ 内网穿透已建立')
console.log(`公网访问地址: ${tunnel.url}`)
console.log(`本地端口: 5173`)
console.log('')
console.log('提示: 手机/电脑浏览器直接打开上面的地址即可访问点餐页面')

tunnel.on('close', () => {
  console.log('隧道已关闭')
})

tunnel.on('error', (err) => {
  console.error('隧道出错:', err.message)
})
