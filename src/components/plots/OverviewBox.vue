<template>
  <v-overlay v-model="showLoadingBox" scroll-strategy="none" contained class="d-flex justify-center align-center">
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

  <div ref="PlotlyBoxChart"></div>


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
  name: "OverviewBox",
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
    // GetDataBoxPlotView) -- rendered as a normal cVar-grouped boxplot, context as the group.
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
      privacyWarning: null,

    };
  },

  // A single watcher on the combined fetch-relevant props, rather than one watcher per prop
  // -- when several of these change together in the same tick (e.g. selecting a new edge
  // changes both xVar and yVar at once), Vue batches the computed's re-evaluation and this
  // watcher into a single flush, so exactly one fetch fires instead of one per prop that moved.
  watch: {
    fetchDeps: "fetchAndUpdateChart",
    textSize: "renderPlot",
    width: "renderPlot",
    height: "renderPlot",
    "$vuetify.theme.global.name": "renderPlot",
  },

  mounted() {
    this.fetchChartData();
  },

  computed: {
    showLoadingBox() {
      return loadingStates.value.isLoadingBox; // Directly reactive to `loadingStates`
    },
    compareMode() {
      return !!(this.context1 && this.context2);
    },
    // Whether the response has multiple (grouped) datasets to render as one trace each,
    // vs. a single "Whole Cohort" dataset -- true for a real cVar or context comparison.
    grouped() {
      return this.compareMode || (this.cVar && this.cVar !== "None");
    },
    // Bundles every prop that should trigger a re-fetch into one reactive value, so the
    // watcher below fires once per batch of prop changes instead of once per individual prop.
    fetchDeps() {
      return [
        this.xVar,
        this.yVar,
        this.cVar,
        this.contextValue,
        this.context1?.contextValue,
        this.context2?.contextValue,
        this.palette,
      ];
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
      console.log("Fetching data for ", this.xVar);

      if (!this.xVar && !this.yVar) {
        return;
      }

      setLoadingState("isLoadingBox", true)

      try {
        const url = new URL("/plotting/api/plotDataBoxPlot/", BASE_URL);
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

        this.privacyWarning = data.warning || null;

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

          // Check if all boxplots are invalid (min === null means privacy-suppressed/no data;
          // min === 0 is a legitimate value and must not be treated as invalid)
          const allBoxplotsInvalid = data.datasets.every(
              (dataset) => dataset.data[i].min === null
          );

          // if not, retain the label
          if (!allBoxplotsInvalid) {
            filteredData.labels.push(data.labels[i]);
            validLabel = true;

            data.datasets.forEach((dataset, datasetIndex) => {
              const boxplot = dataset.data[i];

              filteredData.datasets[datasetIndex].data.push(boxplot);

              if (boxplot.min === null) {
                console.log(
                    "Data for label",
                    data.labels[i],
                    "in dataset",
                    dataset.label,
                    "is invalid"
                );
                dataNanMarker = true;
              }
            });

          } else {
            console.log("Data for label", data.labels[i], "is invalid");
            dataRemoved = true;
          }
        }

        // remove datasets without any valid boxplot
        filteredData.datasets = filteredData.datasets.filter((dataset) =>
            dataset.data.some((boxplot) => boxplot.min !== null)
        );

        if (dataRemoved || dataNanMarker) {
          this.showMessage = true;
          this.messageType = "warning";
          this.messageInfo = dataRemoved
              ? "Some categories were hidden because there was no data to display for them."
              : "Some data points could not be displayed due to insufficient data (privacy protection).";
        }

        // Transform data for Plotly
        this.transformDataForPlotly(filteredData);
      } catch
          (error) {
        console.error("Error fetching data:", error);
        this.plotData = [];
      }

    }
    ,

    transformDataForPlotly(data) {
      const labels = data.labels;
      const datasets = data.datasets;

      console.log("API data: ", datasets);
      console.log("API labels: ", labels);

      // Transform datasets into Plotly-compatible format
      if (!this.grouped) {
        let entry;
        entry = datasets[0]
        // Iterate over data with integer value
        this.plotData = entry.data.map((cat, i) => {
          return {
            x: [labels[i]],
            q1: [cat.q1],
            median: [cat.median],
            q3: [cat.q3],
            mean: [cat.mean],
            lowerfence: [cat.min],
            upperfence: [cat.max],
            type: "box",
            marker: {color: entry.backgroundColor},
            showlegend: false,
          };
        });
      } else {
        this.plotData = datasets.map((entry) => {
          return {
            x: labels,
            q1: entry.data.map(cat => cat.q1),
            median: entry.data.map(cat => cat.median),
            q3: entry.data.map(cat => cat.q3),
            mean: entry.data.map(cat => cat.mean),
            lowerfence: entry.data.map(cat => cat.min),
            upperfence: entry.data.map(cat => cat.max),
            name: entry.label,
            type: "box",
            marker: {color: entry.backgroundColor},
          };
        });
      }

      console.log("Plotly data: ", this.plotData);


      this.renderPlot();
      setLoadingState("isLoadingBox", false);

    }
    ,

    renderPlot() {
      if (this.$refs.PlotlyBoxChart) {

        // Configure layout
        this.plotLayout = {
          boxmode: this.grouped ? "group" : "overlay",
          boxmean: true,
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
          paper_bgcolor: this.backgroundColor(),
          plot_bgcolor: this.backgroundColor(),
          editable: true


        };

        Plotly.newPlot(this.$refs.PlotlyBoxChart, this.plotData, {
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
            filename: "boxplot",
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
      link.download = "boxplot_data.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }


  }
};
</script>

