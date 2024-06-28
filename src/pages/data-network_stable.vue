<template>
  <div class="network-container">
    <div class="overview-panel">
      <h2>Network Overview</h2>
      <div class="count-box">
        <div class="count-item">
          <p class="count-label">Nodes</p>
          <div class="count-value">
            <span>{{ countProteins }}</span>
            <span> (Proteins)</span>
          </div>
          <div class="count-value">
            <span>{{ countMetabolites }}</span>
            <span> (Metabolites)</span>
          </div>
        </div>
        <div class="count-item">
          <p class="count-label">Edges</p>
          <p class="count-value">{{ edges.length }}</p>
        </div>
      </div>
    </div>
    <div ref="network" id="network"></div>
    <div class="info-panel">
      <h2 v-if="selectedElement">Selected Element</h2>
      <template v-if="selectedElement">
        <p v-if="selectedElement.type === 'node'">Label: {{ selectedElement.label }}</p>
        <template v-else>
          <p>Connected Nodes: {{ selectedElement.nodeA }} - {{ selectedElement.nodeB }}</p>
          <p>Edge P-value: {{ selectedElement.p_value.toFixed(3) }}</p>
        </template>
      </template>
      <p v-else>No element selected</p>
    </div>
  </div>
</template>

<script>
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';

export default {
  name: 'DataNetwork',
  data() {
    return {
      network: null,
      nodes: [],
      edges: [],
      selectedElement: null, // To store currently selected node or edge
      countProteins: 0,
      countMetabolites: 0
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.initializeNetwork();
    });
  },
  methods: {
    initializeNetwork() {
      const container = this.$refs.network;

      if (!container) {
        console.error('Container element not found');
        return;
      }

      // Define nodes (proteins and metabolites)
      this.nodes = new DataSet([
        { id: 1, label: 'EGFR', shape: 'circle', color: '#4CAF50', size: 30 }, // Protein: Epidermal growth factor receptor (Green)
        { id: 2, label: 'TP53', shape: 'circle', color: '#4CAF50', size: 30 }, // Protein: Tumor protein p53 (Green)
        { id: 3, label: 'Glucose', shape: 'box', color: '#FF9800', size: 35 }, // Metabolite: Glucose (Orange)
        { id: 4, label: 'ATP', shape: 'box', color: '#FF9800', size: 35 }, // Metabolite: ATP (Orange)
        { id: 5, label: 'Insulin', shape: 'circle', color: '#4CAF50', size: 30 }, // Protein: Insulin (Green)
        { id: 6, label: 'Pyruvate', shape: 'box', color: '#FF9800', size: 35 } // Metabolite: Pyruvate (Orange)
      ]);

      // Define edges with p_value between 0 and 0.05
      this.edges = new DataSet([
        { from: 1, to: 2, p_value: 0.01 },
        { from: 1, to: 3, p_value: 0.03 },
        { from: 2, to: 4, p_value: 0.02 },
        { from: 1, to: 5, p_value: 0.015 }, // Edge from EGFR to Insulin
        { from: 5, to: 6, p_value: 0.025 } // Edge from Insulin to Pyruvate
      ]);

      const data = {
        nodes: this.nodes,
        edges: this.edges
      };

      const options = {
        interaction: {
          multiselect: false,
          selectConnectedEdges: false,
          dragView: true, // Enable dragging the view upon node selection
          dragNodes: true // Enable dragging nodes
        },
        nodes: {
          shape: 'dot',
          font: {
            size: 12,
            color: '#ffffff'
          },
          borderWidth: 2,
          widthConstraint: 40,
          heightConstraint: 40
        },
        edges: {
          width: 2
        }
      };

      this.network = new Network(container, data, options);

      this.updateNodeCounts(); // Update initial node counts

      this.network.on('selectNode', (params) => {
        const selectedNodeId = params.nodes[0];
        const selectedNode = this.nodes.get(selectedNodeId);
        if (selectedNode.shape === 'circle') {
          this.selectedElement = {
            type: 'node',
            label: selectedNode.label
          };
        } else if (selectedNode.shape === 'box') {
          this.selectedElement = {
            type: 'node',
            label: selectedNode.label
          };
        }
      });

      this.network.on('selectEdge', (params) => {
        const selectedEdgeId = params.edges[0];
        const edge = this.edges.get(selectedEdgeId);
        if (edge) {
          const nodeA = this.nodes.get(edge.from);
          const nodeB = this.nodes.get(edge.to);
          this.selectedElement = {
            type: 'edge',
            nodeA: nodeA.label,
            nodeB: nodeB.label,
            p_value: edge.p_value
          };
        } else {
          this.selectedElement = null; // Edge not found, reset selectedElement
        }
      });

      this.network.on('deselectNode', () => {
        this.selectedElement = null;
      });

      this.network.on('deselectEdge', () => {
        this.selectedElement = null;
      });

      // Listen for changes in the network (nodes or edges added/removed)
      this.nodes.on('*', this.updateNodeCounts);
    },
    updateNodeCounts() {
      this.countProteins = this.nodes.get({
        filter: (node) => node.shape === 'circle'
      }).length;

      this.countMetabolites = this.nodes.get({
        filter: (node) => node.shape === 'box'
      }).length;

      this.$forceUpdate(); // Force update to trigger reactivity
    }
  },
  beforeDestroy() {
    if (this.network !== null) {
      this.network.destroy();
      this.network = null;
    }
    
    // Clean up event listeners
    this.nodes.off('*');
  }
};
</script>

<style scoped>
.network-container {
  display: flex;
  position: relative; /* Ensure proper positioning for overview-panel */
}

.overview-panel {
  width: 200px; /* Width of the overview panel */
  padding: 20px;
  background-color: #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1; /* Ensure it's above the network and info-panel */
}

.overview-panel h2 {
  margin-top: 0;
  color: #4CAF50;
}

#network {
  flex: 1;
  height: 600px;
  border: 1px solid lightgray;
}

.info-panel {
  width: 200px;
  padding: 20px;
  background-color: #f0f0f0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1; /* Ensure it's above count-box */
}

.count-box {
  background-color: #ffffff;
  border: 1px solid #ccc;
  padding: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 0; /* Ensure it's behind info-panel */
  display: flex;
  flex-direction: column;
}

.count-item {
  margin-bottom: 10px;
}

.count-label {
  font-weight: bold;
  margin-bottom: 5px;
}

.count-value {
  font-size: 18px;
  display: flex;
  align-items: center;
}

.count-value span:first-child {
  margin-right: 5px;
}
</style>

