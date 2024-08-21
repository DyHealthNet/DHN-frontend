<template>
  <v-footer height="50" class="page-borders-footer" color="#FAFAFA" app>
    <v-row justify="center" no-gutters>
      <v-col cols="12" class="text-center">
        <p class="white--text">©{{ new Date().getFullYear() }} — DyHealthNet</p>
      </v-col>
    </v-row>
  </v-footer>
</template>

<style>
.page-borders-footer {
  border-left: 50px solid #fafafa; /* Change the color and size as needed */
  border-right: 50px solid #fafafa; /* Change the color and size as needed */
}
</style>
