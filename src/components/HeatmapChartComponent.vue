<template>
  <div id="heatmap"></div>
</template>

<script>
import Plotly from "plotly.js-dist";

export default {
  name: "HeatmapChartComponent",
  props: {
    chartData: {
      type: Object,
      required: true,
    },
  },
  mounted() {
    this.createHeatmap();
  },
  methods: {
    createHeatmap() {
      const trace = {
        z: this.chartData.datasets,
        x: this.chartData.xCategories,
        y: this.chartData.yCategories,
        type: "heatmap",
        colorscale: [
          [0, "rgb(209,229,240)"], // Lightest color
          [0.5, "rgb(131,179,197)"], // Mid-tone color
          [1, "rgb(16,77,99)"], // Darkest color (#104d63)
        ],
      };

      const layout = {};

      Plotly.newPlot("heatmap", [trace], layout);
    },
  },
};
</script>
