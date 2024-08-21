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
    renderChart() {
     if (this.chartInstance) {
       this.chartInstance.destroy(); // Destroy the existing chart instance
     }

     const ctx = this.$refs.canvas.getContext('2d');
     this.chartInstance = new Chart(ctx, {
       type: 'boxplot',
       data: this.chartData,
       options: {
          scales: {
            x: {
              title: {
                display: true,
                text: this.xLabel || 'X Label'  
              },
              ticks: {
              minRotation: 25, 
              maxRotation: 25, 
            },
             
            },
            y: {
              title: {
                display: true,
                text: this.yLabel || 'Y Label'  // Y-axis label
              },
              
            }
          }
        }
     });
   },
  }
};
</script>


