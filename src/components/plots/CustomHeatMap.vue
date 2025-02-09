<template>
  <HeatMapChart :chart-data="this.chartData" :y-label="yVar" :x-label="xVar" ref="heatmapChart"></HeatMapChart>
</template>

<script>
import {getCookie} from "@/components/authentication/auth.js";

import {BASE_URL} from "../constants.js";
import HeatMapChart from "@/components/plots/HeatMapChart.vue";

export default {
  name: "CustomHeatmap",
  components: {HeatMapChart},
  props: {
    xVar: {
      type: String,
      required: true,
    },
    yVar: {
      type: String,
      required: true,
    },
    contextValue: {
      type: Number,
      required: false,
    },
    palette: {
      type: String,
      required: false,
    },
  },

  data() {
    return {
      chartData: {
        xCategories: [],
        yCategories: [],
        values: [],
      },
    };
  },

  watch: {
    xVar: "fetchAndUpdateChart",
    yVar: "fetchAndUpdateChart",
    contextValue: "fetchAndUpdateChart",
    palette: "fetchAndUpdateChart",
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
      if (!this.xVar || !this.yVar ||this.checkVariableConflict()) {
        this.chartData = { xCategories: [], yCategories: [], datasets: [] };
        return this.chartData;
      }
      try {

        const url = new URL("/plotting/api/plotDataHeatmap/", BASE_URL);
        url.searchParams.append("x", this.xVar);
        url.searchParams.append("y", this.yVar);
        if (this.contextValue) {
          url.searchParams.append("contextValue", String(this.contextValue));
        }
        // categorical palettes make no sense for heatmaps
        if (this.palette && this.palette === "rocket") {
          url.searchParams.append("colors", this.palette);
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
        
        this.chartData = await response.json();
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
        console.log("this.$refs.heatmapChart: ", this.$refs.heatmapChart);
        if (this.$refs.heatmapChart) {
          this.$refs.heatmapChart.renderChart();
        }
      });
    },
  },

  mounted() {
    this.fetchAndUpdateChart();
  },
};
</script>
