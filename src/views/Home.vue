<template>
  <div class="home">
    <h1>我的日常工作工具集</h1>
    <div class="tools-grid">
      <router-link to="/SqlTools" class="tool-card">
        <h2>工具1</h2>
        <p>工具1的简短描述</p>
      </router-link>
      <router-link to="/tool2" class="tool-card">
        <h2>字符串列表比较</h2>
        <p>比较两组字符串列表的交集、并集和差集</p>
      </router-link>
      <router-link to="/tool3" class="tool-card">
        <h2>字符串编号工具</h2>
        <p>为字符串列表添加多种格式的编号</p>
      </router-link>
      <router-link to="/json-compare" class="tool-card">
        <h2>JSON 比较工具</h2>
        <p>比较两个 JSON 数据之间的差异</p>
      </router-link>
      <!-- 可以继续添加更多工具卡片 -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
.home {
  padding: 20px;
}
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}
.tool-card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s, box-shadow 0.3s;
}
.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}
</style>
