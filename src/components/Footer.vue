<template>
    <v-footer color="#FAFAFA" app>
      <v-row justify="center" no-gutters>
      <v-col cols="12" class="text-center">
        <v-btn
        v-for="link in links"
        :key="link"
        class="mx-2"
        color="#757575"
        variant="text"
        :href="getLinkUrl(link)"
        >
        <strong>{{ link }}</strong>
        </v-btn>
      </v-col>
      <v-col cols="12" class="text-center">
        <p class="white--text">{{ new Date().getFullYear() }} — DyHealthNet</p>
      </v-col>
      </v-row>
    </v-footer>
    </template>
    
    <script>
    export default {
    data() {
      return {
      links: ['Home', 'Visualization', 'Network', 'API', 'Contact']
      };
    },
    methods: {
      getLinkUrl(link) {
      // Define the URL for each link
      if (link === 'Home') {
        return '/';
      } else if (link === 'Visualization') {
        return '/';
      } else if (link === 'Network') {
        return '/';
      } else if (link === 'API') {
        return '/';
      } else if (link === 'Contact') {
        return '/about-us';
      }
      }
    }
    };
    </script>
  
  <style scoped>

  </style>
  
