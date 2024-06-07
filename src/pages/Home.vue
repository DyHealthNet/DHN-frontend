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
                  Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                  diam nonumy eirmod tempor invidunt ut labore et dolore magna
                  aliquyam erat, sed diam voluptua. At vero eos et accusam et
                  justo duo dolores et ea rebum. Stet clita kasd gubergren, no
                  sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem
                  ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
                  nonumy eirmod tempor invidunt ut labore et dolore magna
                  aliquyam erat, sed diam voluptua. At vero eos et accusam et
                  justo duo dolores et ea rebum. Stet clita kasd gubergren, no
                  sea takimata sanctus est Lorem ipsum dolor sit amet
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
                <a href="/data-overview" target="_blank">
                  <v-btn color="#A5BFDC">Data Overview</v-btn>
                </a>
              </v-col>
              <!--Button: Network-->
              <v-col cols="12" sm="6" md="4" class="text-center">
                <v-img>
                  <img :src="network" alt="Network" width="200" height="200" />
                </v-img>
                <v-btn color="#A5BFDC">Network</v-btn>
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
                <a href="/about-us" target="_blank">
                  <v-btn color="#A5BFDC">About Us</v-btn>
                </a>
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
              <!--Card components-->
              <v-col cols="12">
                <v-row>
                  <!--TUM-->
                  <v-col cols="12" md="6" lg="3">
                    <v-card class="mx-auto" max-width="400">
                      <v-img
                        class="align-end text-white"
                        height="200"
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWhsocA3fpJeajwKnYZL8RMOPHLAkEJ47wQQ&s"
                        cover
                      >
                      </v-img>
                      <!--TEXT 
                      <v-card-text>
                        <div><strong>Technical University Munich</strong></div>
                        <div>
                          Data Science in Systems Biology (DaiSyBio) <br />
                          Prof. Dr.Markus List <br />
                          PhD Student Lis Arend
                        </div>
                      </v-card-text>-->
                    </v-card>
                  </v-col>

                  <!--UNIBZ-->
                  <v-col cols="12" md="6" lg="3">
                    <v-card class="mx-auto" max-width="400">
                      <v-img
                        class="align-end text-white"
                        height="200"
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Free_University_of_Bozen-Bolzano_logo.svg/1200px-Free_University_of_Bozen-Bolzano_logo.svg.png"
                        cover
                      >
                      </v-img>
                      <!--TEXT
                      <v-card-text>
                        <div><strong>unibz</strong></div>
                        <div>
                          Database Systems Group at the Faculty of Engineering
                          <br />
                          Prof. Dr. Johann Gamper <br />
                          RTD Researcher Anton Dignös
                        </div>
                      </v-card-text>-->
                    </v-card>
                  </v-col>

                  <!--FAU-->
                  <v-col cols="12" md="6" lg="3">
                    <v-card class="mx-auto" max-width="400">
                      <v-img
                        class="align-end text-white"
                        height="200"
                        aspect-ratio="1"
                        src="https://www.uni-wuerzburg.de/fileadmin/99122200/news/fau.png"
                        cover
                      >
                      </v-img>
                      <!--TEXT
                      <v-card-text>
                        <div><strong>FAU</strong></div>
                        <div>
                          Biomedical Network Science (BIONETS) <br />
                          Prof. Dr. David Blumenthal <br />
                          PhD Student Fabian Woller <br />
                          <br />
                        </div>
                      </v-card-text>-->
                    </v-card>
                  </v-col>

                  <!--EURAC RESEARCH-->
                  <v-col cols="12" md="6" lg="3">
                    <v-card class="mx-auto" max-width="400">
                      <v-img
                        class="align-end text-white"
                        height="200"
                        src="https://pilatus-project.eu/wp-content/uploads/sites/5/2023/02/6.-EURAC-Logo-JPEG-zonder-witruimte_700x400.jpg"
                        cover
                      >
                      </v-img>
                      <!--TEXT
                      <v-card-text>
                        <div><strong>eurac research</strong></div>
                        <div>
                          Institute for Biomedicine <br />
                          Dr. Christian Fuchsberger <br />
                          <br />
                          <br />
                        </div>
                      </v-card-text>-->
                    </v-card>
                  </v-col>
                </v-row>
              </v-col>

              <!--Nicht Karten Komponenten-->
              <v-row>
                <v-col cols="12" md="3" lg="3" class="text-center">
                  <!-- TUM -->
                  <v-img>
                    <img
                      :src="tum_logo"
                      alt=""
                      style="width: 225px; height: auto;"
                    />
                  </v-img>
                </v-col>

                <v-col cols="12" md="3" lg="3" class="text-center">
                  <!-- Unibz -->
                  <v-img>
                    <img
                      :src="unibz_logo"
                      alt="Unibz"
                      style="width: 225px; height: auto;"
                    />
                  </v-img>
                </v-col>

                <v-col cols="12" md="3" lg="3" class="text-center">
                  <!-- fau -->
                  <v-img>
                    <img
                      :src="fau_logo"
                      alt="FAU"
                      style="width: 225px; height: auto;"
                    />
                  </v-img>
                </v-col>

                <v-col cols="12" md="3" lg="3" class="text-center">
                  <!-- Eurac -->
                  <v-img>
                    <img
                      :src="eurac_logo"
                      alt="Eurac"
                      style="width: 225px; height: auto;"
                    />
                  </v-img>
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
