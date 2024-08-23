<template>
  <v-app>
    <!--structure define-->
    <v-main>
      <!--main content-->
      <v-container fluid>
        <v-row>
          <!--Overview data table-->
          <v-col cols="4.5">
            <v-row>
              <v-col cols="12">
                <v-card>
                  <v-toolbar color="#104D63">
                    <v-toolbar-title
                      >Overview of Cohorts Data
                      <v-tooltip bottom>
                        <template v-slot:activator="{ props }">
                          <v-icon v-bind="props">mdi-information</v-icon>
                        </template>
                        <span
                          >Here is an overview of simulited cohorts subsets from
                          CHRIS data</span
                        >
                      </v-tooltip>
                    </v-toolbar-title>
                  </v-toolbar>
                  <v-spacer></v-spacer>

                  <!--Overview cards in tabs-->
                  <v-tabs-window v-model="model">
                    <v-card>
                      <v-card-text>
                        <!--Cards instead of table-->
                        <v-row class="fill-height" justify="center">
                          <v-col
                            align="left"
                            cols="12"
                            sm="6"
                            v-for="(item, index) in rows1"
                            :key="index"
                          >
                            <v-card class="mx-auto">
                              <v-row>
                                <!-- Check if it's the last card -->
                                <!--<v-col
                                  cols="12"
                                  v-if="index === rows1.length - 1"
                                >-->
                                <!-- Render table for the last card -->
                                <!--<v-card-title class="small-title"
                                    >Summary Table</v-card-title
                                  >
                                  <v-card-text>
                                    <v-simple-table>
                                      <thead>
                                        <tr>
                                          <th class="text-left">Name</th>
                                          <th class="text-left">Value</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr
                                          v-for="(row, rowIndex) in rows2"
                                          :key="rowIndex"
                                        >
                                          <td>{{ row.name }}</td>
                                          <td>{{ row.value }}</td>
                                        </tr>
                                      </tbody>
                                    </v-simple-table>
                                  </v-card-text>
                                </v-col>-->
                                <!-- Render regular card for other items -->
                                <!--<v-col cols="12" v-else>-->
                                <v-col cols="12">
                                  <v-img>
                                    <!-- Assign different images im Vergleich zu den Name der daten-->
                                    <img
                                      :src="getImageForCard(item.name)"
                                      :alt="item.name"
                                      width="80"
                                      height="80"
                                    />
                                  </v-img>
                                </v-col>
                                <!--</v-col>-->
                                <v-col cols="12">
                                  <v-card-title class="small-title">{{
                                    item.name
                                  }}</v-card-title>
                                  <v-card-text>{{ item.column1 }}</v-card-text>
                                </v-col>
                              </v-row>
                            </v-card>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-tabs-window>
                </v-card>
              </v-col>
              <!--Overview of Phenotype data table-->
              <!--<v-cols cols="12">
                <v-card>
                  <v-toolbar color="#104D63">
                    <v-toolbar-title
                      >Overview of phenotype data
                    </v-toolbar-title>
                  </v-toolbar>
                  <v-spacer></v-spacer>
                <v-tabs-window v-model="model">
                    <v-card>
                      <v-card-text>
                        <r-row class="fill-height" justify="center">
                          <v-col cols="12" align="left">
                            <v-data-table>
                              <template v-slot:default>
                                <thead>
                                  <tr>
                                    <th class="text-left"></th>
                                    <th class="text-left"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr v-for="item in rows2" :key="item.name">
                                    <td class="first-column">
                                      {{ item.name }}
                                    </td>
                                    <td class="second-column">
                                      {{ item.column1 }}
                                    </td>
                                  </tr>
                                </tbody>
                              </template>
                            </v-data-table>
                          </v-col>
                        </r-row>
                      </v-card-text>
                    </v-card>
                  </v-tabs-window>
                </v-card>
              </v-cols>-->
            </v-row>
          </v-col>

          <!--Tab bar-->
          <v-col cols="8">
            <v-card>
              <!--Tab bar name-->
              <v-toolbar color="#104D63">
                <v-toolbar-title
                  >Data Overview
                  <v-tooltip bottom>
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props">mdi-information</v-icon>
                    </template>
                    <span
                      >You can select and visualize variables for your own
                      requirements</span
                    >
                  </v-tooltip>
                </v-toolbar-title>
                <v-toolbar-sub-title>
                  Here you can visualize phenotypes, proteins as well as
                  metabolimics data
                </v-toolbar-sub-title>
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
                                    label="X Variable"
                                    :items="xItemsBox"
                                    style="max-width: 250px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Categorical variable possible</span>
                              </v-tooltip>

                              <!--Select Y variables-->
                              <v-tooltip location="top" open-on-hover>
                                <template v-slot:activator="{ props }">
                                  <v-autocomplete
                                    v-model="selectedYvariableBox"
                                    clearable
                                    label="Y Variable"
                                    :items="yItemsBox"
                                    style="max-width: 250px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Continous variable possible</span>
                              </v-tooltip>

                              <!--Colored by which variables-->
                              <v-tooltip location="top" open-on-hover>
                                <template v-slot:activator="{ props }">
                                  <v-autocomplete
                                    v-model="selectedCvariableBox"
                                    clearable
                                    label="Colored by (optional)"
                                    :items="colorItemsBox"
                                    style="max-width: 250px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Categorical variable as grouping</span>
                              </v-tooltip>
                            </div>
                          </v-col>

                          <!--Box Chart-->
                          <v-col cols="12" align="center">
                            <div style="height: 500px; width: 800px">
                              <CustomBox
                                :x-var="selectedXvariableBox"
                                :y-var="selectedYvariableBox"
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
                                    label="X Variable"
                                    :items="xItemsLine"
                                    style="max-width: 250px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span
                                  >Categorical and Countinous variable
                                  possible</span
                                >
                              </v-tooltip>

                              <!--Select Y variables-->
                              <v-tooltip location="top" open-on-hover>
                                <template v-slot:activator="{ props }">
                                  <v-autocomplete
                                    v-model="selectedYvariableLine"
                                    clearable
                                    label="Y Variable"
                                    :items="yItemsLine"
                                    style="max-width: 250px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Continous variable possible</span>
                              </v-tooltip>

                              <!--Colored by which variables-->
                              <v-tooltip location="top" open-on-hover>
                                <template v-slot:activator="{ props }">
                                  <v-autocomplete
                                    v-model="selectedCvariableLine"
                                    clearable
                                    label="Colored by (optional)"
                                    :items="colorItemsLine"
                                    style="max-width: 250px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Categorical variable as grouping</span>
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
                                    label="X Variable"
                                    :items="itemHeatmap1"
                                    style="max-width: 350px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Categorical variable possible</span>
                              </v-tooltip>

                              <!--Select variable 2-->
                              <v-tooltip location="top" open-on-hover>
                                <template v-slot:activator="{ props }">
                                  <v-autocomplete
                                    v-model="selectedVariableHeatmap2"
                                    clearable
                                    label="Y Variable"
                                    :items="itemHeatmap2"
                                    style="max-width: 350px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Categorical variable possible </span>
                              </v-tooltip>
                            </div>
                          </v-col>

                          <!--Heatmap-->
                          <v-col cols="12" align="center">
                            <div style="height: 480px; width: 800px">
                              <CustomHeatmap
                                :x-var="selectedVariableHeatmap1"
                                :y-var="selectedVariableHeatmap2"
                              />
                            </div>
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
                                    label="X Variable"
                                    :items="xItemsBar"
                                    style="max-width: 350px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Categorical variable possible</span>
                              </v-tooltip>

                              <!--Colored by which variables-->
                              <v-tooltip location="top" open-on-hover>
                                <template v-slot:activator="{ props }">
                                  <v-autocomplete
                                    v-model="selectedCvariableBar"
                                    clearable
                                    label="Colored by (optional)"
                                    :items="colorItemsBar"
                                    style="max-width: 350px; color: #104d63"
                                    v-bind="props"
                                  ></v-autocomplete>
                                </template>
                                <span>Categorical variable as grouping</span>
                              </v-tooltip>
                            </div>
                          </v-col>

                          <!--Bar-->
                          <v-col cols="12" align="center">
                            <div style="height: 450px; width: 800px">
                              <CustomBar
                                :x-var="selectedXvariableBar"
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

          <!--Commentierte Data Tables-->
          <!--<v-col cols="12">
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
          </v-col>-->

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
import { helper } from "echarts";

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
      data_table: null,

      model: "tab-2",

      //Tab names
      tabs: [
        { name: "Variable counts", value: 6 },
        { name: "Box Plot", value: 1 },
        { name: "Line Plot", value: 2 },
        { name: "Heatmap", value: 3 },
      ],
      tabs_table: [
        { name: "Overall", value: 4 },
        { name: "Phenotype specific", value: 5 },
      ],

      itemtest: ["foo", "bar", "fizz", "buzz"],

      //Bar Plot: Different variables for the dropdown list
      xItemsBar: [],
      //yItemsBar: [],
      colorItemsBar: [],

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

      selectedXvariableLine: "Type of diabetes (x0dm02)",
      selectedYvariableLine: "NEIL2 / Protein (x0so3291)",
      selectedCvariableLine: "Sex (x0_sex)",

      selectedXvariableBox: "Type of diabetes (x0dm02)",
      selectedYvariableBox: "NEIL2 / Protein (x0so3291)",
      selectedCvariableBox: "Sex (x0_sex)",

      selectedVariableHeatmap1: "Type of diabetes (x0dm02)",
      selectedVariableHeatmap2:
        "Diabetes treatment (x0dm03)",

      //table data initialization
      columns: [],
      rows1: [],
      rows2: [],
    };
  },

  // Create the data
  created() {
    //this.data_table = this.getTableDataFromApi()
    //this.splitRows(this.getTableData(this.data_table));
    this.loadData();
    this.getVariableDataBar();
    this.getVariableDataLine();
    this.getVariableDataBox();
    this.getVariableDataHeatmap();
  },

  // +++++++++++ Methods ++++++++++++++
  methods: {
    //functions to get the data from the json file
    async getTableDataFromApi() {
      try {
        const response = await fetch(`${BASE_URL}/network/api/table/`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json(); // Daten im JSON-Format abrufen

        console.log("Overview of Data: ", data);

        //return data;

        const rows = Object.entries(data).map(([key, value]) => {
          return { name: key, column1: value };
        });
        // return simulated data
        return {
          // this part here stays static, don't need to change this
          columns: [
            { align: "start", key: "name", sortable: false, title: "" },
            { key: "column1" },
          ],
          rows: rows,
        };
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
      }
    },
    async loadData() {
      const data_table = await this.getTableDataFromApi();
      if (data_table) {
        this.splitRows(data_table);
      } else {
        console.error("Data table is null or undefined");
      }
    },

    splitRows(tableData) {
      this.columns = tableData.columns;
      // split the rows into two halves so that they can be displayed in two tables
      //const midpoint = Math.ceil(tableData.rows.length / 2);
      this.rows1 = tableData.rows.slice(0, tableData.rows.length - 5);
      this.rows2 = tableData.rows.slice(tableData.rows.length - 5);
    },
    getImageForCard(name) {
      const images = [
        {
          name: "Participants",
          imagepath: new URL(
            "../assets/figures/participants.png",
            import.meta.url
          ).href,
        },
        {
          name: "Phenotypes",
          imagepath: new URL(
            "../assets/figures/phenotypes.png",
            import.meta.url
          ).href,
        },
        {
          name: "Proteins",
          imagepath: new URL("../assets/figures/proteins.png", import.meta.url)
            .href,
        },
        {
          name: "Metabolites",
          imagepath: new URL(
            "../assets/figures/metabolites.png",
            import.meta.url
          ).href,
        },
        {
          name: "Genetic Variants",
          imagepath: new URL(
            "../assets/figures/genetic_variants.png",
            import.meta.url
          ).href,
        },
      ];
      for (let i = 0; i < images.length; i++) {
        if (name === images[i].name) {
          return images[i].imagepath;
        }
      }
      return new URL("../assets/figures/About_Us.png", import.meta.url).href;
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
        this.xItemsBar = data.nonbinaryCategorical.concat(
          data.binaryCategorical
        );
        //this.yItemsBar = data.nonbinaryCategorical;
        this.colorItemsBar = data.binaryCategorical.concat(
          data.nonbinaryCategorical
        );
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
        this.yItemsLine = data.continuous;
        this.colorItemsLine = data.binaryCategorical.concat(
          data.nonbinaryCategorical
        );
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
        this.xItemsBox = data.nonbinaryCategorical.concat(
          data.binaryCategorical
        );
        //.concat(data.continuous);
        this.yItemsBox = data.continuous;
        this.colorItemsBox = data.binaryCategorical.concat(
          data.nonbinaryCategorical
        );
      } catch (error) {
        console.error("Error fetching variable data:", error);
        console.log(error.text);
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
        this.itemHeatmap1 = data.nonbinaryCategorical.concat(
          data.binaryCategorical
        );
        this.itemHeatmap2 = data.nonbinaryCategorical.concat(
          data.binaryCategorical
        );
      } catch (error) {
        console.error("Error fetching variable data:", error);
      }
    },

    // Get table data
    getTableData(imported_json) {
      const rows = Object.entries(imported_json).map(([key, value]) => {
        return { name: key, column1: value };
      });
      return {
        // this part here stays static, don't need to change this
        columns: [
          { align: "start", key: "name", sortable: false, title: "" },
          { key: "column1" },
        ],
        rows: rows,
      };
    },
  },
};
</script>

<style scoped>
.first-column {
  padding-right: 10px;
}

.second-column {
  padding-left: 10px;
}
.small-title {
  font-size: 18px;
}
</style>
