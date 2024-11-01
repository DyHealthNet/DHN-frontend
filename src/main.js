import './assets/main.css'

import { createApp } from 'vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Components
import App from './App.vue'

const dyHealthNetTheme = {
  dark: false,
    colors: {
    "background": "#FFFFFF",
    "surface": "#FAFAFA",
    "surface-bright": "#FFFFFF",
    "surface-light": "#F5F5F5",
    "surface-variant": "#E0E0E0",
    "on-surface-variant": "#4D4D4D",

    "primary": "#A5BFDC",
    "primary-darken-1": "#164F65",

    "secondary": "#C1A1D3",
    "secondary-darken-1": "#7D5E9A",

    "error": "#E57373",
    "info": "#3398DB",
    "success": "#81C784",
    "warning": "#FFB74D",
  },
}

const vuetify = createVuetify({
    theme: {
      defaultTheme: 'dyHealthNetTheme',
        themes: {
          dyHealthNetTheme,
        }
    },
  components,
  directives,
})

createApp(App).use(vuetify).use(router).mount('#app')
