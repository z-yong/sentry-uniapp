import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    uni(),
    UnoCSS()
  ],
  build: {
    // 上传到 Sentry 用于错误堆栈还原
    sourcemap: true, // 生成独立的 .map 文件，但不在 JS 中引用
  },
  ssr: {
    format: 'cjs'
  }
})
