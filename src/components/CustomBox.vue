<template>
  <div>
    <!-- BoxPlotChartComponent anzeigen -->
    <BoxPlotChartComponent
      :chartData="chartData"
      :xLabel="this.xVar"
      :yLabel="this.yVar"
      ref="boxplotchartComponent"
    />

    <!--PopUp Alert-->
    <div class="popup">
      <v-alert v-if="showPopup" color="error" icon="$warning">
        <div class="popup-text">
          Some groups don't have enough members and due to privacy issues some
          data is not displayed.
        </div>
        <v-btn color="primary" @click="closePopup">OK</v-btn>
      </v-alert>
    </div>

    <!-- Special cases as Example -->
    <div class="button-text-container">
      <div class="button-group">
        <v-btn @click="showExample" style="background-color: #f1f1f1">
          Show Example with Popup
        </v-btn>
        <v-space></v-space>
        <v-btn @click="closeExample" style="background-color: #f1f1f1">
          Close Example
        </v-btn>
      </div>

      <p class="centered-text">
        Click this button to see a special case with a popup. Don't forget to
        close the example first if you want to return to the original data.
      </p>
    </div>
  </div>
</template>

<script>
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;
import BoxPlotChartComponent from "@/components/BoxPlotChartComponent.vue";
import testbox from "../data/test_boxplotData.json";
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
  },

  data() {
    return {
      chartData: {
        labels: [],
        datasets: [],
      },
      showPopup: false, // Popup-Status
      useExampleData: false,
    };
  },

  watch: {
    xVar: "fetchAndUpdateChart",
    yVar: "fetchAndUpdateChart",
    cVar: "fetchAndUpdateChart",
  },

  methods: {
    checkVariableConflict() {
      // Check if xVar and yVar or xVar and cVar are the same
      if (this.xVar === this.yVar || this.xVar === this.cVar|| this.yVar === this.cVar) {
        alert("The selected variabels are same. Please choose different variables.");
        return true;
      }
      return false;
    },
    showExample() {
      this.useExampleData = true;
      this.fetchAndUpdateChart();
    },
    closeExample() {
      this.useExampleData = false;
      this.fetchAndUpdateChart();
    },

    async fetchAndUpdateChart() {
      await this.fetchChartData();
      this.updateChart();
    },

    async fetchChartData() {
      try {
        let data;
        if (this.useExampleData) {
          // Verwende die Beispiel-Daten 
          data = testbox;
        } else {
          console.log("this.xVar: ", this.xVar);
          console.log("this.yVar: ", this.yVar);
          console.log("this.cVar: ", this.cVar);
          if (!this.xVar || !this.yVar || this.checkVariableConflict()) {
            this.chartData = { datasets: [] };
            return;
          }
          // Daten von der API abrufen
          const url = new URL("/network/api/plotDataBoxPlot/", BASE_URL);
          url.searchParams.append("x", this.xVar);
          url.searchParams.append("y", this.yVar);
          if (this.cVar) {
            url.searchParams.append("c", this.cVar);
          }
          console.log("url: ", url);
          const response = await fetch(url);
          data = await response.json();
        }
        console.log("data: ", data);
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
            (dataset) => dataset.data[i].min === -100
          );

          // Wenn nicht alle Boxplots ungültig sind, dann Label beibehalten
          if (!allBoxplotsInvalid) {
            filteredData.labels.push(data.labels[i]);
            validLabel = true;

            data.datasets.forEach((dataset, datasetIndex) => {
              const boxplot = dataset.data[i];

              if (boxplot.min !== -100) {
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
  gap: 10px; /* Abstand zwischen den Buttons */
  width: 100%; /* Buttons über die gesamte Breite strecken */
  justify-content: center; /* Buttons zentrieren */
}

.centered-text {
  text-align: center;
  margin-top: 10px;
  max-width: 100%;
  width: calc(100% - 20px); /* Gleiche Breite wie die Button-Gruppe */
}
</style>
