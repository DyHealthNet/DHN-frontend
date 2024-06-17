<template>
  <v-app>
    <!--structure define-->
    <v-main>
      <!--main content-->
      <v-container fluid>
        <v-row>
          <v-col cols="12">
            <v-card>
              <!--Tab bar name-->
              <v-toolbar color="#104D63">
                <v-toolbar-title>Data Overview</v-toolbar-title>
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
                      <!-- Content for first tab -->
                      <template v-if="tab.value === 1">
                        <!--Bar Plot-->
                        <v-row>
                          <!--Drop Down list-->
                          <v-col cols="12" align="center">
                            <div class="d-flex justify-space-around">
                              <!--Select X variables-->
                              <v-autocomplete
                                v-model="selectedXvariable"
                                clearable
                                label="Select X Variable"
                                :items="xItemsBar"
                                style="max-width: 350px; color: #104d63"
                              ></v-autocomplete>

                              <!--Select Y variables-->
                              <v-autocomplete
                                v-model="selectedYvariable"
                                clearable
                                label="Select Y Variable"
                                :items="yItemsBar"
                                style="max-width: 350px; color: #104d63"
                              ></v-autocomplete>

                              <!--Colored by which variables-->
                              <v-autocomplete
                                v-model="selectedColorvariable"
                                clearable
                                label="Colored by"
                                :items="colorItemsBar"
                                style="max-width: 350px; color: #104d63"
                              ></v-autocomplete>

                              <!-- Button to generate figure -->
                              <v-btn
                                color="#A5BFDC"
                                @click="updateChart"
                                class="center"
                                >Generate</v-btn
                              >
                            </div>
                          </v-col>

                          <!--Chart-->
                          <v-col cols="12" align="center">
                            <div style="height: 300px; width: 500px">
                              <Bar
                                :data="chartConfig"
                                :options="{ responsive: true }"
                              />
                            </div>
                          </v-col>
                        </v-row>
                      </template>

                      <!-- Content for second tab -->
                      <template v-else-if="tab.value === 2">
                        <!--Figure-->
                        <figure>
                          <img src="" alt="Figure related to Extension1" />
                        </figure>
                      </template>

                      <!-- Content for the last tab -->
                      <template v-else>
                        <!--Figure-->
                        <figure>
                          <img src="" alt="Figure related to the Extension 2" />
                        </figure>
                      </template>
                    </v-card-text>
                  </v-card>
                </v-tabs-window-item>
              </v-tabs-window>
            </v-card>
          </v-col>

          <!--Data Tables-->
          <v-col cols="12">
            <!--Table with search-->
            <r-row class="fill-height" justify="center">
              <v-col cols="12" align="center">
                <h2>Overview of Data</h2>
              </v-col>
              <v-row justify="center">
                <v-col cols="5">
                  <v-data-table
                    :headers="columns"
                    :items="rows1"
                    hide-default-footer
                  ></v-data-table>
                </v-col>
                <v-col cols="5">
                  <v-data-table
                    :headers="columns"
                    :items="rows2"
                    hide-default-footer
                  ></v-data-table>
                </v-col>
              </v-row>
            </r-row>
          </v-col>

          <!--End of the content-->
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { Bar } from "vue-chartjs";
import barData1 from "../data/test_barplotData1.json";
import * as dropdownData from "../data/test_dropData.json";
import * as dataVariables from "../data/test_variables.json";

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
  components: { Bar },
  data() {
    return {
      model: "tab-2",

      //Tab names
      tabs: [
        { name: "Bar Plot", value: 1 },
        { name: "Line Plot", value: 2 },
        { name: "Extension1", value: 3 },
      ],

      //Different variables for the dropdown list
      xItemsBar: dataVariables.discrete,
      yItemsBar: dataVariables.discrete.concat(dataVariables.continuous),
      colorItemsBar: dataVariables.categorical,

      //initialized selected variables
      selectedXvariable: null,
      selectedYvariable: null,
      selectedColorvariable: null,

      //initialize the data for the chart
      //chartConfig: { ...barData1 },
      chartConfig: {
        labels: [],
        datasets: [],
      },

      //table data initialization
      columns: [],
      rows1: [],
      rows2: [],
    };
  },
  watch: {
    selectedXVariable: "updateChart",
    selectedYVariable: "updateChart",
    selectedColorVariable: "updateChart",
  },

  // +++++++++++  Table Data  ++++++++++++++
  // Get the data for the table
  created() {
    this.splitRows(this.getTableData());
  },

  // +++++++++++ Methods ++++++++++++++
  methods: {
    updateChart() {
      // Logic to update chart based on selected variables
      this.chartConfig.data = this.transformData();
    },
    transformData() {
      console.log(
        "Generating figure with:",
        this.selectedXvariable,
        ", ",
        this.selectedYvariable,
        ", ",
        this.selectedColorvariable
      );
      // Transform your dataset based on the selected variables
      // This is a placeholder, implement according to your data structure and requirements
      return {
        barData1
      };
    },
    

    //function to get the data from the json file
    splitRows(tableData) {
      this.columns = tableData.columns;
      // split the rows into two halves so that they can be displayed in two tables
      const midpoint = Math.ceil(tableData.rows.length / 2);
      this.rows1 = tableData.rows.slice(0, midpoint);
      this.rows2 = tableData.rows.slice(midpoint);
    },
    getTableData() {
      // return simulated data
      return {
        // this part here stays static, you don't need to change this
        columns: [
          { align: "start", key: "name", sortable: false, title: "" },
          { key: "column1" },
        ],
        // this is the part where in the future will get the data from the server using the API endpoint
        // you can then do something like
        // fetch('http://api-endpoint.com/overviewData')
        //  .then(response => response.json())
        //  .then(data => {
        //    this.rows = data.keys.map((key, i) => ({
        //      name: key,
        //      column1: data.value[i]
        //    }));
        //  });
        // since the format will look something like this:
        // { keys: ['key1', 'key2', 'key3'], values: [1, 2, 3] }
        rows: [
          { name: "# Participants", column1: 1 },
          { name: "# NaN values", column1: 2 },
          { name: "# Variables", column1: 3 },
        ],
      };
    },
  },
};
</script>
