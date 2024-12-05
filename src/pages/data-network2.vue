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
    <FilterToolbar :contexts="contexts" @cangeContext="console.log('context changed')"></FilterToolbar>
      <v-row justify="space-between" class="filter-padding">
      <!-- Left Column: Query Nodes -->
      <v-col class="d-flex justify-center" cols="2">
        <v-card rounded="lg" elevation="2"   class="responsive-card">
          <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title>
                Query
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props">mdi-information</v-icon>
                  </template>
                  <span>
                          Please query the database for the nodes you want to inspect in the Network.
                  </span>
                </v-tooltip>
              </v-toolbar-title>
          </v-toolbar>
          <v-spacer></v-spacer>
          <v-card-text>
          <v-row>
            <!-- Input Field -->
            <v-col cols="12">
              <v-text-field
                v-model="searchText"
                @input="fetchNodeRecommendations"
                label="Type something..."
                outlined
                dense
                class="search-input"
              />
            </v-col>
          </v-row>

          <!-- Dropdown List -->
          <v-row v-if="limitedDropdownNodes.length">
            <v-col cols="12">
              <v-card class="dropdown">
                <v-list>
                  <v-list-item
                    v-for="(item, index) in limitedDropdownNodes"
                    :key="index"
                    @click="addDropdownNodeToNetwork(item)"
                    @mouseover="hoverNode(item)"
                    @mouseleave="hoverNode(null)"
                  >
                    <v-list-item-title>{{ item.display_name }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>

          <v-row class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-row>

          <v-row>
          <v-col cols="12">
            <v-list v-if="displayedNodes.length">
              <v-list-item
                v-for="(item, index) in displayedNodes"
                :key="index"
                @click="BoxClickEvent(item, $event)"
                @mouseover="hoverNode(item)"
                @mouseleave="hoverNode(null)"
                >
                <v-list-item-title>{{ item.display_name }}</v-list-item-title>
                  <v-list-item-action>
                    <v-btn
                      icon
                      @click.stop="RemoveNetworkNode(item)"
                      color="red"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>

          <!-- Tooltip -->
          <teleport to="body">
            <div
              v-if="hoveredItem"
              class="tooltip"
              :style="tooltipStyle"
            >
              <strong>CHRIS ID:</strong> {{ hoveredItem.id }}<br />
              <strong>Display Name:</strong> {{ hoveredItem.display_name }}<br />
              <strong>Source Table:</strong> {{ hoveredItem.source_table }}<br />
              <strong>Description:</strong> {{ hoveredItem.description }}
            </div>
          </teleport>
          </v-card-text>
        </v-card>
      </v-col>
      <!-- Middle Column: Network -->
      <v-col class="d-flex justify-center" cols="8">
        <v-card rounded="lg" elevation="2"   class="responsive-card">
          <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title>
                Network View
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props">mdi-information</v-icon>
                  </template>
                  <span>
                    Here you can inspect the Network that is build based on your retrieved Nodes from the Database.
                  </span>
                </v-tooltip>
              </v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <!-- Legend Section -->
            <!-- <v-row>
              <v-col cols="12" md="6">
                <NodeLegend :network-nodes="networkNodes" :groups="groups" />
              </v-col>
              <v-col cols="12" md="6">
                <EdgeLegend :network-edges="networkEdges" />
              </v-col>
            </v-row> -->

            <!-- Network Visualization -->
            <v-row>
              <v-col cols="12">
                <v-card ref="network" class="network-card">
                  <!-- Network visualization goes here -->
                </v-card>
              </v-col>
            </v-row>

            <!-- Action Buttons -->
            <v-row justify="center">
              <v-col cols="auto">
                <v-btn color="primary" @click="console.log('saveNetwork')">Save Network</v-btn>
              </v-col>
              <v-col cols="auto">
                <v-btn color="primary" @click="console.log('clearNetwork')">Clear Network</v-btn>
              </v-col>
              <v-col cols="auto">
                <v-btn color="primary" @click="console.log('keepHighlighted')">Only Keep Highlighted</v-btn>
              </v-col>
            </v-row>

          </v-card-text>
          <v-card color="surface">
          </v-card>
        </v-card>
      </v-col>
      <v-col class="d-flex justify-center" cols="2">
        <v-card rounded="lg" elevation="2"   class="responsive-card">
          <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title>
                Selected
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props">mdi-information</v-icon>
                  </template>
                  <span>
                          Detailed Information about the selected Node. To select a Node please click on it
                  </span>
                </v-tooltip>
              </v-toolbar-title>
          </v-toolbar>
          <v-spacer></v-spacer>
          <v-card-text></v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row justify="space-between" class="filter-padding">
      <v-col class="d-flex justify-center" cols="12">
        <v-card rounded="lg" elevation="2"   class="responsive-card">
          <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title>
                Highlighted
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props">mdi-information</v-icon>
                  </template>
                  <span>
                          Here the highlighted Nodes are depicted.
                          You can highlight a Node by double click and
                          filter the Network to the highlighted Nodes using the button above.
                  </span>
                </v-tooltip>
              </v-toolbar-title>
          </v-toolbar>
          <v-spacer></v-spacer>
          <v-card-text>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import FilterToolbar from "@/components/FilterToolbar.vue";
import axios from "axios";
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;

export default {
  name: "Network",
  components: {FilterToolbar},
  data() {
    return {
      contexts: [
        {text: 'Cohort 1', color: '#FF0000', lightVariant: '#dba3a3', darkVariant: '#845252'},
        {text: 'Cohort 2', color: '#00FF00', lightVariant: '#a3dba3', darkVariant: '#528452'},
        {text: 'Cohort 3', color: '#0000FF', lightVariant: '#a3a3db', darkVariant: '#525284'},
        {text: 'Cohort 4', color: '#FFFF00', lightVariant: '#dbdba3', darkVariant: '#848452'},
        {text: 'Cohort 5', color: '#FF00FF', lightVariant: '#dba3db', darkVariant: '#845284'},
      ],
      searchText: "",
      nodeRecommendations: [],
      debounceTimeout: null,
      typeaheadresult: [],
      dropdownNodes: [],
      addedNodes: [],
      networkNodes: [],
      selectedNode: null,
      hoveredItem: null,
      tooltipStyle: {},
      displayedNodes: [],
      displayedElement: null,
      displayedElementType: null,
      selectedNodes: [],
    };
  },
  computed: {
    // Limit the number of displayed nodes to 5
    limitedDropdownNodes() {
      return this.dropdownNodes.slice(0, 5);
    },
  },
  methods: {
    hoverNode(item) {
      this.hoveredItem = item;
      if (item) {
        // Get the mouse position or node position
        const nodeRect = event.target.getBoundingClientRect();

        // Position the tooltip near the node
        this.tooltipStyle = {
          position: 'absolute',
          top: `${nodeRect.bottom + 5}px`, // Adjust position slightly below the node
          left: `${nodeRect.left}px`,      // Align tooltip horizontally with the node
          zIndex: 1000,                   // Ensure it appears above other elements
        };
      }
    },
    async fetchNodeRecommendations() {
      // Clear the previous timeout
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }

      // Set a new timeout
      this.debounceTimeout = setTimeout(async () => {
        if (this.searchText) {
          try {
            const response = await axios.get(
                BASE_URL +
                `/network/api/getTypeaheadResults/?s=${encodeURIComponent(
                    this.searchText
                )}`
            );
            const items = Object.entries(response.data).map(
                ([id, details]) => ({
                  id,
                  display_name: details.display_name,
                  description: details.description,
                  source_table: details.source_table,
                })
            );
            this.typeaheadresult = items;
          } catch (error) {
            console.error("Error fetching data:", error);
            this.typeaheadresult = [];
          }
        } else {
          this.typeaheadresult = [];
        }

        this.dropdownNodes = [];
        this.typeaheadresult.forEach((node) => {
          const nodeExistsInNetwork = this.displayedNodes.some(
              (networkNode) => networkNode.id === node.id
          );
          if (!nodeExistsInNetwork) {
            this.dropdownNodes.push(node);
          }
        });
      }, 300); // Delay in milliseconds, adjust as needed (e.g., 300ms)
    },
    async addDropdownNodeToNetwork(node) {
      this.hoverNode(null);
      //await this.fetchNodesAndEdges(node);
      this.dropdownNodes = this.dropdownNodes.filter(function (currentNode) {
        return currentNode !== node;
      });
      console.log("dropdownNodes: ", this.dropdownNodes)
      this.displayedNodes.push(node);
      await this.initializeNetwork();
      await this.updateHighlighting();
      const locnode = await this.networkNodes.find(
          (locnode) => locnode.id === node.id
      );
      this.displayNode(locnode);
      this.updateHighlighting();
    },
    updateHighlighting() {
      this.dropdownNodes = this.dropdownNodes.filter((value, index, self) => {
        return index === self.findIndex((v) => v.id === value.id);
      });
    },
    // Network stuff
    initializeNetwork() {
      //
    },
    displayNode(node) {
      this.displayedElement = node;
      this.displayedElementType = "node";
    },
    RemoveNetworkNode(node) {
      this.displayedNodes = this.displayedNodes.filter(function (currentNode) {
        return currentNode.id !== node.id;
      });
      this.dropdownNodes.push(node);
      this.displayedElement = null;
      this.displayedElementType = null;
      if (this.selectedNodes.includes(node)) {
        this.selectedNodes.splice(this.selectedNodes.indexOf(node), 1);
      }
      this.initializeNetwork();
      this.updateHighlighting();
    },
  },
};
</script>

<style scoped>
.responsive-card {
  width: 80%;
  transition: width 0.3s ease;
}
@media (max-width: 1500px) {
  .responsive-card {
    width: 100%;
  }
}
.title {
  font-weight: bold;
}

.filter-padding {
  padding-top: 1px;
  padding-bottom: 1px;
}

.no-bottom-padding {
  padding-bottom: 0;
}
.divider {
  width: 10%;
  margin-top: 16px;
  margin-bottom: 16px;
}
.outlined-card {
  width: 80%;
  border-radius: 10px;
}

.tooltip {
  background-color: rgb(var(--v-theme-primary-darken-1));
  border: 1px solid rgb(var(--v-theme-primary-darken-1));
  border-radius: 4px;
  padding: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  color: rgb(var(--v-theme-white-surface));
}

</style>