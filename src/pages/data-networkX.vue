<template>
  <div class="network-container">
    <!-- Network Visualization -->
    <div ref="network" id="network"></div>
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

#network {
  flex: 1;
  height: 600px;
  border: 6px solid lightgray;
}
</style>
