<template>
  <div class="chart-container">
    <canvas class="max-canvas" ref="canvas"></canvas>
  </div>
</template>

<script>
import { Chart } from 'chart.js';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';


export default {
  name: 'HeatMapChart',
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
  computed: {
    dataValues() {
      return this.chartData?.values || [];
    },
    xLabelList() {
      return this.chartData?.xCategories || [];
    },
    yLabelList() {
      return this.chartData?.yCategories || [];
    },
    computedOptions() {
      return {
          color: this.labelColor,
          scales: {
            x: {
              type: 'category',
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
              gridLines: {
                display: false,
              },
              labels: this.xLabelList,
            },
            y: {
              type: 'category',
              labels: this.yLabelList,
              offset: true,
              reverse: false,
              title: {
                display: true,
                text: this.yLabel || 'Y Label',  // Y-axis label
                color: this.labelColor()
              },
              ticks: {
                color: this.labelColor(),
              },
              gridLines: {
                display: false,
              },
            }
          },
         plugins: {
           tooltip: {
             callbacks: {
               label(context) {
                 const v = context.dataset.data[context.dataIndex];
                 return `${v.y}: ${v.r}`;
               }
             }
           },
           legend: {
             display: false
           }
        }
      }
    }
  },
  mounted() {
    Chart.register(MatrixController, MatrixElement);
    this.renderChart();
  },
  watch: {
    chartData: {
      handler() {
        this.renderChart();
      },
      deep: true
    },
    $vuetify: {
      handler() {
        this.renderChart();
      },
      deep: true
    }
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
       this.chartInstance.destroy();
     }
     console.log("Rendering chart");
     console.log(this.chartData);

     if (this.dataValues.length === 0) {
       return;
     }
     console.log(this.chartData);

     const ctx = this.$refs.canvas.getContext('2d');
     this.chartInstance = new Chart(ctx, {
       type: 'matrix',
       data: {
          datasets: [{
						label: 'Cohort',
						data: this.dataValues,
						backgroundColor(context) {
							return context.dataset.data[context.dataIndex].c;
						},
						width(context) {
							const a = context.chart.chartArea;
              const cols = context.chart.data.datasets[0].data.filter(d => d.y === context.dataset.data[context.dataIndex].y);
							if (!a) {
								return 0;
							}
							return (a.right - a.left) / cols.length - 2;
						},
						height(context) {
							const a = context.chart.chartArea;
              const rows = context.chart.data.datasets[0].data.filter(d => d.x === context.dataset.data[context.dataIndex].x);
							if (!a) {
								return 0;
							}
							return (a.bottom - a.top) / rows.length - 2;
						}
					}],
        },
       options:
           this.computedOptions
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