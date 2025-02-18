<template>
  <div class="chart-container">
    <canvas class="max-canvas" ref="canvas"></canvas>
  </div>
</template>

<script>
import { Chart, LinearScale, CategoryScale } from 'chart.js';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';


export default {
  name: 'BoxPlotChartComponent',
  props: {
    chartData: {
      type: Object,
      required: true
    },
    xLabel: {
      type: String,
      required: true,
    },
    yLabel: {
      type: String,
      required: true,
    }
  },
  mounted() {
    Chart.register(BoxPlotController, BoxAndWiskers, LinearScale, CategoryScale);
    this.renderChart();
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

    renderChart() {
     if (this.chartInstance) {
       this.chartInstance.destroy(); // Destroy the existing chart instance
     }

     const ctx = this.$refs.canvas.getContext('2d');
     this.chartInstance = new Chart(ctx, {
       type: 'boxplot',
       data: this.chartData,
       options: {
          color: this.labelColor(),
          scales: {
            x: {
              title: {
                display: true,
                text: this.xLabel || 'X Label',
                color: this.labelColor()
              },
              ticks: {
                maxRotation: 25,
                minRotation: 25,
                color: this.labelColor(),
              },
              grid: {
                color: this.labelColor(true),
              }
             
            },
            y: {
              title: {
                display: true,
                text: this.yLabel || 'Y Label',  // Y-axis label
                color: this.labelColor()
              },
              ticks: {
                color: this.labelColor(),
              },
              grid: {
                color: this.labelColor(true),
              }
            }
          }
        }
     });
   },
  }
};
</script>

<style scoped>
.max-canvas {
  max-height: 100%;
  max-width: 100%;
  height: 100%;
  width: 100%;
}
.chart-container {
  height: 100%;
  width: 100%;
}
</style>