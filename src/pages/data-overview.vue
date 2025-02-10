<template>
  <v-app>
    <!--structure define-->
    <v-main>
      <!--header -->
      <v-container class="text-center">
        <v-row class="d-flex align-center justify-center">
          <v-col cols="12">
            <h1 class="title mt-4">Data Overview</h1>
          </v-col>
        </v-row>
        <v-row class="d-flex align-center justify-center">
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>
      </v-container>
      <!--main content-->
      <v-container class="mt-4 ">
        <FilterToolbar @change-context="updateData"></FilterToolbar>
        <v-row class="my-2 justify-center">
          <v-card rounded="lg" elevation="1" class="responsive-card">
            <v-toolbar color="primary-darken-1" density="compact">
              <v-toolbar-title>
                Variable Summary
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props">mdi-information</v-icon>
                  </template>
                  <span>
                    Here is an overview of simulated cohorts subsets from CHRIS data
                  </span>
                </v-tooltip>
              </v-toolbar-title>
            </v-toolbar>
            <v-spacer></v-spacer>

            <!--Overview cards in tabs-->
            <v-tabs-window v-model="model">
              <v-card>
                <v-card-text>
                  <!-- Cards filling the entire row, equally spaced -->
                  <v-row class="fill-height" justify="space-around" align="stretch">
                    <v-col
                        :cols="12 / rows1.length"
                        v-for="(item, index) in rows1"
                        :key="index"
                        class=""
                    >
                      <v-card class="mx-0 d-flex flex-row align-center" outlined elevation="0">
                        <v-img
                          :src="getImageForCard(item.name)"
                          :alt="item.name"
                          max-width="40"
                          max-height="40"
                          class="mx-3 bg-layer"
                        ></v-img>
                        <div class="text-left mr-3 my-2 d-flex flex-column justify-center">
                          <div class="small-title">{{ item.name }}</div>
                          <div class="number-data">{{ item.column1 }}</div>
                        </div>
                      </v-card>
                      <v-divider thickness="2"></v-divider>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-tabs-window>
          </v-card>
        </v-row>
        <v-spacer class="my-10"></v-spacer>
        <!--Tab bar-->
        <v-row class="my-2 justify-center">
          <v-card rounded="lg" elevation="1" class="responsive-card">
            <!--Tab bar name-->
            <v-toolbar color="primary-darken-1" density="compact">
              <v-toolbar-title>
                <div class="d-flex align-center">
                  <span>Data Overview</span>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ props }">
                      <v-icon class="ml-2" v-bind="props">mdi-information</v-icon>
                    </template>
                    <span>
                      You can select and visualize variables for your own
                        requirements
                    </span>
                  </v-tooltip>
                <v-spacer></v-spacer>
                <v-btn icon="mdi-cog-outline" @click="showOptions = true"></v-btn>
                </div>
              </v-toolbar-title>
              <template v-slot:extension>
                <v-tabs v-model="model" align-tabs="center" bg-color="primary-darken-1">
                  <v-tab
                      v-for="tab in tabs"
                      :key="tab.value"
                      :text="tab.name"
                      :value="tab.value"
                  ></v-tab>
                </v-tabs>
              </template>
            </v-toolbar>

            <!-- options dialog -->
            <v-dialog v-model="showOptions" max-width="1000px">
              <v-card>
                <v-card-title>Plotting options</v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="6">
                      <p>Plot size</p>
                    </v-col>
                    <v-col cols="3">
                      <p>Color palette continuous</p>
                    </v-col>
                    <v-col>
                      <p>Color palette categorical</p>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="6">
                      <v-slider v-model="plotWidth" max="2000" min="200" step="1">
                            <template v-slot:append>
                              <v-text-field
                                v-model="plotWidth"
                                density="compact"
                                style="width: 90px"
                                type="number"
                                variant="outlined"
                                hide-details
                                single-line
                              ></v-text-field>
                            </template>
                      </v-slider>
                      <v-slider v-model="plotHeight" max="1000" min="200" step="1">
                        <template v-slot:append>
                              <v-text-field
                                v-model="plotHeight"
                                density="compact"
                                style="width: 90px"
                                type="number"
                                variant="outlined"
                                hide-details
                                single-line
                              ></v-text-field>
                            </template></v-slider>
                    </v-col>
                    <v-col cols="3" class="">
                      <ColorPalette :colors="colorPalettes.muted"
                                    palette-id="muted"
                                    class="mx-3 my-3"
                                    @palette-selected="(paletteId) => {this.userSelectedPaletteCa = paletteId}"
                                    :current-palette="userSelectedPaletteCa"
                      ></ColorPalette>
                      <ColorPalette :colors="colorPalettes.husl"
                                    palette-id="husl"
                                    class="mx-3"
                                    @palette-selected="(paletteId) => {this.userSelectedPaletteCa = paletteId}"
                                    :current-palette="userSelectedPaletteCa"
                      ></ColorPalette>
                    </v-col>
                    <v-col cols="3" class="">
                      <ColorPalette palette-id="viridis"
                                    :colors="colorPalettes.viridis"
                                    class="mx-3 my-3"
                                    @palette-selected="(paletteId) => {this.userSelectedPaletteCo = paletteId}"
                                    :current-palette="userSelectedPaletteCo"
                      ></ColorPalette>
                      <ColorPalette :colors="colorPalettes.rocket"
                                    palette-id="rocket"
                                    class="mx-3"
                                    @palette-selected="(paletteId) => {this.userSelectedPaletteCo = paletteId}"
                                    :current-palette="userSelectedPaletteCo"
                      ></ColorPalette>
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-card-actions>
                  <v-btn @click="showOptions = false">Close</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!--Tab content-->
            <v-tabs-window v-model="model">
              <v-tabs-window-item
                  v-for="tab in tabs"
                  :key="tab.value"
                  :value="tab.value"
              >
                <v-card>
                  <v-card-text>
                    <!-- Content for Box Plot -->
                    <template v-if="tab.value === 1">
                      <v-row>
                        <!--Drop Down list-->
                        <v-col cols="12" align="center">
                          <div class="d-flex justify-space-around">
                            <!--Select X variables-->
                            <v-tooltip location="top" open-on-hover>
                              <template v-slot:activator="{ props }">
                                <v-autocomplete
                                    v-model="selectedXvariableBox"
                                    clearable
                                    variant="outlined"
                                    density="compact"
                                    label="X Variable"
                                    :items="xItemsBox"
                                    class="variable-field"
                                    v-bind="props"
                                ></v-autocomplete>
                              </template>
                              <span>Categorical variable</span>
                            </v-tooltip>

                            <!--Select Y variables-->
                            <v-tooltip location="top" open-on-hover>
                              <template v-slot:activator="{ props }">
                                <v-autocomplete
                                    v-model="selectedYvariableBox"
                                    clearable
                                    variant="outlined"
                                    density="compact"
                                    label="Y Variable"
                                    :items="yItemsBox"
                                    class="variable-field"
                                    v-bind="props"
                                ></v-autocomplete>
                              </template>
                              <span>Continous variable</span>
                            </v-tooltip>

                            <!--Colored by which variables-->
                            <v-tooltip location="top" open-on-hover>
                              <template v-slot:activator="{ props }">
                                <v-autocomplete
                                    v-model="selectedCvariableBox"
                                    clearable
                                    variant="outlined"
                                    density="compact"
                                    label="Colored by (optional)"
                                    :items="colorItemsBox"
                                    class="variable-field"
                                    v-bind="props"
                                ></v-autocomplete>
                              </template>
                              <span>Categorical variable for grouping</span>
                            </v-tooltip>
                          </div>
                        </v-col>

                        <!--Box Chart-->
                        <v-col cols="12" align="center">
                          <v-sheet :width="plotWidth" :height="plotHeight">
                            <CustomBox
                                :x-var="selectedXvariableBox"
                                :y-var="selectedYvariableBox"
                                :c-var="selectedCvariableBox"
                                :context-value="contextValue"
                                :palette="userSelectedPaletteCa"
                            />
                          </v-sheet>
                        </v-col>
                      </v-row>
                    </template>

                    <!-- Content for Line Plot -->
                    <template v-else-if="tab.value === 2">
                      <v-row>
                        <!--Drop Down list-->
                        <v-col cols="12" align="center">
                          <div class="d-flex justify-space-around">
                            <!--Select X variables-->
                            <v-tooltip location="top" open-on-hover>
                              <template v-slot:activator="{ props }">
                                <v-autocomplete
                                    v-model="selectedXvariableLine"
                                    clearable
                                    variant="outlined"
                                    density="compact"
                                    label="X Variable"
                                    :items="xItemsLine"
                                    class="variable-field"
                                    v-bind="props"
                                ></v-autocomplete>
                              </template>
                              <span
                              >Categorical or Countinous variable
                                  </span>
                            </v-tooltip>

                            <!--Select Y variables-->
                            <v-tooltip location="top" open-on-hover>
                              <template v-slot:activator="{ props }">
                                <v-autocomplete
                                    v-model="selectedYvariableLine"
                                    clearable
                                    variant="outlined"
                                    density="compact"
                                    label="Y Variable"
                                    :items="yItemsLine"
                                    class="variable-field"
                                    v-bind="props"
                                ></v-autocomplete>
                              </template>
                              <span>Continous variable</span>
                            </v-tooltip>

                            <!--Colored by which variables-->
                            <v-tooltip location="top" open-on-hover>
                              <template v-slot:activator="{ props }">
                                <v-autocomplete
                                    v-model="selectedCvariableLine"
                                    clearable
                                    variant="outlined"
                                    density="compact"
                                    label="Colored by (optional)"
                                    :items="colorItemsLine"
                                    class="variable-field"
                                    v-bind="props"
                                ></v-autocomplete>
                              </template>
                              <span>Categorical variable for grouping</span>
                            </v-tooltip>
                          </div>
                        </v-col>

                        <!--Line Chart-->
                        <v-col cols="12" align="center">
                          <v-sheet :max-width="plotWidth" :min-height="plotHeight" :max-height="plotHeight">
                            <CustomLine
                                :x-var="selectedXvariableLine"
                                :y-var="selectedYvariableLine"
                                :c-var="selectedCvariableLine"
                                :context-value="contextValue"
                                :palette="userSelectedPaletteCa"
                            />
                          </v-sheet>
                        </v-col>
                      </v-row>
                    </template>

                    <!-- Content for Heatmap -->
                    <template v-else-if="tab.value === 3">
                      <v-row>
                        <!--Drop Down list-->
                        <v-col cols="12" align="center">
                          <div class="d-flex justify-space-around">
                            <!--Select variable 1-->
                            <v-tooltip location="top" open-on-hover>
                              <template v-slot:activator="{ props }">
                                <v-autocomplete
                                    v-model="selectedVariableHeatmap1"
                                    clearable
                                    variant="outlined"
                                    density="compact"
                                    label="X Variable"
                                    :items="itemHeatmap1"
                                    class="variable-field"
                                    v-bind="props"
                                ></v-autocomplete>
                              </template>
                              <span>Categorical variable</span>
                            </v-tooltip>

                            <!--Select variable 2-->
                            <v-tooltip location="top" open-on-hover>
                              <template v-slot:activator="{ props }">
                                <v-autocomplete
                                    v-model="selectedVariableHeatmap2"
                                    clearable
                                    variant="outlined"
                                    density="compact"
                                    label="Y Variable"
                                    :items="itemHeatmap2"
                                    class="variable-field"
                                    v-bind="props"
                                ></v-autocomplete>
                              </template>
                              <span>Categorical variable</span>
                            </v-tooltip>
                          </div>
                        </v-col>

                        <!--Heatmap-->
                        <v-col cols="12" align="center">
                          <v-sheet :width="plotWidth" :height="plotHeight">
                            <CustomHeatmap
                                :x-var="selectedVariableHeatmap1"
                                :y-var="selectedVariableHeatmap2"
                                :context-value="contextValue"
                                :palette="userSelectedPaletteCo"
                            />
                          </v-sheet>
                        </v-col>
                      </v-row>
                    </template>

                    <!-- Content for the variable counts tab -->
                    <template v-else-if="tab.value === 6">
                      <!--Bar Plot-->
                      <v-row>
                        <!--Drop Down list-->
                        <v-col cols="12" align="center">
                          <div class="d-flex justify-space-around">
                            <!--Select X variables-->
                            <v-tooltip location="top" open-on-hover>
                              <template v-slot:activator="{ props }">
                                <v-autocomplete
                                    v-model="selectedXvariableBar"
                                    clearable
                                    variant="outlined"
                                    density="compact"
                                    label="X Variable"
                                    :items="xItemsBar"
                                    class="variable-field"
                                    v-bind="props"
                                ></v-autocomplete>
                              </template>
                              <span>Categorical variable</span>
                            </v-tooltip>
                            <!--Colored by which variables-->
                            <v-tooltip location="top" open-on-hover>
                              <template v-slot:activator="{ props }">
                                <v-autocomplete
                                    v-model="selectedCvariableBar"
                                    clearable
                                    variant="outlined"
                                    density="compact"
                                    label="Colored by (optional)"
                                    :items="colorItemsBar"
                                    class="variable-field"
                                    v-bind="props"
                                ></v-autocomplete>
                              </template>
                              <span>Categorical variable for grouping</span>
                            </v-tooltip>
                          </div>
                        </v-col>

                        <!--Bar-->
                        <v-col cols="12" align="center">
                          <v-sheet :max-width="plotWidth" :min-height="plotHeight" :max-height="plotHeight">
                            <CustomBar
                                :x-var="selectedXvariableBar"
                                :c-var="selectedCvariableBar"
                                :context-value="contextValue"
                                :palette="userSelectedPaletteCa"
                            />
                            </v-sheet>
                        </v-col>
                      </v-row>
                    </template>
                    <!-- Content for Density Plot -->
                    <template v-else-if="tab.value === 7">
                      <v-row>
                        <!--Drop Down list-->
                        <v-col cols="12" align="center">
                          <div class="d-flex justify-space-around">
                            <!--Select X variables-->
                            <v-tooltip location="top" open-on-hover>
                              <template v-slot:activator="{ props }">
                                <v-autocomplete
                                    v-model="selectedXvariableDensity"
                                    clearable
                                    variant="outlined"
                                    density="compact"
                                    label="X Variable"
                                    :items="xItemsDensity"
                                    class="variable-field"
                                    v-bind="props"
                                ></v-autocomplete>
                              </template>
                              <span
                              >Countinous variable</span>
                            </v-tooltip>

                            <!--Colored by which variables-->
                            <v-tooltip location="top" open-on-hover>
                              <template v-slot:activator="{ props }">
                                <v-autocomplete
                                    v-model="selectedCvariableDensity"
                                    clearable
                                    variant="outlined"
                                    density="compact"
                                    label="Colored by (optional)"
                                    :items="colorItemsDensity"
                                    class="variable-field"
                                    v-bind="props"
                                ></v-autocomplete>
                              </template>
                              <span>Categorical variable for grouping</span>
                            </v-tooltip>
                          </div>
                        </v-col>

                        <!--Line Chart-->
                        <v-col cols="12" align="center">
                          <v-sheet :max-width="plotWidth" :min-height="plotHeight" :max-height="plotHeight">
                            <CustomDensity
                                :x-var="selectedXvariableDensity"
                                :c-var="selectedCvariableDensity"
                                :context-value="contextValue"
                                :palette="userSelectedPaletteCa"
                                :bandwidth="bandwidth"
                            />
                          </v-sheet>
                        </v-col>
                      </v-row>
                    </template>
                  </v-card-text>
                </v-card>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import {BASE_URL} from "../components/constants.js";
import CustomLine from "../components/plots/CustomLine.vue";
import CustomBar from "../components/plots/CustomBar.vue";
import CustomBox from "../components/plots/CustomBox.vue";
import CustomHeatmap from "../components/plots/CustomHeatMap.vue";
import CustomDensity from "../components/plots/CustomDensity.vue"
// Simulation of test data
//import test_table from "../data/test_dataTableOverview.json";

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import FilterToolbar from "@/components/FilterToolbar.vue";
import {getCookie} from "@/components/authentication/auth.js";
import ColorPalette from "@/components/plots/ColorPalette.vue";

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
);

export default {
  name: "DataOverview",
  components: {CustomDensity, ColorPalette, FilterToolbar, CustomBar, CustomLine, CustomBox, CustomHeatmap},
  data() {
    return {
      data_table: null,
      model: "tab-2",

      //Tab names
      tabs: [
        {name: "Variable counts", value: 6},
        {name: "Density Plot", value: 7},
        {name: "Box Plot", value: 1},
        {name: "Line Plot", value: 2},
        {name: "Heatmap", value: 3},
      ],
      tabs_table: [
        {name: "Overall", value: 4},
        {name: "Phenotype specific", value: 5},
      ],

      allVariables: {},

      //Bar Plot: Different variables for the dropdown list
      xItemsBar: [],
      //yItemsBar: [],
      colorItemsBar: [],

      //Density Plot: Different variables for the dropdown list
      xItemsDensity: [],
      colorItemsDensity: [],
      bandwidth: 0.1,

      //Line Plot: Different variables for the dropdown list
      xItemsLine: [],
      yItemsLine: [],
      colorItemsLine: [],

      //Box Plot: Different variables for the dropdown list
      xItemsBox: [],
      yItemsBox: [],
      colorItemsBox: [],

      //Heatmap Plot: Different variables for the dropdown list
      itemHeatmap1: [],
      itemHeatmap2: [],

      //initialized selected variables, currently they share the same selected variables
      selectedXvariableBar: "Food frequency: Meat (x0fd01)",
      //selectedYvariableBar: null,
      selectedCvariableBar: "Sex (x0_sex)",

      selectedXvariableDensity: "NEIL2 / Protein (x0so3291)",
      selectedCvariableDensity: "Sex (x0_sex)",

      selectedXvariableLine: "Type of diabetes (x0dm02)",
      selectedYvariableLine: "NEIL2 / Protein (x0so3291)",
      selectedCvariableLine: "Sex (x0_sex)",

      selectedXvariableBox: "Type of diabetes (x0dm02)",
      selectedYvariableBox: "NEIL2 / Protein (x0so3291)",
      selectedCvariableBox: "Sex (x0_sex)",

      selectedVariableHeatmap1: "Type of diabetes (x0dm02)",
      selectedVariableHeatmap2: "Diabetes treatment (x0dm03)",

      //table data initialization
      columns: [],
      rows1: [],
      isExpanded: false,

      // context value
      contextValue: null,

      // options
      showOptions: false,
      plotWidth: 900,
      plotHeight: 500,
      colorPalettes: {
        'muted': ['#4878d0', '#ee854a', '#6acc64', '#d65f5f', '#956cb4'],
        'husl': [ '#f67088', '#ad9c31', '#33b07a', '#38a8c5', '#cc79f4'],
        'viridis': [ '#443982', '#30678d', '#20908c', '#35b778', '#90d643'],
        'rocket': [ '#3e1a43', '#831e5a', '#cb1a4f', '#f05f43', '#f5aa83'],
      },
      userSelectedPaletteCa: 'muted',
      userSelectedPaletteCo: 'viridis',

      // information texts
      informationTextShort:
          "This page provides a comprehensive overview of the dataset,\n" +
          "showcasing key statistics and insights through a variety of\n" +
          "visualization methods.",
      informationTextLong:
          "Explore Data Overview and Visualizations:</strong>\n" +
          "This page provides a comprehensive overview of the dataset,\n" +
          "showcasing key statistics and insights through a variety of\n" +
          "visualization methods. <br/> \n" +
          "The data is displayed using different charts\n" +
          "and graphs, such as box plots to highlight data distribution and\n" +
          "outliers, heatmaps to reveal\n" +
          "correlations and patterns. <br/>\n" +
          "These visualizations enable a deeper understanding of the dataset,\n" +
          "making it easier to identify significant relationships and trends.\n" +
          "Click on any visualization to explore the data in more detail and\n" +
          "customize your view.",
    };
  },

  // Create the data
  created: async function () {
    // Wait for both methods to complete
    await this.getTableDataFromApi();
    await this.getAllVariables();

    // Execute the next methods
    this.getVariableDataBar();
    this.getVariableDataDensity();
    this.getVariableDataLine();
    this.getVariableDataBox();
    this.getVariableDataHeatmap();
  },


  // +++++++++++ Methods ++++++++++++++
  methods: {
    async getTableDataFromApi() {
      try {
        const csrfToken = getCookie('csrftoken');
        const contextValue = this.contextValue;
        let url = `${BASE_URL}/plotting/api/table/`;

        if (contextValue) {
          url += `?contextValue=${encodeURIComponent(contextValue)}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();

        const rows = Object.entries(data).map(([key, value]) => {
          return {name: key, column1: value};
        });

        if (rows.length === 0) {
          console.error("No data found in the response");
          return null;
        }

        this.columns = {
          columns: [
            {align: "start", key: "name", sortable: false, title: ""},
            {key: "column1"},
          ],
        }
        this.rows1 = rows;

        // return simulated data
        return data;
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        throw error;
      }
    },

    async getAllVariables() {
      const csrfToken = getCookie('csrftoken');
      const contextValue = this.contextValue;
      let url = `${BASE_URL}/general/api/variables/`;

      if (contextValue) {
        url += `?contextValue=${encodeURIComponent(contextValue)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        credentials: 'include',
      });

      const data = await response.json();

      this.allVariables = data;

      console.log("Fetched all variables");
      return data;
    },

    getImageForCard(name) {
      const images = [
        {
          name: "Participants",
          imagePath: new URL("../assets/figures/participants.png", import.meta.url).href,
        },
        {
          name: "Phenotypes",
          imagePath: new URL("../assets/figures/phenotypes.png", import.meta.url).href,
        },
        {
          name: "Proteins",
          imagePath: new URL("../assets/figures/proteins.png", import.meta.url).href,
        },
        {
          name: "Metabolites",
          imagePath: new URL("../assets/figures/metabolites.png", import.meta.url).href,
        },
        {
          name: "Genetic Variants",
          imagePath: new URL("../assets/figures/genetic_variants.png", import.meta.url).href,
        },
      ];
      for (let i = 0; i < images.length; i++) {
        if (name === images[i].name) {
          return images[i].imagePath;
        }
      }
      return new URL("../assets/figures/About_Us.png", import.meta.url).href;
    },

    // Assemble valid data for the dropdown lists in the different plots
    getVariableDataBar() {
      try {
        //[...new Set(data.nonbinaryCategorical.concat(data.binaryCategorical))]
        this.xItemsBar = this.allVariables.nonbinaryCategorical.concat(
            this.allVariables.binaryCategorical
        );
        //this.yItemsBar = data.nonbinaryCategorical;
        this.colorItemsBar = this.allVariables.binaryCategorical.concat(
            this.allVariables.nonbinaryCategorical
        );
      } catch (error) {
        console.error("Error fetching variable data:", error);
      }
    },

        // Assemble valid data for the dropdown lists in the different plots
    getVariableDataDensity() {
      try {
        //[...new Set(data.nonbinaryCategorical.concat(data.binaryCategorical))]
        this.xItemsDensity = this.allVariables.continuous;
        this.colorItemsDensity = this.allVariables.binaryCategorical.concat(
            this.allVariables.nonbinaryCategorical
        );
      } catch (error) {
        console.error("Error fetching variable data:", error);
      }
    },

    getVariableDataLine() {
      try {
        this.xItemsLine = this.allVariables.nonbinaryCategorical.concat(this.allVariables.continuous);
        this.yItemsLine = this.allVariables.continuous;
        this.colorItemsLine = this.allVariables.binaryCategorical.concat(
            this.allVariables.nonbinaryCategorical
        );
      } catch (error) {
        console.error("Error fetching variable data:", error);
      }
    },

    getVariableDataBox() {
      try {
        //##############Have to change the Box Variable Data#########
        this.xItemsBox = this.allVariables.nonbinaryCategorical.concat(
            this.allVariables.binaryCategorical
        );
        //.concat(data.continuous);
        this.yItemsBox = this.allVariables.continuous;
        this.colorItemsBox = this.allVariables.binaryCategorical.concat(
            this.allVariables.nonbinaryCategorical
        );
      } catch (error) {
        console.error("Error fetching variable data:", error);
      }
    },

    getVariableDataHeatmap() {
      try {
        this.itemHeatmap1 = this.allVariables.nonbinaryCategorical.concat(
            this.allVariables.binaryCategorical
        );
        this.itemHeatmap2 = this.allVariables.binaryCategorical.concat(
            this.allVariables.nonbinaryCategorical
        );
      } catch (error) {
        console.error("Error fetching variable data:", error);
      }
    },

    checkCurrentVariables(){
      this.selectedXvariableBar = this.selectedXvariableBar in this.xItemsBar ? this.selectedXvariableBar : this.xItemsBar[0];
      this.selectedCvariableBar = this.selectedCvariableBar in this.colorItemsBar ? this.selectedCvariableBar : this.colorItemsBar[0];

      this.selectedXvariableDensity = this.selectedXvariableDensity in this.xItemsDensity ? this.selectedXvariableDensity : this.xItemsDensity[0];
      this.selectedCvariableDensity = this.selectedCvariableDensity in this.colorItemsDensity ? this.selectedCvariableDensity : this.colorItemsDensity[0];

      this.selectedXvariableLine = this.selectedXvariableLine in this.xItemsLine ? this.selectedXvariableLine : this.xItemsLine[0];
      this.selectedYvariableLine = this.selectedYvariableLine in this.yItemsLine ? this.selectedYvariableLine : this.yItemsLine[0];
      this.selectedCvariableLine = this.selectedCvariableLine in this.colorItemsLine ? this.selectedCvariableLine : this.colorItemsLine[0];

      this.selectedXvariableBox = this.selectedXvariableBox in this.xItemsBox ? this.selectedXvariableBox : this.xItemsBox[0];
      this.selectedYvariableBox = this.selectedYvariableBox in this.yItemsBox ? this.selectedYvariableBox : this.yItemsBox[0];
      this.selectedCvariableBox = this.selectedCvariableBox in this.colorItemsBox ? this.selectedCvariableBox : this.colorItemsBox[0];

      this.selectedVariableHeatmap1 = this.selectedVariableHeatmap1 in this.itemHeatmap1 ? this.selectedVariableHeatmap1 : this.itemHeatmap1[0];
      this.selectedVariableHeatmap2 = this.selectedVariableHeatmap2 in this.itemHeatmap2 ? this.selectedVariableHeatmap2 : this.itemHeatmap2[0];
    },

    toggleDescription() {
      this.isExpanded = !this.isExpanded;
    },

    async updateData(val) {
      this.contextValue = val ? val.value : null;
      await this.getAllVariables();

      this.getVariableDataBar();
      this.getVariableDataDensity();
      this.getVariableDataLine();
      this.getVariableDataBox();
      this.getVariableDataHeatmap();

      this.checkCurrentVariables();
      await this.getTableDataFromApi();
    }
  },
};
</script>

<style scoped>
.responsive-card {
  width: 80%;
  transition: width 0.3s ease;
}

@media (max-width: 1500px) {
  .responsive-card {
    width: 100%;
  }
}

.title {
  font-size: 2rem;
}

.small-title {
  color: rgb(var(--v-theme-darken-1));
  font-size: 20px;
}

.number-data {
  font-weight: bolder;
  font-size: 16px;
}

.overview-description {
  cursor: pointer; /* Indicates that the element is clickable */
  background-color: rgb(var(--v-theme-surface));
  border-left: 5px solid rgb(var(--v-theme-info)); /* Accent border to the left */
  padding: 15px 10px; /* Padding around the text */
  margin-bottom: 0px; /* Spacing below the description */
  border-radius: 4px; /* Rounded corners for a modern look */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
  font-family: "Arial", sans-serif; /* A clean, modern font */
  width: 1445px; /* Fixed width of 1200px */
}

.toggle-link {
  color: rgb(var(--v-theme-info));
  cursor: pointer; /* Indicates that the text is clickable */
  text-decoration: underline; /* Underline to indicate link */
  font-weight: bold; /* Make the link text bold */
  padding: 0 5px; /* Add some padding for better spacing */
}

.toggle-link:hover {
  color: #2980b9; /* Darker color on hover */
  text-decoration: none; /* Remove underline on hover for cleaner look */
}

.plain-text {
  color: rgb(var(--v-theme-primary-darken-1));
}

.variable-field {
  max-width: 250px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.bg-layer {
  background-color: rgb(var(--v-theme-white-surface));
  border-radius: 50%;
  padding: 0;
}
</style>
