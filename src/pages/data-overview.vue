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
              <v-toolbar color="indigo-darken-1">
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
                        <v-row>
                          <!--Drop Down list-->
                          <v-col cols="12" align="center">
                            <div class="d-flex justify-space-around">
                              <v-menu transition="scroll-x-transition">
                                <template v-slot:activator="{ props }">
                                  <v-btn color="indigo-darken-1" v-bind="props">
                                    Select X Variables
                                  </v-btn>
                                </template>

                                <v-list>
                                  <v-list-item
                                    v-for="(item, i) in xItems"
                                    :key="i"
                                    :title = item
                                  >
                                  </v-list-item>
                                </v-list>
                              </v-menu>

                              <v-menu transition="scroll-x-transition">
                                <template v-slot:activator="{ props }">
                                  <v-btn color="indigo-darken-1" v-bind="props">
                                    Select Y Variables
                                  </v-btn>
                                </template>
                                <v-list>
                                  <v-list-item
                                    v-for="(item, i) in yItems"
                                    :key="i"
                                    :title = item
                                  >
                                  </v-list-item>
                                </v-list>
                              </v-menu>

                              <v-menu transition="scroll-x-transition">
                                <template v-slot:activator="{ props }">
                                  <v-btn color="indigo-darken-1" v-bind="props">
                                    Colored By
                                  </v-btn>
                                </template>

                                <v-list>
                                  <v-list-item
                                    v-for="(item, i) in colorItems"
                                    :key="i"
                                    :title = item
                                  >
                                  </v-list-item>
                                </v-list>
                              </v-menu>
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
              <v-col cols="12">
                <v-data-table :headers="columns" :items="rows"></v-data-table>
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
import { Bar } from "vue-chartjs";
import barData from "../data/test_barplotData.json";
import tableData from "../data/test_table.json";
import * as dropdownData from "../data/test_dropData.json";

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
      //tab names
      tabs: [
        { name: "Bar Plot", value: 1 },
        { name: "Line Plot", value: 2 },
        { name: "Extension1", value: 3 },
      ],
      items: [
        { title: 'Click Me' },
        { title: 'Click Me' },
        { title: 'Click Me' },
      ],
      chartConfig: { ...barData },
      ...tableData,
      xItems: dropdownData.XItems,
      yItems: dropdownData.YItems,
      colorItems: dropdownData.ColorItems,
    };
  },
};
</script>

<!--
<script>
export default {
  // don't forget to export the about us file
  name: "DataOverview",
  data() {
    return {
      model: "tab-2",
      //tab names
      tabs: [
        { name: "Population", value: 1 },
        { name: "Extension1", value: 2 },
        { name: "Extension2", value: 3 },
      ],
      //data for data table
      columns: [
        {
          align: "start",
          key: "name",
          sortable: false,
          title: "",
        },
        { key: "column1", title: "Values" },
  
      ],
      rows: [
        {
          name: "Row1",
          column1: 1,
        
        },
        {
          name: "Row2",
          column1: 2,
       
        },
        {
          name: "Row3",
          column1: 3,
          
        },
      ],
    };
  },
};
</script>
-->
