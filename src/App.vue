<!--This file defines the Navbar and Footer for all the pages in application-->

<template>
  <v-app>
    <Navbar />

    <v-main>
      <v-container fluid>
        <v-row>

          <!--Hier show the pages that  defines in the router-->
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

<!--
<template>
  <h1>Welcome to DyHealthNet!</h1>
  <h2>Master praktikum group members:</h2>
  <p>{{ memberNames }}</p>
  <h2>Supervisors:</h2>
  <p>{{ supervisors }}</p>
  <AboutUsButton />
</template>

<script setup>
import { ref } from 'vue'
import AboutUsButton from '@/components/AboutUsButton.vue'

const memberNames = ref("Andrea, Bastinne, Leo, Manuel, Elias, Grace")
const supervisors = ref('Lis, Farbi and Prof. List')
</script>
<style>
</style>
-->
