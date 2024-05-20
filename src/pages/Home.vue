<!--Defines the Home page-->

<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <v-row>
          <!-- Part 1 Welcome words-->
          <v-col cols="12">
            <v-row justify="center">
              <v-col cols="12" sm="12" md="4" class="text-center">
                <h1 class="title1">Welcome to DyHealthNet!</h1>
              </v-col>
            </v-row>
          </v-col>

          <!-- Part 2 Pages button-->
          <v-col cols="12">
            <v-row justify="center" class="fill-height">
              <v-col cols="12" sm="6" md="4" class="text-center">
                <a href="/CHRIS-Data" target="_blank">
                  <v-btn color="primary">CHRIS Data</v-btn>
                </a>
              </v-col>
              <v-col cols="12" sm="6" md="4" class="text-center">
                <v-btn color="primary">NETWORK</v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="4" class="text-center">
                <a href="/about-us" target="_blank">
                  <v-btn color="primary">About Us</v-btn>
                </a>
              </v-col>
            </v-row>
          </v-col>

          <v-divider></v-divider>

          <!-- Part 3 Foundation-->
          <v-col cols="12">
            <v-row>
              <!--Text-->
              <v-col cols="12">
                <h2 class="text-center">Foundation</h2>
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
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Logo_of_the_Technical_University_of_Munich.svg/1200px-Logo_of_the_Technical_University_of_Munich.svg.png"
                        cover
                      >
                      </v-img>
                      <v-card-text>
                        <div><strong>Technical University Munich</strong></div>
                        <div>
                          Data Science in Systems Biology (DaiSyBio) <br />
                          Prof. Dr.Markus List <br />
                          PhD Student Lis Arend
                        </div>
                      </v-card-text>
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
                      <v-card-text>
                        <div><strong>unibz</strong></div>
                        <div>
                          Database Systems Group at the Faculty of Engineering
                          <br />
                          Prof. Dr. Johann Gamper <br />
                          RTD Researcher Anton Dignös
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <!--FAU-->
                  <v-col cols="12" md="6" lg="3">
                    <v-card class="mx-auto" max-width="400">
                      <v-img
                        class="align-end text-white"
                        height="200"
                        src="https://www.tf.fau.de/files/2022/10/FAU-Logo.png"
                        cover
                      >
                      </v-img>
                      <v-card-text>
                        <div><strong>FAU</strong></div>
                        <div>
                          Biomedical Network Science (BIONETS) <br />
                          Prof. Dr. David Blumenthal <br />
                          PhD Student Fabian Woller <br />
                          <br />
                        </div>
                      </v-card-text>
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
                      <v-card-text>
                        <div><strong>eurac research</strong></div>
                        <div>
                          Institute for Biomedicine <br />
                          Dr. Christian Fuchsberger <br />
                          <br>
                          <br>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-col>

          <!-- Part 4 Github link button-->
          <v-col cols="12">
            <v-row justify="center">
              <v-col cols="12" sm="6" md="4" class="text-center">
                <h2>Want to explore more?</h2>
              </v-col>
              <v-col cols="12" sm="6" md="4" class="text-center">
                <a href="https://github.com/" target="_blank">
                  <v-btn color="primary">Github</v-btn>
                </a>
              </v-col>
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
};
</script>
