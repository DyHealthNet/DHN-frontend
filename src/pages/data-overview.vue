<template>
  <v-app>
    <!--structure define-->
    <v-main>
      <!--main content-->
      <v-container fluid>
        <v-row>
          <!--Tab bar-->
          <v-col cols="12">
            <v-card>
              <!--Tab bar name-->
              <v-toolbar color="#104D63">
                <v-toolbar-title
                  >Phenotype - Data Overview
                  <v-tooltip bottom>
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props">mdi-information</v-icon>
                    </template>
                    <span
                      >here show different visualisation of interested phenotype
                      variables and overview of the data. You can select
                      variables for you own requirements</span
                    >
                  </v-tooltip>
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <template v-slot:extension>
                  <v-tabs v-model="model" align-tabs="center">
                    <v-tab
                      v-for="tab in tabs"
                      :key="tab.value"
                      :text="tab.name"
                      :value="tab.value"
                    ></v-tab>
                  </v-tabs>
                </template>
              </v-toolbar>

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
                                    label="Select categorical variable"
                                    :items="itemtest"
                                    style="max-width: 500px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Select categorical variable</span>
                              </v-tooltip>

                              <!--Select Y variables-->
                              <!--
                              <v-autocomplete
                                v-model="selectedYvariableBox"
                                clearable
                                label="Select Variable 2"
                                :items="yItemsBox"
                                style="max-width: 350px; color: #104d63"
                              ></v-autocomplete>-->

                              <!--Colored by which variables-->
                              <v-tooltip location="top" open-on-hover>
                                <template v-slot:activator="{ props }">
                                  <v-autocomplete
                                    v-model="selectedCvariableBox"
                                    clearable
                                    label="Colored by (optional)"
                                    :items="itemtest"
                                    style="max-width: 500px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Select binary variable for coloring</span>
                              </v-tooltip>
                            </div>
                          </v-col>

                          <!--Box Plot-->
                          <v-col cols="12" align="center">
                            <div style="height: 450px; width: 800px">
                              <CustomBox
                                :x-var="selectedXvariableBox"
                                :c-var="selectedCvariableBox"
                              />
                            </div>
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
                                    label="Select X Variable"
                                    :items="xItemsLine"
                                    style="max-width: 350px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span
                                  >Select categorical/countinous variables of
                                  interest as X</span
                                >
                              </v-tooltip>

                              <!--Select Y variables-->
                              <v-tooltip location="top" open-on-hover>
                                <template v-slot:activator="{ props }">
                                  <v-autocomplete
                                    v-model="selectedYvariableLine"
                                    clearable
                                    label="Select Y Variable"
                                    :items="yItemsLine"
                                    style="max-width: 350px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span
                                  >Select categorical variables of interest as
                                  Y</span
                                >
                              </v-tooltip>

                              <!--Colored by which variables-->
                              <v-tooltip location="top" open-on-hover>
                                <template v-slot:activator="{ props }">
                                  <v-autocomplete
                                    v-model="selectedCvariableLine"
                                    clearable
                                    label="Colored by (optional)"
                                    :items="colorItemsLine"
                                    style="max-width: 350px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Select binary variables</span>
                              </v-tooltip>
                            </div>
                          </v-col>

                          <!--Line Chart-->
                          <v-col cols="12" align="center">
                            <div style="height: 450px; width: 800px">
                              <CustomLine
                                :x-var="selectedXvariableLine"
                                :y-var="selectedYvariableLine"
                                :c-var="selectedCvariableLine"
                              />
                            </div>
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
                                    label="Select category variable 1"
                                    :items="itemtest"
                                    style="max-width: 500px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Select the first category variable</span>
                              </v-tooltip>

                              <!--Select variable 2-->
                              <v-tooltip location="top" open-on-hover>
                                <template v-slot:activator="{ props }">
                                  <v-autocomplete
                                    v-model="selectedVariableHeatmap2"
                                    clearable
                                    label="Select category variable 2"
                                    :items="itemtest"
                                    style="max-width: 500px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span
                                  >Select the second catefory variable
                                </span>
                              </v-tooltip>
                            </div>
                          </v-col>

                          <!--Heatmap-->
                          <v-col cols="12" align="center">
                            <div style="height: 450px; width: 900px">
                              <CustomHeatmap
                                :x-var="selectedVariableHeatmap1"
                                :y-var="selectedVariableHeatmap2"
                              />
                            </div>
                          </v-col>
                        </v-row>
                      </template>

                      <!-- Content for the last extenstion tab -->
                      <template v-else>
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
                                    label="Select X Variable"
                                    :items="xItemsBar"
                                    style="max-width: 350px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span
                                  >Select discrete/ variable of interest as
                                  X-axis</span
                                >
                              </v-tooltip>

                              <!--Select Y variables-->
                              <v-autocomplete
                                v-model="selectedYvariableBar"
                                clearable
                                label="Select Y Variable"
                                :items="yItemsBar"
                                style="max-width: 350px; color: #104d63"
                              ></v-autocomplete>

                              <!--Colored by which variables-->
                              <v-autocomplete
                                v-model="selectedCvariableBar"
                                clearable
                                label="Colored by (optional)"
                                :items="colorItemsBar"
                                style="max-width: 350px; color: #104d63"
                              ></v-autocomplete>
                            </div>
                          </v-col>

                          <!--Chart-->
                          <v-col cols="12" align="center">
                            <div style="height: 450px; width: 800px">
                              <!--<Bar
                                :data="chartConfig"
                                :options="{ responsive: true }"
                              />-->
                              <!-- CustomBar component, pass the selected variables to make API call -->
                              <CustomBar
                                :x-var="selectedXvariableBar"
                                :y-var="selectedYvariableBar"
                                :c-var="selectedCvariableBar"
                              />
                            </div>
                          </v-col>
                        </v-row>
                      </template>
                    </v-card-text>
                  </v-card>
                </v-tabs-window-item>
              </v-tabs-window>
            </v-card>
          </v-col>

          <!--Data Tables 1-->
          <v-col cols="12">
            <!--Table with search-->
            <r-row class="fill-height" justify="center">
              <v-col cols="12" align="center">
                <h2>Data Table</h2>
              </v-col>

              <v-row justify="center">
                <v-col cols="6">
                  <v-data-table
                    :headers="columns"
                    :items="rows1"
                    hide-default-footer
                  ></v-data-table>
                </v-col>

                <v-col cols="6">
                  <v-data-table
                    :headers="columns"
                    :items="rows2"
                    hide-default-footer
                  ></v-data-table>
                </v-col>
              </v-row>
            </r-row>
          </v-col>

          <!--Data Tables 2-->
          <v-col cols="4.5">
            <!--Table without search-->
            <r-row class="fill-height" justify="center">
              <v-col cols="12" align="center">
                <h2>Data Table</h2>
              </v-col>
              <v-col cols="12" align="left">
                <v-simple-table>
                  <template v-slot:default>
                    <thead>
                      <tr>
                        <th class="text-left"></th>
                        <th class="text-left">Number of variables</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in rows1.concat(rows2)" :key="item.name">
                        <td class="first-column">{{ item.name }}</td>
                        <td class="second-column">{{ item.column1 }}</td>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
              </v-col>
            </r-row>
          </v-col>

          <!--End of the content-->
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;
import CustomLine from "../components/CustomLine.vue";
import CustomBar from "../components/CustomBar.vue";
import CustomBox from "../components/CustomBox.vue";
import CustomHeatmap from "../components/CustomHeatMap.vue";

// text boxplot component
//import BoxTest from "@/pages/test.vue";
//import * as dataVariables from "../data/test_variables.json";

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

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
  components: { CustomBar, CustomLine, CustomBox, CustomHeatmap },
  data() {
    return {
      model: "tab-2",

      //Tab names
      tabs: [
        { name: "Box Plot", value: 1 },
        { name: "Line Plot", value: 2 },
        { name: "Heatmap", value: 3 },
        //{ name: "Extension", value: 4 },
      ],

      itemtest: ['foo', 'bar', 'fizz', 'buzz'],

      //Bar Plot: Different variables for the dropdown list
      xItemsBar: [],
      yItemsBar: [],
      colorItemsBar: [],

      //Line Plot: Different variables for the dropdown list
      xItemsLine: [],
      yItemsLine: [],
      colorItemsLine: [],

      //Box Plot: Different variables for the dropdown list
      xItemsBox: [],
      //yItemsBox: [],
      colorItemsBox: [],

      //Heatmap Plot: Different variables for the dropdown list
      itemHeatmap1: [],
      itemHeatmap2: [],

      //initialized selected variables, currently they share the same selected variables
      selectedXvariableBar: null,
      selectedYvariableBar: null,
      selectedCvariableBar: null,

      selectedXvariableLine: null,
      selectedYvariableLine: null,
      selectedCvariableLine: null,

      selectedXvariableBox: null,
      //selectedYvariableBox: null,
      selectedCvariableBox: null,

      selectedVariableHeatmap1: null,
      selectedVariableHeatmap2: null,

      //table data initialization
      columns: [],
      rows1: [],
      rows2: [],
    };
  },

  // +++++++++++  Table Data  ++++++++++++++
  // Get the data for the table
  created() {
    this.splitRows(this.getTableData());
    this.getVariableDataBar();
    this.getVariableDataLine();
    this.getVariableDataBox();
    this.getVariableDataHeatmap();
  },

  // +++++++++++ Methods ++++++++++++++
  methods: {
    //functions to get the data from the json file

    splitRows(tableData) {
      this.columns = tableData.columns;
      // split the rows into two halves so that they can be displayed in two tables
      const midpoint = Math.ceil(tableData.rows.length / 2);
      this.rows1 = tableData.rows.slice(0, midpoint);
      this.rows2 = tableData.rows.slice(midpoint);
    },

    // Bar Plot Data Fetch
    async getVariableDataBar() {
      try {
        //const response = await fetch(
        // "http://localhost:8000/network/api/variables/"
        //);
        const response = await fetch(`${BASE_URL}/network/api/variables/`);
        const data = await response.json();
        this.rows = Object.keys(data).map((key, i) => ({
          name: key,
          column1: data[key],
        }));
        //[...new Set(data.nonbinaryCategorical.concat(data.binaryCategorical))]
        this.xItemsBar = data.nonbinaryCategorical;
        this.yItemsBar = data.nonbinaryCategorical;
        this.colorItemsBar = data.binaryCategorical;
      } catch (error) {
        console.error("Error fetching variable data:", error);
      }
    },

    // Line Plot Data Fetch
    async getVariableDataLine() {
      try {
        //const response = await fetch(
        // "http://localhost:8000/network/api/variables/"
        //);
        console.log(`${BASE_URL}/network/api/variables/`);
        const response = await fetch(`${BASE_URL}/network/api/variables/`);
        const data = await response.json();
        console.log(data);
        this.rows = Object.keys(data).map((key, i) => ({
          name: key,
          column1: data[key],
        }));
        this.xItemsLine = data.nonbinaryCategorical.concat(data.continuous);
        this.yItemsLine = data.nonbinaryCategorical;
        this.colorItemsLine = data.binaryCategorical;
      } catch (error) {
        console.error("Error fetching variable data:", error);
      }
    },

    // Box Plot Data Fetch
    async getVariableDataBox() {
      try {
        //const response = await fetch(
        //  "http://localhost:8000/network/api/variables/"
        //);
        const response = await fetch(`${BASE_URL}/network/api/variables/`);
        const data = await response.json();
        this.rows = Object.keys(data).map((key, i) => ({
          name: key,
          column1: data[key],
        }));
        //##############Have to change the Box Variable Data#########
        this.xItemsBox = data.nonbinaryCategorical;
        //this.yItemsBox = data.nonbinaryCategorical;
        this.colorItemsBox = data.binaryCategorical;
      } catch (error) {
        console.error("Error fetching variable data:", error);
      }
    },

    // Heatmap Data Fetch
    async getVariableDataHeatmap() {
      try {
        const response = await fetch(`${BASE_URL}/network/api/variables/`);
        const data = await response.json();
        this.rows = Object.keys(data).map((key, i) => ({
          name: key,
          column1: data[key],
        }));
        //##############Have to change the Heatmap variable Data#########
        this.itemHeatmap1 = data.nonbinaryCategorical;
        this.itemHeatmap2 = data.nonbinaryCategorical;
      } catch (error) {
        console.error("Error fetching variable data:", error);
      }
    },

    // Table Daten
    getTableData() {
      // return simulated data
      return {
        // this part here stays static, don't need to change this
        columns: [
          { align: "start", key: "name", sortable: false, title: "" },
          { key: "column1" },
        ],
        rows: [
          { name: "# Participants", column1: 13000 },
          { name: "# Male", column1: 6545 },
          { name: "# Female", column1: 6455 },
          { name: "# Phenotypes", column1: 1284 },
          { name: "# Proteins", column1: 7300 },
          { name: "# Metabolites", column1: 175 },
          { name: "# Phenotype-Boolean", column1: 26 },
          { name: "# Phenotype-Categorical", column1: 1234 },
          { name: "# Phenotype-Float", column1: 0 },
          { name: "# Phenotype-Integer", column1: 7 },
          { name: "# Phenotype-Time", column1: 17 },
          { name: "", column1: "" },
        ],
      };
    },
  },
};
</script>

<style scoped>
.first-column {
  padding-right: 20px; /* Adjust the value as needed */
}

.second-column {
  padding-left: 20px; /* Adjust the value as needed */
}
</style>