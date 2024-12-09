<template>
  <Bar
    ref="chartComponent"
    :data="computedChartData"
    :options="computedChartOptions"
  />
</template>

<script>
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
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
  },
  data() {
    return {
      chartData: {
        labels: [],
        datasets: [],
      },
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
    xVar: "fetchChartData",
    cVar: "fetchChartData",
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
      this.$nextTick(() => {
        if (
          this.$refs.chartComponent &&
          this.$refs.chartComponent.chartInstance
        ) {
          this.$refs.chartComponent.chartInstance.update();
        }
      });
    },

    async fetchChartData() {
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

        console.log("url: ", url);
        const response = await fetch(url);
        const data = await response.json();
        this.rows = Object.keys(data).map((key) => ({
          name: key,
          column1: data[key],
        }));

        this.chartData = data;
        //this.chartData = text;

        this.updateChart();
      } catch (error) {
        console.error("Error fetching variable data:", error);
        this.chartData = { labels: [], datasets: [] };
      }
    },
  },
  mounted() {
    this.fetchChartData();
  },
};
</script>