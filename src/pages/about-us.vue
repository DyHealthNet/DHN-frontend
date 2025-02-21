<template>
  <v-app>
    <v-main>
      <v-container class="text-center">
        <v-row>
          <v-col cols="12">
            <h1 class="title mt-4">About</h1>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>
      </v-container>

      <v-container class="mt-4">
        <v-expansion-panels v-model="panels" multiple>
          <!-- What is DyHealthNet -->
          <v-expansion-panel :value="0" class="expansion-item">
            <v-expansion-panel-title class="panel-title" color="primary-darken-1">
              <v-icon left class="icon-custom">mdi-help-circle-outline</v-icon>
               What is DyHealthNet?
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="plain-text">TODO</p>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- About Us -->
          <v-expansion-panel :value="1" class="expansion-item" >
            <v-expansion-panel-title class="panel-title" color="primary-darken-1">
              <v-icon left class="icon-custom">mdi-account-multiple-outline</v-icon>
               About Us
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="plain-text">TODO</p>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Contact -->
          <v-expansion-panel :value="2" class="expansion-item" >
            <v-expansion-panel-title class="panel-title" color="primary-darken-1">
              <v-icon left class="icon-custom">mdi-email-outline</v-icon>
               Contact
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="plain-text">TODO</p>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- FAQ -->
          <v-expansion-panel :value="3" class="expansion-item">
            <v-expansion-panel-title class="panel-title" color="primary-darken-1">
              <v-icon left class="icon-custom">mdi-frequently-asked-questions</v-icon>
               FAQ
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <strong class="plain-text">Q: Can I use DyHealthNet for my cohort study?</strong>
              <p class="plain-text">A: TODO.</p>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Citation -->
          <v-expansion-panel :value="4" class="expansion-item">
            <v-expansion-panel-title class="panel-title" color="primary-darken-1">
              <v-icon left class="icon-custom">mdi-border-color</v-icon>
               Citation
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="plain-text">
                If you use DyHealthNet in your research, please cite our work:
              </p>
              <p class="citation-text">
                Author(s), "Title of the Paper", Journal Name, Year, DOI: 10.1234/dyhealthnet
              </p>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-container>

       <!-- Large Centered Image -->
      <v-container class="d-flex justify-center align-center">
        <img src="../assets/figures/DyHealthNet_Logo.png" width="500" height="auto"/>
      </v-container>
      
    </v-main>
  </v-app>
</template>

<script>

import {BASE_URL} from "../components/constants.js";

export default {
  data() {
    return {
      panels: [0],
    };
  },
};

</script>

<style scoped>

.title {
  font-size: 2rem;
}

.v-container {
  max-width: min(95%, 1800px);
}

@media (max-width: 1919px) {
  .responsive-card {
    width: 95%;
  }
}

.icon-custom {
  margin-right: 8px; /* Adjust spacing as needed */
  font-weight: 100 ! important;
}

.expansion-item {
  margin-bottom: 10px;
}

/* Custom header (similar to card toolbar) */
.panel-title {
  padding: 10px 16px;
  font-size: 20px;
}

.plain-text {
  font-size: 1.2rem;
  line-height: 2;
  max-width: 80ch;
  color: rgb(var(--v-theme-primary-darken-1));
}

</style>