<template>
  <div>
    <BoxPlotChartComponent
      :chartData="chartData"
      :chartOptions="computedChartOptions"
    />
  </div>
</template>

<script>
const BASE_URL = import.meta.env.VITE_BACKEND_URL || `${window.location.protocol}//${window.location.host}`;
import BoxPlotChartComponent from "@/components/BoxPlotChartComponent.vue";

export default {
  name: "CustomBox",
  components: { BoxPlotChartComponent },
  props: {
    xVar: {
      type: String,
      required: true,
    },
    yVar: {
      type: String,
      required: true,
    },
    cVar: {
      type: String,
      required: false,
    },
  },

  data(){
    return {
      chartData: {
        datasets: [],
      },
    };
  },

  // Innitial data
  
  // data() {
  //   return {
  //     chartData: {// Initial data
  //       labels: ["Category 1", "Category 2", "Category 3"],
  //       datasets: [
  //         {
  //           label: "BoxPlot Dataset1",
  //           backgroundColor: "#42A5F5",
  //           borderColor: "#1E88E5",
  //           borderWidth: 1,
  //           outlierColor: "#E53935",
  //           padding: 10,
  //           itemRadius: 0,
  //           data: [
  //             {
  //               min: 1,
  //               q1: 2,
  //               median: 3,
  //               q3: 4,
  //               max: 5,
  //               outliers: [0.5, 5.5],
  //             },
  //             {
  //               min: 2,
  //               q1: 3,
  //               median: 4,
  //               q3: 5,
  //               max: 6,
  //               outliers: [1.5, 6.5],
  //             },
  //             {
  //               min: 3,
  //               q1: 4,
  //               median: 5,
  //               q3: 6,
  //               max: 7,
  //               outliers: [2.5, 7.5],
  //             },
  //           ],
  //         },
          
  //         {
  //           label: "BoxPlot Dataset2",
  //           backgroundColor: "#42A5F6",
  //           borderColor: "#1E88E5",
  //           borderWidth: 1,
  //           outlierColor: "#E53935",
  //           padding: 10,
  //           itemRadius: 0,
  //           data: [
  //             {
  //               min: 1,
  //               q1: 2,
  //               median: 3,
  //               q3: 4,
  //               max: 5,
  //               outliers: [0.5, 5.5],
  //             },
  //             {
  //               min: 2,
  //               q1: 3,
  //               median: 4,
  //               q3: 5,
  //               max: 6,
  //               outliers: [1.5, 6.5],
  //             },
  //             {
  //               min: 3,
  //               q1: 4,
  //               median: 5,
  //               q3: 6,
  //               max: 7,
  //               outliers: [2.5, 7.5],
  //             },
  //           ],
  //         },
  //       ],
  //     },
      
  //   };
  // },
  
  computed: {
    computedChartData() {
      console.log("this.xVar: ", this.xVar);
      console.log("this.yVar: ", this.yVar);
      console.log("this.cVar: ", this.cVar);
      if (!this.xVar || !this.yVar) {
        return {
          datasets: [],
        };
      }
      console.log("this.xVar: ", this.xVar);
      console.log("this.yVar: ", this.yVar);
      console.log("this.cVar: ", this.cVar);

      return this.fetchChartData();
    },
    computedChartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            //beginAtZero: true,
            title: {
              display: true,
              text: this.xVar,
            },
          },
          y: {
            //beginAtZero: true,
            title: {
              display: true,
              text: this.yVar,
            },
          },
        },
      };
    },
  },
  watch: {
    computedChartData: "updateChart",
    computedChartOptions: "updateChart",
  },
  methods: {
    updateChart() {
      this.$nextTick(() => {
        if (
          this.$refs.chartComponent &&
          this.$refs.chartComponent.chartInstance
        ) {
          this.$refs.chartComponent.chartInstance.update();
        }
      });
    },

    async fetchChartData() {
      if (!this.xVar || !this.yVar) {
        this.chartData = { datasets: [] };
        return;
      }
      try {
        const url = new URL("/network/api/plotDataBoxPlot/", BASE_URL);
        //const url = new URL("http://localhost:8000/network/api/plotData/");
        url.searchParams.append("x", this.xVar);
        url.searchParams.append("y", this.yVar);
        if (this.cVar) {
          url.searchParams.append("c", this.cVar);
        }
        console.log("url: ", url);
        const response = await fetch(url);
        const data = await response.json();
        this.rows = Object.keys(data).map((key) => ({
          name: key,
          column1: data[key],
        }));

        //Update data
        this.chartData = data;
        console.log("this.chartData: ", this.chartData);
        //this.chartData = barPlot1;

        return this.chartData;
      } catch (error) {
        console.error("Error fetching variable data:", error);
        this.chartData = { datasets: [] };
      }
    },
  },
  mounted() {
    this.updateChart();
  },
};
</script>
