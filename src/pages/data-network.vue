<template>
  <!-- Clickable description with toggle functionality -->
  <div class="network-description" @click="toggleDescription">
    <p v-if="!isExpanded">
      <strong style="color: #104d63"
        >Explore CHRIS Network Associations:</strong
      >
      This page displays a network illustrating the associations between CHRIS
      nodes and their connections with external variables.
      <span
        style="color: #104d63"
        class="toggle-link"
        v-if="!isExpanded"
        @click.stop="toggleDescription"
        >Read more</span
      >
    </p>
    <p v-if="isExpanded">
      <strong>Explore CHRIS Network Associations:</strong>
      This page presents a network diagram that illustrates the relationships
      between CHRIS nodes and their connections to external variables.<br /><br />
      Edges in the network represent statistically significant associations.
      These are determined using Pearson correlation for continuous variables,
      Chi-square tests for categorical variables, and T-tests for associations
      between continuous and categorical variables.<br /><br />
      To find, select, and add CHRIS nodes to the network display, use the text
      search located in the upper left corner. Selected nodes will be included
      in the network and listed in the "Network Nodes" panel.<br />
      Both nodes and edges in the network are clickable, providing additional
      information. By selecting a node, you can also add its most highly
      correlated nodes to the network.
      <span
        style="color: #104d63"
        class="toggle-link"
        @click.stop="toggleDescription"
        >Read less</span
      >
    </p>
  </div>

  <div class="outer-container">
    <div class="panel-container">
      <div class="panel">
        <div class="panel-header">
          <h2
            style="color: white"
            title="Find CHRIS nodes by CHRIS ID, display name or description and add them to the network display"
          >
            Node Selection <span class="mdi mdi-information"></span>
          </h2>
        </div>
        <div class="panel-content">
          <div class="node-selection">
            <input
              type="text"
              v-model="searchText"
              @input="fetchData"
              placeholder="Type something..."
              style="width: 175px"
            />
            <ul v-if="dropdownNodes.length" class="dropdown" ref="dropdown">
              <li
                v-for="(item, index) in dropdownNodes"
                @click="addDropdownNodeToNetwork(item)"
                :key="index"
                @mouseover="hoverNode(item)"
                @mouseleave="hoverNode(null)"
              >
                {{ item.display_name }}
              </li>
            </ul>
            <teleport to="body">
              <div v-if="hoveredItem" class="tooltip" :style="tooltipStyle">
                <strong>CHRIS ID:</strong> {{ hoveredItem.id }}<br />
                <strong>Display Name:</strong> {{ hoveredItem.display_name
                }}<br />
                <strong>Source Table:</strong> {{ hoveredItem.source_table
                }}<br />
                <strong>Description:</strong> {{ hoveredItem.description }}
              </div>
            </teleport>
          </div>
        </div>
        <div class="panel-header">
          <h2
            style="color: white"
            title="These CHRIS nodes have been selected and are displayed in the network"
          >
            Network Nodes <span class="mdi mdi-information"></span>
          </h2>
        </div>
        <div class="panel-content">
          <div class="node-selection">
            <ul v-if="displayedNodes.length" class="dropdown" ref="dropdown">
              <li
                v-for="(item, index) in displayedNodes"
                @click="BoxClickEvent(item, $event)"
                :key="index"
                @mouseover="hoverNode(item)"
                @mouseleave="hoverNode(null)"
              >
                {{ item.display_name }}
                <span class="remove-node" @click="RemoveNetworkNode(item)"
                  >✖</span
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="network-container">
      <!-- Legend -->
      <div class="legend">
        <h2>
          Total Nodes: <span>{{ this.network_nodes.length }}</span>
        </h2>
        <div v-for="(group, key) in groups" :key="key" class="legend-item">
          <div
            class="legend-color"
            :style="getShapeStyle(group.color, key)"
          ></div>
          <span
            >&nbsp;&nbsp;{{ this.capitalizeFirstLetter(key) }}s:
            {{ this.getNodesCount(key) }}</span
          >
        </div>
      </div>
      <div class="legend2">
        <h2>
          Total Edges: <span>{{ this.network_edges.length }}</span>
        </h2>
        <div class="legend-item">
          <div class="solid-line"></div>
          <div class="legend-text">
            CHRIS: <span>{{ this.getEdgesCount("cohort") }}</span>
          </div>
        </div>
        <div class="legend-item">
          <div class="dashed-line"></div>
          <div class="legend-text">
            External: <span>{{ this.getEdgesCount("external") }}</span>
          </div>
        </div>
      </div>

      <!-- Network Visualization -->
      <div ref="network" id="network">
        <v-tooltip bottom>
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" style="color: #104d63; top: 10px; left: 10px"
              >mdi-information</v-icon
            >
          </template>
          <span></span>
          <v-list-tile-avatar slot="activator">
            <img src="../pages/legend.png" />
          </v-list-tile-avatar>
          <span></span>
        </v-tooltip>
      </div>
      <button
        class="btn-save-network"
        @click="saveNetwork()"
        title="Save network to .json and download it"
      >
        Save Network
      </button>
      <button
        class="btn-clear-network"
        @click="clearNetwork()"
        title="Clear the full network"
      >
        Clear Network
      </button>
      <button
        class="btn-keep-highlighted"
        @click="keepHighlighted()"
        title="Remove all nodes that are not highlighted"
      >
        Only keep highlighted
      </button>
    </div>
    <!-- Info Panel -->
    <div class="info-panel">
      <h2 v-if="displayedElement"></h2>
      <template v-if="displayedElement">
        <template v-if="displayedElementType === 'node'">
          <!-- Display selected node details -->
          <p>
            <strong style="font-size: 24px">Selected Node</strong>
            <span
              class="remove-nodeX"
              @click="RemoveNetworkNode(displayedElement)"
              title="Remove the selected node"
              >✖</span
            >
          </p>
          <button
            class="btn-update-network"
            @click="addConnectedNodes()"
            title="Click to add nodes that are significantly correlated with the selected node"
          >
            Add Connected Nodes
          </button>
          <button
            @click="showOverlay"
            title="Modify the type and number of added nodes"
            class="icon-button"
          >
            <img
              src="@/pages/gear-solid.svg"
              alt="Clear Network Icon"
              class="icon"
            />
          </button>
          <!-- Overlay with radio button selection -->
          <div v-if="isOverlayVisible" class="overlay">
            <div class="overlay-content">
              <h3>Amount of added CHRIS nodes:</h3>
              <div class="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    v-model="isProteinsChecked"
                    @change="updateProteinAmount"
                  />
                  <span class="bold-large-text">Proteins</span>
                </label>
                <input
                  type="number"
                  v-model="proteinAmount"
                  :disabled="!isProteinsChecked"
                  placeholder="Enter amount"
                  max="10"
                  min="0"
                />
              </div>

              <div class="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    v-model="isMetabolitesChecked"
                    @change="updateMetaboliteAmount"
                  />
                  <span class="bold-large-text">Metabolites</span>
                </label>
                <input
                  type="number"
                  v-model="metaboliteAmount"
                  :disabled="!isMetabolitesChecked"
                  placeholder="Enter amount"
                  max="10"
                  min="0"
                />
              </div>
              <!-- Phenotypes Checkbox Group -->
              <div class="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    v-model="isPhenotypesChecked"
                    @change="updatePhenotypeAmount"
                  />
                  <span class="bold-large-text">Phenotypes</span>
                </label>
                <input
                  type="number"
                  v-model="phenotypeAmount"
                  :disabled="!isPhenotypesChecked"
                  placeholder="Enter amount"
                  max="10"
                  min="0"
                />
              </div>

              <!-- Variants Checkbox Group -->
              <div class="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    v-model="isVariantsChecked"
                    @change="updateVariantAmount"
                  />
                  <span class="bold-large-text">Variants</span>
                </label>
                <input
                  type="number"
                  v-model="variantAmount"
                  :disabled="!isVariantsChecked"
                  placeholder="Enter amount"
                  max="10"
                  min="0"
                />
              </div>

              <button @click="handleSubmit">Submit</button>
              <button @click="hideOverlay">Cancel</button>
            </div>
          </div>

          <div id="messageContainer" style="position: absolute"></div>
          <button
            class="btn-show-external"
            @click="showExternals(this.displayedElement)"
            title="Add connections from external databases, can take a few seconds for some protein"
          >
            Add external nodes
          </button>

          <p>&nbsp;</p>
          <p title="CHRIS ID or display Name for external nodes">
            <strong>ID:</strong> {{ displayedElement.id }}
          </p>
          <p title="Node label">
            <strong>Display Name:</strong> {{ displayedElement.display_name }}
          </p>
          <p title="Data set is either CHRIS or external">
            <strong>Data set:</strong> {{ displayedElement.set }}
          </p>

          <p title="Short node description">
            <strong>Description:</strong>
            {{ capitalizeFirstLetter(displayedElement.description) }}
          </p>
          <p
            title="CHRIS contains three source tables: proteins, metabolites, and phenotypes"
          >
            <strong>Source Table:</strong>
            {{
              capitalizeFirstLetter(displayedElement.source_table.split("_")[1])
            }}
          </p>
          <!-- <p><strong>Cross Reference: </strong> {{ displayedElement.xrefs }}</p>-->
          <p
            title="We use Uniprot for proteins, HMDB for metabolites and SNOMED for phenotypes"
          >
            <strong>Reference:</strong>
            <span
              v-if="
                displayedElement.xrefs &&
                displayedElement.xrefs[displayedElement.xrefs.length - 1] !==
                  '.'
              "
            >
              <span
                v-for="(xref, index) in displayedElement.xrefs.split('|')"
                :key="index"
              >
                <a
                  :href="generateLink(xref.trim())"
                  target="_blank"
                  style="color: darkblue"
                  >{{ xref.trim() }}</a
                >
                <span
                  v-if="index < displayedElement.xrefs.split('|').length - 1"
                  >,&#8203;</span
                >
              </span>
            </span>
            <span v-else> none</span>
          </p>
        </template>

        <template
          v-else-if="
            displayedElementType === 'edge' && displayedElement.set === 'cohort'
          "
        >
          <!-- Display details for edge with set 'cohort' -->
          <p><strong style="font-size: 24px">Selected Edge</strong></p>
          <p><strong>Set:</strong> CHRIS edges</p>
          <p>&nbsp;</p>
          <p><strong>Node 0</strong></p>
          <p>
            <strong>Display Name:</strong> {{ displayedElement.node0_label }}
          </p>
          <p><strong>ID:</strong> {{ displayedElement.to }}</p>
          <p><strong>Type:</strong> {{ displayedElement.node0_type }}</p>
          <p>&nbsp;</p>
          <p><strong>Node 1</strong></p>
          <p>
            <strong>Display Name:</strong> {{ displayedElement.node1_label }}
          </p>
          <p><strong>ID:</strong> {{ displayedElement.from }}</p>
          <p><strong>Type:</strong> {{ displayedElement.node1_type }}</p>
          <p>&nbsp;</p>
          <p>
            <strong>P Value:</strong>
            {{ displayedElement.p_value.toPrecision(3) }}
          </p>
          <p>
            <strong>Adjusted P Value:</strong>
            {{ displayedElement.adjusted_p_value.toPrecision(3) }}
          </p>
          <p>
            <strong>Effect Size:</strong>
            {{ displayedElement.effect_size.toPrecision(3) }}
          </p>
          <p>
            <strong>Effect Size Type:</strong>
            {{ capitalizeFirstLetter(displayedElement.effect_size_type) }}
          </p>
        </template>

        <template
          v-else-if="
            displayedElementType === 'edge' &&
            displayedElement.set === 'external'
          "
        >
          <template v-if="displayedElement.to === displayedElement.from">
            <p><strong style="font-size: 24px">Selected Edge</strong></p>
            <p><strong>Set:</strong> External edges</p>
            <p>&nbsp;</p>

            <p>
              <strong>Node Name:</strong> {{ displayedElement.node0_label }}
            </p>
            <p><strong>Node ID:</strong> {{ displayedElement.to }}</p>
            <p><strong>Node Type:</strong> {{ displayedElement.node0_type }}</p>
          </template>

          <template v-else>
            <p><strong style="font-size: 24px">Selected Edge</strong></p>
            <p><strong>Set:</strong> External edges</p>
            <p>&nbsp;</p>

            <p><strong>Node 0</strong></p>
            <p>
              <strong>Display Name:</strong> {{ displayedElement.node0_label }}
            </p>
            <p><strong>ID:</strong> {{ displayedElement.to }}</p>
            <p><strong>Type:</strong> {{ displayedElement.node0_type }}</p>
            <p>&nbsp;</p>
            <p><strong>Node 1</strong></p>
            <p>
              <strong>Display Name:</strong> {{ displayedElement.node1_label }}
            </p>
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
          <h2
            style="color: white"
            title="Double-click on nodes to highlight them. When you download the network, highlighted nodes will include an 'is_highlighted' key set to true or false."
          >
            Highlighted Nodes <span class="mdi mdi-information"></span>
          </h2>
        </div>
        <div class="panel-content">
          <div class="node-selection">
            <ul v-if="selectedNodes.length" class="dropdown" ref="dropdown">
              <li
                v-for="(item, index) in selectedNodes"
                @click="BoxClickEvent2(item, $event)"
                :key="index"
                @mouseover="hoverNode(item)"
                @mouseleave="hoverNode(null)"
              >
                {{ item.display_name }}
                <span class="remove-node" @click="RemoveNetworkNode2(item)"
                  >✖</span
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;
import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import axios from "axios";
import { groups } from "./networkData";
import Swal from 'sweetalert2';

export default {
  data() {
    return {
      isExpanded: false,
      debounceTimeout: null,
      searchText: "",
      typeaheadresult: [],
      hoveredItem: null,
      tooltipStyle: {},
      dropdownNodes: [],
      displayedNodes: [],
      networkNodes: [],
      networkEdges: [],
      network_nodes: [],
      network_edges: [],
      displayedElement: null,
      displayedElementType: null,
      selectedNodes: [],
      l: "10",
      allInternalEdges: [],
      allExternalEdges: [],
      localExternals: [],
      groups: groups,
      isOverlayVisible: false,
      selectedOption: "", // To hold the value of the selected radio button
      isProteinsChecked: true,
      isMetabolitesChecked: true,
      isPhenotypesChecked: true,
      isVariantsChecked: true,
      proteinAmount: 3,
      metaboliteAmount: 3,
      phenotypeAmount: 3,
      variantAmount: 3,
    };
  },
  methods: {
    showAlert(text) {
      Swal.fire({
        title: 'Invalid Input',
        text: text,
        icon: 'warning',
        confirmButtonText: 'Ok',
        customClass: {
          confirmButton: 'my-custom-button'
        }
      });
    },
    keepHighlighted() {
      // Filter displayed nodes to only include those present in selectedNodes
      this.displayedNodes = this.displayedNodes.filter((node) =>
        this.selectedNodes.some((n2) => n2.id === node.id)
      );
      // Initialize network and update highlighting
      this.initializeNetwork();
      this.updateHighlighting();
    },

    updateProteinAmount() {
      if (!this.isProteinsChecked) {
        this.proteinAmount = this.isProteinsChecked ? 3 : 0;
      }
    },
    updateMetaboliteAmount() {
      if (!this.isMetabolitesChecked) {
        this.metaboliteAmount = this.isMetabolitesChecked ? 3 : 0;
      }
    },
    updatePhenotypeAmount() {
      if (!this.isPhenotypesChecked) {
        this.phenotypeAmount = this.isPhenotypesChecked ? 3 : 0;
      }
    },
    updateVariantAmount() {
      if (!this.isVariantsChecked) {
        this.variantAmount = this.isVariantsChecked ? 3 : 0;
      }
    },

    handleSubmit() {
      // Handle form submission logic
      console.log("Proteins checked:", this.proteinAmount);
      console.log("Meta amount:", this.metaboliteAmount);
      console.log("Phen checked:", this.phenotypeAmount);
      console.log("Var amount:", this.variantAmount);
      if (
        this.proteinAmount > 10 ||
        this.metaboliteAmount > 10 ||
        this.phenotypeAmount > 10 ||
        this.variantAmount > 10 ||
        this.proteinAmount < 0 ||
        this.metaboliteAmount < 0 ||
        this.phenotypeAmount < 0 ||
        this.variantAmount < 0
      ) {
        this.showAlert("The minimum value of added nodes is 0 and the maximum 10!!!")
      }
      this.hideOverlay();
    },

    showOverlay() {
      this.isOverlayVisible = true;
    },
    hideOverlay() {
      this.isOverlayVisible = false;
    },
    getNodesCount(type) {
      if (
        this.network_nodes.length > 0 &&
        (type === "protein" ||
          type === "phenotype" ||
          type === "metabolite" ||
          type === "variant" ||
          type === "gene" ||
          type === "disorder")
      ) {
        let count = 0;
        // If using a DataSet or similar that doesn't have filter but does have forEach:
        this.network_nodes.forEach((node) => {
          if (node.source_table.split("_")[1] === type) {
            count++;
          }
        });
        return count;
      }
      return 0; // or handle invalid type
    },

    getEdgesCount(type) {
      if (
        this.network_edges.length > 0 &&
        (type === "cohort" || type === "external")
      ) {
        let count = 0;
        // If using a DataSet or similar that doesn't have filter but does have forEach:
        this.network_edges.forEach((edge) => {
          if (edge.set === type) {
            count++;
          }
        });
        return count;
      }
      return 0; // or handle invalid type
    },

    toggleDescription() {
      this.isExpanded = !this.isExpanded;
    },

    async showExternals(node) {
      const ret = await this.doExternals(node);
      const to_fetch = ret[0];
      const refresh = ret[1];
      console.log(to_fetch);
      if (refresh) {
        this.initializeNetwork();
        this.updateHighlighting();
      } else {
        this.showAlert("No external edges found!")
      }
      if (to_fetch.length > 0) {
        to_fetch.forEach((node) => this.fetchNodesAndEdges(node));
      }
      console.log("done");
    },

    async doExternals(node) {
      const response = await axios.get(
        BASE_URL + `/network/api/getAllExternals/?q=${node.id}`
      );
      console.log(response.data);

      // add all edges to the network:
      const ex_edges = response.data["External Edges"];

      console.log(ex_edges);

      ex_edges.forEach((edge) => {
        // Iterate over mapping_source_id
        edge.mapping_source_id.forEach((chris0) => {
          // Iterate over mapping_target_id
          edge.mapping_target_id.forEach((chris1) => {
            // Push to allExternalEdges array
            this.allExternalEdges.push({
              ...edge,
              set: "external",
              to: chris0,
              from: chris1,
            });
          });
        });
      });

      let refresh = false;
      // add all Chris nodes to the display panel
      const chris_nodes = response.data["Chris Nodes"];
      const fetchPromises = [];
      let to_fetch = [];
      for (const key in chris_nodes) {
        if (Array.isArray(chris_nodes[key])) {
          for (const node of chris_nodes[key]) {
            if (!this.networkNodes.some((locnode) => locnode.id === node.id)) {
              // Add the promise to the array
              to_fetch.push(node);
              node.set = "CHRIS";
              this.networkNodes.push(node);
              // fetchPromises.push(this.fetchNodesAndEdges(node));
              this.displayedNodes.push(node);
              refresh = true;
            }
          }
        }
      }
      // Wait for all fetchNodesAndEdges calls to complete
      await Promise.all(fetchPromises);

      // add all external nodes to the nodes and display panel
      // add all Chris nodes to the display panel
      const ex_node = response.data["External Nodes"];
      for (const key in ex_node) {
        if (Array.isArray(ex_node[key])) {
          for (const node of ex_node[key]) {
            if (!this.networkNodes.some((locnode) => locnode.id === node.id)) {
              if (key === "external_protein") {
                node.id = node.uniprot_id;
              } else if (key == "external_metabolite") {
                node.id = node.hmdb_id;
              } else if (key === "external_phenotype") {
                node.id = node.hpo_id;
              } else if (key === "external_variant") {
                node.id = node.clinvar_id;
              } else if (key === "external_gene") {
                node.id = node.entrez_id;
              } else if (key === "external_disorder") {
                node.id = node.mondo_id;
              }

              node.set = "external";
              node.source_table = key;
              if(!this.networkNodes.some(n => n.id === node.id)){
                this.networkNodes.push(node);
                this.displayedNodes.push(node);
              }
              refresh = true;
            }
          }
        }
      }
      return { 0: to_fetch, 1: refresh };
    },

    clearNetwork() {
      this.searchText = "";
      this.dropdownNodes = [];
      this.displayedNodes = [];
      this.selectedNodes = [];
      this.networkNodes = [];
      this.networkEdges = [];
      this.network_nodes = [];
      this.network_edges = [];
      this.displayedElement = null;
      this.displayedElementType = null;
      this.allInternalEdges = [];
      this.allExternalEdges = [];
      this.localExternals = [];
      this.initializeNetwork();
      this.updateHighlighting();
    },

    async saveNetwork() {
      console.log("saving");
      if (this.network_nodes.length > 0) {
        const nodes = this.network_nodes.get();
        const edges = this.network_edges.get();

        // Combine nodes and edges into one object
        const exportData = { nodes: nodes, edges: edges };
        // Convert the data to a JSON string
        const dataStr = JSON.stringify(exportData, null, 2);
        // Create a Blob from the JSON string
        const blob = new Blob([dataStr], { type: "application/json" });
        // Create a link element
        const link = document.createElement("a");
        // Set the download attribute with a filename
        link.download = "network-data.json";
        // Create a URL for the Blob and set it as the href attribute
        link.href = window.URL.createObjectURL(blob);
        // Append the link to the body
        document.body.appendChild(link);
        // Programmatically click the link to trigger the download
        link.click();
        // Remove the link from the document
        document.body.removeChild(link);

        this.initializeNetwork();
        this.updateHighlighting();
      } else {
        console.log("No network displayed");
      }
    },

    generateLink(xref) {
      switch (xref.split(".")[0]) {
        case "uniprot":
          return `https://www.uniprot.org/uniprotkb/${xref.split(".")[1]}`;
        case "hmdb":
          return `https://hmdb.ca/metabolites/${xref.split(".")[1]}`;
        case "snomedct":
          return `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${
            xref.split(".")[1]
          }`;
        case "mondo":
          return `https://monarchinitiative.org/MONDO:${xref.split(".")[1]}`;
        case "umls":
          return `https://www.ncbi.nlm.nih.gov/medgen/${xref.split(".")[1]}`;
        case "omim":
          return `https://omim.org/entry/${xref.split(".")[1]}`;
        case "orpha":
          return `https://www.orpha.net/en/disease/detail/${xref.split(".")[1]}`;
        case "chemspider":
          return `https://www.chemspider.com/Chemical-Structure.${xref.split(".")[1]}.html`;

        default:
          return "#"; // default case if source_table doesn't match
      }
    },

    async fetchData() {
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
      await this.fetchNodesAndEdges(node);
      this.dropdownNodes = this.dropdownNodes.filter(function (currentNode) {
        return currentNode !== node;
      });
      this.displayedNodes.push(node);
      await this.initializeNetwork();
      await this.updateHighlighting();
      const locnode = await this.networkNodes.find(
        (locnode) => locnode.id === node.id
      );
      this.displayNode(locnode);
      this.updateHighlighting();
    },

    async addConnectedNodes() {
      if (this.displayedElementType === "node") {
        if (this.displayedElement.set === "CHRIS") {
          const selID = this.displayedElement.id;
          const connected_edges = this.allInternalEdges.filter(
            (edge) => edge.from === selID || edge.to === selID
          );

          // Object to keep track of how many nodes of each type have been added
          const limits = {
            cohort_protein: this.proteinAmount,
            cohort_metabolite: this.metaboliteAmount,
            cohort_phenotype: this.phenotypeAmount,
            cohort_variant: this.variantAmount,
          };
          // Object to keep count of added nodes per type
          const addedCounts = {
            cohort_protein: 0,
            cohort_metabolite: 0,
            cohort_phenotype: 0,
            cohort_variant: 0,
          };

          // Array to store nodes that will be added
          const nodesToAdd = [];

          // Loop through each connected edge
          for (const connected_edge of connected_edges) {
            const node0 = this.networkNodes.find(
              (node) => node.id === connected_edge.from
            );
            const node1 = this.networkNodes.find(
              (node) => node.id === connected_edge.to
            );
            nodesToAdd.push(node0);
            nodesToAdd.push(node1);
          }

          // Sort nodes by p-value in descending order
          nodesToAdd.sort((a, b) => b.pvalue - a.pvalue);

          const justAddedNodes = [];
          // Add nodes to displayedNodes and update the count
          for (const node of nodesToAdd) {
            if (
              addedCounts[node.source_table] < limits[node.source_table] &&
              !this.displayedNodes.some((n) => n.id === node.id)
            ) {
              this.displayedNodes.push(node);
              addedCounts[node.source_table] =
                addedCounts[node.source_table] + 1;
              justAddedNodes.push(node);
            }
          }

          if (justAddedNodes.length > 0) {
            this.initializeNetwork();
            this.updateHighlighting();
            justAddedNodes.forEach((node) => {
              this.fetchNodesAndEdges(node);
            });
          } else {
            this.showAlert("No nodes added")
          }
        } else {
          this.showAlert("Only possible for CHRIS nodes!!!")
        }
      } else {
        // Display the message on the webpage
        const messageContainer = document.getElementById("messageContainer");
        if (messageContainer) {
          messageContainer.innerHTML =
            "Please select a node to add connected nodes.";

          // Position the message and style it
          messageContainer.style.left = "70px";
          messageContainer.style.top = "30px";
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

    async fetchNodesAndEdges(node) {
      const nodeID = node.id;
      const type = node.source_table.split("_")[1];
      const api_string =
        BASE_URL +
        "/network/api/getNetwork/?q=" +
        nodeID +
        "&t=" +
        type +
        "&l=" +
        this.l;
      try {
        // add nodes to the (hidden) network
        const response = await axios.get(api_string);

        const nodes = response.data.Nodes;

        for (const key in nodes) {
          if (Array.isArray(nodes[key])) {
            nodes[key].forEach((node) => {
              if (
                !this.networkNodes.some((locnode) => locnode.id === node.id)
              ) {
                node.set = "CHRIS";
                this.networkNodes.push(node);
              }
            });
          }
        }

        // add edges to the (hiddden) network
        const internalEdges = response.data.Edges;
        const externalEdges = response.data["External Edges"];

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
              const edgeExists = this.allInternalEdges.some(
                (existingEdge) => existingEdge.id === edge.id
              );
              if (!edgeExists) {
                this.allInternalEdges.push({
                  ...renamedEdge,
                  type: key,
                  set: "cohort",
                  color: "black",
                  width: -Math.log10(renamedEdge.p_value) * 1.5,
                });
              }
            });
          }
        }

        externalEdges.forEach((edge) => {
          if (
            !this.allExternalEdges.some((locnedge) => locnedge.id === edge.id)
          ) {
            this.allExternalEdges.push({
              ...edge,
              set: "external",
              to: edge.source_cohort_id,
              from: edge.target_cohort_id,
            });
          }
        });
      } catch (error) {
        console.error("Error fetching edges:", error);
      }
    },

    // Network stuff
    initializeNetwork() {
      const options = {};
      const container = this.$refs.network;
      if (!container) return;

      this.filterForNetworkEdges();

      const DisplayNodesFromNetwork = this.networkNodes.filter((node) =>
        this.displayedNodes.some((locnode) => locnode.id === node.id)
      );

      this.network_nodes = new DataSet(DisplayNodesFromNetwork);
      this.network_edges = new DataSet(this.networkEdges);

      const data = { nodes: this.network_nodes, edges: this.network_edges };

      this.network = new Network(container, data, options);

      this.network.on(
        "click",
        function (params) {
          if (params.nodes.length === 1) {
            const clickedNode = this.networkNodes.find(
              (currentNode) => currentNode.id === params.nodes[0]
            );
            console.log(clickedNode);
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
          this.updateHighlighting();
        }.bind(this)
      );

      this.network.on(
        "doubleClick",
        function (params) {
          if (params.nodes.length === 1) {
            const clickedNode = this.networkNodes.find(
              (currentNode) => currentNode.id === params.nodes[0]
            );
            if (this.selectedNodes.includes(clickedNode)) {
              this.selectedNodes.splice(
                this.selectedNodes.indexOf(clickedNode),
                1
              );
            } else {
              this.selectedNodes.push(clickedNode);
            }
            this.displayNode(clickedNode);
            this.updateHighlighting();
          }
        }.bind(this)
      );
    },

    displayNode(node) {
      this.displayedElement = node;
      this.displayedElementType = "node";
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
      edge.node0_type = this.capitalizeFirstLetter(
        node0.source_table.split("_")[1]
      );
      edge.node1_type = this.capitalizeFirstLetter(
        node1.source_table.split("_")[1]
      );
      this.displayedElement = edge;
      this.displayedElementType = "edge";
    },

    filterForNetworkEdges() {
      // Step 1: Filter internal edges based on network nodes
      this.networkEdges = this.allInternalEdges.filter(
        (edge) =>
          this.displayedNodes.some(
            (selectedNode) => selectedNode.id === edge.from
          ) &&
          this.displayedNodes.some(
            (selectedNode) => selectedNode.id === edge.to
          )
      );

      // Step 2: Add external edges with additional properties
      this.allExternalEdges.forEach((edge) => {
        if (
          this.displayedNodes.some((node) => node.id === edge.from) &&
          this.displayedNodes.some((node) => node.id === edge.to)
        ) {
          this.networkEdges.push({
            ...edge,
            color: "grey",
            dashes: [10, 10],
            width: 6,
          });
        }
      });

      // Step 3: Remove duplicates considering edges as undirected
      const uniqueEdges = new Set();
      this.networkEdges = this.networkEdges.filter((edge) => {
        // Create a normalized key where the smaller node ID comes first
        const key = [edge.from, edge.to].sort().join("-");
        if (!uniqueEdges.has(key)) {
          uniqueEdges.add(key);
          return true;
        }
        return false;
      });
    },

    capitalizeFirstLetter(str) {
      if (typeof str !== "string" || str.length === 0) return str;
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    hoverNode(item) {
      this.hoveredItem = item;
      if (item) {
        this.calculateTooltipPosition();
      }
    },
    calculateTooltipPosition() {
      if (this.$refs.dropdown) {
        this.tooltipStyle = {
          position: "fixed",
          top: `150px`, // Position below the dropdown
          left: `200px`, // Align with the left edge of the dropdown
          width: `200px`,
        };
      }
    },

    BoxClickEvent(node, event) {
      if (!event.target.classList.contains("remove-node")) {
        const locnode = this.networkNodes.find(
          (locnode) => locnode.id === node.id
        );
        this.displayNode(locnode);
        this.updateHighlighting();
      }
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
    BoxClickEvent2(node, event) {
      if (!event.target.classList.contains("remove-node")) {
        this.displayNode(node);
        this.updateHighlighting();
      }
    },
    RemoveNetworkNode2(node) {
      this.selectedNodes = this.selectedNodes.filter(function (currentNode) {
        return currentNode.id !== node.id;
      });
      this.hoverNode(null);
      this.updateHighlighting();
    },

    updateHighlighting() {
      this.dropdownNodes = this.dropdownNodes.filter((value, index, self) => {
        return index === self.findIndex((v) => v.id === value.id);});


      //this.network.selectNodes([])
      const updateNodes = this.network_nodes.get().map(node => {
        return { ...node, color:groups[node.source_table.split('_')[1]].color, shape: "square", size:15,
        borderWidth: 4, font: {size: 24, color: 'black'}, 
        label: node.display_name, is_highlighted: false,
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
            node.is_highlighted=true
          };              
        return { ...node};});
      const updateNodes4 = updateNodes3.map(node => {
        let color = {border : 'black',
          background : node.color,
          highlight:{border:'black',
            background: node.color}}
        if (node.set === 'external') {node.color = color}            
        return { ...node};});


      this.network_nodes.update(updateNodes4);

      if (this.displayedElementType === "node") {
        this.network.selectNodes([this.displayedElement.id]);
      }
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
    getShapeStyle(color, key) {
      if (key === "gene" || key === "disorder") {
        return {
          backgroundColor: color,
          width: "20px",
          height: "20px",
          border: "3px solid black",
        };
      }
      return { backgroundColor: color, width: "20px", height: "20px" };
    },
  },
};
</script>

<style scoped>
.my-custom-button {
  background-color: #007BFF; /* You can set your preferred button background color */
  color: #fff; /* Default text color */
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.my-custom-button:hover {
  color: white; /* Text color on hover */
  background-color: #0056b3; /* Optional: Darken the background color on hover */
}

.outer-container {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.panel-container {
  width: 220px;
  height: 100%;
  display: flex;
  flex-direction: column; /* Stack panels vertically */
}
.panel-container2 {
  position: absolute;
  left: 1280px;
  width: 220px;
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
  background-color: #104d63;
  border-bottom: 1px solid #ccc;
  border-radius: 5px 5px 0 0;
}

.panel-content {
  padding: 10px;
}

/* Changes the fotn size of the titles of the panels */
h2,
h3 {
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
  background-color: #4caf50;
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
  height: 550px; /* Make sure the container has a height */
  width: 700px; /* Ensure it takes up the full width */
  padding: 0px;
  position: relative;
  border-radius: 10px;
  left: 10px;
}

.legend2 {
  position: absolute;
  top: 50px;
  left: 50px;
  padding: 10px;
  background-color: #cfcfcf8f;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* Use flex-start for left alignment */
  border-radius: 10px;
}

#network {
  flex: 1;
  height: 550px;
  width: 665px;
  border: 6px solid lightgray;
  border-radius: 15px;
}

.tooltip-icon {
  position: absolute;
  background-color: #555;
  top: 40px; /* Abstand zum oberen Rand des Containers */
  right: 40px; /* Abstand zum rechten Rand des Containers */
  padding: 10px;
}

/* The info pannel */
.info-panel {
  position: absolute;
  width: 290px;
  left: 980px;
  height: 550px;
  padding: 20px;
  background-color: #f0f0f0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1;
  border-radius: 10px;
}

.btn-update-network {
  position: relative;
  top: 0px;
  left: 0px;
  background-color: #a5bfdc;
  color: black;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}
.btn-update-network:hover {
  background-color: #cfcfcf8f;
}
.btn-update-network:active {
  transform: scale(0.95);
}

.btn-show-external {
  position: relative;
  top: 5px;
  left: 0px;
  background-color: #a5bfdc;
  color: black;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}
.btn-show-external:hover {
  background-color: #cfcfcf8f;
}
.btn-show-external:active {
  transform: scale(0.95);
}

.btn-clear-network {
  position: absolute;
  top: 455px;
  left: 10px;
  width: 150px;
  background-color: #a5bfdc;
  color: black;
  border: none;
  padding: 6px 10px;
  font-size: 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}
.btn-clear-network:hover {
  background-color: #cfcfcf8f;
}
.btn-clear-network:active {
  transform: scale(0.95);
}

.btn-save-network {
  position: absolute;
  top: 495px;
  left: 10px;
  width: 150px;
  background-color: #a5bfdc;
  color: black;
  border: none;
  padding: 6px 10px;
  font-size: 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}
.btn-save-network:hover {
  background-color: #cfcfcf8f;
}
.btn-save-network:active {
  transform: scale(0.95);
}

.btn-keep-highlighted {
  position: absolute;
  top: 495px;
  left: 455px;
  width: 190px;
  background-color: #a5bfdc;
  color: black;
  border: none;
  padding: 6px 10px;
  font-size: 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}
.btn-keep-highlighted:hover {
  background-color: #cfcfcf8f;
}
.btn-keep-highlighted:active {
  transform: scale(0.95);
}

.legend {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 180px;
  padding: 10px;
  background: linear-gradient(
    135deg,
    #f5f5f5,
    #e0e0e0
  ); /* Gradient background */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: left;
  border-radius: 10px;
}
.legend-item {
  display: flex;
  align-items: center;
  margin-right: 10px;
  font-size: 15px;
}

.legend2 {
  position: absolute;
  top: 230px;
  left: 20px;
  width: 180px;
  padding: 10px;
  background: linear-gradient(
    135deg,
    #f5f5f5,
    #e0e0e0
  ); /* Gradient background */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: left;
  border-radius: 10px;
}

.legend-text {
  margin-left: 10px;
  font-size: 15px;
}

.solid-line {
  width: 30px;
  height: 2px;
  background-color: black;
  border-bottom: 3px dashed black;
}

.dashed-line {
  width: 30px; /* Adjust width as needed */
  height: 3px;
  border-bottom: 3px dashed black;
}

.remove-nodeX {
  cursor: pointer;
  color: red; /* Makes the X red */
  font-size: 24px; /* Match the font size of the text */
  vertical-align: super; /* Adjusts the vertical alignment */
  margin-left: 4px; /* Optional: slight space between the text and X */
}

/* Customize the icon and heading styles here */
.mdi {
  color: white;
  font-size: 24px; /* Adjust size as needed */
  margin-right: 8px; /* Space between icon and text */
  margin-top: -20px;
  position: relative;
}

.network-description {
  cursor: pointer; /* Indicates that the element is clickable */
  background-color: #f5f7fa; /* Light background color for contrast */
  border-left: 5px solid #3498db; /* Accent border to the left */
  padding: 15px 10px; /* Padding around the text */
  margin-bottom: 0px; /* Spacing below the description */
  border-radius: 4px; /* Rounded corners for a modern look */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
  font-family: "Arial", sans-serif; /* A clean, modern font */
  width: 1445px; /* Fixed width of 1200px */
}

.network-description p {
  margin: 0; /* Remove default paragraph margins */
  line-height: 1.6; /* Improve readability */
}

.network-description strong {
  color: #3498db; /* Accent color for important text */
  font-weight: bold;
}

.toggle-link {
  color: #3498db; /* Accent color for clickable text */
  cursor: pointer; /* Indicates that the text is clickable */
  text-decoration: underline; /* Underline to indicate link */
  font-weight: bold; /* Make the link text bold */
  padding: 0 5px; /* Add some padding for better spacing */
}

.toggle-link:hover {
  color: #2980b9; /* Darker color on hover */
  text-decoration: none; /* Remove underline on hover for cleaner look */
}

.icon-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.icon-button .icon {
  width: 24px; /* Adjust based on your icon size */
  height: 24px;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7); /* Darker background for better contrast */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: opacity 0.3s ease; /* Smooth transition for overlay appearance */
}

.overlay-content {
  background: #ffffff; /* White background for the content */
  padding: 30px; /* Increased padding for more space */
  border-radius: 12px; /* Slightly larger border radius for a softer look */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); /* Softer shadow for a floating effect */
  max-width: 500px; /* Limit the width for better readability */
  width: 100%; /* Full width up to the max-width */
  box-sizing: border-box; /* Ensure padding is included in width */
  display: grid; /* Use grid layout */
  grid-template-columns: repeat(2, 1fr); /* 2 columns */
  gap: 20px; /* Space between items */
}

h3 {
  grid-column: span 2;
  margin-top: 0; /* Remove top margin */
  font-size: 1.5em; /* Larger font size for headings */
  color: #333; /* Darker color for better readability */
  font-weight: 600; /* Slightly bolder text */
}

.checkbox-group {
  margin-bottom: 15px; /* Spacing between groups */
}

.checkbox-group label {
  display: flex;
  align-items: center; /* Align checkbox and label vertically */
  font-size: 1em; /* Adjust font size for better readability */
  color: #555; /* Slightly lighter text color */
}

.checkbox-group input[type="checkbox"] {
  width: 24px; /* Increase the size of the checkbox */
  height: 24px; /* Increase the size of the checkbox */
  transform: scale(1); /* Scale up the checkbox */
  margin-right: 10px; /* Space between checkbox and label */
  cursor: pointer; /* Pointer cursor on hover */
}

input[type="number"] {
  width: 100px; /* Full width of the parent container */
  padding: 8px; /* Padding inside the input */
  border: 1px solid #ddd; /* Light border for the input */
  border-radius: 4px; /* Rounded corners for the input */
  box-sizing: border-box; /* Include padding in width */
  font-size: 1em; /* Adjust font size */
  color: #333; /* Darker text color */
}

button {
  background-color: #007bff; /* Primary color for buttons */
  color: white; /* Text color */
  border: none; /* Remove default border */
  padding: 10px 20px; /* Padding inside buttons */
  border-radius: 4px; /* Rounded corners */
  cursor: pointer; /* Pointer cursor on hover */
  font-size: 1em; /* Font size for readability */
  transition: background-color 0.3s ease, transform 0.2s ease; /* Smooth transitions */
  margin: 5px; /* Space between buttons */
}

button:hover {
  background-color: #0056b3; /* Darker color on hover */
  transform: scale(1.02); /* Slightly enlarge button on hover */
}

button:active {
  transform: scale(0.98); /* Slightly shrink button on click */
}

button.cancel {
  background-color: #6c757d; /* Secondary color for cancel button */
}

button.cancel:hover {
  background-color: #98a7b3; /* Darker color on hover */
}

.bold-large-text {
  font-weight: bold; /* Make text bold */
  font-size: 1.2em; /* Slightly larger font size */
  color: #333; /* Ensure the color matches the design */
}
</style>

http://localhost:8000/network/api/getNetwork/?q=x0so7614&t=protein&l=3
http://localhost:8000/network/api/getNetwork/?q=x0ff209&t=phenotype&l=3 x0so7614
x0so4898 x0ff209 x0so4898, x0so7614