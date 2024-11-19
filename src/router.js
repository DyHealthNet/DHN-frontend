// This file links the pages with the routes so that 
//the pages can be accessed by the authentication
//and show in the browser

import { createRouter, createWebHistory } from 'vue-router'
import AboutUs from './pages/about-us.vue'
import Home from './pages/Home.vue'
import CHRISDataIntro from './pages/chris-data-intro.vue'
import DataOverview from './pages/data-overview.vue'
import NetworkPage from './pages/data-network.vue'
import ContextCreation from './pages/context-creation.vue'
import Login from './pages/user-login.vue'
import Logout from './pages/user-logout.vue'

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
      path: '/overview',
      name: 'DataOverview',
      component: DataOverview
    }
    ,
    {
      path: '/network',
      name: 'Network',
      component: NetworkPage
    },
    {
      path: '/context',
      name: 'Context creation',
      component: ContextCreation
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/logout',
        name: 'Logout',
        component: Logout
    }
  ]

const router = createRouter({
  history: createWebHistory(''),
  routes
})

export default router
