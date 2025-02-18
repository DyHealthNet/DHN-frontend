<template>
  <Line ref="lineComponent" :data="chartData" :options="computedChartOptions" />
</template>

<script>
import {getCookie} from "@/components/authentication/auth.js";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;
//import linePlot1 from "../data/test_linePlotData.json";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  Filler,
  PointElement,
} from "chart.js";

// Register the components globally
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  Filler,
  PointElement
);

export default {
  name: "CustomDensity",

  components: {
    Line,
  },

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
      required: true,
    },
    palette: {
      type: String,
      required: false,
    },
    bandwidth:{
      type: Number,
      required: true,
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
      return this.fetchChartData();
    },

    computedChartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        color: this.labelColor(),
        scales: {
          x: {
            beginAtZero: false,
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
              text: "Density",
              color: this.labelColor(),
            },
            ticks: {
              color: this.labelColor(),
            },
            grid: {
              color: this.labelColor(true),
            },
          },
        },
        elements: {
          line: {
            tension: 0.5,  // Adjust this value for smoother curves (range 0 to 1)
          },
          point: {
          radius: 0,  // This hides the dots on the line chart
        },
        },
      };
    },
  },
  watch: {
    computedChartData: "updateChart",
    computedChartOptions: "updateChart",
    contextValue: "updateChart",
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
      console.log("updateChart")
      console.log("cVar", this.cVar)
      this.$nextTick(() => {
        if (this.$refs.lineComponent && this.$refs.lineComponent.lineInstance) {
          this.$refs.lineComponent.lineInstance.update();
        }
      });
    },

    async fetchChartData() {
      console.log("this.yVar: ", this.yVar)
      console.log("this.contextValue: ", this.contextValue)
      if (!this.xVar) {
        this.chartData = { labels: [], datasets: [] };
        return;
      }
      try {
        const url = new URL("/plotting/api/plotDataDensity/", BASE_URL);
        url.searchParams.append("x", this.xVar);
        if (this.cVar) {
          url.searchParams.append("c", this.cVar);
        }
        if (this.contextValue) {
          url.searchParams.append("contextValue", String(this.contextValue));
        }
        if (this.palette) {
          url.searchParams.append("colors", this.palette);
        }
        url.searchParams.append("bandwidth", this.bandwidth);

        // If the chart is the default chart, add the default parameter to the URL to enable the backend
        // to send a cached version of the data
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

        console.log("this.chartData: ", this.chartData)

        this.defaultChart = false;

        return this.chartData;
      } catch (error) {
        console.error("Error fetching variable data:", error);
        this.chartData = { labels: [], datasets: [] };
      }
    },
  },

  mounted() {
    console.log("Density Plot mounted")
    //this.updateChart();
  },
};
</script>
