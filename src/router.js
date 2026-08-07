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
import Metagraph from './pages/metagraph.vue'
import DifferentialNetwork from './pages/differential-network.vue'
import Login from './pages/user-login.vue'
import Logout from './pages/user-logout.vue'
import PlatformLogin from './pages/platform-login.vue'
import {checkLogin} from "@/components/authentication/auth.js";
import {checkPlatformAuth} from "@/components/authentication/platformAuth.js";
import {BASE_URL} from "@/components/constants.js";



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
      path:'/metagraph',
      name: 'Metagraph',
      component: () => Metagraph,
      meta: { requiresAuth: false }
    },
    {
      path: '/modina',
      name: 'DifferentialNetwork',
      component: DifferentialNetwork,
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
    },
    {
        // Platform-wide login page, see platformAuth.js / network/middleware.py.
        // Self-contained: remove this route + platform-login.vue + platformAuth.js
        // + the router.beforeEach guard below to rip the feature out.
        path: '/platform-login',
        name: 'PlatformLogin',
        component: PlatformLogin,
    }
  ]

const router = createRouter({
  history: createWebHistory(''),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Browser back/forward should restore the scroll position the user was
    // at; every other navigation should land at the top of the new page.
    return savedPosition || { top: 0 }
  }
})

export default router;

// Platform-wide gate: runs before the per-user auth guard below. Remove this
// block (see the route definition above for the rest of the removal steps)
// if the platform-login feature goes away.
router.beforeEach(async (to, from, next) => {
  if (to.name === 'PlatformLogin') {
    next();
    return;
  }

  const { enabled, isAuthenticated } = await checkPlatformAuth();
  if (!enabled || isAuthenticated) {
    next();
  } else {
    next({
      name: 'PlatformLogin',
      query: { redirect: to.fullPath },
    });
  }
});

router.beforeEach(async (to, from, next) => {
    console.log("to", to);
    console.log("from", from);
  if (to.meta.requiresAuth) {
      console.log("to", to);
    try {
      const isLoggedIn = await checkLogin(); // Await the login status

    if (isLoggedIn) {
        console.log("User authenticated, proceeding...");
        next(); // Allow access
      } else {
        console.log("User not authenticated, redirecting to login...");
        next({
          name: 'Login',
          query: { redirect: to.fullPath, message: 'login_required' }, // Redirect to login with original path as query
        });
      }
    } catch (error) {
      console.error('Error during authentication check:', error);
      next({
        name: 'Login',
        query: { redirect: to.fullPath, message: 'login_required' }, // Redirect to login with original path as query
      });
    }
    } else {
    next(); // Route does not require authentication, proceed
    }
});