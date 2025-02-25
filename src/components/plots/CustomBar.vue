<template>
  <Bar
    ref="chartComponent"
    :data="computedChartData"
    :options="computedChartOptions"
  />

   <!--Button-->
   <v-btn color="primary" 
      @click="downloadPlotBar" 
      class="mt-5 mb-5 mx-5" 
      prepend-icon="mdi-tray-arrow-down">
      Download
    </v-btn>
</template>

<script>
import { Bar } from "vue-chartjs";
import {BASE_URL, setIsLoading} from "@/components/constants.js";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import {getCookie} from "@/components/authentication/auth.js";
//import barPlot1 from "../data/test_countBar.json";
//import text from "../data/test_popup.json";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

export default {
  name: "CustomBar",
  components: { Bar },
  props: {
    xVar: {
      type: String,
      required: true,
    },
    cVar: {
      type: String,
      required: false,
    },
    contextValue: {
      type: Number,
      required: false,
    },
    palette: {
      type: String,
      required: false,
    }
  },
  data() {
    return {
      chartData: {
        labels: [],
        datasets: [],
      },
      defaultChart: true,
    };
  },
  computed: {
    computedChartData() {
      if (!this.xVar || this.checkVariableConflict()) {
        return {
          labels: [],
          datasets: [],
        };
      }
      return this.chartData;
    },
    computedChartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        color: this.labelColor(),
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: this.xVar || "X Label",
              color: this.labelColor(),
            },
            ticks: {
              minRotation: 25, 
              maxRotation: 25,
              color: this.labelColor(),
            },
            grid: {
              color: this.labelColor(true),
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Counts",
              color: this.labelColor(),
            },
            ticks: {
              color: this.labelColor(),
            },
            grid: {
              color: this.labelColor(true),
            }
          },
        },
      };
    },
  },
  watch: {
    xVar: "fetchAndUpdateChart",
    cVar: "fetchAndUpdateChart",
    contextValue: "fetchAndUpdateChart",
    palette: "fetchAndUpdateChart",
  },

  mounted() {
    this.fetchChartData();
  },

  methods: {

    labelColor(grid=false) {
      // chartjs does not support theme colors so we just directly call the theme color
      let colorName = grid ? "chart-grid" : "chart";
      if (this.$vuetify.theme.global.name === 'dyHealthNetTheme') {
        return this.$vuetify.theme.themes.dyHealthNetTheme.colors[colorName];
      } else {
        return this.$vuetify.theme.themes.dyHealthNetThemeDark.colors[colorName];
      }
    },

    checkVariableConflict() {
      if (this.xVar === this.cVar) {
        alert(
          "The selected variabels are same. Please choose different variables."
        );
        return true;
      }
      return false;
    },

    updateChart() {
      console.log("updateChart");
      this.$nextTick(() => {
        if (
          this.$refs.chartComponent &&
          this.$refs.chartComponent.chartInstance
        ) {
          this.$refs.chartComponent.chartInstance.update();
        }
      });
    },

    async fetchAndUpdateChart() {
      await this.fetchChartData();
      this.updateChart();
    },

    async fetchChartData() {
      setIsLoading(true);
      if (!this.xVar) {
        this.chartData = { labels: [], datasets: [] };
        return;
      }

      try {
        const url = new URL("/plotting/api/plotDataBarCount/", BASE_URL);
        url.searchParams.append("x", this.xVar);
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
        this.rows = Object.keys(data).map((key) => ({
          name: key,
          column1: data[key],
        }));

        this.chartData = data;

        this.defaultChart = false;

      } catch (error) {
        console.error("Error fetching variable data:", error);
        this.chartData = { labels: [], datasets: [] };
      }
      setIsLoading(false);
    },

    downloadPlotBar() {
      this.$nextTick(() => {
        const chartComponent = this.$refs.chartComponent;
        if (chartComponent && chartComponent.chart) {
          const canvas = chartComponent.chart.ctx.canvas;
          const dpr = window.devicePixelRatio || 2;

          // Create a temporary high-resolution canvas
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = canvas.width * dpr;
          tempCanvas.height = canvas.height * dpr;
          const tempCtx = tempCanvas.getContext("2d");

          // Apply scaling
          tempCtx.scale(dpr, dpr);

          // Fill background with white
          tempCtx.fillStyle = "#ffffff";
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

          // Draw the chart onto the high-res canvas
          tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);

          // Convert to high-quality PNG
          const link = document.createElement("a");
          link.href = tempCanvas.toDataURL("image/png"); // High-quality PNG
          link.download = "barplot_chart.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          console.warn("ChartComponent not found or not rendered yet.");
        }
      });
    }
  }
};
</script>