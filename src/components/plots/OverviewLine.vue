<template>
  <v-overlay v-model="showLoadingLine" scroll-strategy="none" contained class="d-flex justify-center align-center">
    <v-progress-circular indeterminate color="primary" size="60"></v-progress-circular>
  </v-overlay>

  <div ref="PlotlyLineChart"></div>


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
  name: "OverviewLine",
  components: {},

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
    // Optional display labels for the axis titles (xVar/yVar are raw variable ids, used for
    // the actual data query) -- defaults to xVar/yVar when not given, so existing callers
    // that don't pass these keep seeing exactly what they do today.
    xLabel: {
      type: String,
      default: null,
    },
    yLabel: {
      type: String,
      default: null,
    },
    // Required unless context1+context2 (below) are both given instead.
    contextValue: {
      type: [Number, null],
      default: null,
    },
    // Optional two-context comparison mode: when both are set, contextValue/cVar are
    // ignored and the backend instead groups by a synthetic 'context' column (see
    // GetDataLinePlotView) -- rendered as a normal cVar-grouped line plot, context as the
    // group, each context's own privacy-filtered aggregated trend as one colored line.
    context1: {
      type: Object,
      default: null,
    },
    context2: {
      type: Object,
      default: null,
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

      //showLoadingLine: loadingStates.value["isLoadingLine"]

    };
  },

  watch: {
    xVar: "fetchAndUpdateChart",
    yVar: "fetchAndUpdateChart",
    cVar: "fetchAndUpdateChart",
    contextValue: "fetchAndUpdateChart",
    "context1.contextValue": "fetchAndUpdateChart",
    "context2.contextValue": "fetchAndUpdateChart",
    palette: "fetchAndUpdateChart",
    textSize: "renderPlot",
    width: "renderPlot",
    height: "renderPlot",
    "$vuetify.theme.global.name": "renderPlot",
  },

  mounted() {
    this.fetchChartData();
  },

  computed: {
    showLoadingLine() {
      return loadingStates.value.isLoadingLine; // Directly reactive to `loadingStates`
    },
    compareMode() {
      return !!(this.context1 && this.context2);
    },
    // Whether the response has multiple (grouped) datasets, each as {x,y} points -- vs. a
    // single "Whole Cohort" dataset as a plain y array -- true for a real cVar or context
    // comparison.
    grouped() {
      return this.compareMode || !!this.cVar;
    },
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

    checkVariableConflict() {
      if (this.xVar === this.yVar || this.xVar === this.cVar || this.yVar === this.cVar) {
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

      setLoadingState("isLoadingLine", true)

      try {
        const url = new URL("/plotting/api/plotDataLine/", BASE_URL);
        url.searchParams.append("x", this.xVar);
        url.searchParams.append("y", this.yVar);
        if (this.compareMode) {
          url.searchParams.append("contextValue1", String(this.context1.contextValue));
          url.searchParams.append("contextValue2", String(this.context2.contextValue));
        } else {
          if (this.cVar) {
            url.searchParams.append("c", this.cVar);
          }
          if (this.contextValue) {
            url.searchParams.append("contextValue", String(this.contextValue));
          }
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

      console.log("API Data:", datasets);
      console.log("API Labels:", labels);


      // Transform datasets into Plotly-compatible format
      this.plotData = datasets.map((dataset) => {
        let x, y;
        if (this.grouped) {
          x = dataset.data.map(point => point.x)
          y = dataset.data.map(point => point.y)
        } else {
          x = labels
          y = dataset.data
        }
        return {
          x: x,
          y: y,
          name: dataset.label,
          type: "scatter",
          marker: {color: dataset.backgroundColor}
        };
      });

      this.renderPlot();
      setLoadingState("isLoadingLine", false);

    },

    renderPlot() {
      if (this.$refs.PlotlyLineChart) {

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
          barmode: this.barType === "Stacked" ? "stack" : "group",
          xaxis: {
            title: {
              text: this.xLabel || this.xVar,
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
              text: this.yLabel || this.yVar,
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
          legend: {
            title: {
              text: this.formatTitle(this.cVar),
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

        Plotly.newPlot(this.$refs.PlotlyLineChart, this.plotData, {
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
            filename: "lineplot",
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
      link.download = "lineplot_data.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }


  }
};
</script>

