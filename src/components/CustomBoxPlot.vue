<template>
    <div>
      <div>
        <label for="x">X Variable:</label>
        <select v-model="xVar" id="x">
          <option v-for="(label, index) in labels" :key="index" :value="label">{{ label }}</option>
        </select>
  
        <label for="y">Y Variable:</label>
        <select v-model="yVar" id="y">
          <option v-for="(label, index) in labels" :key="index" :value="label">{{ label }}</option>
        </select>
  
        <label for="color">Color By:</label>
        <select v-model="cVar" id="color">
          <option v-for="(label, index) in labels" :key="index" :value="label">{{ label }}</option>
        </select>
      </div>
  
      <Box ref="chartComponent" :chart-data="computedChartData" :options="computedChartOptions" />
    </div>
  </template>
  
  <script>
  import { Chart as ChartJS, Title, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js'
  import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot'
  
  
  
  ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, BoxPlotController, BoxAndWiskers)
  
  export default {
    name: 'CustomBoxplot',
    data() {
      return {
        xVar: '',
        yVar: '',
        cVar: '',
        labels: [],
        sourceData: [],
      };
    },
    computed: {
      computedChartData() {
        if (!this.xVar || !this.yVar) {
          return {
            labels: [],
            datasets: []
          }
        }
  
        // Transform data for box plot
        const transformedData = this.transformData(this.sourceData);
  
        return {
          labels: transformedData.labels,
          datasets: [{
            label: this.yVar,
            data: transformedData.data,
            backgroundColor: '#42A5F5'
          }]
        };
      },
      computedChartOptions() {
        return {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              title: {
                display: true,
                text: this.xVar
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: this.yVar
              }
            }
          }
        }
      }
    },
    watch: {
      xVar() {
        this.updateChart();
      },
      yVar() {
        this.updateChart();
      },
      cVar() {
        this.updateChart();
      }
    },
    methods: {
      async fetchData() {
        try {
          const response = await fetch('http://localhost:8000/network/api/plotData/');
          console.log("WE ARE IN CUSTOMBOXPLOT COMPONENT AND FETCHING DATA")
          const data = await response.json();
          this.labels = Object.keys(data[0]);
          this.sourceData = data;
          this.xVar = this.labels[0];
          this.yVar = this.labels[1];
          this.cVar = this.labels[2];
          this.updateChart();
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      },
      transformData(data) {
        // Transform data for boxplot
        const transformed = data.map(item => this.labels.map(label => item[label]));
        return {
          labels: this.labels,
          data: transformed
        };
      },
      updateChart() {
        this.$nextTick(() => {
          if (this.$refs.chartComponent && this.$refs.chartComponent.chartInstance) {
            this.$refs.chartComponent.chartInstance.update();
          }
        });
      }
    },
    mounted() {
      this.fetchData();
    }
  }
  </script>
  