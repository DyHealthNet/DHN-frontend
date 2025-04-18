<template>
  <v-app>
    <v-main>
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

      <v-container class="mt-4">
        <FilterToolbar :disable-move="true" @change-context="updateData"></FilterToolbar>
        <!-- Network Input -->
        <NodeInput @send-to-network="sendToNetwork" @save-state="saveState" @clear-network="clearNetwork"
                   ref="nodeInputComponent"/>

        <!-- Network Visualization & Analysis -->
        <v-card outlined class="mt-4" expand>
          <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title>
              Network Visualization & Analysis
              <v-tooltip bottom>
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props">mdi-information</v-icon>
                </template>
                <span>
                  Here you can request a subnetwork to be shown and explore it using different techniques.
                </span>
              </v-tooltip>
            </v-toolbar-title>
          </v-toolbar>

          <v-row no-gutters>
            <v-overlay v-model="showLoading" scroll-strategy="none" contained
                        class="d-flex justify-center align-center">
                <v-progress-circular
                    indeterminate
                    color="primary"
                    size="60"
                ></v-progress-circular>
            </v-overlay>
            <v-col cols="4">
              <v-expansion-panels multiple class="scrollable-panels">
                <!-- Network Overview -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-information-outline</v-icon>
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
                    <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-magnify</v-icon>
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
                    <EdgeDetails :getIcon="getIcon" :edge="displayedElement" :selectedTests="store.selectedTests"/>
                  </template>
                  <p v-else>No element selected. You can inspect a node or an edge by clicking on it.</p>
                </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Selection -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-filter</v-icon>
                    Selection</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row justify="center" align="center">
                      <v-col cols="auto">
                        <v-switch
                          v-model="selectAll"
                          :label="selectAll ? 'Unselect all' : 'Select All'"
                          @change="toggleALLNetworkNodeSelection"
                          color="primary-darken-1"
                          class="ml-2"
                        />
                      </v-col>
                    </v-row>
                    <v-divider class="my-4"></v-divider>
                    <span v-if="store.selectedNetworkNodes.length === 0">
                          No node selected. Double click on a node to add it to this panel or select it via the Details panel.
                    </span>
                    <v-table dense v-else="store.selectedNetworkNodes.length === 0">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(node, index) in store.selectedNetworkNodes" :key="node.id">
                          <td>{{ node.display_name }}</td>
                          <td>{{ getPrettyType(node.source_table) }}</td>
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
                    <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-transit-connection-variant</v-icon>
                    Connect Nodes
                  </v-expansion-panel-title>
                    <v-expansion-panel-text>
                  <!-- Individual Node Section -->
                  <v-responsive class="pa-0">
                    <v-row>
                    </v-row>
                    <v-divider class="my-4"></v-divider>
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
                          :disabled="store.selectedNetworkNodes.length !== 1"
                          color="primary-darken-1"
                          block
                          :class="{'grey lighten-2': store.selectedNetworkNodes.length !== 1}"
                          @click="connectIndividualNode()"
                        >Significance Filtering</v-btn>
                      </v-col>
                      <!-- TODO Add a settings toggle to set the amount of Nodes to be retrieved per type like Manuel did-->
                      <v-col cols="12">
                        <v-btn
                          :disabled="store.selectedNetworkNodes.length !== 1"
                          color="primary-darken-1"
                          block
                          :class="{'grey lighten-2': store.selectedNetworkNodes.length !== 1}"
                          @click="connectIndividualNode(true)"
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
                          :disabled="store.selectedNetworkNodes.length <= 1"
                          color="primary-darken-1"
                          block
                          :class="{'grey lighten-2': store.selectedNetworkNodes.length <= 1}"
                          @click="connectGroupNodes(false)"
                        >Significance Filtering</v-btn>
                        </v-col>
                      <v-col cols="12">
                        <v-btn
                          class="mt-2"
                          :disabled="store.selectedNetworkNodes.length <= 1"
                          color="primary-darken-1"
                          block
                          :class="{'grey lighten-2': store.selectedNetworkNodes.length <= 1}"
                          @click="connectGroupNodes(true)"
                        >Minimum Spanning Tree</v-btn>
                        </v-col>
                        </v-row>
                      </v-responsive>
                      </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Analysis -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-flask-outline</v-icon>
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

              <!-- Card Content -->
              <v-card-text ref="wholeNetwork">
                <!-- Network Visualization -->
                <v-row>
                    <v-col>
                      <div ref="network" id="network" style="height: 550px;"></div>
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

              <!-- Card Header -->
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>
                    <v-tooltip bottom>

                    </v-tooltip>
                  </v-toolbar-title>
                    <v-switch
                      v-model="physics_on"
                      @change="updatePhysics"
                      :label="physics_on ? 'Disable Physics' : 'Enable Physics'"
                      color="surface"
                      class="mt-5 mr-3"
                    />
                <v-btn
                  icon
                  @click="saveNetworkImage"
                >
                  <v-icon class="m-3">mdi-camera</v-icon> <!-- mdi-abacus-->
                </v-btn>
                <a ref="downloadLink" style="display: none" :href="imageUrl" :download="downloadFileName"></a>
                <!--<v-btn
                  icon
                  @click="saveNetworkFile"
                >
                  <v-icon class="m-3">mdi-download</v-icon>  mdi-abacus
                </v-btn>-->
                <v-btn
                  icon
                  @click="clearNetworkWarn=true;"
                >
                  <v-icon class="m-3">mdi-trash-can-outline</v-icon> <!-- mdi-abacus-->
                </v-btn>
                  <v-dialog width="auto" v-model="clearNetworkWarn">
                    <v-card color="primary" rounded="lg">
                      <v-card-title class="headline text-white" >
                        <v-icon class="my-0 mr-2">mdi-information-outline</v-icon>
                        <b>You are about to clear the displayed Network.</b>
                      </v-card-title>
                      <v-card-text class="text-white">
                        Would you like to clear the entire network or keep the selected subnetwork and remove <br>
                        the unselected nodes? You can also cancel this action if you change your mind.
                      </v-card-text>
                      <v-card-actions>
                        <v-btn class="text-white" @click="clearNetwork">Clear all</v-btn>
                        <v-btn class="text-white" @click="clearUnselectedNodes">Clear unselected</v-btn>
                        <v-btn class="text-white" @click="clearNetworkWarn = false">Cancel</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
              </v-toolbar>

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
        <v-row>
          <PopUp/>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import FilterToolbar from "@/components/FilterToolbar.vue";

import PopUp from "@/components/PopUp.vue";
//import AdvancedSettings from "@/components/AdvancedSettings.vue";
//import StatisticalTestLine from "@/components/StatisticalTestLine.vue";
//import NetworkEdgeLine from "@/components/network/NetworkEdgeLine.vue";

import NodeInput from "@/components/network/NodeInput.vue";

import {BASE_URL, isLoading, setIsLoading} from "@/components/constants.js";
import {getIcon, getPrettyType, capitalizeFirstLetter} from "@/components/generalFunctions.js";
import {groups, loadNetworkState, saveNetworkState} from "../components/network/networkData.js";
import NodeDetails from '@/components/network/NodeDetails.vue';
import EdgeDetails from '@/components/network/EdgeDetails.vue';
import {DataSet, Network} from "vis-network/standalone/esm/vis-network.js";
import {getCookie} from "@/components/authentication/auth.js";
import {useTheme} from 'vuetify';

import { nodeInputStore } from '@/stores/nodeInputStore'
import { popUpStore } from '@/stores/popUpStore.js'


export default {
  components: {
    PopUp, FilterToolbar, NodeInput, NodeDetails, EdgeDetails},
  data() {
    return {
      // context filter
      contextValue: null,
      //disableSelections: false,

      // Network Input values
      //searchText: "",
      //selectedNodes: [],
      //typeaheadresult: [],
      //dropdownNodes: [],
      //debounceTimeout: null,
      //showDropdown: false,
      //isReadOnly: false,  // Boolean flag to track read-only state

      //hoveredItem: null,
      //tooltipStyle: {},
      //activeIndex: -1, // Tracks which item is focused

      imageUrl: null, // Holds the image URL to be downloaded
      imageText: "static-network",

      // Network Visualization & Settings
      showLoading: isLoading,
      networkNodes: [],//test_data["nodes"],
      networkEdges: [],//test_data["edges"],
      vis_network_nodes: [],
      vis_network_edges: [],
      displayedNodes:  null,
      displayedEdges:  null,
      allInternalEdges: [],
      allExternalEdges: [],

      nodeStyle: groups,
      physics_on: true,
      selectedBorderColor: '', //TODO don't set this in mounted, maybe make it reactive

      displayedElement: null,
      displayedElementType: null,   // 'node' or 'edge'
      isDetailsNodeSelected: false,
      includedNodeTypes: new Set(), // stores type currently present in network for Legend

      //selectedNetworkNodes: [],
      selectAll: false,
      clearNetworkWarn: false,

      // Advanced Settings (default) values
      // selectedTests: {
      //   catCat: {label: 'Chi-squared test', value: 'chi2'}, catContM: {label: 'ANOVA', value: 'anova'},
      //   multTest: {label: 'Benjamini Hochberg (FDR)', value: 'benjamini_hb'},
      //   catContB: {label: 'T-test', value: 'ttest'}, contCont: {label: 'Pearson correlation', value: 'pearson'}
      // },
      // signThresh: 0.999,
      fixThreshold: true,
      //topNodesNumber: 5,
      //topPerNodeCount: true,

      // Popup
      //showInfo: false,
      //infoType: "info", // "error" "success"
      //infoText: "",

    };
  },
  computed: {
    store() {
      return nodeInputStore(); // this makes this.store available
    },
    popUpStore() {
      return popUpStore(); // this makes this.store available
    },
    groups() {
      return groups
    },
    // Limit the number of displayed nodes to 5
    limitedDropdownNodes() {
      return store.dropdownNodes.slice(0, 5);
    },
    downloadFileName() {
      const currentDate = new Date().toLocaleDateString().replace(/\//g, '-'); // Formatting the date as 'MM-DD-YYYY'
      return `network-image-${this.imageText}-${currentDate}.png`; // Append the date to the filename
    },
  },
  methods: {
    getIcon,
    getPrettyType,
    capitalizeFirstLetter,

        sendToNetwork() {
      console.log("this.store.selectedNetworkNodes", this.store.selectedNetworkNodes)
      // Send selectedNodes to networkNodes and reset selectedNodes
      this.networkNodes = [];
      // filter selected Nodes for presence in searchText (if user deletes them)
      this.store.selectedNodes = this.store.selectedNodes.filter(node =>
          this.store.searchText.includes(node.display_name) || this.store.searchText.includes(node.id)
      );
      this.networkNodes = this.store.selectedNodes.map((node) => ({
        ...node,
        set: "CHRIS", //TODO change to internal/cohort or smth when backend became more modular
      }));
      console.log("this.networkNodes", this.networkNodes)
      // check that all selected nodes are unique and still present in the network
      this.store.selectedNetworkNodes = this.store.selectedNetworkNodes
          .filter(node => this.networkNodes.some(networkNode => networkNode.id === node.id))
          .reduce((unique, node) => {
            if (!unique.some(n => n.id === node.id)) {
              unique.push(node);
            }
            return unique;
          }, []);
      console.log("this.store.selectedNetworkNodes", this.store.selectedNetworkNodes)
      // make searchText pretty
      const nodeNames = this.store.selectedNodes
          .filter(node => node && node.display_name)
          .map(node => node.display_name);
      this.store.searchText = nodeNames.length > 0 ? nodeNames.join(", ") : "";
      this.store.isReadOnly = true;
      this.$refs.nodeInputComponent.closeDropdown();
      //this.store.selectedNodes = []; // Clear the selection
      this.filterForNetworkEdges();

      this.initializeNetwork();
      this.updateDesign();
    },

    //Network Visualization
    initializeNetwork() {
      //console.log("initializeNetwork")
      const options = {physics: {enabled: this.physics_on}};
      const container = this.$refs.network;
      if (!container) return;

      //TODO possibly discard displayedNodes and set to networkNodes and the same for the Edges?
      this.vis_network_nodes = new DataSet(this.networkNodes);
      this.vis_network_edges = new DataSet(this.networkEdges);

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
          this.updateDesign(false);
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
            const existingNodeIndex = this.store.selectedNetworkNodes.findIndex(
              (node) => node.id === clickedNode.id
            );

            if (existingNodeIndex !== -1) {
              // If the node exists, remove it from the array
              this.store.selectedNetworkNodes.splice(existingNodeIndex, 1);
            } else {
              // If the node doesn't exist, add it to the array
              this.store.selectedNetworkNodes.push(clickedNode);
            }
            this.displayNode(clickedNode);
            this.checkSelectAll();
          }
          this.updateDesign();
        }.bind(this)
      );
      this.network.on("afterDrawing", this.captureImage);
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
      return this.store.selectedNetworkNodes.some(existingNode => existingNode.id === node.id);

    },
    toggleNetworkNodeSelection() {
      const index = this.store.selectedNetworkNodes.findIndex(n => n.id === this.displayedElement.id); // Check for the node by unique identifier (id)

      if (this.isDetailsNodeSelected && index === -1) {
        this.store.selectedNetworkNodes.push(this.displayedElement);
        this.updateDesign();
      } else if (!this.isDetailsNodeSelected && index !== -1) {
        this.store.selectedNetworkNodes.splice(index, 1);
      }
      this.checkSelectAll();
    },
    toggleALLNetworkNodeSelection(){
      if(this.selectAll) {
        for (const node of this.networkNodes) {
          if (!this.store.selectedNetworkNodes.includes(node)) {
            this.store.selectedNetworkNodes.push(node);  // Add the node if it's not already selected
          }
        }
      }
      else{
        this.store.selectedNetworkNodes = [];
      }
      this.updateDesign();
    },
    removeSelectedNetworkNode(index){
      this.store.selectedNetworkNodes.splice(index, 1);
      this.updateDesign();
      this.checkSelectAll();
    },
    checkSelectAll(){
      if (this.store.selectedNetworkNodes.length === 0){
        this.selectAll = false;
      } else if (this.store.selectedNetworkNodes.length === this.networkNodes.length) {
        this.selectAll = true;
      }
    },
    // editThreshold(){
    //   if (this.fixThreshold){
    //     // do a popup here asking the user if he/she really wants to change the significance threshold as this
    //     // would result in inconcistencies or would delete the current network
    //     this.fixThreshold = false;
    //   } else {
    //     // do a popup here asking the user if he/she really wants to change the significance threshold as this
    //     // would result in inconcistencies or would delete the current network
    //     this.fixThreshold = true;
    //     this.signThresh = this.signThreshTemp
    //     this.clearNetwork();
    //   }
    // },
    async connectIndividualNode(count=false) {
      // Use the first element of selectedNetworkNodes
      const firstNode = this.store.selectedNetworkNodes?.[0];

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
    async connectGroupNodes(minSpanTree) {
      // Check if selectedNetworkNodes is not null/undefined and has at least two elements
      if (this.store.selectedNetworkNodes && this.store.selectedNetworkNodes.length > 1) {
        const filteredNodeIds = this.store.selectedNetworkNodes
            .filter(node => node.set === "CHRIS")  // Filter nodes with .set == "CHRIS"
            .map(node => node.id);  // Extract the node IDs
        if (filteredNodeIds.length === 0) {
          console.warn("No nodes in selectedNetworkNodes to process.");
        }
        await this.fetchNodeGroupEdges(filteredNodeIds, minSpanTree);
        this.filterForNetworkEdges();
        this.initializeNetwork();
        this.updateDesign();
      }
    },
    async fetchNodesAndEdges(node, count=false) {
      setIsLoading(true);
      try {
        const csrfToken = getCookie('csrftoken');
        const nodeID = node.id;
        const type = node.source_table.split("_")[1];
        const limit = count ? this.topNodesNumber : "";
        let funct = "getNetwork"
        if (this.contextValue != null){
          funct = "getNetworkContext"
        }
        const api_string =
          BASE_URL +
          "/network/api/" + funct + "/?q=" +
          encodeURIComponent(nodeID) +
          "&t=" +
          encodeURIComponent(type) +
          "&l=" +
          encodeURIComponent(limit) +
          "&p=" +
          encodeURIComponent(this.topPerNodeCount) +
          "&s=" +
          this.signThresh +
            (this.contextValue != null ? "&c=" + encodeURIComponent(this.contextValue) : "") +
          "&o=" +
          JSON.stringify(this.store.selectedTests);

        const response = await fetch(api_string, {
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
        if (data.message != ""){
          this.popUpStore.infoText = data.message;
          this.popUpStore.infoType = "info";
          this.popUpStore.showInfo = true;
        }

        this.setNetworkNodes(data);
      } catch (error) {
        console.error("Error fetching edges:", error);
      }
      setIsLoading(false);
    },
    async fetchNodeGroupEdges(nodes, minSpanTree) {
      setIsLoading(true);
      try {
        const csrfToken = getCookie('csrftoken');
        let funct = "getGroupNetwork"
        if (this.contextValue != null){
          funct = "getGroupNetworkContext"
        }
        const api_string =
          BASE_URL +
          "/network/api/" + funct + "/?q=" +
          JSON.stringify(nodes) +
          "&s=" +
          this.signThresh +
            (this.contextValue != null ? "&c=" + encodeURIComponent(this.contextValue) : "") +
          "&o=" +
          JSON.stringify(this.store.selectedTests) +
          "&m=" +
          encodeURIComponent(minSpanTree);


        const response = await fetch(api_string, {
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
        const nodeSet = new Set(nodes);
        if (minSpanTree){
          const edgesToRemove = [];
          this.vis_network_edges.forEach(edge => {
            if (nodeSet.has(edge.from) && nodeSet.has(edge.to)) {
              edgesToRemove.push({ id: edge.id }); // Collect the IDs of the edges to remove
            }
          });
          this.vis_network_edges.remove(edgesToRemove);
          this.networkEdges = this.networkEdges.filter(edge =>
            !edgesToRemove.some(edgeToRemove => edgeToRemove.id === edge.id)
          );
          this.allInternalEdges = this.networkEdges;
        }
        if (data.message != ""){
          this.popUpStore.infoText = data.message;
          this.popUpStore.infoType = "error";
          this.popUpStore.showInfo = true;
        }
        this.setNetworkNodes(data);


      } catch (error) {
        console.error("Error fetching edges:", error);
      }
      setIsLoading(false);
    },
    setNetworkNodes(data){
      //console.log("data ", data)

      const nodes = data.Nodes;
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
      const internalEdges = data.Edges;
      const externalEdges = data["External Edges"];

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
                width: 2, //Math.min(Math.max(-Math.log10(renamedEdge.final_p_value) * 2, 0.01), 10), // TODO: adjust width
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
            width: 0.03,
          });
          existingExternalEdgeIds.add(edge.id);
        }
      });
    },
    filterForNetworkEdges() {
      const networkNodeIds = new Set(this.networkNodes.map((node) => node.id));
      const uniqueEdges = new Set();

      const isValidEdge = (edge) =>
        networkNodeIds.has(edge.from) && networkNodeIds.has(edge.to);

      // Filter and process all edges in one step
      this.networkEdges = [
        ...this.allInternalEdges.filter(isValidEdge),
        ...this.allExternalEdges.filter(isValidEdge).map((edge) => ({
          ...edge,
          color: "black",
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
    },
    //TODO split this into smaller functions that update only the needed Design changes?
    // Function to bulk update the highlighting
    updateDesign(saveState=true) {
      // Update nodes with conditional styling
      const updatedNodes = this.vis_network_nodes.get().map(node => {
        const isDisplayed = this.displayedElementType === 'node' && this.displayedElement.id === node.id;
        const isSelected = this.store.selectedNetworkNodes.some(n => n.id === node.id);

        let updatedNode = {
          ...node,
          color: groups[node.source_table.split('_')[1]].color,
          shape: 'dot', // 'dot' text below, 'circle' text inside
          size: 15,
          borderWidth: 0,
          borderWidthSelected: node.borderWidth,
          font: { size: 10, color: this.labelColor("text") },
          label: node.display_name,
          is_highlighted: isSelected,
        };

        if (isSelected) {
          updatedNode.borderWidth = 4;
          updatedNode.borderWidthSelected =  updatedNode.borderWidth,
          updatedNode.color = {
            border: this.labelColor("node-border"),
            background: updatedNode.color,
            highlight: {  border:this.labelColor("node-border"), background: updatedNode.color },
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
      const updatedEdges = this.vis_network_edges.get().map(edge => {
      return {
        ...edge,
        color: {
          color: this.labelColor("text"), // Normal color
        },
      };
    });
    this.vis_network_edges.update(updatedEdges);
      if(saveState){
        this.saveState();
      }
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
    labelColor(colorName) {
      // chartjs does not support theme colors so we just directly call the theme color
      if (this.$vuetify.theme.global.name === 'dyHealthNetTheme') {
        return this.$vuetify.theme.themes.dyHealthNetTheme.colors[colorName];
      } else {
        return this.$vuetify.theme.themes.dyHealthNetThemeDark.colors[colorName];
      }

    },
    updatePhysics() {
      // Update the physics option dynamically
      const newPhysicsOption = {
        physics: {
          enabled: this.physics_on  // Set to true or false based on v-switch
        }
      };

      // Update the options of the existing network
      this.network.setOptions(newPhysicsOption);
    },
    clearNetwork(full = true, saveState=true){
      this.clearNetworkWarn = false;
      this.networkNodes = [];
      this.networkEdges = []; // do i also need allInternalEdges??
      this.vis_network_nodes = [];
      this.vis_network_edges = [];
      this.displayedNodes = null;
      this.displayedEdges = null;
      this.allInternalEdges = [];
      this.allExternalEdges = [];
      this.displayedElement = null;
      this.displayedElementType = null;
      this.isDetailsNodeSelected = false;
      this.store.selectedNetworkNodes = [];
      if(full){
        this.initializeNetwork();
        this.updateDesign(saveState);
      } else{
        this.sendToNetwork()
      }
    },
    clearUnselectedNodes(){
      //console.log("clearUnselectedNodes", this.vis_network_nodes);
      this.clearNetworkWarn = false;
      // Set to only selected Nodes
      this.networkNodes =  [...this.store.selectedNetworkNodes];
      // filter edges now
      this.filterForNetworkEdges();
      // override internal edges with filtered edges
      this.allInternalEdges = this.networkEdges;
      this.initializeNetwork();
      //console.log("clearUnselectedNodes", this.vis_network_nodes);
      this.checkSelectAll();
      this.updateDesign(true);
    },
    // saveNetworkFile() {
    //   if (this.vis_network_nodes.length > 0) {
    //     const nodes = this.vis_network_nodes.get();
    //     const edges = this.vis_network_edges.get();
    //
    //     const exportData = { options: this.store.selectedTests, nodes: nodes, edges: edges };
    //     const dataStr = JSON.stringify(exportData, null, 2);
    //     const blob = new Blob([dataStr], { type: "application/json" });
    //
    //     // Create a link element
    //     const link = document.createElement("a");
    //
    //     const timestamp = new Date().toISOString();
    //     link.download = `network-data-${timestamp}.json`;
    //
    //     // Create a URL for the Blob and set it as the href attribute
    //     link.href = window.URL.createObjectURL(blob);
    //
    //     // Append the link to the body (needed for triggering the click event)
    //     document.body.appendChild(link);
    //
    //     // Programmatically click the link to trigger the download
    //     link.click();
    //
    //     // Remove the link from the document
    //     document.body.removeChild(link);
    //   } else {
    //     console.log("No network displayed");
    //     // Optionally, show an alert to the user
    //     alert("No network available to save.");
    //   }
    // },
    saveNetworkImage() {
      this.captureImage();
      if (this.imageUrl) {
        this.$refs.downloadLink.click();
      } else {
        console.error("Image URL is not available yet");
      }
    },
    captureImage() {
      const canvas = this.network.canvas.frame.canvas;
      const ctx = canvas.getContext('2d'); // Get the context of the canvas

      if (canvas && ctx) {

        // Create a temporary offscreen canvas to avoid triggering redraw
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;

        // Draw the current content of the network on the offscreen canvas
        offscreenCtx.drawImage(canvas, 0, 0);

        // Filter groups based on includedNodeTypes
        const includedGroups = Object.keys(groups).filter(groupKey =>
          this.includedNodeTypes.has(groupKey)
        );

        // Adjust legend height dynamically based on included groups
        const legendHeight = 40 + includedGroups.length * 35; // Title + 35px per group

        // Define the position for the legend (left bottom corner)
        const legendX = 20;
        const legendY = Math.max(50,offscreenCanvas.height/2 - legendHeight - 100);

        // Loop over the groups to draw the legend dynamically
        let yOffset = 50; // Starting Y position for the first item
        includedGroups.forEach((groupKey) => {
          const group = groups[groupKey]; // Get the group object (color)

          // Draw larger color circles
          offscreenCtx.beginPath();
          offscreenCtx.arc(legendX + 25, legendY + yOffset + 15, 15, 0, 2 * Math.PI, false); // Radius increased to 15
          offscreenCtx.fillStyle = group.color; // Set the color
          offscreenCtx.fill();

          // Draw larger label text
          offscreenCtx.fillStyle = 'black';
          offscreenCtx.font = '18px Arial'; // Increased font size to 18px
          offscreenCtx.fillText(this.capitalizeFirstLetter(groupKey), legendX + 55, legendY + yOffset + 20);

          // Increment Y offset for the next item
          yOffset += 35; // Increased spacing for clarity
        });

        // Generate the image URL
        this.imageUrl = offscreenCanvas.toDataURL();
      } else {
        console.error('Canvas or context is undefined');
      }
    },

    // Context methods
    async updateData(val) {
      //console.log("updateData val ", val)
      this.contextValue = val ? val.value : null;
      const context = await this.getContexts(this.contextValue);
      this.store.searchText = "";
      this.store.selectedNodes = [];
      this.isReadOnly = false;
      this.store.dropdownNodes= [];
      if (context) {
        console.log("context.content.contextName",context.content.contextName)
        console.log("context.content.tests",context.content.tests)
        this.store.selectedTests['catCat'] = context.content.tests['catCat'];
        this.store.selectedTests['catContM'] = context.content.tests['catContM'];
        this.store.selectedTests['catContB'] = context.content.tests['catContB'];
        this.store.selectedTests['contCont'] = context.content.tests['contCont'];
        //this.store.selectedTests = context.content.tests
        this.disableSelections = true;
        this.clearNetwork(true,false);
      }
      else{
        this.store.selectedTests =  {
          catCat: {label: 'Chi-squared test', value: 'chi2'}, catContM: {label: 'ANOVA', value: 'anova'},
          multTest: {label: 'Benjamini Hochberg (FDR)', value: 'benjamini_hb'},
          catContB: {label: 'T-test', value: 'ttest'}, contCont: {label: 'Pearson correlation', value: 'pearson'}};
        this.disableSelections = false;
        this.clearNetwork(true, false);
      }
      this.loadState();
    },
    async getContexts(val) {
      if(val){
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
          this.imageText = context.content.contextName.replace(/\s+/g, '-');

          return context;  // Return the first matched item directly
        } catch (error) {
          console.error('Error:', error);
          return null;  // Return null in case of error
        }
      }
      return null;  // Return null if contextVal/ val = null
    },

    // Page/ State Reload
    saveState() {
      //console.log("saveState")
      const nodes = this.vis_network_nodes.get();
      const edges = this.vis_network_edges.get();
      const user_settings = {
        selectedNodes: this.store.selectedNodes,
        selectedNetworkNodes: this.store.selectedNetworkNodes,
        selectedTests: this.store.selectedTests,
        signThresh: this.signThresh,
        fixThreshold: this.fixThreshold,
        topNodesNumber: this.topNodesNumber,
        topPerNodeCount: this.topPerNodeCount,
        selectAll: this.selectAll,
      }

      const exportData = { nodes: nodes, edges: edges ,
        vis_options: {physics: {enabled: this.physics_on}}, user_settings: { ...user_settings }};
      console.log("Save State exportData", exportData)
      saveNetworkState(this.contextValue, exportData);
    },
    loadState() {
      const savedState = loadNetworkState(this.contextValue);
      if (savedState) {
        console.log("Load State savedState", savedState)
        const { nodes, edges, vis_options, user_settings } = savedState;
        this.networkNodes = nodes;
        this.networkEdges = edges;
        this.physics_on = vis_options.physics.enabled;

        this.store.selectedNodes = user_settings.selectedNodes;
        this.selectAll = user_settings.selectAll;
        this.$refs.nodeInputComponent.updateSearchText();
        //this.updateSearchText();

        this.store.selectedNetworkNodes = user_settings.selectedNetworkNodes;
        this.store.selectedTests = user_settings.selectedTests;
        this.signThresh = parseFloat(user_settings.signThresh);
        this.fixThreshold = user_settings.fixThreshold;
        this.topNodesNumber = parseInt(user_settings.topNodesNumber);
        this.topPerNodeCount = user_settings.topPerNodeCount;
        this.initializeNetwork(); // Example: Reapply the state to your network
        this.updateDesign(false);
      }
    },
  },
  watch: {
    showDropdown(newVal) {
      // Add or remove the global click listener when dropdown visibility changes
      if (newVal) {
        document.addEventListener('click', this.handleClickOutside);
        this.store.activeIndex = -1;
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    },
    '$vuetify.theme.global.name'(newTheme, oldTheme) {
      console.log(`Theme changed from ${oldTheme} to ${newTheme}`);
      this.updateDesign(false); // Trigger the network update
    },
    },
    beforeUnmount() {
      // Clean up event listener when component is destroyed
      document.removeEventListener('click', this.handleClickOutside);
    },

  mounted() {
    const theme = useTheme();
    this.loadState(); // Load state when the component is mounted
    this.selectedBorderColor = theme.current.value.colors['primary']; // Correct way to access the primary color
  },
};
</script>

<style scoped>

.title {
  font-size: 2rem;
}

.v-container {
  max-width: min(95%, 1800px);
}

@media (max-width: 1919px) {
  .responsive-card {
    width: 95%;
  }
}

.legend-color {
  margin-right: 10px; /* Space between the color and the text */
}
/* Style for the legend container */
.legend {
  position: absolute;  /* Position relative to the nearest positioned ancestor (network container) */
  bottom: 25px;  /* Adjust the bottom margin */
  left: 10px;    /* Adjust the left margin */
  background: transparent;  /* Transparent background */
  z-index: 10;  /* Ensure it appears above other elements */
}
.scrollable-panels {
  max-height: 625px;  /* You can adjust the height as needed */
  overflow-y: auto;   /* This will make the content scrollable */
}

/* Style for the network container */
#network {
  position: relative;  /* Make this container the reference for absolute positioning */
}

</style>