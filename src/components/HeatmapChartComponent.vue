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
    xLabel: {
      type: String,
      required: true,
    },
    yLabel: {
      type: String,
      required: true,
    },
  },
  mounted() {
    this.createHeatmap();
  },
  methods: {
    createHeatmap() {
      const xCategoriesAsString = this.chartData.xCategories.map(String);
      const yCategoriesAsString = this.chartData.yCategories.map(String);

      const trace = {
        x: xCategoriesAsString,
        y: yCategoriesAsString,
        z: this.chartData.datasets,
        type: "heatmap",
        colorscale: [
          [0, "rgb(209,229,240)"], // Lightest color
          [0.5, "rgb(131,179,197)"], // Mid-tone color
          [1, "rgb(16,77,99)"], // Darkest color (#104d63)
        ],
      };

      const layout = {
        xaxis: {
          type: "category",
          title: {
            text: this.xLabel || 'Default X Label'
          }
        },
        yaxis: {
          type: "category",
          title: {
            text:this.yLabel || 'Default Y Label'
          }
        },
      };

      Plotly.newPlot("heatmap", [trace], layout);
    },
  },
};
</script>
