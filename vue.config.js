// vue.config.js
module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/github-tools/' // 替换为你的仓库名
    : '/',
  outputDir: 'dist'
}