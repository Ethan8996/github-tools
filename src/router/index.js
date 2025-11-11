import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/SqlTools',
    name: 'SqlTools',
    component: () => import('../views/SqlTools.vue')
  },
  {
    path: '/tool2',
    name: 'Tool2',
    component: () => import('../views/Tool2.vue')
  },
  {
    path: '/tool3',
    name: 'Tool3',
    component: () => import('../views/Tool3.vue')
  },
  {
    path: '/json-compare',
    name: 'JsonCompare',
    component: () => import('../views/JsonCompare.vue')
  },
  {
    path: '/properties-to-json',
    name: 'PropertiesToJson',
    component: () => import('../views/PropertiesToJson.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
