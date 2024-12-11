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
    getThemeColor(color) {
      if (this.$vuetify.theme.global.name === 'dyHealthNetTheme') {
        return this.$vuetify.theme.themes.dyHealthNetTheme.colors[color];
      } else {
        return this.$vuetify.theme.themes.dyHealthNetThemeDark.colors[color];
      }
    },

    createHeatmap() {
      const xCategoriesAsString = this.chartData.xCategories.map(String);
      const yCategoriesAsString = this.chartData.yCategories.map(String);

      const trace = {
        x: xCategoriesAsString,
        y: yCategoriesAsString,
        z: this.chartData.datasets,
        type: "heatmap",
        colorscale: [
            // TODO: Change whatever the hell this is
          [0, "rgb(209,229,240)"], // Lightest color
          [0.5, "rgb(131,179,197)"], // Mid-tone color
          [1, "rgb(16,77,99)"], // Darkest color (#104d63)
        ],
      };

      Plotly.newPlot("heatmap", [trace], this.heatmapLayout);
    },
  },
  computed: {
    heatmapLayout() {
      return {
        paper_bgcolor: this.getThemeColor('surface'),
        font: {
          color: this.getThemeColor('chart')
        },
        xaxis: {
          type: "category",
          title: {
            text: this.xLabel || 'X Label',
            standoff: 20, // Abstand zwischen Achsentitel und Achse
          },
          tickangle: -20, // Labels um drehen
          automargin: true,
        },
        yaxis: {
          type: "category",
          title: {
            text: this.yLabel || 'Y Label',
            standoff: 20, // Abstand zwischen Achsentitel und Achse
          },
          tickangle: 0,
          automargin: true,
        },
      };
    },
  },
  watch: {
    '$vuetify.theme.global.name': function () {
      this.createHeatmap();
    },
  },
};
</script>
