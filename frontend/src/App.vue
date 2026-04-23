<template>
  <!-- 路由出口：所有页面（比如 Chat.vue）都会渲染到这里 -->
  <router-view />
</template>

<script setup lang="ts">
// 无需写任何代码，空着即可
// 如果需要全局引入样式/组件，可在这里写
</script>

<style>
/* 全局样式（可选，可统一设置页面基础样式） */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Microsoft YaHei", sans-serif;
  background-color: #f5f5f5;
}

/* 消除默认滚动条样式（可选） */
html, body {
  height: 100%;
  overflow: hidden;
}
</style>