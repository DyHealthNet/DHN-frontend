<template>
      <Line ref="lineComponent" :data="computedChartData" :options="computedChartOptions" />
  </template>
  
  <script>
  import linePlot1 from '../data/test_linePlotData.json'
  import { Line } from 'vue-chartjs';
  import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, LinearScale, CategoryScale, PointElement } from 'chart.js';
  
  // Register the components globally
  ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, CategoryScale, PointElement);
  
  export default {
    name: 'CustomLine',
    components: {
      Line
    },
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
      return linePlot1
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
        if (this.$refs.lineComponent && this.$refs.lineComponent.lineInstance) {
          this.$refs.lineComponent.lineInstance.update()
        }
      })
    }
  },
  mounted() {
    this.updateChart()
  }
}
</script>