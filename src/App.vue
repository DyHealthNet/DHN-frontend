<!--This file defines the Navbar and Footer for all the pages in application-->

<template>
  <v-app>
    <Navbar />
    <v-main>
      <v-container fluid class="page-borders">
        <v-row>
          <router-view />
        </v-row>
      </v-container>
    </v-main>
    <Footer />
  </v-app>
</template>

<script>
import Navbar from "@/components/Navbar.vue";
import Footer from "@/components/Footer.vue";


export default {
  components: {
    Navbar,
    Footer,
  },
};
</script>

<style>
</style>
