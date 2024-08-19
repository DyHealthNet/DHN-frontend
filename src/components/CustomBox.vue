<template>
  <div>
    <BoxPlotChartComponent :chartData="chartData" ref="boxplotchartComponent" />
  </div>
</template>

<script>
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;
import BoxPlotChartComponent from "@/components/BoxPlotChartComponent.vue";
import testbox from "../data/test_boxplotData.json";

export default {
  name: "CustomBox",
  components: { BoxPlotChartComponent },
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
        labels: [],
        datasets: [],
      },
    };
  },

  watch: {
    xVar: "fetchAndUpdateChart",
    yVar: "fetchAndUpdateChart",
    cVar: "fetchAndUpdateChart",
  },

  methods: {
    async fetchAndUpdateChart() {
      await this.fetchChartData();
      this.updateChart();
    },

    async fetchChartData() {
      console.log("this.xVar: ", this.xVar);
      console.log("this.yVar: ", this.yVar);
      console.log("this.cVar: ", this.cVar);
      if (!this.xVar || !this.yVar) {
        this.chartData = { datasets: [] };
        return;
      }
      console.log("this.xVar: ", this.xVar);
      console.log("this.yVar: ", this.yVar);
      console.log("this.cVar: ", this.cVar);
      try {
        const url = new URL("/network/api/plotDataBoxPlot/", BASE_URL);
        url.searchParams.append("x", this.xVar);
        url.searchParams.append("y", this.yVar);
        if (this.cVar) {
          url.searchParams.append("c", this.cVar);
        }

        const response = await fetch(url);
        const data = await response.json();
        this.chartData = data;
        
        //this.chartData = testbox;
      } catch (error) {
        console.error("Error fetching variable data:", error);
        this.chartData = { datasets: [] };
      }
    },

    updateChart() {
      this.$nextTick(() => {
        if (this.$refs.boxplotchartComponent) {
          this.$refs.boxplotchartComponent.renderChart();
        }
      });
    },
  },

  mounted() {
    this.fetchAndUpdateChart();
  },
};
</script>
