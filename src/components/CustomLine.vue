<template>
  <Line ref="lineComponent" :data="chartData" :options="computedChartOptions" />
</template>

<script>
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
  },

  data() {
    return {
      chartData: {
        datasets: [],
      },
    };
  },

  computed: {
    computedChartData() {
      console.log("this.xVar: ", this.xVar);
      console.log("this.yVar: ", this.yVar);
      console.log("this.cVar: ", this.cVar);
      if (!this.xVar || !this.yVar || this.checkVariableConflict()) {
        return {
          datasets: [],
        };
      }
      // Add your stuff here. I.e. the api call or other data manipulation. If you create a function, just add it
      // in the methods section and call it here using this.functionName()
      console.log("this.xVar: ", this.xVar);
      console.log("this.yVar: ", this.yVar);
      console.log("this.cVar: ", this.cVar);
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
        const url = new URL("/plotting/api/plotData/", BASE_URL);
        //const url = new URL("http://localhost:8000/network/api/plotData/");
        url.searchParams.append("x", this.xVar);
        url.searchParams.append("y", this.yVar);
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
        //this.chartData = linePlot1;
        console.log("this.chartData: ", this.chartData);

        return this.chartData;
      } catch (error) {
        console.error("Error fetching variable data:", error);
        this.chartData = { datasets: [] };
      }
    },
  },

  mounted() {
    this.updateChart();
  },
};
</script>
