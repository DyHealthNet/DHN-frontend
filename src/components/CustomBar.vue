<template>
  <Bar ref="chartComponent" :data="chartData" :options="computedChartOptions" />
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
      required: false
    }
  },
  data() {
    return {
      chartData: {
        datasets: []
      }
    }
  },
  computed: {
     computedChartData() {
      console.log('this.xVar: ', this.xVar)
      console.log('this.yVar: ', this.yVar)
      console.log('this.cVar: ', this.cVar)
      if (!this.xVar || !this.yVar) {
        return {
          datasets: []
        }
      }
      console.log('this.xVar: ', this.xVar)
      console.log('this.yVar: ', this.yVar)
      console.log('this.cVar: ', this.cVar)

      return this.fetchChartData();
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
    },

    async fetchChartData() {
      if (!this.xVar || !this.yVar) {
        this.chartData = { datasets: [] };
        return;
      }
      try {
        const url = new URL("http://localhost:8000/network/plotData/");
        url.searchParams.append("x", this.xVar);
        url.searchParams.append("y", this.yVar);
        if (this.cVar) {
          url.searchParams.append("c", this.cVar);
        }
        console.log('url: ', url)
        const response = await fetch(url);
        const data = await response.json();
        this.rows = Object.keys(data).map((key) => ({
          name: key,
          column1: data[key],
        })) 
        //this.chartData = data;
        this.chartData = barPlot1;
        return this.chartData;
      } catch (error) {
        console.error("Error fetching variable data:", error);
        this.chartData = { datasets: [] };
      }
    }
    
  },
  mounted() {
    this.updateChart()
  }
}
</script>