<template>
  <div class="chart-container">
    <canvas ref="canvas"></canvas>
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
    chartOptions: {
      type: Object,
      required: true
    }
  },
  mounted() {
    Chart.register(BoxPlotController, BoxAndWiskers, LinearScale, CategoryScale);
    this.renderChart();
  },
  methods: {
    renderChart() {
      const ctx = this.$refs.canvas.getContext('2d');
      new Chart(ctx, {
        type: 'boxplot',
        data: this.chartData,
        options: this.chartOptions
      });
    }
  }
};
</script>


