// This file links the pages with the routes so that 
//the pages can be accessed by the user
//and show in the browser

import { createRouter, createWebHistory } from 'vue-router'
import AboutUs from './pages/about-us.vue'
import Home from './pages/Home.vue'
import CHRISData from './pages/chris-data.vue'


const routes = [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/about-us',
      name: 'AboutUs',
      component: AboutUs
    }
    ,
    {
      path: '/CHRIS-Data',
      name: 'CHRISData',
      component: CHRISData
    }
  ]

const router = createRouter({
  history: createWebHistory(''),
  routes
})

export default router