<template>
  <Bar ref="chartComponent" :data="computedChartData" :options="computedChartOptions" />
</template>

<script>
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import barPlot1 from '../data/test_barplotData1.json'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
  name: 'CustomBar',
  components: { Bar },
  props: {
    xVar: {
      type: String,
      required: true
    },
    yVar: {
      type: String,
      required: true
    },
    cVar: {
      type: String,
      required: true
    }
  },
  computed: {
    computedChartData() {
      console.log('this.xVar: ', this.xVar)
      console.log('this.yVar: ', this.yVar)
      console.log('this.cVar: ', this.cVar)
      if (!this.xVar || !this.yVar || !this.cVar) {
        return {
          datasets: []
        }
      }
      // Add your stuff here. I.e. the api call or other data manipulation. If you create a function, just add it
      // in the methods section and call it here using this.functionName()
      console.log('this.xVar: ', this.xVar)
      console.log('this.yVar: ', this.yVar)
      console.log('this.cVar: ', this.cVar)
      return barPlot1
    },
    computedChartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            title:{
              display: true,
              text: this.xVar
            }
          },
          y: {
            beginAtZero: true,
            title:{
              display: true,
              text: this.yVar
            }
          }
        }
      }
    }
  },
  watch: {
    computedChartData: 'updateChart',
    computedChartOptions: 'updateChart'
  },
  methods: {
    updateChart() {
      this.$nextTick(() => {
        if (this.$refs.chartComponent && this.$refs.chartComponent.chartInstance) {
          this.$refs.chartComponent.chartInstance.update()
        }
      })
    }
  },
  mounted() {
    
    this.updateChart()
  }
}
</script>