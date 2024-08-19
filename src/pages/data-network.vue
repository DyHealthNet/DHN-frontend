<template>
  <div class="outer-container">
    <div class="panel-container">
      <div class="panel">
        <div class="panel-header">
          <h2 title="Find CHRIS nodes and add them to the network display">Node Selection</h2>
        </div>
        <div class="panel-content">
          <div class="node-selection">
            <input type="text" v-model="searchText" @input="fetchData" placeholder="Type something..." style="width: 175px;"/>
            <ul v-if="dropdownNodes.length" class="dropdown" ref="dropdown">
              <li v-for="(item, index) in dropdownNodes" @click="addNodeToNetwork(item)"
                :key="index" @mouseover="hoverNode(item)" @mouseleave="hoverNode(null)">
                {{ item.display_name }}
              </li>
            </ul>
            <teleport to="body">
              <div
                v-if="hoveredItem"
                class="tooltip"
                :style="tooltipStyle"
              >
                <strong>ID:</strong> {{ hoveredItem.id }}<br />
                <strong>Display Name:</strong> {{ hoveredItem.display_name }}<br />
                <strong>Source Table:</strong> {{ hoveredItem.source_table }}<br />
                <strong>Description:</strong> {{ hoveredItem.description }}
                
              </div>
            </teleport>

          </div>
        </div>
        <div class="panel-header">
          <h2 title="These are the nodes that are displayed in the network">Network Nodes</h2>
        </div>
        <div class="panel-content">
          <div class="node-selection">
            <ul v-if="networkNodes.length" class="dropdown" ref="dropdown">
              <li v-for="(item, index) in networkNodes" @click="BoxClickEvent(item, $event)"
                :key="index" @mouseover="hoverNode(item)" @mouseleave="hoverNode(null)">
                {{ item.display_name }}
                <span class="remove-node" @click="RemoveNetworkNode(item)">✖</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

  <!-- Legend -->
  <div class="legend">
    <div v-for="(group, key) in groups" :key="key" class="legend-item">
      <div class="legend-color" :style="getShapeStyle(group.color)"></div>
      <span>&nbsp;&nbsp;{{ this.capitalizeFirstLetter(key.split('_')[1]) }}</span>
    </div>
  </div>
  <div class="legend2">
    <div class="legend-item">
      <div class="solid-line"></div>
      <div class="legend-text">CHRIS</div>
    </div>
    <div class="legend-item">
      <div class="dashed-line"></div>
      <div class="legend-text">External</div>
    </div>
  </div>



    <div class="network-container">
      <!-- Network Visualization -->
      <div ref="network" id="network"></div>
    </div>
    <!-- Info Panel -->
    <div class="info-panel">
      <h2 v-if="displayedElement"></h2>
      <template v-if="displayedElement">
        <template v-if="displayedElementType === 'node'">
          <!-- Display selected node details -->
          <p><strong style="font-size: 24px;">Selected Node</strong></p>
          <p>&nbsp;</p>
          <p title="CHRIS ID"><strong>ID:</strong> {{ displayedElement.id }}</p>
          <p title="Node label"><strong>Label:</strong> {{ displayedElement.display_name }}</p>
          <p title="Short node description"><strong>Description:</strong> {{ capitalizeFirstLetter(displayedElement.description) }}</p>
          <p title="CHRIS contains three source tables: proteins, metabolites, and phenotypes"><strong>Source Table:</strong> {{ capitalizeFirstLetter(displayedElement.source_table.split('_')[1]) }}</p>
          <!-- <p><strong>Cross Reference: </strong> {{ displayedElement.xrefs }}</p>-->
          <p title="We use Uniprot for proteins, HMDB for metabolites and SNOMED for phenotypes"><strong>Reference:</strong>
            <span v-if="displayedElement.xrefs">
              <span v-for="(xref, index) in displayedElement.xrefs.split(';')" :key="index">
                <a :href="generateLink(xref.trim())" target="_blank" style="color: darkblue;">{{ xref.trim() }}</a>
                <span v-if="index < displayedElement.xrefs.split(';').length - 1">, </span>
              </span>
            </span>
            <span v-else> none</span>
          </p>

        </template>

        <template v-else-if="displayedElementType === 'edge' && displayedElement.set === 'cohort'">
          <!-- Display details for edge with set 'cohort' -->
          <p><strong style="font-size: 24px;">Selected Edge</strong></p>
          <p><strong>Set:</strong> CHRIS edges</p>
          <p>&nbsp;</p>
          <p><strong>Node 0</strong></p>
          <p><strong>Label:</strong> {{ displayedElement.node0_label }}</p>
          <p><strong>ID:</strong> {{ displayedElement.to }}</p>
          <p><strong>Type:</strong> {{ displayedElement.node0_type }}</p>
          <p>&nbsp;</p>
          <p><strong>Node 1</strong></p>
          <p><strong>Label:</strong> {{ displayedElement.node1_label }}</p>
          <p><strong>ID:</strong> {{ displayedElement.from }}</p>
          <p><strong>Type:</strong> {{ displayedElement.node1_type }}</p>
          <p>&nbsp;</p>
          <p><strong>P Value:</strong> {{ displayedElement.p_value.toPrecision(3) }}</p>
          <p><strong>Adjusted P Value:</strong> {{ displayedElement.adjusted_p_value.toPrecision(3) }}</p>
          <p><strong>Effect Size:</strong> {{ displayedElement.effect_size.toPrecision(3) }}</p>
          <p><strong>Effect Size Type:</strong> {{ capitalizeFirstLetter(displayedElement.effect_size_type) }}</p>
        </template>

        <template v-else-if="displayedElementType === 'edge' && displayedElement.set === 'external'">
          <template v-if="displayedElement.to === displayedElement.from">
            <p><strong style="font-size: 24px;">Selected Edge</strong></p>
            <p><strong>Set:</strong> External edges</p>
            <p>&nbsp;</p>

            <p><strong>Node Label:</strong> {{ displayedElement.node0_label }}</p>
            <p><strong>Node ID:</strong> {{ displayedElement.to }}</p>
            <p><strong>Node Type:</strong> {{ displayedElement.node0_type }}</p>
          </template>

          <template v-else>
            <p><strong style="font-size: 24px;">Selected Edge</strong></p>
            <p><strong>Set:</strong> External edges</p>
            <p>&nbsp;</p>

            <p><strong>Node 0</strong></p>
            <p><strong>Label:</strong> {{ displayedElement.node0_label }}</p>
            <p><strong>ID:</strong> {{ displayedElement.to }}</p>
            <p><strong>Type:</strong> {{ displayedElement.node0_type }}</p>
            <p>&nbsp;</p>
            <p><strong>Node 1</strong></p>
            <p><strong>Label:</strong> {{ displayedElement.node1_label }}</p>
            <p><strong>ID:</strong> {{ displayedElement.from }}</p>
            <p><strong>Type:</strong> {{ displayedElement.node1_type }}</p>
            <!-- Add more fields specific to 'external' here -->
          </template>
        </template>
      </template>
      <!-- No element selected message -->
      <p v-else>No element selected, you can select a node or an edge</p>
    </div>
    <div class="panel-container2">
      <div class="panel">
        <div class="panel-header">
          <h2 title="These network nodes are selected and can be used for ...">Highlighted Nodes</h2>
        </div>
        <div class="panel-content">
          <div class="node-selection">
            <ul v-if="selectedNodes.length" class="dropdown" ref="dropdown">
              <li v-for="(item, index) in selectedNodes" @click="BoxClickEvent2(item, $event)"
                :key="index" @mouseover="hoverNode(item)" @mouseleave="hoverNode(null)">
                {{ item.display_name }}
                <span class="remove-node" @click="RemoveNetworkNode2(item)">✖</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <button class="btn-update-network" @click="addInternalNodes()" title="Click to add nodes that are significantly correlated with the selected node">Add Connected Nodes</button>
    <div id="messageContainer" style="position: absolute;"></div>
  </div>
</template>


<script>
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';
import axios from 'axios';
import { groups } from './networkData';



export default {
  data() {
    return {
      searchText: '',
      typeaheadresult: [],
      hoveredItem: [],
      tooltipStyle: {},
      dropdownNodes: [],
      networkNodes: [],
      networkEdges: [],
      network_nodes: [],
      network_edges: [],
      displayedElement: null,
      displayedElementType: null,
      selectedNodes : [],
      l : '3',
      allConnectedNodes : [],
      allInternalEdges : [],
      allExternalEdges : [],
      externalNetworkNodes : [],
      groups : groups
    };
  },
  methods: {
    generateLink(xref) {
      switch (this.displayedElement.source_table) {
        case 'cohort_protein':
          return `https://www.uniprot.org/uniprotkb/${xref}`;
        case 'cohort_metabolite':
          return `https://hmdb.ca/metabolites/${xref}`;
        case 'cohort_phenotype':
          return `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${xref}`;
        default:
          return '#';  // default case if source_table doesn't match
      }
    },

    async fetchData() {
      if (this.searchText) {
        try {
          const response = await axios.get(`http://localhost:8000/network/api/getTypeaheadResults/?s=${encodeURIComponent(this.searchText)}`);
          const items = Object.entries(response.data).map(([id, details]) => ({
            id,
            display_name: details.display_name,
            description: details.description,
            source_table: details.source_table,
          }));
          this.typeaheadresult = items;
        } catch (error) {
          console.error('Error fetching data:', error);
          this.typeaheadresult = [];
        }
      } else {
        this.typeaheadresult = [];
      }
      this.dropdownNodes = [];
      this.typeaheadresult.forEach(node => {
            const nodeExistsInNetwork = this.networkNodes.some(networkNode => networkNode.id === node.id);
            if (!nodeExistsInNetwork) {this.dropdownNodes.push(node);}})
    },

    async addInternalNodes() {
      if (this.displayedElementType === "node") {
        const selID = this.displayedElement.id;
        const connected_edges = this.allInternalEdges.filter(edge =>
          edge.from === selID || edge.to === selID);

        // Use a for...of loop to await each asynchronous operation
        for (const connected_edge of connected_edges) {
          const node0 = this.allConnectedNodes.find(node => node.id === connected_edge.from);
          const node1 = this.allConnectedNodes.find(node => node.id === connected_edge.to);
          if (node0 && !this.networkNodes.some(lno => lno.id === node0.id)) {
            await this.addNodeToNetwork(node0); // Await here
          }
          if (node1 && !this.networkNodes.some(lno => lno.id === node1.id)) {
            await this.addNodeToNetwork(node1); // Await here
          }}}
          else {
            // Display the message on the webpage
            const messageContainer = document.getElementById("messageContainer");
            if (messageContainer) {
              messageContainer.innerHTML = "Please select a node to add connected nodes.";
              
              // Position the message and style it
              messageContainer.style.left = "280px";
              messageContainer.style.top = "650px";
              messageContainer.style.color = "black";
              messageContainer.style.fontWeight = "bold";
              messageContainer.style.backgroundColor = "lightblue";
              messageContainer.style.padding = "10px";
              messageContainer.style.border = "2px solid black";
              messageContainer.style.borderRadius = "5px";
              messageContainer.style.display = "block"; // Ensure the message is visible

              // Remove the message after 3 seconds
              setTimeout(() => {
                messageContainer.innerHTML = "";
                messageContainer.style.display = "none"; // Hide the container after clearing
              }, 3000); // Clears the message after 3 seconds
            }
          } 
    },


    async fetchEdges(node) {
      const nodeID = node.id;
      const source_table = node.source_table;
      const type = source_table.split('_')[1];
      const api_string = 'http://localhost:8000/network/api/getNetwork/?q='+nodeID+'&t='+type+'&l='+this.l
      try {
          const response = await axios.get(api_string);

          const nodes = response.data.Nodes;

          for (const key in nodes) {
            if (Array.isArray(nodes[key])) {
              nodes[key].forEach(node => {
                if (!this.allConnectedNodes.some(locnode => locnode.id === node.id)) {
                  this.allConnectedNodes.push(node)}})}};

          // save the node xref
          const loc_nodes = response.data.Nodes[source_table];
          const xrefs = null;
          try {xrefs = loc_nodes.find(function(currentNode) {return currentNode.id === nodeID;}).xrefs} catch (error) {};

          const edges = response.data.Edges;
          const externalEdges = response.data["External Edges"];

          for (const key in edges) {
            if (Array.isArray(edges[key])) {
              edges[key].forEach(edge => {
                const renamedEdge = Object.entries(edge).reduce((acc, [k, v]) => {
                  if (k.includes('_id')) {if (!acc.from) {acc.from = v;} else {acc.to = v;}
                  } else {acc[k] = v; } return acc; }, {});
                const edgeExists = this.allInternalEdges.some(existingEdge => existingEdge.id === edge.id);
                if (!edgeExists) {this.allInternalEdges.push({ ...renamedEdge, type: key, set: 'cohort',
                  color:'black', width:-Math.log10(renamedEdge.p_value)*1.5
                 });}
            })}};

          externalEdges.forEach(edge => {this.allExternalEdges.push({ ...edge, set: 'external', to: edge.source_cohort_id,
            from: edge.target_cohort_id})});

          return xrefs;
      } catch (error) {
          console.error('Error fetching edges:', error);
          return null;
      }
    },

    filterForNetworkEdges() {
      // Step 1: Filter internal edges based on network nodes
      this.networkEdges = this.allInternalEdges.filter(edge =>
        this.networkNodes.some(selectedNode => selectedNode.id === edge.from) &&
        this.networkNodes.some(selectedNode => selectedNode.id === edge.to)
      );

      // Step 2: Add external edges with additional properties
      this.allExternalEdges.forEach(edge => {
        if (this.networkNodes.some(node => node.id === edge.from) && this.networkNodes.some(node => node.id === edge.to)) {
          this.networkEdges.push({ ...edge, color: 'grey', dashes: [10, 10], width: 6 });
        }
      });

      // Step 3: Remove duplicates considering edges as undirected
      const uniqueEdges = new Set();
      this.networkEdges = this.networkEdges.filter(edge => {
        // Create a normalized key where the smaller node ID comes first
        const key = [edge.from, edge.to].sort().join('-');
        if (!uniqueEdges.has(key)) {
          uniqueEdges.add(key);
          return true;
        }
        return false;
      });

      console.log(this.networkEdges);
    },

    capitalizeFirstLetter(str) {
      if (typeof str !== 'string' || str.length === 0) return str;
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    hoverNode(item) {
      this.hoveredItem = item;
      if (item) {
        this.calculateTooltipPosition(); }},
      calculateTooltipPosition() {
      if (this.$refs.dropdown) {
        this.tooltipStyle = {
          position: 'fixed',
          top: `150px`, // Position below the dropdown
          left: `200px`,  // Align with the left edge of the dropdown
          width: `200px`, }; } },

    async addNodeToNetwork(node){
      //console.log(node)
      this.hoverNode(null);
      this.dropdownNodes = this.dropdownNodes.filter(function(currentNode) {return currentNode !== node;});
      await this.fetchEdges(node)
      const conNode = await this.allConnectedNodes.find(locnode => locnode.id === node.id)
      if (conNode === undefined){
        this.networkNodes.push(node);
      } else {
        this.networkNodes.push(conNode);
      }
      await this.initializeNetwork();
      await this.updateHighlighting();
    },




    BoxClickEvent(node, event) {
      if (!event.target.classList.contains('remove-node')) {
        this.displayNode(node);
        this.updateHighlighting()}
    },
    RemoveNetworkNode(node) {
      this.networkNodes = this.networkNodes.filter(function(currentNode) {return currentNode !== node;});
      if (this.selectedNodes.includes(node)) {
        this.selectedNodes = this.selectedNodes.filter(function(selectedNode) {return selectedNode !== node;});};
      this.dropdownNodes.push(node);
      this.initializeNetwork();
      this.updateHighlighting();
    },
    BoxClickEvent2(node, event) {
      if (!event.target.classList.contains('remove-node')) {
        this.displayNode(node);
        this.updateHighlighting() }
    },
    RemoveNetworkNode2(node) {
      this.selectedNodes = this.selectedNodes.filter(function(currentNode) {return currentNode !== node;});
      this.hoverNode(null);
      this.updateHighlighting()
    },


    // Network stuff

    initializeNetwork() {
      const options = {}
      const container = this.$refs.network;
        if (!container) return;

      this.filterForNetworkEdges()

      this.network_nodes = new DataSet(this.networkNodes);
      this.network_edges = new DataSet(this.networkEdges);

      const data = { nodes: this.network_nodes, edges: this.network_edges};

      this.network = new Network(container, data, options);

      this.network.on("click", function (params) {
        if (params.nodes.length === 1) {
          const clickedNode = this.networkNodes.find(currentNode => currentNode.id === params.nodes[0]);
          this.displayNode(clickedNode);
        } else if (params.edges.length === 1) {
          const clickedEdge = this.networkEdges.find(currentEdge => currentEdge.id === params.edges[0]);
          this.displayEdge(clickedEdge);
        } else {
          this.displayNode(null);
          this.displayedElement = null;
          this.displayedElementType = null;        }
          this.updateHighlighting()
      }.bind(this));

      this.network.on("doubleClick", function (params) {
        if (params.nodes.length === 1) {
          const clickedNode = this.networkNodes.find(currentNode => currentNode.id === params.nodes[0]);
          if (this.selectedNodes.includes(clickedNode)) {
            this.selectedNodes.splice(this.selectedNodes.indexOf(clickedNode), 1);
          } else { this.selectedNodes.push(clickedNode);}
          this.displayNode(clickedNode);
          this.updateHighlighting()
        }
      }.bind(this));
    },

    displayNode(node){
      this.displayedElement = node
      this.displayedElementType = 'node'
    },
    displayEdge(edge) {
      const nodeID0 = edge.to
      const nodeID1 = edge.from
      const node0 = this.networkNodes.find(node => node.id === nodeID0);
      const node1 = this.networkNodes.find(node => node.id === nodeID1);
      edge.node0_descr = node0.description
      edge.node1_descr = node1.description
      edge.node0_label = node0.display_name
      edge.node1_label = node1.display_name
      edge.node0_type = this.capitalizeFirstLetter(node0.source_table.split('_')[1])
      edge.node1_type = this.capitalizeFirstLetter(node1.source_table.split('_')[1])
      this.displayedElement = edge
      this.displayedElementType = 'edge'
    },

    updateHighlighting() {
      const updateNodes = this.network_nodes.get().map(node => {
        return { ...node, color:groups[node.source_table].color, shape: "square", size:15,
        borderWidth: 0,
        };
      });
      const updateNodes2 = updateNodes.map(node => {
        if (this.displayedElementType === 'node' && this.displayedElement.id === node.id) {
          node.size = 22
        }
        return { ...node};});
      const updateNodes3 = updateNodes2.map(node => {
        if (this.selectedNodes.some(n => n.id === node.id)) {
            node.color = this.adjustBrightness(node.color, 0.5);
            node.shape = 'diamond'
            node.size = node.size*1.3
           };              
        return { ...node};});

      this.network_nodes.update(updateNodes3);
    },
    hexToRgb(hex) {
      let bigint = parseInt(hex.slice(1), 16);
      let r = (bigint >> 16) & 255;
      let g = (bigint >> 8) & 255;
      let b = bigint & 255;
      return [r, g, b];
    },
    rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    adjustBrightness(hex, factor) {
      let [r, g, b] = this.hexToRgb(hex);
      r = Math.min(255, Math.floor(r + (255 - r) * factor));
      g = Math.min(255, Math.floor(g + (255 - g) * factor));
      b = Math.min(255, Math.floor(b + (255 - b) * factor));
      return this.rgbToHex(r, g, b);
    },
    getShapeStyle(color) {return { backgroundColor: color, width: '20px', height: '20px' };},
  }
}
</script>













<style scoped>
.outer-container {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.panel-container {
  width: 200px;
  height: 100%;
  display: flex;
  flex-direction: column; /* Stack panels vertically */
}
.panel-container2 {
  position: absolute;
  left: 1030px;
  width: 200px;
  height: 100%;
  display: flex;
  flex-direction: column; /* Stack panels vertically */
}

.panel {
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
  border-radius: 5px 5px 0 0;
}

.panel-content {
  padding: 10px;
}

/* Changes the fotn size of the titles of the panels */
h2, h3 {
  margin: 0;
  font-size: 18px;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  cursor: pointer;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

li:not(.selected):hover {
  background-color: #f0f0f0;
}

.selected {
  background-color: #4CAF50;
  color: white;
}

.not-selected {
  background-color: white;
  color: black;
}

.selected-node {
  background-color: #f9f9f9;
  margin-bottom: 5px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remove-node {
  position: absolute;
  right: 5px; /* Adjust the distance from the right edge */
  color: red;
  cursor: pointer;
  font-size: 20px;
}


.selected-nodes-text {
  margin-top: 10px;
  padding: 0px;
  background-color: #f0f0f0;
  border: 0px solid #ccc;
  border-radius: 0px;
  width: 0px;
  height: 0px;
}

.dropdown {
  background-color: #f4f4f4;
  border: 1px solid #ccc;
  border-radius: 5px;
  list-style-type: none;
  margin: 0;
  padding: 10px;
  max-height: 250px;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
  position: relative;
}

.dropdown li {
  padding: 8px 12px;
  cursor: pointer;
}

.dropdown li:hover {
  background-color: #e9e9e9;
}

.tooltip {
  background-color: #333;
  color: #fff;
  padding: 10px;
  border-radius: 5px;
  white-space: pre-wrap;
  z-index: 1000;
}


/* The Network */
.network-container {
  height: 700px; /* Make sure the container has a height */
  width: 500px; /* Ensure it takes up the full width */
  padding: 5px;
  border-radius: 10px;
}

#network {
  flex: 1;
  height: 600px;
  width: 480px;
  border: 6px solid lightgray;
  border-radius: 15px;
}

/* The info pannel */
.info-panel {
  width: 290px;
  height: 600px;
  padding: 20px;
  background-color: #f0f0f0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1;
  border-radius: 10px;
}

.btn-update-network {
  position: absolute;
  top:750px;
  left:260px;
  background-color: #1d4cc2;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;}
.btn-update-network:hover {background-color: #173a96}
.btn-update-network:active {transform: scale(0.95)}


.legend {
  position: absolute;
  top: 155px;
  left: 245px;
  padding: 10px;
  background-color: #cfcfcf8f;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: left;
  border-radius: 10px;
}
.legend-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
}



.legend2 {
  position: absolute;
  top: 255px;
  left: 245px;
  padding: 10px;
  background-color: #cfcfcf8f;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: left;
  border-radius: 10px;
}

.solid-line {
  width: 30px;
  height: 2px;
  background-color: black;
}

.dashed-line {
  width: 30px; /* Adjust width as needed */
  height: 2px;
  border-bottom: 3px dashed black;
}

.legend-text {
  margin-left: 10px;
  font-size: 14px;
}


</style>

http://localhost:8000/network/api/getNetwork/?q=x0so7614&t=protein&l=3
http://localhost:8000/network/api/getNetwork/?q=x0ff209&t=phenotype&l=3

x0so7614 
x0so4898

x0ff209

x0so4898, x0so7614