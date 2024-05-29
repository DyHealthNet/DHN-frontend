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
                        <!--Chart-->
                        <div style="height: 300px; width: 500px">
                          <Bar
                            :data="chartConfig"
                            :options="{ responsive: true }"
                          />
                        </div>

                        <!-- Figures -->
                        <!--
                        <v-row>
                          
                          <v-col cols="6">
                            <figure>
                              <img
                                src="https://blogs.sas.com/content/graphicallyspeaking/files/2019/02/nc_population_age_gender.png"
                                alt="Population"
                                width="500"
                                height="500"
                              />
                            </figure>
                          </v-col>
                          
                          <v-col cols="6">
                            <figure>
                              <img
                                src="https://static.packt-cdn.com/products/9781788295260/graphics/5a534f47-8593-4fd1-bbbe-e3c801a7b8ad.png"
                                alt="Population"
                                width="500"
                                height="300"
                              />
                            </figure>
                          </v-col>
                        </v-row>-->

                        <!--Table with search-->
                        <r-row>
                          <v-col cols="12">
                            <!--search field-->
                            <!--
                            <v-text-field
                              v-model="search"
                              label="Search"
                              prepend-inner-icon="mdi-magnify"
                              variant="outlined"
                              hide-details
                              single-line
                            ></v-text-field>-->
                            <!--table content-->
                            <v-data-table
                              :headers="columns"
                              :items="rows"
                            ></v-data-table>
                          </v-col>
                        </r-row>
                      </template>

                      <!-- Content for second tab -->
                      <template v-else-if="tab.value === 2">
                        <!--Figure-->
                        <figure>
                          <img src="" alt="Figure related to Extension1" />
                        </figure>
                        <table>
                          <!-- Table -->
                        </table>
                      </template>

                      <!-- Content for the last tab -->
                      <template v-else>
                        <!--Figure-->
                        <figure>
                          <img src="" alt="Figure related to the Extension 2" />
                        </figure>
                        <table>
                          <!-- Table -->
                        </table>
                      </template>
                    </v-card-text>
                  </v-card>
                </v-tabs-window-item>
              </v-tabs-window>
            </v-card>
          </v-col>

          <!--Data Tables-->
          <v-col cols="12"> </v-col>

          <!--End of the content-->
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { Bar } from "vue-chartjs";
import bardata from "../data/test_barplotData.json";
import data from "../data/test_table.json";

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
        { name: "Participiants", value: 1 },
        { name: "Extension1", value: 2 },
        { name: "Extension2", value: 3 },
      ],
      chartConfig: { ...bardata },
      ...data,
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
