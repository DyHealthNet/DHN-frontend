<template>
  <v-card style="height:100%">
    <v-row style="height: 100%" no-gutters class="flex-nowrap">
      <v-col cols = "auto">
        <!--Button-->
        <v-btn class="plot-settings-btn" icon="mdi-cog-outline" size="small" variant="tonal"
               @click="plotOptions = true"></v-btn>
        <v-btn v-if="!showNewPlot" class="plot-remove-btn" icon="mdi-close" size="small" variant="tonal"
               @click="removePlot"></v-btn>
      </v-col>
      <v-col>
        <!-- Render CustomBarPlot ONLY if selectedPlotType is 'Bar' -->
        <div style="height: 98%; width: 98%" ref="plotDiv">

          <OverviewBar v-if="showBar"
                       ref="overviewBar"
                       :xVar="selectedXVariable"
                       :cVar="selectedCVariable"
                       :contextValue="contextValue"
                       :barType="selectedBarPlotType"
                       :barOrientation="selectedBarPlotOrientation"
                       :textSize="plotTextSize"
                       :palette="paletteCA"
                       :width="width"
                       :height="height"
          />

          <OverviewBox v-if="showBox"
                       ref="overviewBox"
                       :xVar="selectedXVariable"
                       :yVar="selectedYVariable"
                       :cVar="selectedCVariable"
                       :contextValue="contextValue"
                       :textSize="plotTextSize"
                       :palette="paletteCA"
                       :width="width"
                       :height="height"
          />

          <OverviewLine v-if="showLine"
                        ref="overviewLine"
                        :xVar="selectedXVariable"
                        :yVar="selectedYVariable"
                        :cVar="selectedCVariable"
                        :contextValue="contextValue"
                        :textSize="plotTextSize"
                        :palette="paletteCA"
                        :width="width"
                        :height="height"
          />

          <OverviewHeatmap v-if="showHeatmap"
                           ref="overviewHeatmap"
                           :xVar="selectedXVariable"
                           :yVar="selectedYVariable"
                           :contextValue="contextValue"
                           :palette="paletteCO"
                           :textSize="plotTextSize"
                           :width="width"
                           :height="height"
                           :showValues="selectedHeatmapValues"
          />

          <OverviewPie v-if="showPie"
                       ref="overviewPie"
                       :xVar="selectedXVariable"
                       :contextValue="contextValue"
                       :textSize="plotTextSize"
                       :palette="paletteCA"
                       :width="width"
                       :height="height"
          />

          <OverviewDensity v-if="showDensity"
                        ref="overviewDensity"
                        :xVar="selectedXVariable"
                        :cVar="selectedCVariable"
                        :contextValue="contextValue"
                        :textSize="plotTextSize"
                        :palette="paletteCA"
                        :width="width"
                        :height="height"
          />


          <div v-if="showNewPlot" class="overlay" @click="plotOptions = true">
            <div class="plus-sign">+</div>
          </div>

        </div>
      </v-col>
    </v-row>

    <!--Modal-->
    <v-dialog v-model="plotOptions" max-width="1000px">
      <v-card>
        <v-card-title>Parameters & Plot Style</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" align="center">
              <div class="d-flex justify-space-around">
                <v-tooltip location="top" open-on-hover>
                  <template v-slot:activator="{ props }">
                    <v-autocomplete
                        v-model="selectedPlotType"
                        clearable
                        variant="outlined"
                        density="compact"
                        label="Plot Type"
                        :items="plotTypes"
                        class="variable-field"
                        v-bind="props"
                    ></v-autocomplete>
                  </template>
                  <span>Select the type of plot.</span>
                </v-tooltip>
              </div>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" align="center">
              <div class="d-flex justify-space-around">
                <!--Select X variable-->
                <v-tooltip location="top" open-on-hover>
                  <template v-slot:activator="{ props }">
                    <v-autocomplete
                        v-model="selectedXVariable"
                        clearable
                        variant="outlined"
                        density="compact"
                        label="X Variable"
                        :items="xItems"
                        :class="getAutoCompleteStyleX"
                        v-bind="props"
                    ></v-autocomplete>
                  </template>
                  <span>{{ selectedXVarType }} Variable </span>
                </v-tooltip>

                <!--Select Y variable-->
                <v-tooltip location="top" open-on-hover>
                  <template v-slot:activator="{ props }">
                    <v-autocomplete
                        v-if="showYVariable"
                        v-model="selectedYVariable"
                        clearable
                        variant="outlined"
                        density="compact"
                        label="Y Variable"
                        :items="yItems"
                        :class="getAutoCompleteStyleY"
                        v-bind="props"
                    ></v-autocomplete>
                  </template>
                  <span>{{ selectedYVarType }} Variable </span>
                </v-tooltip>

                <!--Select color variable-->
                <v-tooltip location="top" open-on-hover>
                  <template v-slot:activator="{ props }">
                    <v-autocomplete
                        v-if="showCVariable"
                        v-model="selectedCVariable"
                        clearable
                        variant="outlined"
                        density="compact"
                        label="Color Variable"
                        :items="cItems"
                        class="variable-field"
                        v-bind="props"
                    ></v-autocomplete>
                  </template>
                  <span>{{ selectedCVarType }} Variable </span>
                </v-tooltip>

                <!--Select type of barplot (stacked, grouped)-->
                <v-tooltip location="top" open-on-hover>
                  <template v-slot:activator="{ props }">
                    <v-select
                        v-if="barPlotType"
                        v-model="selectedBarPlotType"
                        variant="outlined"
                        density="compact"
                        label="Bar Chart Type"
                        :items="barPlotTypes"
                        class="variable-field"
                        v-bind="props"
                    ></v-select>
                  </template>
                  <span>Grouped or Stacked Bar Chart</span>
                </v-tooltip>

                <!--Flip axes-->
                <v-tooltip location="top" open-on-hover>
                  <template v-slot:activator="{ props }">
                    <v-select
                        v-if="barPlotOrientation"
                        v-model="selectedBarPlotOrientation"
                        variant="outlined"
                        density="compact"
                        label="Orientation of Bars"
                        :items="barPlotOrientations"
                        class="variable-field"
                        v-bind="props"
                    ></v-select>
                  </template>
                  <span>Bars In Vertical or Horizontal Direction</span>
                </v-tooltip>

                <!--Select if heatmap is annotated-->
                <v-tooltip location="top" open-on-hover>
                  <template v-slot:activator="{ props }">
                    <v-select
                        v-if="showHeatmapValue"
                        v-model="selectedHeatmapValues"
                        variant="outlined"
                        density="compact"
                        label="Annotate Heatmap"
                        :items="heatmapValues"
                        class="variable-field"
                        v-bind="props"
                    ></v-select>
                  </template>
                  <span>Add Count Values Inside Tiles</span>
                </v-tooltip>
              </div>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" align="center">
              <div class="d-flex justify-space-around">
                <p>Text Size</p>
                <v-slider v-model="plotTextSize" max="25" min="1" step="1" style="width: 50px;">
                  <template v-slot:append>
                    <v-text-field
                        v-model="plotTextSize"
                        density="compact"
                        style="width: 90px"
                        type="number"
                        variant="outlined"
                        hide-details
                        single-line
                    ></v-text-field>
                  </template>
                </v-slider>
              </div>
            </v-col>
          </v-row>

        </v-card-text>
        <v-card-actions>
          <v-btn @click="plotOptions = false">Close</v-btn>
        </v-card-actions>

      </v-card>
    </v-dialog>


  </v-card>

</template>

<script>

import {getCookie} from "@/components/authentication/auth.js";
import {BASE_URL} from "@/components/constants.js";
import OverviewBar from "@/components/plots/OverviewBar.vue";
import OverviewBox from "@/components/plots/OverviewBox.vue";
import OverviewLine from "@/components/plots/OverviewLine.vue";
import OverviewHeatmap from "@/components/plots/OverviewHeatmap.vue";
import OverviewPie from "@/components/plots/OverviewPie.vue";
import OverviewDensity from "@/components/plots/OverviewDensity.vue";
import Plotly from "plotly.js-dist";

export default {
  name: "PlotComponent",
  components: {
    OverviewBar,
    OverviewBox,
    OverviewLine,
    OverviewHeatmap,
    OverviewPie,
    OverviewDensity
  },
  emits: ['remove'],
  props: {
    id: {
      type: Number,
      required: true,
    },
    contextValue: {
      type: Number,
      required: false,
    },
    paletteCA: {
      type: String,
      required: false,
    },
    paletteCO: {
      type: String,
      required: false,
    },
    // Optional pre-seeded plot type + X variable, so a caller can drop in a fully
    // configured plot instead of the user manually going through the "+" dialog
    // (e.g. clicking a variable in VariableCatalogTable).
    initialPlotType: {
      type: String,
      default: null,
    },
    initialXVariable: {
      type: String,
      default: null,
    }
  },

  data() {
    return {
      chartData: {
        labels: [],
        datasets: [],
      },
      defaultChart: true,

      xItems: [],
      yItems: [],
      cItems: [],

      selectedXVariable: this.initialXVariable,
      selectedYVariable: null,
      selectedCVariable: null,
      selectedBarPlotType: "Grouped",
      selectedHeatmapValues: "No",
      selectedBarPlotOrientation: "Vertical",

      plotOptions: false,

      plotTypes: ["Bar", "Box", "Line", "Heatmap", "Pie", "Density"],

      selectedPlotType: this.initialPlotType,

      xVarTypes: {
        "Bar": "Categorical",
        "Box": "Categorical",
        "Line": "Categorical/Continuous",
        "Heatmap": "Categorical",
        "Pie": "Categorical",
        "Density": "Continuous"
      },
      yVarTypes: {
        "Bar": "",
        "Box": "Continuous",
        "Line": "Continuous",
        "Heatmap": "Categorical",
        "Pie": "",
        "Density": ""
      },
      cVarTypes: {
        "Bar": "Categorical",
        "Box": "Categorical",
        "Line": "Categorical",
        "Heatmap": "",
        "Pie": "",
        "Density": "Categorical"
      },

      barPlotTypes: ["Grouped", "Stacked"],
      heatmapValues: ["Yes", "No"],
      barPlotOrientations: ["Vertical", "Horizontal"],

      plotTextSize: 12,

      width: 0,
      height: 0,
      resizeObserver: null,
    };
  },

  mounted() {
    this.$nextTick(() => {
      this.observeCardSize();
    });
  },

  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  },

  created: async function () {
    console.log("Load variables...")
    await this.getAllVariables();
    this.loadVariablesToAutoComplete()

  },

  watch: {
    selectedPlotType(newType, oldType) {
      console.log("oldType: ", oldType);
      console.log("newType: ", newType);
      if (this.isHeatmap(newType) && this.isBoxOrLine(oldType) || this.isBoxOrLine(newType) && this.isHeatmap(oldType)) {
        console.log(`Plot type changed from ${oldType} to ${newType}`);
        this.selectedYVariable = null;
      }
      if (this.isDensity(newType) && !this.isDensity(oldType) || !this.isDensity(newType) && this.isDensity(oldType)) {
        console.log(`Plot type changed from ${oldType} to ${newType}`);
        this.selectedXVariable = null;
      }
      if (newType) {
        this.loadVariablesToAutoComplete();
      }

    },

    // the variable catalog is scoped to the active context - refetch it whenever the
    // context changes (including the very first time one gets picked), and drop back to
    // the empty "+" placeholder if whatever's currently plotted isn't in the new context,
    // rather than silently keep showing an out-of-context variable.
    async contextValue() {
      await this.getAllVariables();
      this.loadVariablesToAutoComplete();

      const validX = new Set(this.xItems);
      const validY = new Set(this.yItems);
      const validC = new Set(this.cItems);
      const xStillValid = !this.selectedXVariable || validX.has(this.selectedXVariable);
      const yStillValid = !this.selectedYVariable || validY.has(this.selectedYVariable);
      const cStillValid = !this.selectedCVariable || validC.has(this.selectedCVariable);

      if (!xStillValid || !yStillValid || !cStillValid) {
        this.selectedPlotType = null;
        this.selectedXVariable = null;
        this.selectedYVariable = null;
        this.selectedCVariable = null;
      }
    },
  },

  computed: {

    // Functions to show/hide the different plot types and variables

    showYVariable() {
      return this.selectedPlotType == "Box" || this.selectedPlotType == "Line" || this.selectedPlotType == "Heatmap";
    },

    showCVariable() {
      return this.selectedPlotType !== "Heatmap" && this.selectedPlotType !== "Pie";
    },

    barPlotType() {
      return (this.selectedPlotType === "Bar") && this.selectedCVariable !== "" && this.selectedCVariable !== null;
    },

    barPlotOrientation() {
      return this.selectedPlotType === "Bar";
    },

    showHeatmapValue() {
      return this.selectedPlotType === "Heatmap";
    },

    selectedXVarType() {
      return this.xVarTypes[this.selectedPlotType];
    },

    selectedYVarType() {
      return this.yVarTypes[this.selectedPlotType] || "Please first select a plot type !";
    },

    selectedCVarType() {
      return this.cVarTypes[this.selectedPlotType] || "Please first select a plot type !";
    },

    showBar() {
      return this.selectedPlotType === "Bar" && this.selectedXVariable !== "" && this.selectedXVariable !== null;
    },

    showBox() {
      return this.selectedPlotType === "Box" && this.selectedXVariable !== "" && this.selectedXVariable !== null && this.selectedYVariable !== "" && this.selectedYVariable !== null;
    },

    showLine() {
      return this.selectedPlotType === "Line" && this.selectedXVariable !== "" && this.selectedXVariable !== null && this.selectedYVariable !== "" && this.selectedYVariable !== null;
    },

    showHeatmap() {
      return this.selectedPlotType === "Heatmap" && this.selectedXVariable !== "" && this.selectedXVariable !== null && this.selectedYVariable !== "" && this.selectedYVariable !== null;
    },

    showPie() {
      return this.selectedPlotType === "Pie" && this.selectedXVariable !== "" && this.selectedXVariable !== null;
    },

    showDensity() {
      return this.selectedPlotType === "Density" && this.selectedXVariable !== "" && this.selectedXVariable !== null;
    },

    showNewPlot() {
      return this.selectedPlotType === "" || this.selectedPlotType === null;
    },

    getAutoCompleteStyleX() {
      if (["Bar", "Density", "Box", "Line", "Heatmap", "Pie"].includes(this.selectedPlotType)) {
        return "default-variable-field";
      } else {
        return "variable-field";
      }
    },

    getAutoCompleteStyleY() {
       if (["Box", "Line", "Heatmap"].includes(this.selectedPlotType)) {
        return "default-variable-field";
      } else {
        return "variable-field";
      }
    }

  },

  methods: {
    observeCardSize() {
      this.$nextTick(() => {
        const container = this.$refs.plotDiv; // Get the v-card element
        console.log("Query container: ", container);
        if (container) {
          this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
              this.width = entry.contentRect.width; // Get width
              this.height = entry.contentRect.height; // Get 80% of height for the chart
              console.log("Height: ", this.height);
              console.log("Width: ", this.width);
            }
          });
          this.resizeObserver.observe(container); // ✅ Get raw HTML element
        }
      });
    },

    async getAllVariables() {
      const csrfToken = getCookie('csrftoken');
      const contextValue = this.contextValue;
      let url = `${BASE_URL}/general/api/variables/`;

      if (contextValue) {
        url += `?contextValue=${encodeURIComponent(contextValue)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        credentials: 'include',
      });

      const data = await response.json();

      this.allVariables = data;

      console.log("Fetched all variables");
      console.log("All variables: ", this.allVariables);
      return data;
    },

    loadVariablesToAutoComplete() {
      try {
        // check which plotType selected, then take extract xVarType, yVarType, and cVarType
        const xVarType = this.xVarTypes[this.selectedPlotType];
        const yVarType = this.yVarTypes[this.selectedPlotType];
        const cVarType = this.cVarTypes[this.selectedPlotType];

        //console.log("xVarType: ", xVarType);
        //console.log("yVarType: ", yVarType);
        //console.log("cVarType: ", cVarType);

        // Load x variables
        if (xVarType === "Continuous") {
          this.xItems = this.allVariables.continuous;
        } else if (xVarType === "Categorical") {
          this.xItems = this.allVariables.nonbinaryCategorical.concat(this.allVariables.binaryCategorical);
        } else if (xVarType === "Categorical/Continuous") {
          this.xItems = this.allVariables.nonbinaryCategorical.concat(this.allVariables.binaryCategorical).concat(this.allVariables.continuous);
        }

        // Load y variables
        if (yVarType === "Continuous") {
          this.yItems = this.allVariables.continuous;
        } else if (yVarType === "Categorical") {
          this.yItems = this.allVariables.nonbinaryCategorical.concat(this.allVariables.binaryCategorical);
        }

        // Load c variables
        if (cVarType === "Continuous") {
          this.cItems = this.allVariables.continuous;
        } else if (cVarType === "Categorical") {
          this.cItems = this.allVariables.nonbinaryCategorical.concat(this.allVariables.binaryCategorical);
        }

        console.log("X Items: ", this.xItems);
        console.log("Y Items: ", this.yItems);
        console.log("C Items: ", this.cItems);

      } catch (error) {
        console.log("Error in loadVariablesToAutoComplete: ", error);
      }
    },

    // Clears this cell back to its empty "+" placeholder and lets the parent grid know, so
    // it can shift/shrink around the gap (see data-overview.vue's removePlot).
    removePlot() {
      this.selectedPlotType = null;
      this.selectedXVariable = null;
      this.selectedYVariable = null;
      this.selectedCVariable = null;
      this.$emit('remove');
    },

    // Helper functions to prevent that a variable of the wrong type stays being selected
    isHeatmap(type) {
      return type === "Heatmap";
    },

    isBoxOrLine(type) {
      return type === "Box" || type === "Line";
    },

    isDensity(type) {
      return type === "Density";
    },

    getActivePlotlyInstance() {
      let plotRef = null;
      if (this.showBar) {
        plotRef = this.$refs.overviewBar;
      } else if (this.showBox) {
        plotRef = this.$refs.overviewBox;
      } else if (this.showLine) {
        plotRef = this.$refs.overviewLine;
      } else if (this.showHeatmap) {
        plotRef = this.$refs.overviewHeatmap;
      } else if (this.showPie) {
        plotRef = this.$refs.overviewPie;
      } else if(this.showDensity){
        plotRef = this.$refs.overviewDensity;
      }

      console.log("Plot Ref:", plotRef);

      if (plotRef && typeof plotRef.getPlotlyInstance === "function") {
        return plotRef.getPlotlyInstance();
      } else {
        console.warn("Plotly instance not available")
        return null;
      }
    }
  }
};
</script>

<style>
.variable-field {
  max-width: 250px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.default-variable-field {
  max-width: 250px;
  color: rgb(var(--v-theme-primary-darken-1));
}

.plot-settings-btn {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-white-surface)) !important;
  margin-left: 5px;
  margin-top: 5px;
  margin-bottom: -5px;

}

.plot-remove-btn {
  background-color: rgb(var(--v-theme-error)) !important;
  color: rgb(var(--v-theme-white-surface)) !important;
  margin-left: 5px;
  margin-top: 10px;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgb(var(--v-theme-primary-darken-1), 0.8) !important;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10; /* Ensure it appears above content */
}

.plus-sign {
  font-size: 100px;
  font-weight: bold;
  color: rgb(var(--v-theme-white-surface));
}

</style>