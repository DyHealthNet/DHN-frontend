<template>
  <v-overlay v-model="showLoadingPie" scroll-strategy="none" contained class="d-flex justify-center align-center">
    <v-progress-circular indeterminate color="primary" size="60"></v-progress-circular>
  </v-overlay>

  <v-alert
      v-if="privacyWarning"
      type="warning"
      density="compact"
      variant="tonal"
      closable
      class="mb-2"
      @click:close="privacyWarning = null"
  >
    {{ privacyWarning }}
  </v-alert>

  <div ref="PlotlyPieChart"></div>


  <div class="text-center ma-2">
    <v-snackbar
        v-model="showMessage"
        :color="messageType"
    >
      <v-icon class="my-0 mr-2">
        mdi-information-outline
      </v-icon>
      {{ messageInfo }}

      <template v-slot:actions>
        <v-btn
            variant="text"
            @click="showMessage = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import {getCookie} from "@/components/authentication/auth.js";

import Plotly from "plotly.js-dist";
import {BASE_URL, setLoadingState, loadingStates} from "@/components/constants.js";


export default {
  name: "OverviewPie",
  components: {},

  props: {
    xVar: {
      type: String,
      required: true,
    },
    contextValue: {
      type: [Number, null],
      required: true,
    },
    palette: {
      type: String,
      required: false,
    },
    textSize: {
      type: Number,
      required: false,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },

  },

  data() {
    return {
      plotData: [],
      plotLayout: {},

      showMessage: false,
      messageInfo: null,
      messageType: "",
      privacyWarning: null,

    };
  },

  watch: {
    xVar: "fetchAndUpdateChart",
    contextValue: "fetchAndUpdateChart",
    palette: "fetchAndUpdateChart",
    textSize: "fetchAndUpdateChart",
    width: "renderPlot",
    height: "renderPlot",
    "$vuetify.theme.global.name": "renderPlot",
  },

  mounted() {
    this.fetchChartData();
  },

  computed: {
    showLoadingPie() {
      return loadingStates.value.isLoadingPie; // Directly reactive to `loadingStates`
    }
  },

  methods: {

    labelColor(grid = false) {
      // chartjs does not support theme colors so we just directly call the theme color
      let colorName = grid ? "chart-grid" : "chart";
      if (this.$vuetify.theme.global.name === 'dyHealthNetTheme') {
        return this.$vuetify.theme.themes.dyHealthNetTheme.colors[colorName];
      } else {
        return this.$vuetify.theme.themes.dyHealthNetThemeDark.colors[colorName];
      }
    },

    backgroundColor() {
      if (this.$vuetify.theme.global.name === 'dyHealthNetTheme') {
        return this.$vuetify.theme.themes.dyHealthNetTheme.colors["surface"];
      } else {
        return this.$vuetify.theme.themes.dyHealthNetThemeDark.colors["surface"];
      }
    },

    formatTitle(title, maxLength = 20) {
      // check if title is null
      if (!title) {
        return "";
      }
      if (title.length <= maxLength) {
        return title;
      }
      return title.match(new RegExp(`.{1,${maxLength}}`, "g")).join("-<br>");
    },

    async fetchAndUpdateChart() {
      await this.fetchChartData();
    },

    async fetchChartData() {
      if (!this.xVar) {
        return;
      }

      setLoadingState("isLoadingPie", true)

      try {
        const url = new URL("/plotting/api/plotDataPieCount/", BASE_URL);
        url.searchParams.append("x", this.xVar);

        if (this.contextValue) {
          url.searchParams.append("contextValue", String(this.contextValue));
        }
        if (this.palette) {
          url.searchParams.append("colors", String(this.palette))
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
            }
        );
        const data = await response.json();

        this.privacyWarning = data.warning || null;

        // Transform data for Plotly
        this.transformDataForPlotly(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        this.plotData = [];
      }

    },

    transformDataForPlotly(data) {
      const labels = data.labels;
      const datasets = data.datasets;

      // Transform datasets into Plotly-compatible format
      this.plotData = datasets.map((dataset) => {
        return {
          values: dataset.data,
          labels: labels,
          type: "pie",
          marker: {colors: dataset.backgroundColor},
          textfont: {
            size: this.textSize,
          }
        };
      });

      this.renderPlot();
      setLoadingState("isLoadingPie", false);

    },

    renderPlot() {
      if (this.$refs.PlotlyPieChart) {

        // Configure layout
        this.plotLayout = {
          title: {
            text: "",
            font: {
              size: this.textSize,
              color: this.labelColor(),
            }
          },
          subtitle: {
            text: null,
            font: {
              size: this.textSize,
              color: this.labelColor(),
            }
          },
          legend: {
            title: {
              text: this.formatTitle(this.xVar),
              font: {
                size: this.textSize,
                color: this.labelColor()
              }
            },
            font: {
              size: this.textSize,
              color: this.labelColor()
            },
            automargin: true,
          },
          responsive: true,
          autosize: false,
          automargin: true,
          paper_bgcolor:  this.backgroundColor(),
          plot_bgcolor:  this.backgroundColor(),
          editable: true


        };

        Plotly.newPlot(this.$refs.PlotlyPieChart, this.plotData, {
          ...this.plotLayout,
          width: this.width,  // Force full width
          height: this.height,  // Force full height
        }, {
          editable: true,
          modeBarButtonsToRemove: ["select2d", "lasso2d"],
          modeBarButtonsToAdd: [{
            name: "Download JSON",
            icon: Plotly.Icons.disk,
            click: (gd) => {
              this.downloadJSON(gd);
            }
          }],
          showEditInChartStudio: true,
          toImageButtonOptions: {
            filename: "piechart",
            format: "jpeg",
            scale: 5

          },
          plotlyServerURL: "https://chart-studio.plotly.com"
        }).then((plot) => {
          this.plotlyInstance = plot;
        });

      }
    },

    getPlotlyInstance() {
      if (!this.plotlyInstance) {
        console.warn("Plotly instance is not available yet.");
        return null;
      }
      return this.plotlyInstance;
    },


    downloadJSON(gd) {
      let exportData = {data: gd.data, layout: gd.layout};
      let jsonData = JSON.stringify(exportData, null, 2); // Pretty format JSON

      let blob = new Blob([jsonData], {type: "application/json"});
      let link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "pieplot_data.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }


  }
};
</script>

