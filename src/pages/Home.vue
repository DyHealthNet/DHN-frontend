<template>
  <v-app>
    <v-main class="home-background">
      <v-container width="80%" >
        <!-- Part 1 Welcome words-->
        <v-row class="my-12">
          <v-col cols="12" class="text-center">
            <!-- Title -->
            <h1 class="main-header">
              {{ mainHeader }}
            </h1>
          </v-col>
          <v-col cols="12" class="text-center">
            <h2 class="main-subheader">
              {{ mainSubheader }}
            </h2>
          </v-col>
        </v-row>

        <!-- Part 2 Overview, Network-->
        <v-row class="my-5">
          <!-- Part 2 Context page-->
          <v-col cols="12" md="12" lg="6" class="text-center">
            <v-sheet rounded="lg" elevation="1" height="300px" min-width="620px" class="d-flex align-center">
              <v-row>
                <v-col cols="4" class="d-flex justify-center align-center">
                  <v-img>
                    <img :src="network" alt="Network" width="200" height="200"/>
                  </v-img>
                </v-col>
                <v-col cols="8" class="d-flex flex-column justify-space-between">
                  <h3 class="secondary-header">
                    Define your Context
                  </h3>
                  <p class="description-text mx-3">
                    {{ loremIpsum }}
                  </p>
                  <v-btn size="x-large" to="/context" color="primary"
                         class="mt-5 align-self-center" prepend-icon="mdi-tune-vertical">Contexts</v-btn>
                </v-col>
              </v-row>
            </v-sheet>
          </v-col>

          <!-- Part 2 Network page-->
          <v-col cols="12" md="12" lg="6" class="text-center">
            <v-sheet rounded="lg" elevation="1" height="300px" min-width="620px" class="d-flex align-center">
              <v-row>
                <v-col cols="4" class="d-flex justify-center align-center">
                  <v-img>
                    <img :src="network" alt="Network" width="200" height="200"/>
                  </v-img>
                </v-col>
                <v-col cols="8" class="d-flex flex-column justify-space-between">
                  <h3 class="secondary-header">
                    Build a Network
                  </h3>
                  <p class="description-text mx-3">
                    {{ networkDescription }}
                  </p>
                  <v-btn size="x-large" to="/network" color="primary"
                         class="mt-5 align-self-center" prepend-icon="mdi-graph-outline">Network</v-btn>
                </v-col>
              </v-row>
            </v-sheet>
          </v-col>

          <!-- Part 2 Overview page-->
          <v-col cols="12" md="12" lg="6" class="text-center">
            <v-sheet rounded="lg" elevation="1" height="300px" min-width="620px" class="d-flex align-center">
              <v-row>
                <v-col cols="4" class="d-flex justify-center align-center">
                  <v-img>
                    <img
                        :src="overview"
                        alt="Data Overview"
                        width="200"
                        height="200"
                    />
                  </v-img>
                </v-col>
                <v-col cols="8" class="d-flex flex-column justify-space-between">
                  <div>
                    <h3 class="secondary-header">
                      Get a Data Overview
                    </h3>
                    <p class="description-text mx-3">
                      {{ overviewDescription }}
                    </p>
                  </div>
                  <v-btn size="x-large" to="/overview" color="primary"
                         class="mt-5 align-self-center" prepend-icon="mdi-chart-line">Overview</v-btn>
                </v-col>
              </v-row>
            </v-sheet>
          </v-col>

          <!-- Do it yourself page-->
          <v-col cols="12" md="12" lg="6" class="text-center">
            <v-sheet rounded="lg" elevation="1" height="300px" min-width="620px" class="d-flex align-center">
              <v-row>
                <v-col cols="4" class="d-flex justify-center align-center">
                  <v-img>
                    <img :src="about_us" alt="Network" width="200" height="200"/>
                  </v-img>
                </v-col>
                <v-col cols="8" class="d-flex flex-column justify-space-between">
                  <h3 class="secondary-header">
                    Apply to your Cohort
                  </h3>
                  <p class="description-text mx-3">
                    {{ loremIpsum }}
                  </p>
                  <v-btn size="x-large" to="/about-us" color="primary"
                         class="mt-5 align-self-center" prepend-icon="mdi-book-outline">Documentation</v-btn>
                </v-col>
              </v-row>
            </v-sheet>
          </v-col>

        </v-row>

        <v-divider class="my-10"></v-divider>

        <!-- Part 3 Explanation-->
        <v-row class="my-5">
          <v-col cols="6" class="d-flex justify-center">
            <h1 class="secondary-header">
              What is DyHealthNet?
            </h1>
          </v-col>
          <v-col cols="6">
            <p class="plain-text">
              {{ detailedExplanation }}
            </p>
          </v-col>
        </v-row>

        <v-divider class="my-10"></v-divider>

        <!-- Part 4 Foundation-->
        <v-row class="my-5">
          <v-col cols="6">
            <v-row>
              <v-col cols="6" class="text-center align-content-center">
                <a href="https://www.tum.de/" target="_blank">
                  <v-img :src="tum_logo" alt="TUM Logo" width="225" class="mx-auto">
                  </v-img>
                </a>
              </v-col>
              <v-col cols="6" class="text-center">
                <!-- Unibz -->
                <a href="https://www.unibz.it/" target="_blank">
                  <v-img>
                    <img
                        :src="unibz_logo"
                        alt="Unibz"
                        style="width: 225px; height: auto"
                    />
                  </v-img>
                </a>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6" class="text-center">
                <!-- fau -->
                <a href="https://www.fau.de/" target="_blank">
                  <v-img>
                    <img
                        :src="fau_logo"
                        alt="FAU"
                        style="width: 225px; height: auto"
                    />
                  </v-img>
                </a>
              </v-col>
              <v-col cols="6" class="text-center">
                <!-- Eurac -->
                <a href="https://www.eurac.edu/en" target="_blank">
                  <v-img>
                    <img
                        :src="eurac_logo"
                        alt="Eurac"
                        style="width: 225px; height: auto"
                    />
                  </v-img>
                </a>
              </v-col>
            </v-row>
          </v-col>

        <v-col cols="6" class="d-flex flex-column align-center text-center">
          <h2 class="secondary-header">
            Our collaborators
          </h2>
          <p class="plain-text my-5">
            {{ collaboratorsDescription }}
          </p>
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
      about_us: new URL("../assets/figures/About_Us.png", import.meta.url).href,
      overview: new URL("../assets/figures/Data_Overview.png", import.meta.url)
          .href,
      network: new URL(
          "../assets/figures/DyHealthNet_Icon.png",
          import.meta.url
      ).href,

      mainHeader: "Explore Cohorts with DyHealthNet",
      mainSubheader: "A Dynamic Approach to Network Medicine in the CHRIS Study",

      detailedExplanation:
          "DyHealthNet is a platform that addresses the dynamic\n" +
          "exploration of epidemiological population cohorts via\n" +
          "multi-level network medicine. This platform is connected to a\n" +
          "open-source backend and a multi-omics database comprising\n" +
          "knowledge from other reliable databases as well as various\n" +
          "association scores among genetic variants, metabolites, and\n" +
          "additional information from CHRIS data.\n" +
          "In this first developed prototype, we mainly focus on the visualization of\n" +
          "phenotype data and the network-based data correlation.",
      overviewDescription:
          "Get a comprehensive summary of data variables\n" +
          "and visualise data through diverse methods to\n" +
          "accommodate different analytical requirements.",
      networkDescription:
          "Build a network of variables from the CHRIS study and\n" +
          "explore a network of interactions between those variables\n" +
          "and their associations with health outcomes.",
      aboutUsDescription:
          "More information about the research group and collaborators\n" +
          "you can find here",
      collaboratorsDescription:
          "The DyHealthNet project is a collaboration between the\n" +
          "Technical University of Munich (TUM), Free University of\n" +
          "Bolzano (Unibz), Friedrich-Alexander University Erlangen-\n" +
          "Nuremberg (FAU), and Eurac Research.",
      loremIpsum:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla\n" +
          "congue, nisl nec ultricies ultricies, nunc nisl ultricies\n" +
          "nunc, nec ultricies nunc nisl nec nunc. Nulla congue, nisl\n",
    };
  },
};
</script>

<style scoped>

.home-background {
  //background: radial-gradient(ellipse, rgb(var(--v-theme-primary)) 30%, rgba(255, 255, 255, 0) 100%);
  background: linear-gradient(to bottom right,  rgb(var(--v-theme-primary)),  rgb(var(--v-theme-background)));
  padding: 20px;
  border-radius: 10px;
}

.description-text {
  margin-top: 10px;
  font-size: 14px;
  color: rgb(var(--v-theme-darken));
}

.plain-text {
  font-size: 1.2rem;
  line-height: 2;
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
</style>