<template>
  <v-overlay v-model="showLoadingBox" scroll-strategy="none" contained class="d-flex justify-center align-center">
    <v-progress-circular indeterminate color="primary" size="60"></v-progress-circular>
  </v-overlay>

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

    };
  },

  watch: {
    xVar: "fetchAndUpdateChart",
    yVar: "fetchAndUpdateChart",
    cVar: "fetchAndUpdateChart",
    contextValue: "fetchAndUpdateChart",
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
    showLoadingBox() {
      return loadingStates.value.isLoadingBox; // Directly reactive to `loadingStates`
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
        if (this.cVar) {
          url.searchParams.append("c", this.cVar);
        }
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
          this.showPopup = true;
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
      if (!this.cVar || this.cVar === "None") {
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
          boxmode: this.cVar ? "group" : "overlay",
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

