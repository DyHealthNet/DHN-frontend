<template>
  <v-container class="overview-page page-container py-10">
    <v-row>
      <v-col cols="12">
            <div class="hero">
              <div>
                <p class="eyebrow">Overview</p>
                <h1 class="title">Data Overview</h1>
                <p class="subtitle">
                  Get a comprehensive understanding of the data variables through diverse visualizations.
                </p>
              </div>
            </div>
          </v-col>
        </v-row>

        <div class="filter-toolbar-slot">
          <FilterToolbar @change-context="updateData"></FilterToolbar>
        </div>

        <!--Variable Counts-->
        <v-card outlined>
          <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title>
              Variable Summary
              <v-tooltip bottom>
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props">mdi-information</v-icon>
                </template>
                <span>
                  Here is an overview of the cohort data.
                </span>
              </v-tooltip>
            </v-toolbar-title>
          </v-toolbar>
          <v-spacer></v-spacer>

          <!--Overview cards in tabs-->
          <v-tabs-window v-model="model">
            <v-card>
              <v-card-text>
                <!-- Cards filling the entire row, equally spaced -->
                <v-row class="fill-height" justify="space-around" align="stretch" id="coolrow">
                  <v-col
                      :cols="12 / rows1.length"
                      v-for="(item, index) in rows1"
                      :key="index"
                      class=""
                  >
                    <v-card class="mx-0 d-flex flex-row align-center" outlined elevation="0">
                      <v-img
                          :src="getImageForCard(item.name)"
                          :alt="item.name"
                          max-width="70"
                          width="50"
                          max-height="70"
                          height="50"
                          class="mx-3 bg-layer"
                      ></v-img>
                      <div class="text-left mr-3 my-2 d-flex flex-column justify-center">
                        <div class="small-title">{{ item.name }}</div>
                        <div class="number-data">{{ item.column1 }}</div>
                      </div>
                    </v-card>
                    <v-divider thickness="2"></v-divider>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-tabs-window>
        </v-card>
        <v-spacer class="my-10"></v-spacer>
        <!--Tab bar-->
        <v-card outlined>
          <!--Tab bar name-->
          <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title>
              <div class="d-flex align-center">
                <span>Data Overview</span>
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <v-icon class="ml-2" v-bind="props">mdi-information</v-icon>
                  </template>
                  <span>
                    You can select and visualize variables for your own
                      requirements
                  </span>
                </v-tooltip>
                <v-spacer></v-spacer>


                <v-tooltip location="left">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" @click="getActivePlotlyInstances" icon="mdi-download"></v-btn>

                  </template>
                  <span>Download Panel</span>
                </v-tooltip>

                <v-tooltip location="left">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-cog-outline" @click="showOptions = true"></v-btn>

                  </template>
                  <span>Panel Settings</span>
                </v-tooltip>
              </div>
            </v-toolbar-title>
          </v-toolbar>

          <!-- options dialog -->
          <v-dialog v-model="showOptions" max-width="1000px">
            <v-card>
              <v-card-title>Panel & Color Options</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="6">

                    <p>Number of Rows</p>
                    <v-slider v-model="plotRows" max="10" min="1" step="1" @update:modelValue="updatePlotColsHeights">
                      <template v-slot:append>
                        <v-text-field
                            v-model="plotRows"
                            density="compact"
                            style="width: 90px"
                            type="number"
                            variant="outlined"
                            hide-details
                            single-line
                        ></v-text-field>
                      </template>
                    </v-slider>

                    <template v-for="row in plotRows">
                      <v-row class="align-center">
                        <!-- Number of Columns Slider -->
                        <v-col cols="6">
                          <p>Number of Columns for Row {{ row }}</p>
                          <v-slider v-model="plotCols[row - 1]" max="4" min="1" step="1">
                            <template v-slot:append>
                              <v-text-field
                                  v-model="plotCols[row - 1]"
                                  density="compact"
                                  style="width: 90px"
                                  type="number"
                                  variant="outlined"
                                  hide-details
                                  single-line
                              ></v-text-field>
                            </template>
                          </v-slider>
                        </v-col>

                        <!-- Panel Height Slider -->
                        <v-col cols="6">
                          <p>Panel Height for Row {{ row }}</p>
                          <v-slider v-model="plotHeights[row - 1]" max="1500" min="200" step="50">
                            <template v-slot:append>
                              <v-text-field
                                  v-model="plotHeights[row - 1]"
                                  density="compact"
                                  style="width: 90px"
                                  type="number"
                                  variant="outlined"
                                  hide-details
                                  single-line
                              ></v-text-field>
                            </template>
                          </v-slider>
                        </v-col>
                      </v-row>

                    </template>
                  </v-col>
                  <v-col cols="3">
                    <p>Color Palette Categorical</p>
                    <ColorPalette :colors="colorPalettes.muted"
                                  palette-id="muted"
                                  class="mx-3 my-3"
                                  @palette-selected="(paletteId) => {this.userSelectedPaletteCa = paletteId}"
                                  :current-palette="userSelectedPaletteCa"
                    ></ColorPalette>
                    <ColorPalette :colors="colorPalettes.husl"
                                  palette-id="husl"
                                  class="mx-3"
                                  @palette-selected="(paletteId) => {this.userSelectedPaletteCa = paletteId}"
                                  :current-palette="userSelectedPaletteCa"
                    ></ColorPalette>
                  </v-col>
                  <v-col>
                    <p>Color Palette Continuous</p>
                    <ColorPalette palette-id="Viridis"
                                  :colors="colorPalettes.Viridis"
                                  class="mx-3 my-3"
                                  @palette-selected="(paletteId) => {this.userSelectedPaletteCo = paletteId}"
                                  :current-palette="userSelectedPaletteCo"
                    ></ColorPalette>
                    <ColorPalette :colors="colorPalettes.Rocket"
                                  palette-id="Rocket"
                                  class="mx-3"
                                  @palette-selected="(paletteId) => {this.userSelectedPaletteCo = paletteId}"
                                  :current-palette="userSelectedPaletteCo"
                    ></ColorPalette>
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-actions>
                <v-btn @click="showOptions = false">Close</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-tabs-window v-model="model" :style="{margin:'15px'}">
            <!-- Cards filling the entire row, equally spaced -->
            <v-row class="fill-height" justify="space-around" align="stretch" id="coolrow" v-for="row in plotRows">
              <v-col
                  :cols="12 / plotCols[row-1]"
                  v-for="col in plotCols[row-1]"
                  class="plot-col"
                  :style="{ height: plotHeights[row - 1] + 'px' }"
              >
                <PlotComponent
                    ref="plotComponents"
                    :id="'plot-' + row + '-' + col"
                    :contextValue="contextValue"
                    :paletteCA="userSelectedPaletteCa"
                    :paletteCO="userSelectedPaletteCo"
                >
                </PlotComponent>
                <v-divider thickness="2"></v-divider>
              </v-col>
            </v-row>
          </v-tabs-window>

          <div class="text-center ma-2">
            <v-snackbar
                v-model="showDownloadMessage"
                :color="messageType"
            >
              <v-icon class="my-0 mr-2">
                mdi-information-outline
              </v-icon>
              {{ messageInfo }}
              <template v-slot:actions>
                <v-btn
                    variant="text"
                    @click="showDownloadMessage = false"
                >
                  Close
                </v-btn>
              </template>
            </v-snackbar>
          </div>

        </v-card>
  </v-container>
</template>

<script>
import {BASE_URL} from "../components/constants.js";
import PlotComponent from "@/components/plots/PlotComponent.vue";


import FilterToolbar from "@/components/FilterToolbar.vue";
import {getCookie} from "@/components/authentication/auth.js";
import ColorPalette from "@/components/plots/ColorPalette.vue";
import {isLoading} from "../components/constants.js";
import {reactive} from "vue";


export default {
  name: "DataOverview",
  components: {
    FilterToolbar,
    PlotComponent,
    ColorPalette
  },
  data() {
    return {
      model: "tab-2",

      plotCols: reactive([1]),
      plotHeights: reactive([600]),
      plotRows: 1,

      //table data initialization
      columns: [],
      rows1: [],
      isExpanded: false,

      // context value
      contextValue: null,

      // options
      showLoading: isLoading,
      showOptions: false,

      colorPalettes: {
        'muted': ['#4878d0', '#ee854a', '#6acc64', '#d65f5f', '#956cb4'],
        'husl': ['#f67088', '#ad9c31', '#33b07a', '#38a8c5', '#cc79f4'],
        'Viridis': ['#443982', '#30678d', '#20908c', '#35b778', '#90d643'],
        'Rocket': ['#3e1a43', '#831e5a', '#cb1a4f', '#f05f43', '#f5aa83'],
      },
      userSelectedPaletteCa: 'muted',
      userSelectedPaletteCo: 'Viridis',

      showDownloadMessage: false,
      messageInfo: null,
      messageType: "",

      plotComponents: [],

    };
  },

  // Create the data
  created: async function () {
    // Wait for both methods to complete
    await this.getTableDataFromApi();
  },


  // +++++++++++ Methods ++++++++++++++
  methods: {

    updatePlotColsHeights() {
      for (let row = 0; row < this.plotRows; row++) {
        if (!this.plotCols[row]) {
          this.plotCols[row] = 1;
        }
        if (!this.plotHeights[row]) {
          this.plotHeights[row] = 500;
        }
      }
    },

    async getTableDataFromApi() {
      try {
        const csrfToken = getCookie('csrftoken');
        const contextValue = this.contextValue;
        let url = `${BASE_URL}/plotting/api/table/`;

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

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();

        const rows = Object.entries(data)
            .filter(([key]) => key !== 'preservePrivacy')
            .map(([key, value]) => {
              return {name: key, column1: value};
            });

        if (rows.length === 0) {
          console.error("No data found in the response");
          return null;
        }

        this.columns = {
          columns: [
            {align: "start", key: "name", sortable: false, title: ""},
            {key: "column1"},
          ],
        }
        this.rows1 = rows;

        // return simulated data
        return data;
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        throw error;
      }
    },

    getImageForCard(name) {
      const images = [
        {
          name: "Participants",
          imagePath: new URL("../assets/figures/participants.png", import.meta.url).href,
        },
        {
          name: "Phenotypes",
          imagePath: new URL("../assets/figures/phenotypes.png", import.meta.url).href,
        },
        {
          name: "Proteins",
          imagePath: new URL("../assets/figures/proteins.png", import.meta.url).href,
        },
        {
          name: "Metabolites",
          imagePath: new URL("../assets/figures/metabolites.png", import.meta.url).href,
        },
        {
          name: "Genetic Variants",
          imagePath: new URL("../assets/figures/genetic_variants.png", import.meta.url).href,
        },
      ];
      for (let i = 0; i < images.length; i++) {
        if (name === images[i].name) {
          return images[i].imagePath;
        }
      }
      return new URL("../assets/figures/About_Us.png", import.meta.url).href;
    },

    async updateData(val) {
      this.contextValue = val ? val.value : null;
      await this.getTableDataFromApi();
    },

    async getActivePlotlyInstances() {
      // get all plot components
      const plotComponents = this.$refs.plotComponents;

      let plotlyInstances = [];

      // First pass: Collect all valid plotly instances
      for (const [index, plotComponent] of plotComponents.entries()) {
        if (typeof plotComponent.getActivePlotlyInstance === "function") {
          const plotlyInstance = plotComponent.getActivePlotlyInstance();
          if (plotlyInstance) {
            // Retrieve the ID of the PlotComponent
            let plotId = plotComponent.id || plotComponent.$props.id;  // ✅ Correct way to get the ID
            console.log("PlotID: ", plotId);
            // Extract row and col from the ID
            let [_, row, col] = plotId.split("-"); // ["plot", "1", "2"]
            row = parseInt(row, 10)-1; // Convert to 0-based index
            col = parseInt(col, 10)-1; // Convert to 0-based index

            plotlyInstances.push({id: plotId, row: row, col: col, plotlyInstance: plotlyInstance});
          }
        }
      }

      // If no valid instances are found, exit early
      if (plotlyInstances.length === 0) {
        // TODO: change this so that the plot is disabled!
        this.showDownloadMessage = true;
        this.messageInfo = "No plot currently displayed and hence download not available.";
        this.messageType = "warning";
        return;
      }

      // Sort plots by row and column
      plotlyInstances.sort((a, b) => {
        // First, sort by row (ascending)
        if (a.row !== b.row) {
          return a.row - b.row;
        }
        // If rows are the same, sort by column (ascending)
        return a.col - b.col;
      });

      let widths = {};
      let heights = [];

      // Calculate widths of rows
      plotlyInstances.forEach(({id, row, col, plotlyInstance}) => {
        let plot_width = plotlyInstance._fullLayout.width;
        let plot_height = plotlyInstance._fullLayout.height;
        heights[row] = plot_height;
        widths[row] = [...(widths[row] || []), plot_width];
      });

      // Step 1: Compute the total width for each row (sum of all column widths in that row)
      let rowTotalWidths = {};  // Stores total width per row
      Object.keys(widths).forEach(row => {
        rowTotalWidths[row] = widths[row].reduce((sum, width) => sum + width, 0);  // Sum widths in row
      });

      // Step 2: Find the max row width (widest row)
      let totalWidth = Math.max(...Object.values(rowTotalWidths));

      // Step 3: Compute total height (sum of all row heights)
      let totalHeight = Object.values(heights).reduce((sum, height) => sum + height, 0);

      // Step 4: Find spacing between plots
      let rowSpacing = {};
      Object.keys(rowTotalWidths).forEach(row => {
        let rowWidth = rowTotalWidths[row];  // Total width of this row
        let numCols = widths[row].length;    // Number of plots (columns) in this row
        let spaceLeft = totalWidth - rowWidth;  // Remaining space for this row
        if (spaceLeft === 0) {
          rowSpacing[row] = 0;
        } else {
          rowSpacing[row] = spaceLeft / numCols;  // Distribute space evenly across columns
        }
      });

      console.log("totalWidth: ", totalWidth);
      console.log("totalHeight: ", totalHeight);

      console.log("RowSpacing: ", rowSpacing);

      console.log("Widths:", widths);
      console.log("Heights:", heights);


      // Loop through all plots and get the first active one
      let images = [];

      for (const {id, row, col, plotlyInstance} of plotlyInstances) {


        const plot_width = plotlyInstance._fullLayout.width + rowSpacing[row];
        const plot_height = plotlyInstance._fullLayout.height;

        try {
          const imageData = await Plotly.toImage(plotlyInstance, {
            format: "svg",
            width: plot_width,
            height: plot_height
          });

          images.push({
            imageData,
            row,
            col,
            plot_width,
            plot_height
          });

        } catch (error) {
          console.error("Error generating image for plot:", error);
        }

      };

      // Check if plotlyInstances is empty
      if (images.length !== 0
      ) {
        this.combineSVGs(images, totalWidth, totalHeight, heights);
      } else
        console.warn("No active Plotly instances found.");
    },

    decodeSVG(imageData) {
      // Check if imageData is a Base64-encoded SVG
      if (imageData.startsWith("data:image/svg+xml,")) {
        const encodedSVG = imageData.replace("data:image/svg+xml,", "");
        return decodeURIComponent(encodedSVG);
      }
      return imageData; // If already raw SVG, return as is
    }
    ,

    combineSVGs(plots, totalWidth, totalHeight, heights) {

      // Create the main SVG container
      let combinedSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">`;

      let yOffset = 0; // Tracks vertical positioning
      let xOffset = 0; // Tracks horizontal positioning
      let previousRow = plots[0].row;
      plots.forEach(({imageData, row, col, plot_width, plot_height}) => {
        if (row !== previousRow) {
          yOffset += heights[previousRow];
          xOffset = 0;
          previousRow = row;
        }
        const rawSVG = this.decodeSVG(imageData);
        const cleanedSVG = rawSVG.replace(/<\?xml.*?>/, "").replace(/<!DOCTYPE.*?>/, "");

        // Add the SVG to the combined output
        combinedSVG += `<g transform="translate(${xOffset}, ${yOffset})">${cleanedSVG}</g>`;

        xOffset += plot_width //+ rowSpacing[row];
      });

      combinedSVG += "</svg>";

      // Convert to downloadable file
      const blob = new Blob([combinedSVG], {type: "image/svg+xml"});
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "combined_plots.svg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    ,

  }
}


</script>

<style scoped>

.overview-page {
  min-height: calc(100vh - 220px);
}

.hero {
  padding: 2rem;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.12), rgba(17, 24, 39, 0.04));
  border: 1px solid rgba(25, 118, 210, 0.16);
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary-darken-1));
}

.title {
  margin: 0;
  font-size: 2.5rem;
  line-height: 1.05;
}

.subtitle {
  margin-top: 0.9rem;
  max-width: 720px;
  font-size: 1.02rem;
  opacity: 0.82;
}

@media (max-width: 2500px) {
  .responsive-card {
    width: 100%;
  }
}

.small-title {
  color: rgb(var(--v-theme-darken-1));
  font-size: 20px;
}

.number-data {
  font-weight: bolder;
  font-size: 16px;
}

.overview-description {
  cursor: pointer; /* Indicates that the element is clickable */
  background-color: rgb(var(--v-theme-surface));
  border-left: 5px solid rgb(var(--v-theme-info)); /* Accent border to the left */
  padding: 15px 10px; /* Padding around the text */
  margin-bottom: 0px; /* Spacing below the description */
  border-radius: 4px; /* Rounded corners for a modern look */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
  font-family: "Arial", sans-serif; /* A clean, modern font */
  width: 1445px; /* Fixed width of 1200px */
}

.toggle-link {
  color: rgb(var(--v-theme-info));
  cursor: pointer; /* Indicates that the text is clickable */
  text-decoration: underline; /* Underline to indicate link */
  font-weight: bold; /* Make the link text bold */
  padding: 0 5px; /* Add some padding for better spacing */
}

.toggle-link:hover {
  color: #2980b9; /* Darker color on hover */
  text-decoration: none; /* Remove underline on hover for cleaner look */
}

.bg-layer {
  background-color: rgb(var(--v-theme-white-surface));
  border-radius: 50%;
  padding: 0;
}

.plot-col {
  height: 100%;
  max-width: 100%;
  width: auto;
}

</style>
