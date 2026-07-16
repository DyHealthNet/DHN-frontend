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

// Plotly's built-in named colorscales don't include matplotlib's "coolwarm" (a softer,
// less saturated diverging map than the harsher built-in 'RdBu'), so it's supplied as an
// explicit set of stops -- matplotlib's own well-known coolwarm control points.
const COOLWARM_COLORSCALE = [
  [0, '#3B4CC0'],
  [0.167, '#6F92F3'],
  [0.333, '#A8C6FC'],
  [0.5, '#F2EBE9'],
  [0.667, '#F5A889'],
  [0.833, '#DB6151'],
  [1, '#B40426'],
];

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
    // Optional two-context comparison mode: when both are set, contextValue is ignored and
    // the backend instead returns a proportion-difference grid between the two contexts
    // (see GetDataHeatmapView) -- rendered here with a diverging, zero-centered colorscale.
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
    "context1.contextValue": "fetchAndUpdateChart",
    "context2.contextValue": "fetchAndUpdateChart",
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
    },
    diverging() {
      return !!(this.context1 && this.context2);
    },
    differenceTitle() {
      if (!this.diverging) return "";
      const name1 = this.context1?.contextName || "Context 1";
      const name2 = this.context2?.contextName || "Context 2";
      return `Difference of values, calculated as ${name1} − ${name2}`;
    },
  },

  methods: {

    // `values` is flat with x as the slow/outer axis and y as the fast/inner axis (each run
    // of `yLen` values shares one x -- matches pd.crosstab's row-major serialization order
    // in GetDataHeatmapView). Plotly wants z[row][col] with row=y-index, col=x-index, so
    // this un-flattens by (x, y) position rather than slicing fixed-width chunks -- a plain
    // slice(i*xLen, (i+1)*xLen) only happens to work when xLen === yLen.
    create2Darray(values, xLen, yLen) {
      const z = Array.from({ length: yLen }, () => new Array(xLen));
      for (let xi = 0; xi < xLen; xi++) {
        for (let yi = 0; yi < yLen; yi++) {
          z[yi][xi] = values[xi * yLen + yi];
        }
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
        if (this.diverging) {
          url.searchParams.append("contextValue1", String(this.context1.contextValue));
          url.searchParams.append("contextValue2", String(this.context2.contextValue));
        } else if (this.contextValue) {
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
      const trace = {
        x: xCategories,
        y: yCategories,
        z: z,
        type: "heatmap",
        colorbar: {
          title: {
            text: this.diverging ? "Difference" : "Count",
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
      };
      if (this.diverging) {
        // Zero-centered diverging scale so "no difference" reads as the neutral midpoint
        // color rather than whatever a sequential palette's low end happens to be. Still
        // goes through the same palette prop as every other plot (coolwarm here is just the
        // fallback if the caller doesn't pass one), not a hardcoded choice -- 'coolwarm'
        // resolves to the custom stops above since Plotly has no built-in by that name;
        // any actual Plotly built-in name (e.g. 'RdBu') still passes through untouched.
        const maxAbs = Math.max(0.01, ...z.flat().map((v) => Math.abs(v)));
        const palette = this.palette || "coolwarm";
        trace.colorscale = palette === "coolwarm" ? COOLWARM_COLORSCALE : palette;
        trace.zmid = 0;
        trace.zmin = -maxAbs;
        trace.zmax = maxAbs;
      } else {
        trace.colorscale = this.palette;
      }
      this.plotData = [trace];

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
            text: this.differenceTitle,
            // Plotly centers titles by default (x: 0.5), which clips the start of a title
            // wider than the plot area since it then overflows equally on both sides --
            // left-anchoring it at the plot's left edge keeps the full text visible instead.
            x: 0,
            xanchor: 'left',
            automargin: true,
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
            // Without an explicit type, Plotly auto-detects the axis type from the tick
            // labels -- categories that happen to look numeric (e.g. binary/ordinal codes
            // like "0"/"1") get inferred as a continuous linear axis instead of discrete
            // categories, spacing/ordering them by numeric value rather than as a plain list.
            type: 'category',
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
            type: 'category',
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

