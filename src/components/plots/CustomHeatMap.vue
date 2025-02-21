<template>
  <div class="chart-container">
    <div class="chart">
      <HeatMapChart :chart-data="chartData" :y-label="yVar" :x-label="xVar" ref="heatmapChart" />
    </div>
    <div class="legend">
      <ContinuousLegend :min="minValue" :max="maxValue" :palette="palette" :height="this.legendHeight - 200" />
    </div>
  </div>
</template>

<script>
import {getCookie} from "@/components/authentication/auth.js";

import {BASE_URL, setIsLoading} from "../constants.js";
import HeatMapChart from "@/components/plots/HeatMapChart.vue";
import ContinuousLegend from "@/components/plots/ContinuousLegend.vue";

export default {
  name: "CustomHeatmap",
  components: {ContinuousLegend, HeatMapChart},
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
    legendHeight: {
      type: Number,
      required: false,
    }
  },

  data() {
    return {
      chartData: {
        xCategories: [],
        yCategories: [],
        values: [],
      },
      minValue: 0,
      maxValue: 0,
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
      setIsLoading(true);
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
        if (this.chartData?.values?.length > 0) {
          const rValues = this.chartData.values.map(v => v.r);
          this.minValue = Math.min(...rValues);
          this.maxValue = Math.max(...rValues);
        } else {
          console.warn("No values in chartData");
        }
        setIsLoading(false);
        return this.chartData;
      } catch (error) {
        console.error("Error fetching heatmap data:", error);
        this.chartData = { xCategories: [], yCategories: [], datasets: [] };
        setIsLoading(false);
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

<style scoped>
.chart-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 100%;
}

.chart {
  flex: 1 1 0; /* Takes up most of the space */
  min-width: 0;
  margin-right: 30px;
}

.legend {
  width: 40px;
  display: flex;
}
</style>
