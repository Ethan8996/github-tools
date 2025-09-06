import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/tool1',
    name: 'Tool1',
    component: () => import('../views/Tool1.vue')
  },
  {
    path: '/tool2',
    name: 'Tool2',
    component: () => import('../views/Tool2.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router