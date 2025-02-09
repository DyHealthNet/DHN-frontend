<template>
    <!-- BoxPlotChartComponent anzeigen -->
    <BoxPlotChartComponent
      :chartData="chartData"
      :xLabel="this.xVar"
      :yLabel="this.yVar"
      ref="boxplotchartComponent"
    />
    <!--PopUp Alert-->
    <div class="popup">
      <v-snackbar v-model="showPopup" color="error" multi-line>
          <v-icon class="my-0 mr-2">
            mdi-information-outline
          </v-icon>
          Some groups could not be displayed due to privacy reasons.
        <template v-slot:actions>
            <v-btn variant="text" @click="showPopup = false">
              Close
            </v-btn>
        </template>
      </v-snackbar>
    </div>
</template>

<script>
import {getCookie} from "@/components/authentication/auth.js";

import {BASE_URL} from "../constants.js";
import BoxPlotChartComponent from "@/components/plots/BoxPlotChartComponent.vue";
import testbox from "../../data/test_boxplotData.json";
//import testbox from "../data/test_boxPlotWithTimeAsX.json";

export default {
  name: "CustomBox",
  components: { BoxPlotChartComponent },
  props: {
    xVar: {
      type: String,
      required: true,
    },
    yVar: {
      type: String,
      required: true,
    },
    cVar: {
      type: String,
      required: false,
    },
    contextValue: {
      type: Number,
      required: true,
    },
    palette: {
      type: String,
      required: false,
    },
  },

  data() {
    return {
      chartData: {
        labels: [],
        datasets: [],
      },
      showPopup: false, // Popup-Status
      useExampleData: false,
      defaultChart: true,
    };
  },

  watch: {
    xVar: "fetchAndUpdateChart",
    yVar: "fetchAndUpdateChart",
    cVar: "fetchAndUpdateChart",
    contextValue: "fetchAndUpdateChart",
    palette: "fetchAndUpdateChart",
  },

  methods: {
    checkVariableConflict() {
      if (this.xVar === this.yVar || this.xVar === this.cVar|| this.yVar === this.cVar) {
        alert("The selected variabels are same. Please choose different variables.");
        return true;
      }
      return false;
    },

    async fetchAndUpdateChart() {
      await this.fetchChartData();
      this.updateChart();
    },

    async fetchChartData() {
      try {
        let data;
        if (this.useExampleData) {
          // Use example data
          data = testbox;
        } else {
          if (!this.xVar || !this.yVar || this.checkVariableConflict()) {
            this.chartData = { datasets: [] };
            return;
          }
          const url = new URL("/plotting/api/plotDataBoxPlot/", BASE_URL);
          url.searchParams.append("x", this.xVar);
          url.searchParams.append("y", this.yVar);
          if (this.cVar) {
            url.searchParams.append("c", this.cVar);
          }
          if (this.contextValue) {
            url.searchParams.append("contextValue", String(this.contextValue));
          }
          if (this.palette) {
            console.log("palette: ", this.palette);
            url.searchParams.append("colors", this.palette);
          }
          if (this.defaultChart) {
            url.searchParams.append("default", "true");
          }

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include',
          });
          data = await response.json();
        }

        this.defaultChart = false;

        const filteredData = {
          labels: [],
          datasets: data.datasets.map((dataset) => ({
            ...dataset,
            data: [],
          })),
        };

        let dataRemoved = false;
        let dataNanMarker = false;

        for (let i = 0; i < data.labels.length; i++) {
          let validLabel = false;

          // Check if all boxplots are invalid
          const allBoxplotsInvalid = data.datasets.every(
            (dataset) => !dataset.data[i].min
          );

          // if not, retain the label
          if (!allBoxplotsInvalid) {
            filteredData.labels.push(data.labels[i]);
            validLabel = true;

            data.datasets.forEach((dataset, datasetIndex) => {
              const boxplot = dataset.data[i];

              filteredData.datasets[datasetIndex].data.push(boxplot);

              if (!boxplot.min) {
                dataNanMarker = true;
              }
            });
          } else {
            dataRemoved = true;
          }
        }

        // remove datasets without any valid boxplot
        filteredData.datasets = filteredData.datasets.filter((dataset) =>
          dataset.data.some((boxplot) => boxplot.min !== null)
        );

        if (dataRemoved || dataNanMarker) {
          this.showPopup = true;
        }

        this.chartData = filteredData;
      } catch (error) {
        console.error("Error fetching variable data:", error);
        this.chartData = { datasets: [] };
      }
    },

    updateChart() {
      this.$nextTick(() => {
        if (this.$refs.boxplotchartComponent) {
          this.$refs.boxplotchartComponent.renderChart();
        }
      });
    },

  },

  mounted() {
    this.fetchAndUpdateChart();
  },
};
</script>

<style>
.popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 100%;
  width: 80%;
  padding: 20px;
  border-radius: 8px;
  z-index: 1000;
}
.popup-text {
  color: white;
  font-size: 18px;
  text-align: center;
}
.button-text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.button-group {
  display: flex;
  gap: 10px; 
  width: 100%; 
  justify-content: center; 
}

.centered-text {
  text-align: center;
  margin-top: 10px;
  max-width: 100%;
  width: calc(100% - 20px);
}

.big-text {
  font-size: 18px;
}
</style>
