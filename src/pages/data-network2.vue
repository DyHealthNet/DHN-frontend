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
          <div class="count-value">
            <span>{{ countPhenotypes }}</span>
            <span> (Phenotypes)</span>
          </div>
          <div class="count-value">
            <span>{{ countDisorder }}</span>
            <span> (Disorder)</span>
          </div>
          <div class="count-value">
            <span>{{ countGenes }}</span>
            <span> (Genes)</span>
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

    <!-- Legend -->
    <div class="legend">
      <h3>Legend</h3>
      <div v-for="(group, key) in groups" :key="key" class="legend-item">
        <div class="legend-color" :style="getShapeStyle(group.shape, group.color)"></div>
        <span>{{ key }}</span>
      </div>
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
      countMetabolites: 0,
      groups
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
        this.selectedElement = { type: 'node', label: selectedNode.label, nodeType: selectedNode.group };
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
          this.selectedElement = { type: 'node', label: selectedNode.label, nodeType: selectedNode.group };
        }
      });

      this.nodes.on('*', this.updateNodeCounts);
    },
    updateNodeCounts() {
      this.countProteins = this.nodes.get({ filter: node => node.group === 'Protein' }).length;
      this.countMetabolites = this.nodes.get({ filter: node => node.group === 'Metabolites' }).length;
      this.countPhenotypes = this.nodes.get({ filter: node => node.group === 'Phenotypes' }).length;
      this.countDisorder = this.nodes.get({ filter: node => node.group === 'Disorder' }).length;
      this.countGenes = this.nodes.get({ filter: node => node.group === 'Genes' }).length;
      this.$forceUpdate();
    },
    clearSelection() {
      this.selectedElement = null;
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

.legend {
  position: absolute;
  bottom: 10px;
  left: 20%;
  transform: translateX(-50%);
  padding: 10px;
  background-color: #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.legend h3 {
  margin: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-top: 5px;
}

.legend-color {
  width: 20px;
  height: 20px;
  margin-right: 10px;
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

