<template>
  <div>
    <!-- BoxPlotChartComponent anzeigen -->
    <BoxPlotChartComponent :chartData="chartData" ref="boxplotchartComponent" />
    <!-- Overlay anzeigen, wenn Daten entfernt wurden -->
    <!--<div v-if="showPopup" class="popup popup-text">
      Some of the data is not displayed due to a small number of patients.
      <button @click="closePopup" style="border: 2px solid #000">OK</button>
    </div>-->
    <v-alert v-if="showPopup" color="error" icon="$warning" class="popup">
      <div class="popup-text">
        Some of the data is not displayed due to a small number of patients.
      </div>
      <v-btn color="primary" @click="closePopup">OK</v-btn>
    </v-alert>
  </div>
</template>

<script>
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;
import BoxPlotChartComponent from "@/components/BoxPlotChartComponent.vue";
import testbox from "../data/test_boxplotData.json";

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
  },

  data() {
    return {
      chartData: {
        labels: [],
        datasets: [],
      },
      showPopup: false, // Popup-Status
    };
  },

  watch: {
    xVar: "fetchAndUpdateChart",
    yVar: "fetchAndUpdateChart",
    cVar: "fetchAndUpdateChart",
  },

  methods: {
    async fetchAndUpdateChart() {
      await this.fetchChartData();
      this.updateChart();
    },

    async fetchChartData() {
      console.log("this.xVar: ", this.xVar);
      console.log("this.yVar: ", this.yVar);
      console.log("this.cVar: ", this.cVar);
      if (!this.xVar || !this.yVar) {
        this.chartData = { datasets: [] };
        return;
      }
      try {
        const url = new URL("/network/api/plotDataBoxPlot/", BASE_URL);
        url.searchParams.append("x", this.xVar);
        url.searchParams.append("y", this.yVar);
        if (this.cVar) {
          url.searchParams.append("c", this.cVar);
        }
        console.log("url: ", url);
        //const response = await fetch(url);
        //const data = await response.json();
        //this.rows = Object.keys(data).map((key) => ({
        //  name: key,
        //  column1: data[key],
        //}))

        // Original JSON-Daten
        const data = testbox;

        // Neue Datenstruktur für gefilterte Boxplots
        const filteredData = {
          labels: [],
          datasets: data.datasets.map((dataset) => ({
            ...dataset,
            data: [],
          })),
        };

        let dataRemoved = false;
        let dataNanMarker = false; // Marker für NaN-Werte

        // Durchlaufen der Labels und Daten
        for (let i = 0; i < data.labels.length; i++) {
          let validLabel = false;

          // Prüfen, ob alle Boxplots für diesen Index ungültig sind
          const allBoxplotsInvalid = data.datasets.every(
            (dataset) => dataset.data[i].min === -1
          );

          // Wenn nicht alle Boxplots ungültig sind, dann Label beibehalten
          if (!allBoxplotsInvalid) {
            filteredData.labels.push(data.labels[i]);
            validLabel = true;

            data.datasets.forEach((dataset, datasetIndex) => {
              const boxplot = dataset.data[i];

              if (boxplot.min !== -1) {
                filteredData.datasets[datasetIndex].data.push(boxplot);
              } else {
                // In den anderen Gruppen einen Platzhalter einfügen
                filteredData.datasets[datasetIndex].data.push({
                  min: null,
                  q1: null,
                  median: null,
                  mean: null,
                  q3: null,
                  max: null,
                });
                dataNanMarker = true;
              }
            });
          } else {
            dataRemoved = true;
          }
        }

        // Entferne leere Datensätze (wo keine Daten vorhanden sind)
        filteredData.datasets = filteredData.datasets.filter((dataset) =>
          dataset.data.some((boxplot) => boxplot.min !== null)
        );

        if (dataRemoved || dataNanMarker) {
          this.showPopup = true;
        }

        console.log("filteredData_end: ", filteredData);

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

    closePopup() {
      this.showPopup = false; // Popup schließen
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
  top: 100%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 400px;
  width: 100%;
  z-index: 1000;
}
.popup-text {
  color: #333;
  font-size: 18px;
  text-align: center;
}
</style>
