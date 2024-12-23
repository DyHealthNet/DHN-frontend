<template>
  <div>
    <HeatmapChartComponent :chartData="chartData" :xLabel="this.xVar" 
    :yLabel="this.yVar" ref="heatmapComponent" />
  </div>
</template>

<script>
import {getCookie} from "@/components/authentication/auth.js";

import {BASE_URL} from "../constants.js";
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
        datasets: [],
      },
    };
  },

  watch: {
    xVar: "fetchAndUpdateChart",
    yVar: "fetchAndUpdateChart",
    contextValue: "fetchAndUpdateChart",
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
