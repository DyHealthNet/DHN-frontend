<template>
  <v-overlay v-model="showLoadingHeatmap" scroll-strategy="none" contained class="d-flex justify-center align-center">
    <v-progress-circular indeterminate color="primary" size="60"></v-progress-circular>
  </v-overlay>

  <div ref="PlotlyHeatmapChart"></div>


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
  name: "OverviewHeatmap",
  components: {},

  props: {
    xVar: {
      type: String,
      required: true,
    },
    yVar: {
      type: String,
      required: false,
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
    showValues: {
      type: String,
      required: true,
    }

  },

  data() {
    return {
      plotData: [],
      plotLayout: {},

      showMessage: false,
      messageInfo: null,
      messageType: "",

    };
  },

  watch: {
    xVar: "fetchAndUpdateChart",
    yVar: "fetchAndUpdateChart",
    contextValue: "fetchAndUpdateChart",
    palette: "fetchAndUpdateChart",
    textSize: "fetchAndUpdateChart",
    width: "renderPlot",
    height: "renderPlot",
    showValues: "fetchAndUpdateChart",
    "$vuetify.theme.global.name": "renderPlot",
  },

  mounted() {
    this.$nextTick(() => {
      if (this.$refs.PlotlyHeatmapChart) {
        this.fetchChartData();
      } else {
        console.error("PlotlyHeatmapChart ref is not available at mount.");
      }
    });

  },

  computed: {
    showLoadingHeatmap() {
      return loadingStates.value.isLoadingHeatmap; // Directly reactive to `loadingStates`
    }
  },

  methods: {

    create2Darray(values, x, y) {
      let z = [];

      for (let i = 0; i < y; i++) {
        z.push(values.slice(i * x, (i + 1) * x)); // Extract `x` elements per row
      }

      return z;
    },

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

    checkVariableConflict() {
      if (this.xVar === this.yVar) {
        this.showMessage = true;
        this.messageInfo = "The selected X and C variable are the same. Please choose different variables.";
        this.messageType = "error"
        return true;
      } else {
        return false;
      }
    },

    async fetchAndUpdateChart() {
      if (!this.checkVariableConflict()) {
        await this.fetchChartData();
      }
    },

    async fetchChartData() {
      if (!this.xVar && !this.yVar) {
        return;
      }

      setLoadingState("isLoadingHeatmap", true)

      try {
        const url = new URL("/plotting/api/plotDataHeatmap/", BASE_URL);
        url.searchParams.append("x", this.xVar);
        url.searchParams.append("y", this.yVar);
        if (this.contextValue) {
          url.searchParams.append("contextValue", String(this.contextValue));
        }
        // TODO: remove palette function in backend
        // categorical palettes make no sense for heatmaps
        //if (this.palette && this.palette === "rocket") {
        //  url.searchParams.append("colors", this.palette);
        //}

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

        // Transform data for Plotly
        this.transformDataForPlotly(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        this.plotData = [];
      }

    },

    transformDataForPlotly(data) {
      const xCategories = data.xCategories;
      const yCategories = data.yCategories;
      const values = data.values.map(v => v.r);
      const z = this.create2Darray(values, xCategories.length, yCategories.length);

      if (this.showValues === "Yes") {
        this.annotations = yCategories.flatMap((y, i) =>
            xCategories.map((x, j) => ({
              xref: 'x1',
              yref: 'y1',
              x: x,
              y: y,
              text: z[i][j], // Display value inside the heatmap
              font: {
                family: 'Arial',
                size: this.textSize,
                color: z[i][j] !== 0 ? 'white' : 'black' // Color logic
              },
              showarrow: false
            }))
        )
      }

      // Transform datasets into Plotly-compatible format
      this.plotData = [{
        x: xCategories,
        y: yCategories,
        z: this.create2Darray(values, xCategories.length, yCategories.length),
        type: "heatmap",
        colorscale: this.palette,
        colorbar: {
          title: {
            text: "Count",
            font: {
              size: this.textSize,
              color: this.labelColor(),
            }
          },
          tickfont: {
            size: this.textSize,
            color: this.labelColor()
          }
        },
        hoverongaps: false
      }];

      console.log("plotData: ", this.plotData);

      this.renderPlot();
      setLoadingState("isLoadingHeatmap", false);

    },

    renderPlot() {
      if (this.$refs.PlotlyHeatmapChart) {

        // Configure layout
        this.plotLayout = {
          annotations: this.showValues === "Yes" ? this.annotations : [],
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
          xaxis: {
            title: {
              text: this.xVar,
              font: {
                size: this.textSize,
                color: this.labelColor(),
              }
            },
            tickfont: {
              size: this.textSize,
              color: this.labelColor()
            },
            automargin: true,
          },
          yaxis: {
            title: {
              text: this.yVar,
              font: {
                size: this.textSize,
                color: this.labelColor(),
              }
            },
            tickfont: {
              size: this.textSize,
              color: this.labelColor()
            },
            automargin: true,
            showgrid: true,
            gridcolor: this.labelColor(true),
          },
          responsive: true,
          autosize: false,
          automargin: true,
          paper_bgcolor: this.backgroundColor(),
          plot_bgcolor: this.backgroundColor(),
          editable: true


        };

        Plotly.newPlot(this.$refs.PlotlyHeatmapChart, this.plotData, {
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
            filename: "heatmap",
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
      link.download = "heatmap_data.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

  }
};
</script>

