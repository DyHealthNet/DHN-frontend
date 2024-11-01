<!--Defines the Home page-->

<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <v-row>
          <!-- Part 1 Welcome words-->
          <v-col cols="12">
            <v-row>
              <!-- Figure kommt noch
              <v-col cols="6">
                <img src="https://genengnews.com/wp-content/uploads/2018/10/UGENWebsitepictures2010GEN20_Nov1510DimondSignalingCellSignalingTech_AML_layout2361511805.jpg" alt="sample figure">
              </v-col>-->

              <!-- Title -->
              <v-col cols="12" class="text-center">
                <h1 class="title1" style="color: #104d63">
                  Dynamic Exploration of the Cooperative Health Research in
                  South Tyrol Study Data via Multi-Level Network Medicine
                </h1>
                <p style="color: #104d63">
                  DyHealthNet is a platform that addresses the dynamic
                  exploration of epidemiological population cohorts via
                  multi-level network medicine. This platform is connected to a
                  open-source backend and a multi-omics database comprising
                  knowledge from other reliable databases as well as various
                  association scores among genetic variants, metabolites, and
                  additional information from CHRIS data.
                  In this first developed prototype, we mainly focus on the visualization of
                  phenotype data and the network-based data correlation.
                </p>
              </v-col>
            </v-row>
          </v-col>

          <!-- Part 2 Pages button-->
          <v-col cols="12">
            <v-row justify="center" class="fill-height">
              <!--Button: Data Overview-->
              <v-col cols="12" sm="6" md="4" class="text-center">
                <v-img>
                  <img
                    :src="overview"
                    alt="Data Overview"
                    width="200"
                    height="200"
                  />
                </v-img>
                <v-btn to="/overview" color="primary">Data Overview</v-btn>
                <p class="description-text">
                  This page provides a comprehensive summary of data variables
                  and visualises phenotype data through diverse methods to
                  accommodate different analytical requirements.
                </p>
              </v-col>
              <!--Button: Network-->
              <v-col cols="12" sm="6" md="4" class="text-center">
                <v-img>
                  <img :src="network" alt="Network" width="200" height="200" />
                </v-img>
                <v-btn to="/network" color="primary">Network</v-btn>
                <p class="description-text">
                  This page visualizes correlations between various variables
                  sourced from different databases, facilitating a deeper
                  understanding of data relationships.
                </p>
              </v-col>
              <!--Button: About Us-->
              <v-col cols="12" sm="6" md="4" class="text-center">
                <v-img>
                  <img
                    :src="about_us"
                    alt="about us"
                    width="200"
                    height="200"
                  />
                </v-img>
                <v-btn to="/about-us" color="primary">About Us</v-btn>
                <p class="description-text">
                  More information about the research group and collaborators
                  you can find here
                </p>
              </v-col>
            </v-row>
          </v-col>

          <br />
          <v-divider></v-divider>
          <br />

          <!-- Part 3 Foundation-->
          <v-col cols="12">
            <v-row>
              <!--Text-->
              <v-col cols="12">
                <h1 class="text-center" style="color: #104d63">
                  Collaborators
                </h1>
              </v-col>

              <!--Nicht Karten Komponenten-->
              <v-row>
                <v-col cols="12" md="3" lg="3" class="text-center">
                  <!-- TUM -->
                  <a href="https://www.tum.de/" target="_blank">
                    <v-img>
                      <img
                        :src="tum_logo"
                        alt=""
                        style="width: 225px; height: auto"
                      />
                    </v-img>
                  </a>
                </v-col>

                <v-col cols="12" md="3" lg="3" class="text-center">
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

                <v-col cols="12" md="3" lg="3" class="text-center">
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

                <v-col cols="12" md="3" lg="3" class="text-center">
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
            </v-row>
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
    };
  },
};
</script>

<style scoped>
.description-text {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}
</style>
