<template>
  <v-app>
    <v-main class="home-background">
      <v-container width="80%">
        <!-- Part 1: Welcome -->
        <v-row class="my-12">
          <v-col cols="12" class="text-center">
            <h1 class="main-header">{{ mainHeader }}</h1>
          </v-col>
          <v-col cols="12" class="text-center">
            <h2 class="main-subheader">{{ mainSubheader }}</h2>
          </v-col>
        </v-row>

        <!-- Part 2 Overview, Network-->
        <v-row class="my-5">
          <!-- Context Page -->
          <v-col cols="12" md="12" lg="6" class="text-center">
            <v-sheet rounded="lg" elevation="1"  class="d-flex align-center sheet">
              <v-row>
                <v-col cols="4" class="d-flex justify-center align-center">
                  <v-img :src="contexts" alt="Context" width="200" height="200" contain/>
                </v-col>
                <v-col cols="8" class="d-flex flex-column text-left">
                  <h3 class="secondary-header mt-1 mr-3">Define Your Context</h3>
                  <p class="description-text mr-3">{{ contextDescription }}</p>
                  <div class="right-align">
                  <v-btn size="x-large" to="/network" color="primary"
                         class="mt-5 mb-5 mx-5" prepend-icon="mdi-graph-outline">Contexts</v-btn>
                  </div>

                </v-col>
              </v-row>
            </v-sheet>
          </v-col>

          <!-- Part 2 Network page-->
          <v-col cols="12" md="12" lg="6" class="text-center">
            <v-sheet rounded="lg" elevation="1"  class="d-flex align-center sheet">
              <v-row>
                <v-col cols="4" class="d-flex justify-center align-center">
                  <v-img :src="network" alt="Network" width="200" height="200" contain/>
                </v-col>
                <v-col cols="8" class="d-flex flex-column text-left">
                  <h3 class="secondary-header mt-1 mr-3">
                    Build a Network
                  </h3>
                  <p class="description-text mr-3">
                    {{ networkDescription }}
                  </p>
                  <div class="right-align">
                  <v-btn size="x-large" to="/network" color="primary"
                         class="mt-5 mb-5 mx-5" prepend-icon="mdi-graph-outline">Network</v-btn>
                  </div>

                </v-col>
              </v-row>
            </v-sheet>
          </v-col>

          <!-- Part 2 Overview page-->
          <v-col cols="12" md="6">
            <v-sheet rounded="lg" elevation="1" class="d-flex align-center sheet fill-height">
              <v-row no-gutters>
                <v-col cols="4" class="d-flex justify-center align-center">
                  <v-img :src="overview" alt="Overview" width="200" height="200" contain />
                </v-col>
                <v-col cols="8" class="d-flex flex-column text-left">
                  <h3 class="secondary-header mt-1 mr-3">Get a Data Overview</h3>
                  <p class="description-text mr-3">{{ overviewDescription }}</p>
                  <div class="right-align">
                    <v-btn size="x-large" to="/overview" color="primary" class="mt-5 mb-5 mx-5"
                           prepend-icon="mdi-chart-line">Overview</v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-sheet>
          </v-col>

          <!-- Documentation page -->
          <v-col cols="12" md="6">
            <v-sheet rounded="lg" elevation="1" class="d-flex align-center sheet fill-height">
              <v-row no-gutters>
                <v-col cols="4" class="d-flex justify-center align-center">
                  <v-img :src="documentation" alt="Documentation" width="200" height="200" contain />
                </v-col>
                <v-col cols="8" class="d-flex flex-column text-left">
                  <h3 class="secondary-header mt-1 mr-3">Apply to Your Cohort</h3>
                  <p class="description-text mr-3">{{ applyCohortDescription }}</p>
                  <div class="right-align">
                    <v-btn size="x-large" to="/about-us" color="primary" class="mt-5 mb-5 mx-5" disabled
                           prepend-icon="mdi-book-outline">Documentation</v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-sheet>
          </v-col>

        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      tum_logo: new URL("../assets/figures/TUM.png", import.meta.url).href,
      eurac_logo: new URL("../assets/figures/Eurac.png", import.meta.url).href,
      fau_logo: new URL("../assets/figures/FAU.png", import.meta.url).href,
      unibz_logo: new URL("../assets/figures/Unibz.png", import.meta.url).href,

      documentation: new URL("../assets/figures/Home_Page_Icons-05.png", import.meta.url).href,
      overview: new URL("../assets/figures/Home_Page_Icons-01.png", import.meta.url).href,
      network: new URL("../assets/figures/Home_Page_Icons-03.png", import.meta.url).href,
      contexts: new URL("../assets/figures/Home_Page_Icons-04.png", import.meta.url).href,

      mainHeader: "Explore Cohorts with DyHealthNet",
      mainSubheader: "A Dynamic Approach to Network Medicine in the CHRIS Study",


      overviewDescription: "Get a comprehensive summary of data variables and visualize data through diverse methods.",
      networkDescription: "Build a network of variables from the CHRIS study and explore interactions with health outcomes.",
      contextDescription: "Define your context by selecting patients of interest for a more focused exploration.",
      applyCohortDescription: "Use our documentation to apply the DyHealthNet platform to your own cohort.",

    };
  },
};
</script>

<style scoped>

.home-background {
  background: linear-gradient(to bottom right,  rgb(var(--v-theme-primary)),  rgb(var(--v-theme-background)));
  padding: 20px;
  border-radius: 10px;
}

.description-text {
  margin-top: 10px;
  font-size: 1rem;
  color: rgb(var(--v-theme-darken));
}

.plain-text {
  font-size: 1.2rem;
  line-height: 2;
  max-width: 80ch;
  color: rgb(var(--v-theme-primary-darken-1));
}

.main-header {
  font-size: 4rem;
  font-weight: bold;
  color: rgb(var(--v-theme-darken-1));
  margin-bottom: 10px;
}

.main-subheader {
  font-size: 3rem;
  font-weight: 400;
  color: rgb(var(--v-theme-primary-darken-1));
}

.secondary-header {
  font-size: 2rem;
  font-weight: bold;
  justify-content: center;
  color: rgb(var(--v-theme-primary-darken-1));
}

.round-border {
  border-radius: 10px;
  background-color: rgb(var(--v-theme-surface));
}

.sheet {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.right-align {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  height: 100%;
}
</style>