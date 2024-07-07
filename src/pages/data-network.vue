<template>
  <div class="outer-container">
    <div class="panel-container">
      <div class="panel">
        <div class="panel-header" @click="togglePanel('nodeSelection')">
          <h2>{{ nodeSelectionCollapsed ? 'Node Selection ▶' : 'Node Selection ▼' }}</h2>
        </div>
        <div v-show="!nodeSelectionCollapsed" class="panel-content">
          <div class="node-type-selection">
            <label class="node-type">
              <input type="radio" v-model="filterType" value="all">
              <span class="custom-radio"></span> All
            </label>
            <label class="node-type">
              <input type="radio" v-model="filterType" value="Protein">
              <span class="custom-radio"></span> Protein
            </label>
            <label class="node-type">
              <input type="radio" v-model="filterType" value="Metabolites">
              <span class="custom-radio"></span> Metabolites
            </label>
            <label class="node-type">
              <input type="radio" v-model="filterType" value="Phenotypes">
              <span class="custom-radio"></span> Phenotypes
            </label>
            <label class="node-type">
              <input type="radio" v-model="filterType" value="Disorder">
              <span class="custom-radio"></span> Disorder
            </label>
            <label class="node-type">
              <input type="radio" v-model="filterType" value="Genes">
              <span class="custom-radio"></span> Genes
            </label>
          </div>
          <div class="node-selection">
            <input type="text" v-model="filterText" placeholder="Filter nodes by label..." class="filter-input">
            <div class="node-list">
              <ul>
                <li v-for="node in filteredNodes.slice(0, 5)" :key="node.id" @click="selectNode(node)"
                    :class="{ 'selected': isSelected(node), 'not-selected': !isSelected(node) }"
                    @mouseover="hoverNode(node)"
                    @mouseleave="leaveNode(node)">
                  {{ node.label }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>



      <div class="panel">
        <div class="panel-header" @click="togglePanel('selectedNodes')">
          <h2>{{ selectedNodesCollapsed ? 'Selected Nodes ▶' : 'Selected Nodes ▼' }}</h2>
        </div>
        <div v-show="!selectedNodesCollapsed" class="panel-content">
          <div class="selected-nodes">
            <div class="selected-node-list">
              <ul>
                <li v-for="selectedNode in sortedSelectedNodes" :key="selectedNode.id" class="selected-node" 
                ref="selectedNodeItem" @click="BoxClickEvent(selectedNode, $event)">
                  {{ selectedNode.label }}
                  <span class="remove-node" @click="toggleSelect(selectedNode)">✖</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Legend -->
  <div class="legend">
    <div v-for="(group, key) in groups" :key="key" class="legend-item">
      <div class="legend-color" :style="getShapeStyle(group.shape, group.color)"></div>
      <span>&nbsp;&nbsp;{{ key }}</span>
    </div>
  </div>

  <div class="network-container">
    <!-- Network Visualization -->
    <div ref="network" id="network"></div>
  </div>


  <!-- Info Panel -->
  <div class="info-panel">
    <h2 v-if="selectedElement">Selected Element</h2>
    <template v-if="selectedElement">
      <!-- Display selected node or edge details -->
      <p v-if="selectedElement.type === 'node'">Label: {{ selectedElement.label }}</p>
      <p v-if="selectedElement.type === 'node'">Type: {{ selectedElement.nodeType }}</p>
      <template v-else>
        <p>Connected Nodes: {{ selectedElement.nodeA }} - {{ selectedElement.nodeB }}</p>
        <p>Edge P-value: {{ selectedElement.p_value.toFixed(3) }}</p>
      </template>
    </template>
    <!-- No element selected message -->
    <p v-else>No element selected</p>
  </div>

  <div class="panel2">
      <div class="panel-header" @click="togglePanel('selectedNetNodes')">
        <h2>{{ selectedNetNodesCollapsed ? 'Selected Nodes ▶' : 'Selected Nodes ▼' }}</h2>
      </div>
      <div v-show="!selectedNetNodesCollapsed" class="panel-content">
        <div class="selected-nodes2">
          <div class="selected-node-list2">
            <ul>
                <li v-for="selectedNetNode in sortedSelectedNetNodes" :key="selectedNetNode.id" class="selected-node" 
                ref="selectedNodeItem" @click="BoxClickEvent(selectedNetNode, $event)">
                  {{ selectedNetNode.label }}
                  <span class="remove-node" @click="toggleNetSelect(selectedNetNode)">✖</span>
                </li>
              </ul>
          </div>
        </div>
      </div>
  </div>


  <button class="btn-update-network" @click="showSelectedNodesText">Update Network</button>
  <button class="btn-update-network2" @click="deselectAllNetNodes">Deselect all</button>
  <button class="btn-update-network3" @click="toggleSelectButton(this.selectedElement)">Remove Node</button>
  <button class="btn-update-network5" @click="AddEgdes(this.selectedElement)">Add Edges</button>
  <button class="btn-update-network6" @click="toggleSelect2()">Remove sel. Nodes</button>
  <button class="btn-update-network7" @click="">G-Profiler</button>

  
  <!-- Display selected nodes text for 5 seconds -->
  <div v-if="displaySelectedNodesText" class="selected-nodes-text">
  </div>
</template>

<script>
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';
import { nodeSelData } from './networkData2';
import { groups, nodeData, edgeData, options } from './networkData';

export default {
  data() {
    return {
      nodes: nodeSelData,
      filterText: '',
      filterType: 'all',
      selectedNodes: [],
      nodeSelectionCollapsed: false,
      selectedNodesCollapsed: false,
      selectedNetNodesCollapsed: false,
      displaySelectedNodesText: '',
      network: null,
      net_nodes: [],
      net_edges: [],
      groups,
      selectedElement: null,
      isDragging: false,
      selectedNetNodes: [],
      selectedElementBefore: null,
    };
  },
  mounted() {
    this.$nextTick(this.initializeNetwork);
  },
  computed: {
    filteredNodes() {
      if (!this.filterText) {
        return [];
      }
      const filtered = this.nodes.filter(node => {
        return (this.filterType === 'all' || node.group === this.filterType) &&
               !this.isSelected(node) &&
               node.label.toLowerCase().startsWith(this.filterText.toLowerCase());
      });
      return filtered;
    },
    sortedSelectedNodes() {
      return this.selectedNodes.slice().sort((a, b) => {
        return a.label.localeCompare(b.label); // Sort alphabetically by label
      });
    },
    sortedSelectedNetNodes() {
      return this.selectedNetNodes.slice().sort((a, b) => {
        return a.label.localeCompare(b.label); // Sort alphabetically by label
      });
    },
},
  methods: {
    selectNode(node) {
      if (!this.isSelected(node)) {
        this.selectedNodes.push(node);
      }
      this.showSelectedNodesText();
      this.highlightNodes()
    },

    toggleSelect(node) {
      const index = this.selectedNodes.findIndex(n => n.id === node.id);
      if (index !== -1) {
        this.selectedNodes.splice(index, 1);
      } else {
        this.selectedNodes.push(node);
      };
      const index2 = this.selectedNetNodes.findIndex(n => n.id === node.id);
      if (index2 !== -1) {
        this.selectedNetNodes.splice(index2, 1);
      } ;
      this.selectedElement = null;
      this.showSelectedNodesText();
      this.highlightNodes()},
    toggleSelectButton(node) {
      if (node !== null && node.type === 'node') {
      const index = this.selectedNodes.findIndex(n => n.id === node.id);
      if (index !== -1) {
        this.selectedNodes.splice(index, 1);
      } else {
        this.selectedNodes.push(node);
      };
      const index2 = this.selectedNetNodes.findIndex(n => n.id === node.id);
      if (index2 !== -1) {
        this.selectedNetNodes.splice(index2, 1);
      } ;
      this.selectedElement = null;
      this.showSelectedNodesText();
      this.highlightNodes()
    }},
    toggleSelect2() {
      const copy_of_NetNodes = [...this.selectedNetNodes];
      copy_of_NetNodes.forEach(node => {
      const index = this.selectedNetNodes.findIndex(n => n.id === node.id);
      this.selectedNetNodes.splice(index, 1);
      const index2 = this.selectedNodes.findIndex(n => n.id === node.id);
      this.selectedNodes.splice(index2, 1);})
      this.showSelectedNodesText();
      this.highlightNodes()
    },



    BoxClickEvent(node, event) {
      if (!event.target.classList.contains('remove-node')) {
          this.selectedElement = { type: 'node', label: node.label, nodeType: node.group, id:node.id };
          this.highlightNodes()
      }
    },

    toggleNetSelect(node) {
      const index = this.selectedNetNodes.findIndex(n => n.id === node.id);
      if (index !== -1) {
        this.selectedNetNodes.splice(index, 1);
      } else {
        this.selectedNetNodes.push(node);
      }
      this.highlightNodes()
    },

    AddEgdes (selectedElement){
      if (selectedElement !== null && selectedElement.type === 'node') {


      if (selectedElement.type === 'node') {
    // Find edges connected to the selected node
    const new_edges = edgeData.filter(edge => edge.from === selectedElement.id || edge.to === selectedElement.id);
    

    // Extract unique node IDs from new_edges
    const new_node_ids = [];
    new_edges.forEach(edge => {
      new_node_ids.push(edge.from);
      new_node_ids.push(edge.to);
      });

    nodeData.forEach(node => {
      if (new_node_ids.includes(node.id) && !this.selectedNodes.some(selectedNode => selectedNode.id === node.id)) {
        this.selectedNodes.push(node)
      }
    });
    this.initializeNetwork()
    this.highlightNodes()
  }
  }},



    isSelected(node) {
      return this.selectedNodes.some(n => n.id === node.id);
    },
    hoverNode(node) {
      if (!this.isSelected(node)) {
        // Add hover effect only if the node is not selected
      }
    },
    leaveNode(node) {
      // Reset any hover effects if needed
    },
    togglePanel(panel) {
      //if (panel === 'nodeSelection') {
      //  this.nodeSelectionCollapsed = !this.nodeSelectionCollapsed;
      //} else if (panel === 'selectedNodes') {
      //  this.selectedNodesCollapsed = !this.selectedNodesCollapsed;
      //} else if (panel === 'selectedNetNodes') {
      //  this.selectedNetNodesCollapsed = !this.selectedNetNodesCollapsed;
      //}
    },
    showSelectedNodesText() {
      this.displaySelectedNodesText = this.selectedNodes.map(node => node.label).join(', ');
      this.clearSelectedNodesText();
      this.initializeNetwork()
    },
    clearSelectedNodesText() {
      setTimeout(() => {
        this.displaySelectedNodesText = '';
      }, 5000); // Clear after 5 seconds
    },



    handleDoubleClick(event) {
      if (event.nodes.length > 0) {
        const nodeId = event.nodes[0];
        const node = this.nodes.find((n) => n.id === nodeId);
        const selectedIndex = this.selectedNetNodes.findIndex(n => n.id === nodeId);

        if (selectedIndex === -1) {
          // Node is not in the selected list, add it
          this.selectedNetNodes.push(node);
        } else {
          // Node is in the selected list, remove it
          this.selectedNetNodes.splice(selectedIndex, 1);
        }
        this.highlightNodes();
        }
      },

    initializeNetwork() {
      const container = this.$refs.network;
      if (!container) return;

      const filteredNodes = nodeData.filter(node =>
        this.selectedNodes.some(selectedNode => selectedNode.id === node.id)
      );

      const annotated_nodes = filteredNodes.map(node => ({
        ...node,
        ...groups[node.group]
      }));

      const filteredEdges = edgeData.filter(edge =>
        this.selectedNodes.some(selectedNode => selectedNode.id === edge.from) &&
        this.selectedNodes.some(selectedNode => selectedNode.id === edge.to)
      );

      this.net_nodes = new DataSet(annotated_nodes);
      this.net_edges = new DataSet(filteredEdges);

      const data = { nodes: this.net_nodes, edges: this.net_edges};

      this.network = new Network(container, data, options);

      this.network.on('selectNode', params => {
          const selectedNode = this.net_nodes.get(params.nodes[0]);
          this.selectedElement = { type: 'node', label: selectedNode.label, nodeType: selectedNode.group, id:selectedNode.id };
          this.highlightNodes()
      }),
      this.network.on("click", function (params) {
        if (params.nodes.length === 0 && (params.edges === undefined || params.edges.length === 0)) {
          this.selectedElement = null,
          this.highlightNodes()}
      }.bind(this));

      this.network.on('selectEdge', params => {
        const edge = this.net_edges.get(params.edges[0]);
        this.selectedElement = {type: 'edge',
          nodeA: this.net_nodes.get(edge.from).label,
          nodeB: this.net_nodes.get(edge.to).label,
          p_value: edge.p_value
        };
        this.highlightNodes()
      });
      this.network.on('deselectNode', () => {
        this.clearSelection();
        this.highlightNodes();
      });
      this.network.on('deselectEdge', this.clearSelection);
      this.network.on('doubleClick', this.handleDoubleClick);



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


    highlightNodes() {
        const selEl = this.selectedElement;
        if (selEl && selEl.type === "node") {
          const updateNodes = this.net_nodes.get().map(node => {
            if (this.selectedNetNodes.some(n => n.id === node.id) && node.id === selEl.id) {
              const localcolor = this.adjustBrightness(groups[node.group].color, 0.5);
              return { ...node, size: 65, color:localcolor, shape: "diamond" };
            } else if (node.id === selEl.id) {
              const localcolor = this.adjustBrightness(groups[node.group].color, 0.5);
              return { ...node, size: 45, color:localcolor, shape: "square" };
            }else if (this.selectedNetNodes.some(n => n.id === node.id)) {
              const localcolor = groups[node.group].color;
              return { ...node, size: 50, color:localcolor, shape: "diamond" };
            } else {
              const localcolor = groups[node.group].color;
              return { ...node, size: 30, color:localcolor, shape: 'square' };
            }
          })
          this.net_nodes.update(updateNodes);
        } else {
          const updateNodes =  this.net_nodes.get().map(node => {
            if (this.selectedNetNodes.some(n => n.id === node.id)) {
              const localcolor = groups[node.group].color;
              return { ...node, size: 50, color:localcolor, shape: "diamond" };
            } else {
              const localcolor = groups[node.group].color;
              return { ...node, size: 30, color:localcolor, shape:'square' };
            }
        })
        this.net_nodes.update(updateNodes);
      }
    },


    clearSelection() {this.selectedElement = null,
      this.highlightNodes()
    },

    getShapeStyle(shape, color) {
      switch (shape) {
        case 'circle':
          return { backgroundColor: color, width: '20px', height: '20px', borderRadius: '50%' };
        case 'box':
        case 'square':
          return { backgroundColor: color, width: '20px', height: '20px' };
        case 'triangle':
          return {
            width: '0',
            height: '0',
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: `20px solid ${color}`
          };
        case 'diamond':
          return {
            backgroundColor: color,
            width: '14px',
            height: '14px',
            transform: 'rotate(45deg)'
          };
        default:
          return {};
      }
    },

    deselectAllNetNodes() {
      this.selectedNetNodes = [];
      this.selectedElement = null;
      this.highlightNodes()
    },
  },
  beforeDestroy() {
    if (this.network) this.network.destroy();
    this.nodes.off('*');
  }
};
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

.node-type-selection {
  margin-bottom: 10px;
}

/* Stacks the sectable radio labels */
.node-type {
  display: block;
  margin-bottom: 5px;
}

/* For the radio labels */
.node-type input[type="radio"] {
  display: none;
}
.custom-radio {
  width: 16px;
  height: 16px;
  border: 2px solid #aaa; /* Gray border */
  border-radius: 50%; /* Circle shape */
  display: inline-block;
  margin-right: 10px;
  position: relative;
  cursor: pointer;
}

.node-type input[type="radio"]:checked + .custom-radio::before {
  content: '';
  width: 8px;
  height: 8px;
  background-color: #000000; /* Black circle when selected */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%; /* Circle shape */
}

/* Changes the fotn size of the titles of the panels */
h2, h3 {
  margin: 0;
  font-size: 18px;
}

/* For the text input panel */
.filter-input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.node-list {
  overflow-y: auto;
  max-height: 100px;
}

.selected-node-list {
  overflow-y: auto;
  max-height: 200px;
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
  color: red;
  cursor: pointer;
  font-size: 14px;
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

/* The Legend */

.legend {
  position: absolute;
  top: 130px;
  left: 260px;
  padding: 10px;
  background-color: #cfcfcf8f;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: left;
  border-radius: 10px;
}

.legend h3 {
  margin: 0;
}

.legend-item {
  display: flex;
  align-items: left;
  margin-top: 0px;
  padding: 3px;
}


/* The Network */
.network-container {
  height: 550px; /* Make sure the container has a height */
  width: 50%; /* Ensure it takes up the full width */
  padding: 5px;
  border-radius: 10px;
}

#network {
  flex: 1;
  height: 100%;
  width: 100%;
  border: 6px solid lightgray;
  border-radius: 15px;
}

/* The info pannel */
.info-panel {
  width: 12%;
  height: 500px;
  padding: 20px;
  background-color: #f0f0f0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1;
  border-radius: 10px;
}

/* The Network Node Selection */
.panel2 {
  width: 200px;
  height: 500px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  padding: 10px;
}

.selected-node-list2 {
  overflow-y: auto;
  max-height: 400px;
}



.btn-update-network {
  position: absolute;
  top:600px;
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

.btn-update-network2 {
  position: absolute;
  top:550px;
  left:260px;
  background-color: #1d4cc2;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;}
.btn-update-network2:hover {background-color: #173a96}
.btn-update-network2:active {transform: scale(0.95)}

.btn-update-network3 {
  position: absolute;
  top:500px;
  left:260px;
  background-color: #1d4cc2;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;}
.btn-update-network3:hover {background-color: #173a96}
.btn-update-network3:active {transform: scale(0.95)}

.btn-update-network5 {
  position: absolute;
  top:450px;
  left:260px;
  background-color: #1d4cc2;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;}
.btn-update-network5:hover {background-color: #173a96}
.btn-update-network5:active {transform: scale(0.95)}

.btn-update-network6 {
  position: absolute;
  top:400px;
  left:260px;
  background-color: #1d4cc2;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;}
.btn-update-network6:hover {background-color: #173a96}
.btn-update-network6:active {transform: scale(0.95)}

.btn-update-network7 {
  position: absolute;
  top:350px;
  left:260px;
  background-color: #1d4cc2;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;}
.btn-update-network7:hover {background-color: #173a96}
.btn-update-network7:active {transform: scale(0.95)}

</style>