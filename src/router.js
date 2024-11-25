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
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;


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
      component: ContextCreation,
      meta: { requiresAuth: true }
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/logout',
        name: 'Logout',
        component: Logout,
    }
  ]

const router = createRouter({
  history: createWebHistory(''),
  routes
})

export default router;
router.beforeEach(async (to, from, next) => {
    console.log("to", to);
    console.log("from", from);
  if (to.meta.requiresAuth) {
      console.log("to", to);
    try {
      const response = await fetch(`${BASE_URL}/network/api/checklogin/`, {
        method: 'GET',
        credentials: 'include', // Ensures session cookies are sent with the request
      });

      const data = await response.json();
      console.log("data.is_logged_in:", data.is_logged_in);

      if (data.is_logged_in) {
        console.log("User authenticated, proceeding...");
        next(); // Proceed to the route
      } else {
        console.log("User not authenticated, redirecting to login...");
        next({
          name: 'Login',
          query: { redirect: to.fullPath, // Redirect to login with original route as query
          message: 'login_required'},
        });
      }
    } catch (error) {
      console.error("Error during authentication check:", error);
      next({
        name: 'Login',
          query: { redirect: to.fullPath, // Redirect to login with original route as query
          message: 'login_required'},
      });
    }
  } else {
    console.log("Route does not require authentication, proceeding...");
    next(); // Allow access for routes that don't require authentication
  }
});