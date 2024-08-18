<!--This file defines the Navbar and Footer for all the pages in application-->

<template>
  <v-app>

      <Navbar />
    
      <v-main>
        <v-container fluid class="page-borders">
          <v-row>

            <!--Hier show the pages that  defines in the router-->
            <router-view />
            
          </v-row>
        </v-container>
      </v-main>

      <!--<Footer />-->
   
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
.page-borders {
  border-left: 50px solid white; /* Change the color and size as needed */
  border-right: 50px solid white; /* Change the color and size as needed */
}
</style>