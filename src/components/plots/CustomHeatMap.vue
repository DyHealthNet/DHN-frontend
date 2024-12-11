<template>
  <div>
    <HeatmapChartComponent :chartData="chartData" :xLabel="this.xVar" 
    :yLabel="this.yVar" ref="heatmapComponent" />
  </div>
</template>

<script>
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;
import HeatmapChartComponent from "@/components/plots/HeatmapChartComponent.vue";
//import testheatmap from "../data/test_heatmapData.json";

export default {
  name: "CustomHeatmap",
  components: { HeatmapChartComponent },
  props: {
    xVar: {
      type: String,
      required: true,
    },
    yVar: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      chartData: {
        xCategories: [],
        yCategories: [],
        datasets: [],
      },
    };
  },

  watch: {
    xVar: "fetchAndUpdateChart",
    yVar: "fetchAndUpdateChart",
  },

  methods: {
    checkVariableConflict() {
      if (this.xVar === this.yVar) {
        alert("Two selected Variables are same. Please choose different variables.");
        return true;
      }
      return false;
    },
    async fetchAndUpdateChart() {
      await this.fetchChartData();
      this.updateChart();
    },

    async fetchChartData() {
      console.log('this.xVar: ', this.xVar)
      console.log('this.yVar: ', this.yVar)
      if (!this.xVar || !this.yVar ||this.checkVariableConflict()) {
        this.chartData = { xCategories: [], yCategories: [], datasets: [] };
        return this.chartData;
      }
      try {
        console.log('this.xVar: ', this.xVar)
        console.log('this.yVar: ', this.yVar)
        const url = new URL("/plotting/api/plotDataHeatmap/", BASE_URL);
        url.searchParams.append("x", this.xVar);
        url.searchParams.append("y", this.yVar);
        console.log('url: ', url)
        const response = await fetch(url);
        const data = await response.json();
        this.rows = Object.keys(data).map((key) => ({
          name: key,
          column1: data[key],
        })) 
        
        this.chartData = data;
        console.log("this.chartData: ", this.chartData);

        return this.chartData;
      } catch (error) {
        console.error("Error fetching heatmap data:", error);
        this.chartData = { xCategories: [], yCategories: [], datasets: [] };
        return this.chartData;
      }
    },

    updateChart() {
      this.$nextTick(() => {
        if (this.$refs.heatmapComponent) {
          this.$refs.heatmapComponent.createHeatmap();
        }
      });
    },
  },

  mounted() {
    this.fetchAndUpdateChart();
  },
};
</script>
