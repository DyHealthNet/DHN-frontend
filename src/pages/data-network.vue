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
                <NetworkOverviewPanel :nodes="networkNodes.length" :edges="networkEdges.length"/>

                <!-- Node Details -->
                <DetailsPanel @update-design="updateDesign" @check-select-all="checkSelectAll"
                              ref="detailsPanelComponent"/>

                <!-- Selection -->
                <SelectionPanel :network-nodes="networkNodes" v-model:selectAll="selectAll"
                                @update-design="updateDesign" @check-select-all="checkSelectAll"/>

                <!-- Connect Nodes -->
                <ConnectNodesPanel :selected-network-nodes-length="nodeStore.selectedNetworkNodes.length"
                    @connect-individual-node="connectIndividualNode"
                    @connect-group-nodes="connectGroupNodes"
                  />

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
            <!-- Network Visualization -->
            <v-col cols="8">
              <v-card outlined class="network-container">
                <v-card-text ref="wholeNetwork">
                  <v-row>
                    <v-col>
                      <div ref="network" id="network" style="height: 550px;"></div>
                      <div class="legend">
                        <v-row v-for="(group, groupKey) in groups" :key="groupKey" align="center" class="mb-2" no-gutters>
                          <v-col v-if="includedNodeTypes.has(groupKey)" cols="auto" class="legend-dot">
                            <div class="legend-color" :style="getShapeStyle(group.color, groupKey)"></div>
                          </v-col>
                          <v-col v-if="includedNodeTypes.has(groupKey)" cols="auto" class="legend-text">
                            <span>{{ capitalizeFirstLetter(groupKey) }}</span>
                          </v-col>
                        </v-row>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-toolbar color="primary-darken-1" density="compact">
                  <v-toolbar-title>
                    <v-tooltip bottom />
                  </v-toolbar-title>

                  <v-switch
                    v-model="physics_on"
                    @change="updatePhysics"
                    :label="physics_on ? 'Disable Physics' : 'Enable Physics'"
                    color="surface"
                    class="mt-5 mr-3"
                  />
                  <v-btn icon @click="saveNetworkImage">
                    <v-icon class="m-3">mdi-camera</v-icon>
                  </v-btn>
                  <a ref="downloadLink" style="display: none" :href="imageUrl" :download="downloadFileName"></a>
                  <v-btn icon @click="clearNetworkWarn = true">
                    <v-icon class="m-3">mdi-trash-can-outline</v-icon>
                  </v-btn>

                  <v-dialog width="auto" v-model="clearNetworkWarn">
                    <v-card color="primary" rounded="lg">
                      <v-card-title class="headline text-white">
                        <v-icon class="my-0 mr-2">mdi-information-outline</v-icon>
                        <b>You are about to clear the displayed Network.</b>
                      </v-card-title>
                      <v-card-text class="text-white">
                        Would you like to clear the entire network or keep the selected subnetwork and remove<br />
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
//import NodeDetails from '@/components/network/NodeDetails.vue';
//import EdgeDetails from '@/components/network/EdgeDetails.vue';

import NodeInput from "@/components/network/NodeInput.vue";
//import NetworkVisualization from "@/components/network/NetworkVisualization.vue";
import NetworkOverviewPanel from "@/components/network/NetworkOverviewPanel.vue";
import DetailsPanel from "@/components/network/DetailsPanel.vue";
import SelectionPanel from "@/components/network/SelectionPanel.vue";
import ConnectNodesPanel from "@/components/network/ConnectNodesPanel.vue";


import {BASE_URL, isLoading, setIsLoading} from "@/components/constants.js";
import {getIcon, getPrettyType, capitalizeFirstLetter} from "@/components/generalFunctions.js";
import {groups, loadNetworkState, saveNetworkState} from "../components/network/networkData.js";
import {DataSet, Network} from "vis-network/standalone/esm/vis-network.js";
import {getCookie} from "@/components/authentication/auth.js";
import {useTheme} from 'vuetify';

import { nodeInputStore } from '@/stores/nodeInputStore'
import { popUpStore } from '@/stores/popUpStore.js'


export default {
  components: {
    ConnectNodesPanel,
    SelectionPanel,
    DetailsPanel,
    NetworkOverviewPanel,
    PopUp, FilterToolbar, NodeInput},
  data() {
    return {
      // context filter
      contextValue: null,

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

      includedNodeTypes: new Set(), // stores type currently present in network for Legend

      selectAll: false, // keep track of selected Nodes status over components
      clearNetworkWarn: false,

      // Advanced Settings (default) values
      fixThreshold: true,

    };
  },
  computed: {
    nodeStore() {
      return nodeInputStore(); // this makes the store available
    },
    popUpStore() {
      return popUpStore(); // this makes the store available
    },
    groups() {
      return groups
    },
    downloadFileName() {
      const currentDate = new Date().toLocaleDateString().replace(/\//g, '-'); // Formatting the date as 'MM-DD-YYYY'
      return `network-image-${this.imageText}-${currentDate}.png`; // Append the date to the filename
    },
  },
  methods: {
    capitalizeFirstLetter,

    sendToNetwork() {
      console.log("this.nodeStore.selectedNetworkNodes", this.nodeStore.selectedNetworkNodes)
      // Send selectedNodes to networkNodes and reset selectedNodes
      this.networkNodes = [];
      // filter selected Nodes for presence in searchText (if user deletes them)
      this.nodeStore.selectedNodes = this.nodeStore.selectedNodes.filter(node =>
          this.nodeStore.searchText.includes(node.display_name) || this.nodeStore.searchText.includes(node.id)
      );
      this.networkNodes = this.nodeStore.selectedNodes.map((node) => ({
        ...node,
        set: "CHRIS", //TODO change to internal/cohort or smth when backend became more modular
      }));
      console.log("this.networkNodes", this.networkNodes)
      // check that all selected nodes are unique and still present in the network
      this.nodeStore.selectedNetworkNodes = this.nodeStore.selectedNetworkNodes
          .filter(node => this.networkNodes.some(networkNode => networkNode.id === node.id))
          .reduce((unique, node) => {
            if (!unique.some(n => n.id === node.id)) {
              unique.push(node);
            }
            return unique;
          }, []);
      console.log("this.nodeStore.selectedNetworkNodes", this.nodeStore.selectedNetworkNodes)
      // make searchText pretty
      const nodeNames = this.nodeStore.selectedNodes
          .filter(node => node && node.display_name)
          .map(node => node.display_name);
      this.nodeStore.searchText = nodeNames.length > 0 ? nodeNames.join(", ") : "";
      this.nodeStore.isReadOnly = true;
      this.$refs.nodeInputComponent.closeDropdown();
      //this.nodeStore.selectedNodes = []; // Clear the selection
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

      if (this.network) {
        this.network.destroy();
        this.network = null;
      }

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
            this.$refs.detailsPanelComponent.displayNode(clickedNode);
          } else if (params.edges.length === 1) {
            const clickedEdge = this.networkEdges.find(
              (currentEdge) => currentEdge.id === params.edges[0]
            );
            this.$refs.detailsPanelComponent.displayEdge(clickedEdge);
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
            const existingNodeIndex = this.nodeStore.selectedNetworkNodes.findIndex(
              (node) => node.id === clickedNode.id
            );

            if (existingNodeIndex !== -1) {
              // If the node exists, remove it from the array
              this.nodeStore.selectedNetworkNodes.splice(existingNodeIndex, 1);
            } else {
              // If the node doesn't exist, add it to the array
              this.nodeStore.selectedNetworkNodes.push(clickedNode);
            }
            this.$refs.detailsPanelComponent.displayNode(clickedNode);
            this.checkSelectAll();
          }
          this.updateDesign();
        }.bind(this)
      );
      this.network.on("afterDrawing", this.captureImage);
    },
    checkSelectAll(){
      if (this.nodeStore.selectedNetworkNodes.length === 0){
        this.selectAll = false;
      } else if (this.nodeStore.selectedNetworkNodes.length === this.networkNodes.length) {
        this.selectAll = true;
      }
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
      this.nodeStore.selectedNetworkNodes = [];
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
      this.networkNodes =  [...this.nodeStore.selectedNetworkNodes];
      // filter edges now
      this.filterForNetworkEdges();
      // override internal edges with filtered edges
      this.allInternalEdges = this.networkEdges;
      this.initializeNetwork();
      //console.log("clearUnselectedNodes", this.vis_network_nodes);
      this.checkSelectAll();
      this.updateDesign(true);
    },
    async connectIndividualNode(count=false) {
      console.log("connectIndividualNode called")
      // Use the first element of selectedNetworkNodes
      const firstNode = this.nodeStore.selectedNetworkNodes?.[0];

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
      if (this.nodeStore.selectedNetworkNodes && this.nodeStore.selectedNetworkNodes.length > 1) {
        const filteredNodeIds = this.nodeStore.selectedNetworkNodes
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
        const limit = count ? this.nodeStore.topNodesNumber : "";
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
          encodeURIComponent(this.nodeStore.topPerNodeCount) +
          "&s=" +
          this.nodeStore.signThresh +
            (this.contextValue != null ? "&c=" + encodeURIComponent(this.contextValue) : "") +
          "&o=" +
          JSON.stringify(this.nodeStore.selectedTests);

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
          this.nodeStore.signThresh +
            (this.contextValue != null ? "&c=" + encodeURIComponent(this.contextValue) : "") +
          "&o=" +
          JSON.stringify(this.nodeStore.selectedTests) +
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
        const isSelected = this.nodeStore.selectedNetworkNodes.some(n => n.id === node.id);

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
    // saveNetworkFile() {
    //   if (this.vis_network_nodes.length > 0) {
    //     const nodes = this.vis_network_nodes.get();
    //     const edges = this.vis_network_edges.get();
    //
    //     const exportData = { options: this.nodeStore.selectedTests, nodes: nodes, edges: edges };
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
      this.nodeStore.searchText = "";
      this.nodeStore.selectedNodes = [];
      this.isReadOnly = false;
      this.nodeStore.dropdownNodes= [];
      if (context) {
        console.log("context.content.contextName",context.content.contextName)
        console.log("context.content.tests",context.content.tests)
        this.nodeStore.selectedTests['catCat'] = context.content.tests['catCat'];
        this.nodeStore.selectedTests['catContM'] = context.content.tests['catContM'];
        this.nodeStore.selectedTests['catContB'] = context.content.tests['catContB'];
        this.nodeStore.selectedTests['contCont'] = context.content.tests['contCont'];
        //this.nodeStore.selectedTests = context.content.tests
        this.disableSelections = true;
        this.clearNetwork(true,false);
      }
      else{
        this.nodeStore.selectedTests =  {
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
        selectedNodes: this.nodeStore.selectedNodes,
        selectedNetworkNodes: this.nodeStore.selectedNetworkNodes,
        selectedTests: this.nodeStore.selectedTests,
        signThresh: this.nodeStore.signThresh,
        fixThreshold: this.fixThreshold,
        topNodesNumber: this.nodeStore.topNodesNumber,
        topPerNodeCount: this.nodeStore.topPerNodeCount,
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

        this.nodeStore.selectedNodes = user_settings.selectedNodes;
        this.selectAll = user_settings.selectAll;
        this.$refs.nodeInputComponent.updateSearchText();

        this.nodeStore.selectedNetworkNodes = user_settings.selectedNetworkNodes;
        this.nodeStore.selectedTests = user_settings.selectedTests;
        this.nodeStore.signThresh = parseFloat(user_settings.signThresh);
        this.fixThreshold = user_settings.fixThreshold;
        this.nodeStore.topNodesNumber = parseInt(user_settings.topNodesNumber);
        this.nodeStore.topPerNodeCount = user_settings.topPerNodeCount;
        this.initializeNetwork(); // Example: Reapply the state to your network
        this.updateDesign(false);
      }
    },
  },
  watch: {
    '$vuetify.theme.global.name'(newTheme, oldTheme) {
      console.log(`Theme changed from ${oldTheme} to ${newTheme}`);
      this.updateDesign(false); // Trigger the network update
    },
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