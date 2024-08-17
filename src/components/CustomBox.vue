<template>
  <div>
    <BoxPlotChartComponent
      :chartData="chartData"
      ref="boxplotchartComponent"
    />
  </div>
</template>

<script>
const BASE_URL = import.meta.env.VITE_BACKEND_URL || `${window.location.protocol}//${window.location.host}`;
import BoxPlotChartComponent from "@/components/BoxPlotChartComponent.vue";
import testbox from '../data/test_boxplotData.json';

export default {
  name: "CustomBox",
  components: { BoxPlotChartComponent },
  props: {
    xVar: {
      type: String,
      required: true,
    },
    cVar: {
      type: String,
      required: false,
    },
  },
  
  data() {
    return {
      chartData: {
        labels: [], // Initialize with empty labels or any default values
        datasets: [],
      },
    };
  },

  watch: {
    xVar: 'fetchAndUpdateChart',
    cVar: 'fetchAndUpdateChart',
  },

  methods: {
   async fetchAndUpdateChart() {
     await this.fetchChartData();
     this.updateChart();
   },

   async fetchChartData() {
     if (!this.xVar) {
       this.chartData = { datasets: [] };
       return;
     }
     try {
       const url = new URL("/network/api/plotDataBoxPlot/", BASE_URL);
       url.searchParams.append("x", this.xVar);
       if (this.cVar) {
         url.searchParams.append("c", this.cVar);
       }
       // const response = await fetch(url);
       // const data = await response.json();
       // this.chartData = data;
       
       this.chartData = testbox;

     } catch (error) {
       console.error("Error fetching variable data:", error);
       this.chartData = { datasets: [] };
     }
   },

   updateChart() {
     this.$nextTick(() => {
       if (this.$refs.boxplotchartComponent) {
         this.$refs.boxplotchartComponent.renderChart();
       }
     });
   }
},

mounted() {
  this.fetchAndUpdateChart();
}

};
</script>
