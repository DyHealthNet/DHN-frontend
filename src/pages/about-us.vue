<template>
  <v-container class="about-page page-container py-10">
    <v-row>
      <v-col cols="12">
            <div class="hero">
              <div>
                <p class="eyebrow">About</p>
                <h1 class="title">About DyHealthNet</h1>
                <p class="subtitle">
                  Meet the team behind DyHealthNet, find out how to reach us, and see how to cite the project.
                </p>
              </div>
            </div>
          </v-col>
        </v-row>

        <v-expansion-panels class="mt-4" v-model="panels" multiple>
          <!-- What is DyHealthNet -->
          <v-expansion-panel :value="0" class="expansion-item">
            <v-expansion-panel-title class="panel-title" color="primary-darken-1">
              <v-icon left class="icon-custom">mdi-help-circle-outline</v-icon>
               What is DyHealthNet?
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="plain-text">DyHealthNet is a network-based data analysis platform, which allows to integrate heterogeneous data and support explorative data analytics over dynamically generated subsets of the CHRIS study data. </p>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- About Us -->
          <v-expansion-panel :value="1" class="expansion-item" >
            <v-expansion-panel-title class="panel-title" color="primary-darken-1">
              <v-icon left class="icon-custom">mdi-account-multiple-outline</v-icon>
               About Us
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="plain-text">DyHealthNet is a DFG-funded research project run by FAU (Biomedical Network Science Lab), TUM (Big Data in Biomedicine Group), Eurac (Institute for Biomedicine), and UNIBZ (Database Systems Group).</p>
              <v-container fluid>
                <v-row justify="space-around" align="center" no-gutters>
                  <!-- TUM -->
                  <v-col cols="6" md="3" lg="3" class="text-center">
                    <a href="https://www.tum.de/" target="_blank">
                      <v-img :src="tum_logo" alt="TUM Logo" contain class="mx-auto logo-img"/>
                    </a>
                    <p class="professor-name">Prof. Dr. Markus List</p>
                    <p class="professor-name">Data Science in Systems Biology</p>
                    <p class="professor-name">Technical University of Munich</p>
                    <a class="professor-name" href="mailto:markus.list@tum.de">markus.list@tum.de</a>
                    <p class="professor-name" href="https://www.daisybio.de">https://www.daisybio.de/</p>
                  </v-col>

                  <!-- Unibz -->
                  <v-col cols="6" md="3" lg="3" class="text-center">
                    <a href="https://www.unibz.it/" target="_blank">
                      <v-img :src="unibz_logo" alt="Unibz" contain class="mx-auto logo-img"/>
                    </a>
                    <p class="professor-name">Prof. Dr. Johann Gamper List</p>
                    <p class="professor-name">Database Systems Group - Faculty of Engineering</p>
                    <p class="professor-name">Free University of Bozen-Bolzano</p>
                    <a class="professor-name" href="mailto:johann.gamper@unibz.it">johann.gamper@unibz.it</a>
                    <p class="professor-name" href="https://dbs.inf.unibz.it/">https://dbs.inf.unibz.it/</p>
                  </v-col>

                  <!-- FAU -->
                  <v-col cols="6" md="3" lg="3" class="text-center">
                    <a href="https://www.fau.de/" target="_blank">
                      <v-img :src="fau_logo" alt="FAU" contain class="mx-auto logo-img"/>
                    </a>
                    <p class="professor-name">Prof. Dr. David B. Blumenthal</p>
                    <p class="professor-name">Biomedical Network Science Lab</p>
                    <p class="professor-name">Friedrich-Alexander-University Erlangen-Nürnberg</p>
                    <a class="professor-name" href="mailto:david.b.blumenthal@fau.de">david.b.blumenthal@fau.de</a>
                    <p class="professor-name" href="https://www.bionets.tf.fau.de/">https://www.bionets.tf.fau.de/</p>
                  </v-col>

                  <!-- Eurac -->
                  <v-col cols="6" md="3" lg="3" class="text-center">
                    <a href="https://www.eurac.edu/en" target="_blank">
                      <v-img :src="eurac_logo" alt="Eurac" contain class="mx-auto logo-img"/>
                    </a>
                    <p class="professor-name">Dr. Christian Fuchsberger</p>
                    <p class="professor-name">Research Group Leader at the Institute for Biomedicine</p>
                    <p class="professor-name">EURAC Research</p>
                    <a class="professor-name" href="mailto:Christian.Fuchsberger@eurac.edu">Christian.Fuchsberger@eurac.edu</a>
                    <p class="professor-name" href="https://www.eurac.edu/en/institutes-centers/institute-for-biomedicine">https://www.eurac.edu/en/institutes-centers/institute-for-biomedicine</p>
                  </v-col>
                </v-row>
              </v-container>
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
</template>

<script>

import {BASE_URL} from "../components/constants.js";

export default {
  data() {
    return {
      panels: [0],
      tum_logo: new URL("../assets/figures/TUM.png", import.meta.url).href,
      eurac_logo: new URL("../assets/figures/eurac.png", import.meta.url).href,
      fau_logo: new URL("../assets/figures/FAU.png", import.meta.url).href,
      unibz_logo: new URL("../assets/figures/unibz.png", import.meta.url).href
    };
  },
};

</script>

<style scoped>

.about-page {
  min-height: calc(100vh - 220px);
}

.hero {
  padding: 2rem;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.12), rgba(17, 24, 39, 0.04));
  border: 1px solid rgba(25, 118, 210, 0.16);
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary-darken-1));
}

.title {
  margin: 0;
  font-size: 2.5rem;
  line-height: 1.05;
}

.subtitle {
  margin-top: 0.9rem;
  max-width: 720px;
  font-size: 1.02rem;
  opacity: 0.82;
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
  color: rgb(var(--v-theme-primary-darken-1));
}

.professor-name {
  font-size: 1rem;
  line-height: 2;
  color: rgb(var(--v-theme-primary-light-1));
}

</style>