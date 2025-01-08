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
              @keydown.arrow-down.prevent="moveFocus('down')"
              @keydown.arrow-up.prevent="moveFocus('up')"
              @keydown.enter.prevent="selectFocusedItem"
              @keydown.esc.prevent="closeDropdown"
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
                ref="dropdownMenu"
                tabindex="0">
                <v-list>
                  <v-list-item
                        v-for="(item, index) in limitedDropdownNodes"
                        :key="index"
                        @click="addPerDropDown(item)"
                        @mouseover="hoverNode(item)"
                        @mouseleave="hoverNodeLeave"
                        :class="{ 'text-primary': index === activeIndex }"
                        :color="index === activeIndex ? 'primary' : ''"
                        class="d-flex align-center text-truncate"
                      >
                      <!-- Icon Section -->
                      <v-icon
                        class="me-3"
                        size="32"
                        color="transparent"
                      >
                      <v-img
                      :src="getIcon(getPrettyType(item.source_table))"
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
                <EdgeDetails :getIcon="getIcon" :edge="displayedElement" :selectedTests="selectedTests"/>
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
                      <td>{{ this.getPrettyType(node.source_table) }}</td>
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
                    <!-- TODO Add a settings toggle to set the significance threshold and possibly the multiple testing
                    correction if changeable and if we don't want the user to only be able to set it
                    in Advanced Settings -->
                    <v-btn
                      :disabled="selectedNetworkNodes.length !== 1"
                      color="primary-darken-1"
                      block
                      :class="{'grey lighten-2': selectedNetworkNodes.length !== 1}"
                      @click="connectIndividualNode()"
                    >Significance Filtering</v-btn>
                  </v-col>
                  <!-- TODO Add a settings toggle to set the amount of Nodes to be retrieved per type like Manuel did-->
                  <v-col cols="12">
                    <v-btn
                      :disabled="selectedNetworkNodes.length !== 1"
                      color="primary-darken-1"
                      block
                      :class="{'grey lighten-2': selectedNetworkNodes.length !== 1}"
                      @click="connectIndividualNode(count=true)"
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
                    Here you can inspect the Network that is build based on your retrieved Nodes from the Database.<br>
                    With the buttons you can save an image of your network, the network itself or clear the network
                    to start over.
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
              @click="saveNetworkFile"
            >
              <v-icon class="m-3">mdi-download</v-icon> <!-- mdi-abacus-->
            </v-btn>
            <v-btn
              icon
              @click="clearNetwork"
            >
              <v-icon class="m-3">mdi-trash-can-outline</v-icon> <!-- mdi-abacus-->
            </v-btn>
          </v-toolbar>

          <!-- Card Content -->
          <v-card-text ref="wholeNetwork">
            <!-- Network Visualization -->
            <v-row>
                <v-col>
                  <div ref="network" id="network" style="height: 400px;"></div>
                  <!-- Legend -->
                  <div class="legend">
                    <v-row v-for="(group, groupKey) in groups" :key="groupKey" align="center" class="mb-2" no-gutters>
                      <v-col v-if="this.includedNodeTypes.has(groupKey)" cols="auto" class="legend-dot">
                        <div class="legend-color" :style="getShapeStyle(group.color, groupKey)"></div>
                      </v-col>
                      <v-col v-if="this.includedNodeTypes.has(groupKey)" cols="auto" class="legend-text">
                        <span>{{ capitalizeFirstLetter(groupKey) }}</span>
                      </v-col>
                    </v-row>
                  </div>
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
import { groups } from "../components/network/networkData.js";
import NodeDetails from '@/components/network/NodeDetails.vue';
import EdgeDetails from '@/components/network/EdgeDetails.vue';
import {DataSet, Network} from "vis-network/standalone/esm/vis-network.js";
import {getCookie} from "@/components/authentication/auth.js";
import StatisticalTestLine from "@/components/StatisticalTestLine.vue";
import { useTheme } from 'vuetify';
import html2canvas from "html2canvas"; // Only if using npm/yarn
import { nextTick } from 'vue';







export default {
  components: {
    StatisticalTestLine, FilterToolbar, AdvancedSettings, NodeDetails,
    EdgeDetails},
  data() {
    return {
      // context filter
      contextValue: null,
      disableSelections: { contCont: false, catCat: false, multTest: false , catContB: false, catContM: false},

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
      activeIndex: -1, // Tracks which item is focused

      // Network Visualization & Settings
      networkNodes: [],//test_data["nodes"],
      networkEdges: [],//test_data["edges"],
      vis_network_nodes: [],
      vis_network_edges: [],
      displayedNodes:  null,
      displayedEdges:  null,
      allInternalEdges: [],
      allExternalEdges: [],

      nodeStyle: groups,
      selectedBorderColor: '', //TODO don't set this in mounted, maybe make it reactive
      nodeRetrivalLimit: "4",

      displayedElement: null,
      displayedElementType: null,   // 'node' or 'edge'
      isDetailsNodeSelected: false,
      includedNodeTypes: new Set(), // stores type currently present in network for Legend

      selectedNetworkNodes: [],


      // Advanced Settings (default) values
      selectedTests: {
        catCat: {label: 'Chi-squared test', value: 'chi2'}, catContM: {label: 'ANOVA', value: 'anova'},
        multTest: {label: 'Benjamini Hochberg (FDR)', value: 'benjamini_hb'},
        catContB: {label: 'T-test', value: 'ttest'}, contCont: {label: 'Pearson correlation', value: 'pearson'}
      },
      signThresh: "0.999",
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
          this.hoveredItem = null;
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
    hoverNode(item) {
      if (!this.hoveredItem || this.hoveredItem !== item) {
        this.hoveredItem = item;

        if (item) {
          const dropdown = this.$refs.dropdownMenu?.$el; // Accessing the actual DOM element
          const dropdownRect = dropdown.getBoundingClientRect();
          const centerX = (window.innerWidth) / 2; // Center of the page

          // Calculate fixed position: right-center of the dropdown
          this.tooltipStyle = {
            backgroundColor: `rgb(var(--v-theme-primary-darken-1))`,
            color: `rgb(var(--v-theme-surface))`,
            borderRadius: '5px',
            padding: '10px',
            position: 'absolute',
            top: `${dropdownRect.top + dropdownRect.height / 2 + window.scrollY - 80}px`, // Vertically centered
            left: `${centerX}px`,  // Right of the dropdown
            zIndex: 1000,
          };
        }
      }
    },
    hoverNodeLeave() {
      // Hide the tooltip when the item is no longer hovered
      this.hoveredItem = null;
      this.activeIndex = -1;
    },
    getIcon(sourceTable) {
      switch (sourceTable) {
        case 'Protein':
          return new URL('../assets/figures/proteins.png', import.meta.url).href;
        case 'Metabolite':
          return new URL('../assets/figures/metabolites.png', import.meta.url).href;
        case 'Variants':
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
    capitalizeFirstLetter(str) {
      if (typeof str !== "string" || str.length === 0) return str;
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    handleClickOutside(event) {
      if (this.isReadOnly){
        this.closeDropdown()
        return;
      }
      const dropdown = this.$refs.dropdownMenu?.$el; // Accessing the actual DOM element
      const textField = this.$refs.textField?.$el; // Accessing the actual DOM element

      // Check if dropdown and textField are not undefined and if the clicked element is NOT inside either
      if (
        dropdown && !dropdown.contains(event.target) &&
        textField && !textField.contains(event.target)
      ) {
        this.closeDropdown()
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
    moveFocus(direction) {
      if (this.isReadOnly) return;
      const length = this.limitedDropdownNodes.length;
      if (direction === "down") {
        this.activeIndex = (this.activeIndex + 1) % length;
      } else if (direction === "up") {
        if (this.activeIndex === -1) {
          this.activeIndex = length - 1;  // Start from the last item if moving up from -1
        } else {
          this.activeIndex = (this.activeIndex - 1 + length) % length;
        }
      }
       if (this.activeIndex === -1) {
         return;
       }
      this.hoverNode(this.limitedDropdownNodes[this.activeIndex]);
    },
    selectFocusedItem() {
      if (this.activeIndex === -1) {
         return;
       }
      const selectedItem = this.limitedDropdownNodes[this.activeIndex];
      if (selectedItem) {
        this.addPerDropDown(selectedItem);
      }
    },
    closeDropdown() {
      this.showDropdown = false;
      this.hoveredItem = null;
      this.activeIndex = -1;
    },
    sendToNetwork() {
      // Send selectedNodes to networkNodes and reset selectedNodes
      this.networkNodes= [];
      this.networkNodes = this.selectedNodes.map((node) => ({
          ...node,
          set: "CHRIS", //TODO change to internal/cohort or smth when backend became more modular
        }));
      // make searchText pretty
      const nodeNames = this.selectedNodes
        .filter(node => node && node.display_name)
        .map(node => node.display_name);
      this.searchText = nodeNames.length > 0 ? nodeNames.join(", ") : "";
      this.isReadOnly = true;
      this.closeDropdown();
      //this.selectedNodes = []; // Clear the selection
      console.log("Updated networkNodes:", this.networkNodes);

      this.initializeNetwork();
      this.updateDesign();
    },

    //Network Visualization
    initializeNetwork() {
      console.log("initializeNetwork")
      console.log("networkEdges: ", this.networkEdges)
      const options = {physics: {enabled:true}};
      const container = this.$refs.network;
      if (!container) return;

      //TODO possibly discard displayedNodes and set to networkNodes and the same for the Edges?

      console.log("networkNodes: ",this.networkNodes)
      console.log("networkEdges: ",this.networkEdges)
      this.vis_network_nodes = new DataSet(this.networkNodes);
      this.vis_network_edges = new DataSet(this.networkEdges);
      console.log("network_nodes: ",this.vis_network_nodes)
      console.log("network_edges: ",this.vis_network_edges)

      const data = { nodes: this.vis_network_nodes, edges: this.vis_network_edges};

      this.network = new Network(container, data, options);

      this.includedNodeTypes = new Set(this.networkNodes.map((node) => node.source_table.split("_")[1]));

      // Click Event -> display node in Details Field
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
          this.updateDesign();
        }.bind(this)
      );
      // Double Click Event -> select Node, consequently shown in Selection field
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
          this.updateDesign();
        }.bind(this)
      );
    },
    displayNode(node) {
      node.type = this.getPrettyType(node.source_table);
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
      edge.node0_type = this.getPrettyType(node0.source_table);
      edge.node1_type = this.getPrettyType(node1.source_table);
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
        this.updateDesign();
      } else if (!this.isDetailsNodeSelected && index !== -1) {
        this.selectedNetworkNodes.splice(index, 1);
      }
    },
    removeSelectedNetworkNode(index){
      this.selectedNetworkNodes.splice(index, 1);
      this.updateDesign();
    },
    async connectIndividualNode(count=false) {
      // Use the first element of selectedNetworkNodes
      const firstNode = this.selectedNetworkNodes?.[0];

      if (firstNode) {

        if (firstNode.set === "CHRIS") { //TODO change to internal/cohort or smth when backend became more modular
          await this.fetchNodesAndEdges(firstNode, count); // Pass the first node to fetchNodesAndEdges
          this.filterForNetworkEdges();
          this.initializeNetwork();
          this.updateDesign();
        }
      } else {
        console.warn("No nodes in selectedNetworkNodes to process.");
      }
    },
    async connectNodeGroupNode() {
      console.log("connectNodeGroupNode");

      // Check if selectedNetworkNodes is not null/undefined and has at least one element
      const nodeGroup = this.selectedNetworkNodes && this.selectedNetworkNodes.length > 0 ? this.selectedNetworkNodes[0] : null;

      console.log("firstNode: ", nodeGroup);

      if (nodeGroup) {
        console.log("Using the first selectedNetworkNode: ", nodeGroup);

        if (nodeGroup.set === "CHRIS") { //TODO change to internal/cohort or something when the backend becomes more modular
          await this.fetchNodesAndEdges(nodeGroup); // Pass the first node to fetchNodesAndEdges
          this.filterForNetworkEdges();
          this.initializeNetwork();
          this.updateDesign();
        }
      } else {
        console.warn("No nodes in selectedNetworkNodes to process.");
      }
    },
    async fetchNodesAndEdges(node, count=false) {
      const nodeID = node.id;
      const type = node.source_table.split("_")[1];
      const limit = count ? this.nodeRetrivalLimit : "";
      const api_string =
        BASE_URL +
        "/network/api/getNetwork/?q=" +
        nodeID +
        "&t=" +
        type +
        "&l=" +
        limit +
        "&s=" +
        this.signThresh +
        "&o=" +
        JSON.stringify(this.selectedTests);
      try {
        // add nodes to the (hidden) network
        const response = await axios.get(api_string);

        const nodes = response.data.Nodes;
        // Get existingNodeIds beforehand as set for faster loop
        const existingNodeIds = new Set(this.networkNodes.map((locnode) => locnode.id));

        for (const key in nodes) {
          if (Array.isArray(nodes[key])) {
            nodes[key].forEach((node) => {
              if (!existingNodeIds.has(node.id)) {
                node.set = "CHRIS"; //TODO change to internal/cohort or smth when backend became more modular
                this.networkNodes.push(node);
                existingNodeIds.add(node.id); // Track new node
              }
            });
          }
        }

        // add edges to the network
        const internalEdges = response.data.Edges;
        console.log("These are the returned Edges: ", internalEdges)
        const externalEdges = response.data["External Edges"];

        // Get existing*EdgeIds beforehand as set for faster loop
        const existingInternalEdgeIds = new Set(this.allInternalEdges.map((edge) => edge.id));
        const existingExternalEdgeIds = new Set(this.allExternalEdges.map((edge) => edge.id));

        for (const key in internalEdges) {
          if (Array.isArray(internalEdges[key])) {
            internalEdges[key].forEach((edge) => {
              const renamedEdge = Object.entries(edge).reduce((acc, [k, v]) => {
                if (k.includes("_id")) {
                  if (!acc.from) {
                    acc.from = v;
                  } else {
                    acc.to = v;
                  }
                } else {
                  acc[k] = v;
                }
                return acc;
              }, {});
              if (!existingInternalEdgeIds.has(edge.id)) {
                this.allInternalEdges.push({
                  ...renamedEdge,
                  type: key,
                  set: "cohort (calculated)",
                  color: "black",
                  width: -Math.log10(renamedEdge.final_p_value) * 1.5,
                });
                existingInternalEdgeIds.add(edge.id);
              }
            });
          }
        }
        externalEdges.forEach((edge) => {
          if (!existingExternalEdgeIds.has(edge.id)) {
            this.allExternalEdges.push({
              ...edge,
              set: "external",
              to: edge.source_cohort_id,
              from: edge.target_cohort_id,
            });
            existingExternalEdgeIds.add(edge.id);
          }
        });
      } catch (error) {
        console.error("Error fetching edges:", error);
      }
    },
    filterForNetworkEdges() {
      console.log("filterForNetworkEdges")
      const networkNodeIds = new Set(this.networkNodes.map((node) => node.id));
      const uniqueEdges = new Set();

      console.log("this.allInternalEdges: ",this.allInternalEdges)
      console.log("this.networkNodeIds: ",this.networkNodeIds)

      const isValidEdge = (edge) =>
        networkNodeIds.has(edge.from) && networkNodeIds.has(edge.to);

      // Filter and process all edges in one step
      this.networkEdges = [
        ...this.allInternalEdges.filter(isValidEdge),
        ...this.allExternalEdges.filter(isValidEdge).map((edge) => ({
          ...edge,
          color: "grey",
          dashes: [10, 10],
          width: 6,
        })),
      ].filter((edge) => {
        // Use a consistent key format for undirected edges
        const key = edge.from < edge.to ? `${edge.from}-${edge.to}` : `${edge.to}-${edge.from}`;
        if (!uniqueEdges.has(key)) {
          uniqueEdges.add(key);
          return true;
        }
        return false;
      });
      console.log("In filterForNetworkEdges this.networkEdges: ",this.networkEdges)
    },
    //TODO split this into smaller functions that update only the needed Design changes?
    // Function to bulk update the highlighting
    updateDesign() {
      // Update nodes with conditional styling
      const updatedNodes = this.vis_network_nodes.get().map(node => {
        const isDisplayed = this.displayedElementType === 'node' && this.displayedElement.id === node.id;
        const isSelected = this.selectedNetworkNodes.some(n => n.id === node.id);

        let updatedNode = {
          ...node,
          color: groups[node.source_table.split('_')[1]].color,
          shape: 'dot', // 'dot' text below, 'circle' text inside
          size: 15,
          borderWidth: 0,
          borderWidthSelected: node.borderWidth,
          font: { size: 10, color: 'black' },
          label: node.display_name,
          is_highlighted: isSelected,
        };

        if (isSelected) {
          updatedNode.borderWidth = 4;
          updatedNode.borderWidthSelected =  updatedNode.borderWidth,
          updatedNode.color = {
            border: this.selectedBorderColor,
            background: updatedNode.color,
            highlight: {  border: this.selectedBorderColor, background: updatedNode.color },
          };
        }

        if (node.set === 'external') {
          updatedNode.color = {
            border: 'black',
            background: updatedNode.color,
            highlight: {  border: 'black', background: updatedNode.color },
          };
        }

        return updatedNode;
      });
      this.vis_network_nodes.update(updatedNodes);
    },
    getShapeStyle(color, key) {
      // not applicable right now or only for externals
      if (key === "gene" || key === "disorder") {
        return {
          borderRadius: "50%",
          backgroundColor: color,
          width: "20px",
          height: "20px",
          border: "3px solid black",
        };
      }
      return { borderRadius: "50%", backgroundColor: color, width: "20px", height: "20px" };
    },
    clearNetwork(){
      this.networkNodes = [];
      this.networkEdges = [];
      this.vis_network_nodes = [];
      this.vis_network_edges = [];
      this.displayedNodes = null;
      this.displayedEdges = null;
      this.allInternalEdges = [];
      this.allExternalEdges = [];
      this.displayedElement = null;
      this.displayedElementType = null;
      this.isDetailsNodeSelected = false;
      this.selectedNetworkNodes = [];
      this.initializeNetwork();
      this.updateDesign();
    },
    saveNetworkFile() {
      console.log("Saving network data...");
      if (this.vis_network_nodes.length > 0) {
        const nodes = this.vis_network_nodes.get();
        const edges = this.vis_network_edges.get();

        const exportData = { options: this.selectedTests, nodes: nodes, edges: edges };
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });

        // Create a link element
        const link = document.createElement("a");

        const timestamp = new Date().toISOString();
        link.download = `network-data-${timestamp}.json`;

        // Create a URL for the Blob and set it as the href attribute
        link.href = window.URL.createObjectURL(blob);

        // Append the link to the body (needed for triggering the click event)
        document.body.appendChild(link);

        // Programmatically click the link to trigger the download
        link.click();

        // Remove the link from the document
        document.body.removeChild(link);
      } else {
        console.log("No network displayed");
        // Optionally, show an alert to the user
        alert("No network available to save.");
      }
    },
    saveNetworkImage() {
    }

    // Advanced Settings methods
    addTests(data) {
      this.selectedTests = data;
      this.clearNetwork();
    },

    // Context methods
    async updateData(val) {
      this.contextValue = val ? val.value : null;
      const context = await this.getContexts(this.contextValue);
      if (context) {
        this.selectedTests = context.content.tests
        this.disableSelections = { contCont: true, catCat: true, multTest: false , catContB: true, catContM: true}
      }
      else{
        this.disableSelections = { contCont: false, catCat: false, multTest: false , catContB: false, catContM: false}
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
        this.activeIndex = -1;
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    },
    },
    beforeUnmount() {
      // Clean up event listener when component is destroyed
      document.removeEventListener('click', this.handleClickOutside);
    },
  mounted() {
    const theme = useTheme();
    this.selectedBorderColor = theme.current.value.colors['primary']; // Correct way to access the primary color
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
.legend-color {
  margin-right: 10px; /* Space between the color and the text */
}
/* Style for the legend container */
.legend {
  position: absolute;  /* Position relative to the nearest positioned ancestor (network container) */
  bottom: 10px;  /* Adjust the bottom margin */
  left: 10px;    /* Adjust the left margin */
  background: transparent;  /* Transparent background */
  z-index: 10;  /* Ensure it appears above other elements */
}

/* Style for the network container */
#network {
  position: relative;  /* Make this container the reference for absolute positioning */
}

</style>