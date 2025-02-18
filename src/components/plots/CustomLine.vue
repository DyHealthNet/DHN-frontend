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
  PointElement
);

export default {
  name: "CustomLine",

  components: {
    Line,
  },

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
      type: Number,
      required: true,
    },
    palette: {
      type: String,
      required: false,
    }
  },

  data() {
    return {
      chartData: {
        datasets: [],
      },
      defaultChart: true,
    };
  },

  computed: {
    computedChartData() {
      if (!this.xVar || !this.yVar || this.checkVariableConflict()) {
        return {
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
            beginAtZero: false,
            title: {
              display: true,
              text: this.yVar || "Y Label",
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
    updateChart() {
      this.$nextTick(() => {
        if (this.$refs.lineComponent && this.$refs.lineComponent.lineInstance) {
          this.$refs.lineComponent.lineInstance.update();
        }
      });
    },
    checkVariableConflict() {
      if (this.xVar === this.yVar || this.xVar === this.cVar|| this.yVar === this.cVar) {
        alert("The selected variabels are same. Please choose different variables.");
        return true;
      }
      return false;
    },

    async fetchChartData() {
      if (!this.xVar || !this.yVar) {
        this.chartData = { datasets: [] };
        return;
      }
      try {
        const url = new URL("/plotting/api/plotDataLine/", BASE_URL);
        url.searchParams.append("x", this.xVar);
        url.searchParams.append("y", this.yVar);
        if (this.cVar) {
          url.searchParams.append("c", this.cVar);
        }
        if (this.contextValue) {
          url.searchParams.append("contextValue", String(this.contextValue));
        }
        if (this.palette) {
          url.searchParams.append("colors", this.palette);
        }

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

        this.defaultChart = false;

        return this.chartData;
      } catch (error) {
        console.error("Error fetching variable data:", error);
        this.chartData = { datasets: [] };
      }
    },
  },

  mounted() {
    //this.updateChart();
  },
};
</script>
