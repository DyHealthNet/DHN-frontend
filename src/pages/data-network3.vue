<template>
<v-container class="text-center">
    <v-row>
      <v-col cols="12">
        <h1 class="title mt-4">Network Exploration</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col class="d-flex justify-center">
        <v-divider class="my-2" thickness="2"></v-divider>
      </v-col>
    </v-row>
  </v-container>
  <v-container class="justify-center mt-4">
    <FilterToolbar @change-context="updateData"></FilterToolbar>
    <!-- Network Input -->
    <v-card outlined class="responsive-card">
      <v-card-title class="d-flex align-center">
        <v-icon color="primary-darken-1" size="30" class="mr-3 my-0">mdi-square-edit-outline</v-icon> <!-- mdi-abacus-->
        Network Input
        <v-spacer></v-spacer>
        <v-tooltip bottom>
          <template v-slot:activator="{ props }">
            <v-icon color="primary" v-bind="props" size="30" class="mr-3 my-0">mdi-information</v-icon>
          </template>
          <span>
            Find Nodes by their internal ID, display name or description and send them to the Network display.
          </span>
        </v-tooltip>
      </v-card-title>
      <v-card-subtitle>
        <b>Node Selection</b>
      </v-card-subtitle>
      <v-card-text>
        <v-row align="center">
          <v-col cols="10" class="d-flex align-center">
          <v-text-field
              v-model="searchText"
              outlined
              dense
              :clearable="!isReadOnly && (searchText && searchText.length > 0)"
              label="Select one or a list of nodes"
              @input="fetchNodeRecommendations"
              hide-details
              class="mb-0"
              @focus="showDropdown = true"
              ref="textField"
              :readonly="isReadOnly"
              @click:clear="handleClearNodeInput"
            ><template v-slot:append>
            <v-btn
              v-if="isReadOnly"
              icon
              @click="editText"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </template></v-text-field>
            </v-col>
          <v-col cols="2" class="d-flex align-center">
          <v-btn
          color="primary-darken-1"
          block
          class="mt-0 mb-0"
          @click="sendToNetwork"
          :disabled="!selectedNodes.length"
        >Send to Network</v-btn>
        </v-col>
      </v-row>
        <!-- Dropdown List -->
          <v-row v-if="limitedDropdownNodes.length && !isReadOnly">
            <v-col cols="12">
              <v-card class="dropdown"
                v-if="showDropdown && limitedDropdownNodes.length"
                ref="dropdownMenu">
                <v-list>
                  <v-list-item
                        v-for="(item, index) in limitedDropdownNodes"
                        :key="index"
                        @click="addPerDropDown(item)"
                        @mouseover="hoverNode($event, item)"
                        @mouseleave="hoverNodeLeave"
                        class="d-flex align-center text-truncate"
                      >
                      <!-- Icon Section -->
                      <v-icon
                        class="me-3"
                        size="32"
                        color="transparent"
                      >
                      <v-img
                      :src="getIcon(item.source_table)"
                      alt="icon"
                      max-width="32"
                      max-height="32"
                      class="me-0 rounded-circle"
                      ></v-img>
                        </v-icon>
                      <!-- Text Section -->
                    <span class="text-subtitle-1">
                      {{`${item.display_name} (${item.id})` }}
                      </span>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>
      </v-card-text>
      <!-- Tooltip for Hovered Item (outside dropdown) -->
      <teleport to="body">
        <div v-if="hoveredItem" class="tooltip" :style="tooltipStyle">
          <strong>ID:</strong> {{ hoveredItem.id }}<br />
          <strong>Display Name:</strong> {{ hoveredItem.display_name }}<br />
          <strong>Node Type:</strong> {{ hoveredItem.source_table }}<br />
          <strong>Description:</strong> {{ hoveredItem.description }}
        </div>
      </teleport>
    </v-card>

    <!-- Network Visualization & Analysis -->
    <v-card outlined class="mt-4 responsive-card" expand>
      <v-card-title class="d-flex align-center">
        <v-icon color="primary-darken-1" size="30" class="mr-3 my-0">mdi-graph-outline</v-icon>
        Network Visualization & Analysis
        <v-spacer></v-spacer>
        <v-tooltip bottom>
          <template v-slot:activator="{ props }">
            <v-icon color="primary" v-bind="props" size="30" class="mr-3 my-0">mdi-information</v-icon>
          </template>
          <span>
            Here you can inspect, analyse and manipulate the Network..
          </span>
        </v-tooltip>
      </v-card-title>
      <v-row no-gutters>
        <v-col cols="4">
          <v-expansion-panels variant="accordion">
            <!-- Network Overview -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon color="primary-darken-1" size="20" class="ml-0 mr-3 my-0">mdi-information-outline</v-icon>
                Network Overview</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-card outlined class="network-overview">
                    <v-card-text>
                      <v-row justify="center" align="center" class="mt-2 mb-2">
                        <!-- Nodes -->
                        <v-col cols="6" class="text-center">
                          <v-label class="text-caption">NODES</v-label>
                          <v-sheet color="transparent" class="text-h4 font-weight-bold">
                            {{ networkNodes.length }}
                          </v-sheet>
                        </v-col>
                        <!-- Edges -->
                        <v-col cols="6" class="text-center">
                          <v-label class="text-caption">EDGES</v-label>
                          <v-sheet color="transparent" class="text-h4 font-weight-bold">
                            {{ networkEdges.length }}
                          </v-sheet>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Node Details -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon color="primary-darken-1" size="20" class="ml-0 mr-3 my-0">mdi-magnify</v-icon>
                Details</v-expansion-panel-title>
              <v-expansion-panel-text>
                 <v-divider class="my-4"></v-divider>
              <template v-if="displayedElementType === 'node'">
                <NodeDetails :getIcon="getIcon" :node="displayedElement" />
                <v-switch
                  v-model="isDetailsNodeSelected"
                  :label="isDetailsNodeSelected ? 'Selected' : 'Not Selected'"
                  @change="toggleNetworkNodeSelection"
                  color="primary"
                  class="ml-2"
                />
              </template>
              <template v-else-if="displayedElementType === 'edge'">
                <EdgeDetails :edge="displayedElement" />
              </template>
              <p v-else>No element selected. You can inspect a node or an edge by clicking on it.</p>
            </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Selection -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon color="primary-darken-1" size="20" class="ml-0 mr-3 my-0">mdi-filter</v-icon>
                Selection</v-expansion-panel-title>
              <v-expansion-panel-text>
                <span v-if="selectedNetworkNodes.length === 0">
                      No node selected. Double click on a node to add it to this panel or select it via the Details panel.
                </span>
                <v-table dense v-else="selectedNetworkNodes.length === 0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(node, index) in selectedNetworkNodes" :key="node.id">
                      <td>{{ node.description }}</td>
                      <td>{{ node.source_table }}</td>
                      <td>
                        <v-btn
                          size="small"
                          icon
                          color="error"
                          @click="removeSelectedNetworkNode(index)">
                          <v-icon size="20" color="background">mdi-trash-can-outline</v-icon>
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Connect Nodes -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon color="primary-darken-1" size="20" class="ml-0 mr-3 my-0">mdi-transit-connection-variant</v-icon>
                Connect Nodes</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-divider class="my-4"></v-divider>
              <!-- Individual Node Section -->
              <v-container class="pa-0">
                <v-row>
                  <v-col cols="12">
                    <p>
                      Individual Node
                    </p>
                  </v-col>
                  <v-col cols="12">
                    <v-btn
                      :disabled="selectedNetworkNodes.length !== 1"
                      color="primary-darken-1"
                      block
                      :class="{'grey lighten-2': selectedNetworkNodes.length !== 1}"
                    >Significance Filtering</v-btn>
                  </v-col>
                  <v-col cols="12">
                    <v-btn
                      :disabled="selectedNetworkNodes.length !== 1"
                      color="primary-darken-1"
                      block
                      :class="{'grey lighten-2': selectedNetworkNodes.length !== 1}"
                      @click="indivualNetworkNodeCount"
                    >Node Count</v-btn>
                  </v-col>
                </v-row>
                <v-divider class="my-4"></v-divider>
                <!-- Set of Nodes Section -->
                <v-row>
                  <v-col cols="12">
                    <p>
                      Set of Nodes
                    </p>
                  </v-col>
                  <v-col cols="12">
                    <v-btn
                      class="mt-2"
                      :disabled="selectedNetworkNodes.length <= 1"
                      color="primary-darken-1"
                      block
                      :class="{'grey lighten-2': selectedNetworkNodes.length <= 1}"
                    >Significance Filtering</v-btn>
                    </v-col>
                  <v-col cols="12">
                    <v-btn
                      class="mt-2"
                      :disabled="selectedNetworkNodes.length <= 1"
                      color="primary-darken-1"
                      block
                      :class="{'grey lighten-2': selectedNetworkNodes.length <= 1}"
                    >Minimum Spanning Tree</v-btn>
                    </v-col>
                    </v-row>
                  </v-container>
                  </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Analysis -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon color="primary-darken-1" size="20" class="ml-0 mr-3 my-0">mdi-flask-outline</v-icon>
                Analysis</v-expansion-panel-title>
              <v-expansion-panel-text>
                 <v-divider class="my-4"></v-divider>
                <p>Network analysis options coming here...</p>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <!-- Put this in its own file -->
        <v-col cols="8" >
          <v-card outlined class="network-container">
          <!-- Card Header -->
          <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title>
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props">mdi-information</v-icon>
                  </template>
                  <span>
                    Here you can inspect the Network that is build based on your retrieved Nodes from the Database.
                  </span>
                </v-tooltip>
              </v-toolbar-title>
            <v-btn
              icon
              @click="console.log('saveNetworkImage')"
            >
              <v-icon class="m-3">mdi-camera</v-icon> <!-- mdi-abacus-->
            </v-btn>
            <v-btn
              icon
              @click="console.log('saveNetworkFile')"
            >
              <v-icon class="m-3">mdi-download</v-icon> <!-- mdi-abacus-->
            </v-btn>
          </v-toolbar>

          <!-- Card Content -->
          <v-card-text>
            <!-- Legend -->
            <!-- Network Visualization -->
            <v-row>
              <v-col>
                <div ref="network" id="network" style="height: 400px;"></div>
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Card Actions
          <v-card-actions>
            <v-btn color="primary" @click="console.log('saveNetwork')" title="Save network to .json and download it">
              Save Network
            </v-btn>
          </v-card-actions>-->
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <!-- Advanced Settings -->
    <v-card outlined class="mt-4">
      <AdvancedSettings :selected-tests="selectedTests"
                        :disable-selections="disableSelections"
                        :show-mult-test="true"
                        :show-header="true"
                        :use-advanced-title="true"
                        expansion-panel-variant="default"
                        header-text="Network Statistics Configuration"
                        @data-changed="addTests"
                        />
    </v-card>
  </v-container>
</template>

<script>
import AdvancedSettings from "@/components/AdvancedSettings.vue";
import axios from "axios";
import FilterToolbar from "@/components/FilterToolbar.vue";
import {BASE_URL} from "@/components/constants.js";
import {groups} from "@/pages/networkData.js";
import NodeDetails from '@/components/network/NodeDetails.vue';
import EdgeDetails from '@/components/network/EdgeDetails.vue';
import {DataSet, Network} from "vis-network/standalone/esm/vis-network.js";
import {getCookie} from "@/components/authentication/auth.js";
import StatisticalTestLine from "@/components/network/StatisticalTestLine.vue";


export default {
  components: {
    StatisticalTestLine, FilterToolbar, AdvancedSettings, NodeDetails,
    EdgeDetails},
  data() {
    return {
      // context filter
      contextValue: null,
      disableSelections: null,

      // Network Input values
      searchText: "",
      selectedNodes: [],
      typeaheadresult: [],
      dropdownNodes: [],
      debounceTimeout: null,
      showDropdown: false,
      isReadOnly: false,  // Boolean flag to track read-only state

      hoveredItem: null,
      tooltipStyle: {},

      // Network Visualization & Settings
      networkNodes: [],//test_data["nodes"],
      networkEdges: [],//test_data["edges"],
      displayedNodes:  null,
      displayedEdges:  null,

      displayedElement: null,
      displayedElementType: null,   // 'node' or 'edge'
      isDetailsNodeSelected: false,

      selectedNetworkNodes: [],


      // Advanced Settings values
      selectedTests: this.content?.tests ?? {
        catCat: {label: 'Chi-squared test', value: 'chi2'}, catContM: {label: 'ANOVA', value: 'anova'},
        multTest: {label: 'Benjamini Hochberg (FDR)', value: 'bh'},
        catContB: {label: 'T-test', value: 't-test'}, contCont: {label: 'Pearson correlation', value: 'pearson'}
      },
    };
  },
  computed: {
    groups() {
      return groups
    },
    // Limit the number of displayed nodes to 5
    limitedDropdownNodes() {
      return this.dropdownNodes.slice(0, 5);
    },
  },
  methods: {
    // Network Input methods
    // This should return the last typed string that is following the display names of the selected nodes seperated by commas
    getLastTypedString() {
      console.log("getLastTypedString");
      console.log("searchText: ", this.searchText);
      if (!this.searchText) {
        return null; // If searchText is empty, return an empty string
      }
      // Split by commas, trim whitespace, and return the last part
      const parts = this.searchText.split(",").map((part) => part.trim());
      return parts[parts.length - 1];
  },
    async fetchNodeRecommendations() {
      console.log("fetchNodeRecommendations, this.selectedNodes: ",this.selectedNodes)
      const search = this.getLastTypedString();
      // Clear the previous timeout
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }

      // Set a new timeout
      this.debounceTimeout = setTimeout(async () => {
        if (search) {
          try {
            const response = await axios.get(
              BASE_URL +
                `/network/api/getTypeaheadResults/?s=${encodeURIComponent(
                  search
                )}`
            );
            console.log("response.data: ", response.data)
            this.typeaheadresult = Object.entries(response.data).map(([id, details]) => ({
              id,
              display_name: details.display_name,
              description: details.description,
              source_table: details.source_table,
              x_refs: details.x_refs,
            }));
          } catch (error) {
            console.error("Error fetching data:", error);
            this.typeaheadresult = [];
          }
        } else {
          this.typeaheadresult = [];
        }

        this.dropdownNodes = [];
        console.log("this.typeaheadresult: ", this.typeaheadresult)
        this.typeaheadresult.forEach((node) => {
          const nodeExistsInNetwork = this.selectedNodes.some(
            (networkNode) => networkNode.id === node.id
          );
          if (!nodeExistsInNetwork) {
            this.dropdownNodes.push(node);
          }
        });
      }, 300); // Delay in milliseconds, adjust as needed (e.g., 300ms)
    },
    addPerDropDown(item) {
      // Re-join the array into comma-separated searchText
      //this.searchText = searchTextParts.join(', ') + ', ';
      this.selectedNodes.push(item);
      const search = this.getLastTypedString();
      const nodeNames = this.selectedNodes
        .filter(node => node && node.display_name)
        .map(node => node.display_name);

      this.searchText = nodeNames.length > 0 ? nodeNames.join(", ") + ", " + search : search;
      this.fetchNodeRecommendations();
      // this.dropdownNodes = [];
      // this.hoverNodeLeave();
      console.log("this.searchText: ", this.searchText)
      console.log("this.selectedNodes: ", this.selectedNodes)

      // Focus the input field and move the cursor to the end
      this.$nextTick(() => {
        const input = this.$refs.textField.$el.querySelector('input');
        input.focus();
        input.setSelectionRange(this.searchText.length, this.searchText.length);
      });
    },
    hoverNode(event, item) {
      if (!this.hoveredItem) {
        this.hoveredItem = item;

        if (item) {
          // Get the bounding rect of the target item
          const nodeRect = event.target.getBoundingClientRect();

          // Calculate tooltip position based on the item’s bounding rect
          this.tooltipStyle = {
            backgroundColor: `rgb(var(--v-theme-primary-darken-1))`, // Dark background color
            color: `rgb(var(--v-theme-surface))`,  // White text color
            borderRadius: '5px',
            padding: '10px',

            position: 'absolute',
            top: `${nodeRect.bottom + 5}px`, // Adjust position slightly below the node
            left: `${nodeRect.left}px`,      // Align tooltip horizontally with the node
            zIndex: 1000,                   // Ensure it appears above other elements
          };
        }
      }
    },
    hoverNodeLeave() {
      // Hide the tooltip when the item is no longer hovered
      this.hoveredItem = null;
    },
    getIcon(sourceTable) {
      switch (sourceTable) {
        case 'cohort_protein':
          return new URL('../assets/figures/proteins.png', import.meta.url).href;
        case 'cohort_metabolite':
          return new URL('../assets/figures/metabolites.png', import.meta.url).href;
        case 'cohort_variants':
          return new URL('../assets/figures/genetic_variants.png', import.meta.url).href;
        default:
          return new URL('../assets/figures/phenotypes.png', import.meta.url).href;
      }
    },
    getPrettyType(sourceTable) {
      switch (sourceTable) {
        case 'cohort_protein':
          return 'Protein';
        case 'cohort_metabolite':
          return 'Metabolite';
        case 'cohort_variants':
          return 'Variant';
        case 'cohort_disorder':
          return 'Disorder';
        case 'cohort_phenotype':
          return 'Phenotype';
        default:
          return 'None';
      }
    },
    sendToNetwork() {
      // Send selectedNodes to networkNodes and reset selectedNodes
      this.networkNodes= [];
      this.networkNodes.push(...this.selectedNodes);
      // make searchText pretty
      const nodeNames = this.selectedNodes
        .filter(node => node && node.display_name)
        .map(node => node.display_name);
      this.searchText = nodeNames.length > 0 ? nodeNames.join(", ") : "";
      this.showDropdown = false; // Hide dropdown
      this.isReadOnly = true;
      //this.selectedNodes = []; // Clear the selection
      console.log("Updated networkNodes:", this.networkNodes);

      this.initializeNetwork();
    },
    handleClickOutside(event) {
      if (this.isReadOnly){
        this.showDropdown = false;
        return;
      }
      const dropdown = this.$refs.dropdownMenu?.$el; // Accessing the actual DOM element
      const textField = this.$refs.textField?.$el; // Accessing the actual DOM element

      // Check if dropdown and textField are not undefined and if the clicked element is NOT inside either
      if (
        dropdown && !dropdown.contains(event.target) &&
        textField && !textField.contains(event.target)
      ) {
        this.showDropdown = false;
        return;
      }
    },
    editText() {
      this.isReadOnly = false;
      //this.searchText = '';  // Optionally clear the input
      //this.selectedNodes = [];  // Optionally clear selected nodes
    },
    handleClearNodeInput(){
      this.searchText = "";
      this.selectedNodes = [];
    },

    //Network Visualization
    initializeNetwork() {
      const options = {};
      const container = this.$refs.network;
      if (!container) return;

      const DisplayNodesFromNetwork = this.networkNodes;

      this.displayedNodes = new DataSet(DisplayNodesFromNetwork);

      const data = { nodes: this.displayedNodes};

      this.network = new Network(container, data, options);

      this.network.on(
        "click",
        function (params) {
          if (params.nodes.length === 1) {
            const clickedNode = this.networkNodes.find(
              (currentNode) => currentNode.id === params.nodes[0]
            );
            this.displayNode(clickedNode);
          } else if (params.edges.length === 1) {
            const clickedEdge = this.networkEdges.find(
              (currentEdge) => currentEdge.id === params.edges[0]
            );
            this.displayEdge(clickedEdge);
          } else {
            this.displayedElement = null;
            this.displayedElementType = null;
          }
          //this.updateHighlighting();
        }.bind(this)
      );

      this.network.on(
        "doubleClick",
        function (params) {
          if (params.nodes.length === 1) {
            const clickedNode = this.networkNodes.find(
              (currentNode) => currentNode.id === params.nodes[0]
            );
            if (this.selectedNetworkNodes.includes(clickedNode)) {
              this.selectedNetworkNodes.splice(
                this.selectedNetworkNodes.indexOf(clickedNode),
                1
              );
            } else {
              this.selectedNetworkNodes.push(clickedNode);
            }
            this.displayNode(clickedNode);
          }
        }.bind(this)
      );
    },
    displayNode(node) {
      this.displayedElement = node;
      this.displayedElementType = "node";
      this.isDetailsNodeSelected = this.isNodeInNetworkSelected(node);
    },
    displayEdge(edge) {
      const nodeID0 = edge.to;
      const nodeID1 = edge.from;
      const node0 = this.networkNodes.find((node) => node.id === nodeID0);
      const node1 = this.networkNodes.find((node) => node.id === nodeID1);
      edge.node0_descr = node0.description;
      edge.node1_descr = node1.description;
      edge.node0_label = node0.display_name;
      edge.node1_label = node1.display_name;
      edge.node0_type = this.capitalizeFirstLetter(
        node0.source_table.split("_")[1]
      );
      edge.node1_type = this.capitalizeFirstLetter(
        node1.source_table.split("_")[1]
      );
      this.displayedElement = edge;
      this.displayedElementType = "edge";
    },
    isNodeInNetworkSelected(node) {
      return this.selectedNetworkNodes.includes(node);
    },
    toggleNetworkNodeSelection() {
      const index = this.selectedNetworkNodes.findIndex(n => n.id === this.displayedElement.id); // Check for the node by unique identifier (id)

      if (this.isDetailsNodeSelected && index === -1) {
        this.selectedNetworkNodes.push(this.displayedElement);
      } else if (!this.isDetailsNodeSelected && index !== -1) {
        this.selectedNetworkNodes.splice(index, 1);
      }
    },
    removeSelectedNetworkNode(index){
      this.selectedNetworkNodes.splice(index, 1);
    },
    indivualNetworkNodeCount() {
      if (this.displayedElementType === "node") {
        if (this.displayedElement.set === "CHRIS") {
          this.fetchNodesAndEdges(this.displayedElementType);
        }
      }
    },



    // Advanced Settings methods
    addTests(data) {
      this.selectedTests = data;
    },

    // Context methods
    async updateData(val) {
      console.log("updateData called, val: ",val)
      this.contextValue = val ? val.value : null;
      const context = await this.getContexts(this.contextValue);
      console.log("context: ", context)
      if (context) {
        this.selectedTests = context.content.tests
        this.disableSelections = true
      }
      else{
        this.disableSelections = false
      }
    },
    async getContexts(val) {
      try {
        const wantedFields = ['contextValue', 'content']
        let url = new URL(`${BASE_URL}/context/api/retrieveContexts/`);
        url.search = new URLSearchParams({fields: wantedFields});
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie("csrftoken")
          },
          credentials: 'include',
        });
        const data = await response.json();

        const context = data.result.filter(item => item.contextValue === val)[0];
        console.log(context);

        return context;  // Return the first matched item directly
      } catch (error) {
        console.error('Error:', error);
        return null;  // Return null in case of error
      }
    },
  },
  watch: {
    showDropdown(newVal) {
      // Add or remove the global click listener when dropdown visibility changes
      if (newVal) {
        document.addEventListener('click', this.handleClickOutside);
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    },
    },
    beforeUnmount() {
      // Clean up event listener when component is destroyed
      document.removeEventListener('click', this.handleClickOutside);
    },
};
</script>

<style scoped>
.mt-4 {
  margin-top: 16px;
}
@media (max-width: 1500px) {
  .responsive-card {
    width: 100%;
  }
}

</style>