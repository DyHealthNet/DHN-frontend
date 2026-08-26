<template>
  <v-overlay v-model="showLoadingBar" scroll-strategy="none" contained class="d-flex justify-center align-center">
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

  <div ref="PlotlyBarChart"></div>


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
  name: "OverviewBar",
  components: {},

  props: {
    xVar: {
      type: String,
      required: true,
    },
    cVar: {
      type: String,
      required: false,
    },
    // Required unless context1+context2 (below) are both given instead.
    contextValue: {
      type: [Number, null],
      default: null,
    },
    // Optional two-context comparison mode: when both are set, contextValue/cVar are
    // ignored and the backend instead groups by a synthetic 'context' column (see
    // GetDataBarCountView), rendered as a normal cVar-grouped bar chart, context as the group.
    context1: {
      type: Object,
      default: null,
    },
    context2: {
      type: Object,
      default: null,
    },
    barType: {
      type: String,
      required: false,
    },
    barOrientation: {
      type: String,
      required: false,
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

      //showLoadingBar: loadingStates.value["isLoadingBar"],

    };
  },

  watch: {
    xVar: "fetchAndUpdateChart",
    cVar: "fetchAndUpdateChart",
    contextValue: "fetchAndUpdateChart",
    "context1.contextValue": "fetchAndUpdateChart",
    "context2.contextValue": "fetchAndUpdateChart",
    palette: "fetchAndUpdateChart",
    textSize: "renderPlot",
    width: "renderPlot",
    height: "renderPlot",
    barType: "renderPlot",
    barOrientation: "transformDataForPlotly",
    "$vuetify.theme.global.name": "renderPlot",
  },

  mounted() {
    this.fetchChartData();
  },

  computed: {
    showLoadingBar() {
      return loadingStates.value.isLoadingBar; // Directly reactive to `loadingStates`
    },
    compareMode() {
      return !!(this.context1 && this.context2);
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
      if (this.xVar === this.cVar) {
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
      if (!this.xVar) {
        return;
      }

      setLoadingState("isLoadingBar", true)

      try {
        const url = new URL("/plotting/api/plotDataBarCount/", BASE_URL);
        url.searchParams.append("x", this.xVar);
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
        this.data = await response.json();

        this.privacyWarning = this.data.warning || null;

        // Transform data for Plotly
        this.transformDataForPlotly();
      } catch (error) {
        console.error("Error fetching data:", error);
        this.plotData = [];
      }

    },

    transformDataForPlotly() {
      const labels = this.data.labels;
      const datasets = this.data.datasets;
      // Transform datasets into Plotly-compatible format
      this.plotData = datasets.map((dataset) => {
        let y;
        if (this.cVar || this.compareMode) {
          y = dataset.data.map(point => point.y)
        } else {
          y = dataset.data
        }
        return {
          x: this.barOrientation === "Vertical" ? labels : y,
          y: this.barOrientation === "Vertical" ? y : labels,
          orientation: this.barOrientation === "Vertical" ? "v" : "h",
          name: dataset.label,
          type: "bar",
          marker: {color: dataset.backgroundColor}
        };
      });

      this.renderPlot();
      setLoadingState("isLoadingBar", false);

    },

    renderPlot() {
      if (this.$refs.PlotlyBarChart) {

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
              text: "Counts",
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

        Plotly.newPlot(this.$refs.PlotlyBarChart, this.plotData, {
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
            filename: "barplot",
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
      link.download = "barplot_data.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

  }
};
</script>

