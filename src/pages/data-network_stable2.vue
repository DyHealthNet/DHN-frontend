<template>
  <div class="network-container">
    <!-- Overview Panel -->
    <div class="overview-panel">
      <h2>Network Overview</h2>
      <div class="count-box">
        <!-- Nodes Count -->
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
        <!-- Edges Count -->
        <div class="count-item">
          <p class="count-label">Edges</p>
          <p class="count-value">{{ edges.length }}</p>
        </div>
      </div>
    </div>

    <!-- Network Visualization -->
    <div ref="network" id="network"></div>

    <!-- Info Panel -->
    <div class="info-panel">
      <h2 v-if="selectedElement">Selected Element</h2>
      <template v-if="selectedElement">
        <!-- Display selected node or edge details -->
        <p v-if="selectedElement.type === 'node'">Label: {{ selectedElement.label }}</p>
        <template v-else>
          <p>Connected Nodes: {{ selectedElement.nodeA }} - {{ selectedElement.nodeB }}</p>
          <p>Edge P-value: {{ selectedElement.p_value.toFixed(3) }}</p>
        </template>
      </template>
      <!-- No element selected message -->
      <p v-else>No element selected</p>
    </div>

  </div>
</template>


<script>
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';
import { groups, nodeData, edgeData, options } from './networkData';

export default {
  name: 'DataNetwork',
  data() {
    return {
      network: null,
      nodes: [],
      edges: [],
      selectedElement: null,
      countProteins: 0,
      countMetabolites: 0
    };
  },
  mounted() {
    this.$nextTick(this.initializeNetwork);
  },
  methods: {
    initializeNetwork() {
      const container = this.$refs.network;
      if (!container) return;

      const nodes = nodeData.map(node => ({
        ...node,
        ...groups[node.group]
      }));

      this.nodes = new DataSet(nodes);
      this.edges = new DataSet(edgeData);

      const data = { nodes: this.nodes, edges: this.edges };

      this.network = new Network(container, data, options);
      this.updateNodeCounts();

      this.network.on('selectNode', params => {
        const selectedNode = this.nodes.get(params.nodes[0]);
        this.selectedElement = { type: 'node', label: selectedNode.label };
      });

      this.network.on('selectEdge', params => {
        const edge = this.edges.get(params.edges[0]);
        const nodeA = this.nodes.get(edge.from);
        const nodeB = this.nodes.get(edge.to);
        this.selectedElement = {
          type: 'edge',
          nodeA: nodeA.label,
          nodeB: nodeB.label,
          p_value: edge.p_value
        };
      });

      this.network.on('deselectNode', this.clearSelection);
      this.network.on('deselectEdge', this.clearSelection);
      this.network.on('dragStart', params => {
        if (params.nodes.length > 0) {
          const selectedNode = this.nodes.get(params.nodes[0]);
          this.selectedElement = { type: 'node', label: selectedNode.label };
        }
      });

      this.nodes.on('*', this.updateNodeCounts);
    },
    updateNodeCounts() {
      this.countProteins = this.nodes.get({ filter: node => node.shape === 'circle' }).length;
      this.countMetabolites = this.nodes.get({ filter: node => node.shape === 'box' }).length;
      this.$forceUpdate();
    },
    clearSelection() {
      this.selectedElement = null;
    }
  },
  beforeDestroy() {
    if (this.network) this.network.destroy();
    this.nodes.off('*');
  }
};
</script>

<style scoped>
.network-container {
  display: flex;
  position: relative;
}

.overview-panel {
  width: 200px;
  padding: 20px;
  background-color: #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.overview-panel h2 {
  margin-top: 0;
  color: #4CAF50;
}

#network {
  flex: 1;
  height: 600px;
  border: 6px solid lightgray;
}

.info-panel {
  width: 200px;
  padding: 20px;
  background-color: #f0f0f0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.count-box {
  background-color: #ffffff;
  border: 1px solid #ccc;
  padding: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 0;
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

