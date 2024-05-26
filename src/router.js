// This file links the pages with the routes so that 
//the pages can be accessed by the user
//and show in the browser

import { createRouter, createWebHistory } from 'vue-router'
import AboutUs from './pages/about-us.vue'
import Home from './pages/Home.vue'
import CHRISDataIntro from './pages/chris-data-intro.vue'
import DataOverview from './pages/data-overview.vue'


const routes = [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/about-us', // file path
      name: 'AboutUs', //name in the file for exporting
      component: AboutUs //component name
    }
    ,
    {
      path: '/data-introduction',
      name: 'CHRISDataIntro',
      component: CHRISDataIntro
    }
    ,
    {
      path: '/data-overview',
      name: 'DataOverview',
      component: DataOverview
    }
  ]

const router = createRouter({
  history: createWebHistory(''),
  routes
})

export default router