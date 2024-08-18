<!-- About Us Page -->

<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <v-row>
          <v-col cols="12" class="text-center">
            <h1 class="title1" style="color: #104d63">About Us</h1>
            <h3 style="color: #104d63">
              This project is a collaborative effort among students and
              supervisors for the Bioinformatics Master Practicum 2024. Learn
              more about our team, supervisors, and project collaborators.
            </h3>
          </v-col>
          <v-col cols="12">
            <div style="color: #104d63">
              <h2>Bioinformatik Master Praktikum 2024</h2>
            </div>
            <div style="color: #104d63">
              <h3>Team Members:</h3>
              <p>
                Elias Albrecht, Manuel Gander, Grace Zhuoyun Han, Andrea
                Raithel, Bastienne Rehor, Leo Sprengel
              </p>
              <h3>Supervisors:</h3>
              <p>Prof.Dr.Markus List, Lis Arend, Fabian Woller</p>
            </div>
          </v-col>
          <v-col cols="12">
            <div style="color: #104d63">
              <h2>Project Partners</h2>
            </div>
          </v-col>

          <v-row style="color: #104d63">
            <v-col cols="12" md="3" lg="3">
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
              <h3>Data Science in Systems Biology (DaiSyBio)</h3>
              <p>Prof. Dr. Markus List,<br />PhD Student Lis Arend</p>
            </v-col>

            <v-col cols="12" md="3" lg="3">
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
              <h3>Database Systems Group at the Faculty of Engineering</h3>
              <p>Prof. Dr. Johann Gamper,<br />RTD Researcher Anton Dignös</p>
            </v-col>

            <v-col cols="12" md="3" lg="3">
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
              <h3>Biomedical Network Science (BIONETS)</h3>
              <p>Prof. Dr. David Blumenthal,<br />PhD Student Fabian Woller</p>
            </v-col>

            <v-col cols="12" md="3" lg="3">
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
              <h3>Institute for Biomedicine</h3>
              <p>Dr. Christian Fuchsberger</p>
            </v-col>
          </v-row>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "AboutUs",
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
