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
                <li v-for="selectedNode in sortedSelectedNodes" :key="selectedNode.id" class="selected-node">
                  {{ selectedNode.label }}
                  <span class="remove-node" @click="toggleSelect(selectedNode)">✖</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Button to display selected nodes text -->
      <button @click="showSelectedNodesText">Show Selected Nodes Text</button>
      
      <!-- Display selected nodes text for 5 seconds -->
      <div v-if="displaySelectedNodesText" class="selected-nodes-text">
        Selected Nodes: {{ displaySelectedNodesText }}
      </div>
    </div>
  </div>
</template>

<script>
import { nodeData } from './networkData'; // Adjust the path as per your project structure

export default {
  data() {
    return {
      nodes: nodeData,
      filterText: '',
      filterType: 'all',
      selectedNodes: [],
      nodeSelectionCollapsed: false,
      selectedNodesCollapsed: false,
      displaySelectedNodesText: '', // Text to display for 5 seconds
    };
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
    }
  },
  methods: {
    selectNode(node) {
      if (!this.isSelected(node)) {
        this.selectedNodes.push(node);
      }
    },
    toggleSelect(node) {
      const index = this.selectedNodes.findIndex(n => n.id === node.id);
      if (index !== -1) {
        this.selectedNodes.splice(index, 1);
      } else {
        this.selectedNodes.push(node);
      }
    },
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
      if (panel === 'nodeSelection') {
        this.nodeSelectionCollapsed = !this.nodeSelectionCollapsed;
      } else if (panel === 'selectedNodes') {
        this.selectedNodesCollapsed = !this.selectedNodesCollapsed;
      }
    },
    showSelectedNodesText() {
      this.displaySelectedNodesText = this.selectedNodes.map(node => node.label).join(', ');
      this.clearSelectedNodesText();
    },
    clearSelectedNodesText() {
      setTimeout(() => {
        this.displaySelectedNodesText = '';
      }, 5000); // Clear after 5 seconds
    }
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
  width: 80%; /* Adjust as needed */
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

.panel-toggle {
  font-size: 20px;
}

.node-type-selection {
  margin-bottom: 10px;
}

.node-type {
  display: block;
  margin-bottom: 5px;
}

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

h2, h3 {
  margin: 0;
  font-size: 18px;
}

.filter-input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.node-list, .selected-node-list {
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

.selected-node:hover {
  background-color: #f0f0f0;
}

.remove-node {
  color: red;
  cursor: pointer;
  font-size: 14px;
}

.selected-nodes-text {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 5px;
}
</style>