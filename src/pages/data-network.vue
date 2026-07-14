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
        <v-card outlined>
           <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title>
              Network Input
              <v-tooltip bottom>
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props">mdi-information</v-icon>
                </template>
                <span>
                  Find Nodes by their internal ID, display name or description and send them to the Network display.
                </span>
              </v-tooltip>
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text>
            <div class="ma-2">
              <v-row align="center">
                <v-col cols="10" class="d-flex align-center">
                  <v-text-field
                      v-model="searchText"
                      density="compact"
                      variant="outlined"
                      :clearable="!isReadOnly && (searchText && searchText.length > 0)"
                      label="Select one or a list of nodes"
                      @input="fetchNodeRecommendations($event)"
                      @keydown.arrow-down.prevent="moveFocus('down')"
                      @keydown.arrow-up.prevent="moveFocus('up')"
                      @keydown.enter.prevent="selectFocusedItem"
                      @keydown.esc.prevent="closeDropdown"
                      hide-details
                      class="mb-0"
                      @focus="showDropdown = true"
                      ref="textField"
                      :readonly="isReadOnly"
                      @click:clear="handleClearNodeInput"
                    ><template v-slot:append>
                    <v-btn
                      v-if="isReadOnly"
                      icon
                      @click="editText"
                    >
                      <v-icon color="primary-darken-1">mdi-pencil</v-icon>
                    </v-btn>
                  </template></v-text-field>
                    </v-col>
                  <v-col cols="2" class="d-flex align-center">
                  <v-btn color="primary-darken-1" block class="mt-0 mb-0" @click="sendToNetwork" :disabled="!selectedNodes.length" elevation="1">
                    <v-icon class="my-0 mr-2">mdi-arrow-down</v-icon>
                    Send to Network
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Dropdown List -->
              <v-row v-if="limitedDropdownNodes.length && !isReadOnly">
                <v-col cols="12">
                  <v-card class="dropdown"
                    v-if="showDropdown && limitedDropdownNodes.length"
                    ref="dropdownMenu"
                    tabindex="0">
                    <v-list>
                      <v-list-item
                            v-for="(item, index) in limitedDropdownNodes"
                            :key="index"
                            @click="addPerDropDown(item)"
                            @mouseover="hoverNode(item)"
                            @mouseleave="hoverNodeLeave"
                            :class="{ 'text-primary': index === activeIndex }"
                            :color="index === activeIndex ? 'primary' : ''"
                            class="d-flex align-center text-truncate"
                          >
                          <!-- Icon Section -->
                          <v-icon
                            class="me-3"
                            size="32"
                            color="transparent"
                          >
                          <v-img
                          :src="getIcon(getPrettyType(item.source_table))"
                          alt="icon"
                          max-width="32"
                          max-height="32"
                          class="me-0 rounded-circle"
                          ></v-img>
                            </v-icon>
                          <!-- Text Section -->
                        <span class="text-subtitle-1">
                          {{`${item.display_name} (${item.id})` }}
                          </span>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Tooltip for Hovered Item (outside dropdown) -->
              <teleport to="body">
                <div v-if="hoveredItem" class="tooltip" :style="tooltipStyle">
                  <strong>ID:</strong> {{ hoveredItem.id }}<br />
                  <strong>Display Name:</strong> {{ hoveredItem.display_name }}<br />
                  <strong>Node Type:</strong> {{ hoveredItem.source_table }}<br />
                  <strong>Description:</strong> {{ hoveredItem.description }}
                </div>
              </teleport>
              <v-row>
                <v-col>
                    <AdvancedSettings :selected-tests="selectedTests"
                                        :signThresh="signThresh"
                                        :disable-selections="disableSelections"
                                        :show-mult-test="true"
                                        :show-header="true"
                                        :use-advanced-title="true"
                                        expansion-panel-variant="default"
                                        header-text="Network Statistics Configuration"
                                        @data-changed="addSettings"
                                        :topNodesNumber="topNodesNumber"
                                        :topPerNodeCount="topPerNodeCount"
                                        :read-only-correction="true"
                                        />
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>

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
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-information-outline</v-icon>
                    Network Overview</v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-card outlined class="network-overview">
                        <v-card-text>
                          <v-row justify="center" align="center" class="mt-2 mb-2">
                            <!-- Nodes -->
                            <v-col cols="6" class="text-center">
                              <v-label class="text-caption">NODES</v-label>
                              <v-sheet color="transparent" class="text-h4 font-weight-bold">
                                {{ networkNodes.length }}
                              </v-sheet>
                            </v-col>
                            <!-- Edges -->
                            <v-col cols="6" class="text-center">
                              <v-label class="text-caption">EDGES</v-label>
                              <v-sheet color="transparent" class="text-h4 font-weight-bold">
                                {{ networkEdges.length }}
                              </v-sheet>
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>
                    </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Node Details -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-magnify</v-icon>
                    Details</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-autocomplete
                      v-model="searchedNodeId"
                      :items="networkNodeSearchItems"
                      label="Search node in network"
                      density="compact"
                      variant="outlined"
                      clearable
                      hide-details
                      @update:model-value="jumpToSearchedNode"
                    ></v-autocomplete>
                    <v-divider class="my-4"></v-divider>
                  <template v-if="displayedElementType === 'node'">
                    <NodeDetails :getIcon="getIcon" :node="displayedElement" />
                    <v-switch
                      v-model="isDetailsNodeSelected"
                      :label="isDetailsNodeSelected ? 'Selected' : 'Not Selected'"
                      @change="toggleNetworkNodeSelection"
                      color="primary"
                      class="ml-2"
                    />
                  </template>
                  <template v-else-if="displayedElementType === 'edge'">
                    <EdgeDetails :getIcon="getIcon" :edge="displayedElement" :selectedTests="selectedTests"/>
                  </template>
                  <p v-else>No element selected. You can inspect a node or an edge by clicking on it.</p>
                </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Selection -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-filter</v-icon>
                    Selection</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row justify="center" align="center">
                      <v-col cols="auto">
                        <v-switch
                          v-model="selectAll"
                          :label="selectAll ? 'Unselect all' : 'Select All'"
                          @change="toggleALLNetworkNodeSelection"
                          color="primary-darken-1"
                          class="ml-2"
                        />
                      </v-col>
                    </v-row>
                    <v-divider class="my-4"></v-divider>
                    <span v-if="selectedNetworkNodes.length === 0">
                          No node selected. Double click on a node to add it to this panel or select it via the Details panel.
                    </span>
                    <v-table dense v-else="selectedNetworkNodes.length === 0">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(node, index) in selectedNetworkNodes" :key="node.id">
                          <td>{{ node.display_name }}</td>
                          <td>{{ this.getPrettyType(node.source_table) }}</td>
                          <td>
                            <v-btn
                              size="small"
                              icon
                              color="error"
                              @click="removeSelectedNetworkNode(index)">
                              <v-icon size="20" color="background">mdi-trash-can-outline</v-icon>
                            </v-btn>
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Connect Nodes -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-transit-connection-variant</v-icon>
                    Connect Nodes
                  </v-expansion-panel-title>
                    <v-expansion-panel-text>
                  <!-- Individual Node Section -->
                  <v-responsive class="pa-0">
                    <v-row>
                    </v-row>
                    <v-divider class="my-4"></v-divider>
                    <v-row>
                      <v-col cols="12">
                        <p>
                          Individual Node
                        </p>
                      </v-col>
                      <v-col cols="12">
                        <!-- TODO Add a settings toggle to set the significance threshold and possibly the multiple testing
                        correction if changeable and if we don't want the user to only be able to set it
                        in Advanced Settings -->
                        <v-btn
                          :disabled="selectedNetworkNodes.length !== 1"
                          color="primary-darken-1"
                          block
                          :class="{'grey lighten-2': selectedNetworkNodes.length !== 1}"
                          @click="connectIndividualNode()"
                        >Significance Filtering</v-btn>
                      </v-col>
                      <!-- TODO Add a settings toggle to set the amount of Nodes to be retrieved per type like Manuel did-->
                      <v-col cols="12">
                        <v-btn
                          :disabled="selectedNetworkNodes.length !== 1"
                          color="primary-darken-1"
                          block
                          :class="{'grey lighten-2': selectedNetworkNodes.length !== 1}"
                          @click="connectIndividualNode(true)"
                        >Node Count</v-btn>
                      </v-col>
                    </v-row>
                    <v-divider class="my-4"></v-divider>
                    <!-- Set of Nodes Section -->
                    <v-row>
                      <v-col cols="12">
                        <p>
                          Set of Nodes
                        </p>
                      </v-col>
                      <v-col cols="12">
                        <v-btn
                          class="mt-2"
                          :disabled="selectedNetworkNodes.length <= 1"
                          color="primary-darken-1"
                          block
                          :class="{'grey lighten-2': selectedNetworkNodes.length <= 1}"
                          @click="connectGroupNodes(false)"
                        >Significance Filtering</v-btn>
                        </v-col>
                      <v-col cols="12">
                        <v-btn
                          class="mt-2"
                          :disabled="selectedNetworkNodes.length <= 1"
                          color="primary-darken-1"
                          block
                          :class="{'grey lighten-2': selectedNetworkNodes.length <= 1}"
                          @click="connectGroupNodes(true)"
                        >Minimum Spanning Tree</v-btn>
                        </v-col>
                        </v-row>
                      </v-responsive>
                      </v-expansion-panel-text>
                </v-expansion-panel>

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

            <!-- Put this in its own file -->
            <v-col cols="8" >
              <v-card outlined class="network-container">

              <!-- Card Content -->
              <v-card-text ref="wholeNetwork">
                <!-- Network Visualization -->
                <v-row>
                    <v-col>
                      <div ref="network" id="network" style="height: 550px;"></div>
                      <!-- Legend -->
                      <div class="legend">
                        <v-row
                          v-for="groupKey in legendGroups"
                          :key="groupKey"
                          align="center"
                          class="mb-2 legend-item"
                          :class="{ 'legend-item-active': isGroupFullySelected(groupKey) }"
                          no-gutters
                          @click="selectNodesByGroup(groupKey)"
                        >
                          <v-tooltip bottom>
                            <template v-slot:activator="{ props }">
                              <v-col cols="auto" class="legend-dot" v-bind="props">
                                <div class="legend-color" :style="getShapeStyle(colorForGroup(groupKey))"></div>
                              </v-col>
                              <v-col cols="auto" class="legend-text" v-bind="props">
                                <span>{{ capitalizeFirstLetter(groupKey) }}</span>
                              </v-col>
                            </template>
                            <span>Click to select/deselect all {{ capitalizeFirstLetter(groupKey) }} nodes</span>
                          </v-tooltip>
                        </v-row>
                      </div>
                  </v-col>
                </v-row>
              </v-card-text>

              <!-- Card Header -->
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>
                    <v-tooltip bottom>

                    </v-tooltip>
                  </v-toolbar-title>
                    <v-btn-toggle
                      v-model="selectionMode"
                      class="mr-3"
                      density="compact"
                      variant="outlined"
                      divided
                      mandatory
                      @update:model-value="applySelectionMode"
                    >
                      <v-tooltip text="Zoom / pan" location="bottom">
                        <template v-slot:activator="{ props }">
                          <v-btn value="zoom" size="small" v-bind="props">
                            <v-icon :color="toolbarIconColor">mdi-cursor-default</v-icon>
                          </v-btn>
                        </template>
                      </v-tooltip>
                      <v-tooltip text="Rectangular selection" location="bottom">
                        <template v-slot:activator="{ props }">
                          <!-- Cosmograph's own rect-selection control icon (from
                               @cosmograph/cosmograph's select-rect button config),
                               reused directly for a consistent look. -->
                          <v-btn value="rect" size="small" v-bind="props">
                            <svg width="20" height="20" viewBox="0 0 96 96" version="1.1" xmlns="http://www.w3.org/2000/svg" :style="{ color: toolbarIconColor, fillRule: 'evenodd', clipRule: 'evenodd', strokeMiterlimit: 2 }">
                              <g fill="none" fill-rule="nonzero" stroke="currentColor" stroke-width="8px">
                                <path d="M92.8,71.003L92.8,83.2L75.058,83.2"/>
                                <path d="M65.014,83.2L34.968,83.2"/>
                                <path d="M24.994,83.2L4,83.2L4,71.003"/>
                                <path d="M4,60.954L4,35.036"/>
                                <path d="M4,25.06L4,11.8L24.994,11.8"/>
                                <path d="M34.968,11.8L65.014,11.8"/>
                                <path d="M75.058,11.8L92.8,11.8L92.8,25.06"/>
                                <path d="M92.8,35.036L92.8,60.954"/>
                              </g>
                            </svg>
                          </v-btn>
                        </template>
                      </v-tooltip>
                      <v-tooltip text="Polygonal selection" location="bottom">
                        <template v-slot:activator="{ props }">
                          <!-- Cosmograph's own polygon-selection control icon (from
                               @cosmograph/cosmograph's select-polygon button config),
                               reused directly for a consistent look. -->
                          <v-btn value="polygon" size="small" v-bind="props">
                            <svg width="20" height="20" viewBox="0 0 24 24" transform="scale(1.15)" xmlns="http://www.w3.org/2000/svg" :style="{ color: toolbarIconColor }">
                              <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M21.72.226a1 1 0 0 1 .587.936l-.336 13.583a1 1 0 0 1-.685.924l-8.893 2.948a2.6 2.6 0 0 1-.028.692a2.93 2.93 0 0 1 1.429 1.495c.342.792.33 1.645.198 2.267a1 1 0 0 1-1.956-.417c.07-.328.06-.739-.078-1.056c-.098-.226-.27-.444-.655-.565l-.064.05c-.667.512-1.545.8-2.475.8s-1.808-.288-2.476-.8c-.668-.511-1.165-1.289-1.165-2.224s.497-1.712 1.165-2.224q.232-.178.495-.318L1.782 5.237a1 1 0 0 1 1.092-1.394l11.694 2.146L20.63.402a1 1 0 0 1 1.09-.176m-1.73 13.766l-8.53 2.828a3 3 0 0 0-.22-.185c-.668-.511-1.546-.799-2.476-.799H8.76L4.39 6.154l10.308 1.892a1 1 0 0 0 .859-.248l4.692-4.326zm-12.485 4.23c-.288.22-.382.455-.382.637s.094.416.382.637c.288.22.73.386 1.259.386s.97-.165 1.259-.386c.288-.22.382-.455.382-.637s-.094-.416-.382-.637c-.289-.22-.73-.386-1.26-.386s-.97.165-1.258.386"/>
                            </svg>
                          </v-btn>
                        </template>
                      </v-tooltip>
                    </v-btn-toggle>
                    <v-switch
                      v-model="physics_on"
                      @change="updatePhysics"
                      :label="physics_on ? 'Disable Physics' : 'Enable Physics'"
                      color="surface"
                      class="mt-5 mr-3"
                    />
                <v-btn
                  icon
                  @click="saveNetworkImage"
                >
                  <v-icon class="m-3">mdi-camera</v-icon> <!-- mdi-abacus-->
                </v-btn>
                <a ref="downloadLink" style="display: none" :href="imageUrl" :download="downloadFileName"></a>
                <!--<v-btn
                  icon
                  @click="saveNetworkFile"
                >
                  <v-icon class="m-3">mdi-download</v-icon>  mdi-abacus
                </v-btn>-->
                <v-btn
                  icon
                  @click="clearNetworkWarn=true;"
                >
                  <v-icon class="m-3">mdi-trash-can-outline</v-icon> <!-- mdi-abacus-->
                </v-btn>
                  <v-dialog width="auto" v-model="clearNetworkWarn">
                    <v-card color="primary" rounded="lg">
                      <v-card-title class="headline text-white" >
                        <v-icon class="my-0 mr-2">mdi-information-outline</v-icon>
                        <b>You are about to clear the displayed Network.</b>
                      </v-card-title>
                      <v-card-text class="text-white">
                        Would you like to clear the entire network or keep the selected subnetwork and remove <br>
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

              <!-- Card Actions
              <v-card-actions>
                <v-btn color="primary" @click="console.log('saveNetwork')" title="Save network to .json and download it">
                  Save Network
                </v-btn>
              </v-card-actions>-->
              </v-card>
            </v-col>
          </v-row>
        </v-card>
        <v-row>
          <div class="ma-2">
            <v-snackbar
                v-model="showInfo"
                :color="infoType"
            >
              <v-icon class="my-0 mr-2">
                mdi-information-outline
              </v-icon>
              {{ infoText }}

              <template v-slot:actions>
                <v-btn
                    variant="text"
                    @click="showInfo = false"
                >
                  Close
                </v-btn>
              </template>
            </v-snackbar>
          </div>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import AdvancedSettings from "@/components/AdvancedSettings.vue";
import FilterToolbar from "@/components/FilterToolbar.vue";
import {BASE_URL, isLoading, setIsLoading} from "@/components/constants.js";
import {darkenHexColor, generateGroupColor, loadNetworkState, saveNetworkState} from "../components/network/networkData.js";
import NodeDetails from '@/components/network/NodeDetails.vue';
import EdgeDetails from '@/components/network/EdgeDetails.vue';
import {Cosmograph} from "@cosmograph/cosmograph";
import {getCookie} from "@/components/authentication/auth.js";
import StatisticalTestLine from "@/components/StatisticalTestLine.vue";
import NetworkEdgeLine from "@/components/network/NetworkEdgeLine.vue";
import {useTheme} from 'vuetify';



export default {
  components: {
    StatisticalTestLine, FilterToolbar, AdvancedSettings, NodeDetails, NetworkEdgeLine,
    EdgeDetails},
  data() {
    return {
      // context filter
      contextValue: null,
      disableSelections: false,

      // Network Input values
      searchText: "",
      selectedNodes: [],
      typeaheadresult: [],
      dropdownNodes: [],
      debounceTimeout: null,
      showDropdown: false,
      isReadOnly: false,  // Boolean flag to track read-only state

      hoveredItem: null,
      tooltipStyle: {},
      activeIndex: -1, // Tracks which item is focused

      imageUrl: null, // Holds the image URL to be downloaded
      imageText: "static-network",

      // Network Visualization & Settings
      showLoading: isLoading,
      networkNodes: [],//test_data["nodes"],
      networkEdges: [],//test_data["edges"],
      cosmographInstance: null,
      _cosmoConfig: null,
      _configUpdateChain: null,
      indexToNodeId: [],
      indexToEdgeId: [],
      _clickTimer: null,
      _lastClickIndex: null,
      _lastClickTime: 0,
      displayedNodes:  null,
      displayedEdges:  null,
      allInternalEdges: [],
      allExternalEdges: [],

      physics_on: true,
      selectionMode: 'zoom', // 'zoom' | 'rect' | 'polygon' -- see applySelectionMode()
      selectedBorderColor: '', //TODO don't set this in mounted, maybe make it reactive

      displayedElement: null,
      displayedElementType: null,   // 'node' or 'edge'
      isDetailsNodeSelected: false,
      includedNodeTypes: new Set(), // stores type currently present in network for Legend
      searchedNodeId: null, // Details-panel "search node in network" field

      selectedNetworkNodes: [],
      selectAll: false,
      clearNetworkWarn: false,

      // Advanced Settings (default) values
      selectedTests: { testType: 'parametric', correction: 'bh' },
      // Real correction used to precompute the static (no-context) network's
      // edges -- fetched in mounted() via fetchNetworkConfig(). 'bh' fallback
      // matches today's default in case the fetch fails.
      staticCorrection: 'bh',
      signThresh: 0.999,
      fixThreshold: true,
      topNodesNumber: 5,
      topPerNodeCount: true,

      // Popup
      showInfo: false,
      infoType: "info", // "error" "success"
      infoText: "",

    };
  },
  computed: {
    // Legend entries: whatever groups are actually present in the current network --
    // node_group/source_table has no fixed set of values (see colorForGroup()).
    // Sorted for a stable, predictable order.
    legendGroups() {
      return Array.from(this.includedNodeTypes).sort();
    },
    // Limit the number of displayed nodes to 5
    limitedDropdownNodes() {
      return this.dropdownNodes.slice(0, 5);
    },
    // Items for the Details panel's "search node in network" field -- searches
    // only the nodes already loaded into the current network (client-side),
    // unlike the Network Input field above which queries the backend.
    networkNodeSearchItems() {
      return this.networkNodes.map((node) => ({
        title: `${node.display_name} (${this.getPrettyType(node.source_table)})`,
        value: node.id,
      }));
    },
    // v-btn-toggle's `color` prop only ever styles the currently-active button
    // (that's how Vuetify indicates the selection), so it can't give every
    // button in the selection-mode toggle a consistent color regardless of which
    // one is active -- bind this directly on each icon instead, bypassing that
    // entirely. Same white/dark inversion as the toolbar itself: primary-darken-1
    // (the toolbar's background) is dark in the light theme and light in the dark
    // theme, so icons need the opposite of the theme's own "text" color to read
    // clearly against it either way.
    toolbarIconColor() {
      return this.$vuetify.theme.global.name === 'dyHealthNetTheme' ? '#FFFFFF' : '#1E1E1E';
    },
    downloadFileName() {
      const currentDate = new Date().toLocaleDateString().replace(/\//g, '-'); // Formatting the date as 'MM-DD-YYYY'
      return `network-image-${this.imageText}-${currentDate}.png`; // Append the date to the filename
    },
  },
  methods: {
    // Network Input methods
    // This should return the last typed string that is following the display names of the selected nodes seperated by commas
    getLastTypedString() {
      console.log("getLastTypedString");
      console.log("searchText: ", this.searchText);
      if (!this.searchText) {
        return null; // If searchText is empty, return an empty string
      }
      // Split by commas, trim whitespace, and return the last part
      const parts = this.searchText.split(",").map((part) => part.trim());
      return parts[parts.length - 1];
    },
    deleteNodesNotInSearchText(){
      this.selectedNodes = this.selectedNodes.filter(node =>
        this.searchText.includes(node.display_name) || this.searchText.includes(node.id)
      );
    },
    async fetchNodeRecommendations(event) {
      if (event && event.inputType) {
        if (event.inputType === "deleteContentBackward" || event.inputType === "deleteContentForward") {
          console.log("Somethings getting deleted");
          this.deleteNodesNotInSearchText();
          console.log("this.selectedNodes", this.selectedNodes);
        }
        else if (event.inputType === "insertText" || event.inputType === "insertFromPaste") {
          const lastChar = this.searchText[this.searchText.length - 1];
          if (lastChar === ",") {
            console.log("Comma was typed.");
            await this.findNodeMatch();
            this.typeaheadresult = [];
            this.hoveredItem = null;
            return;
          }
        }
      }
      const search = this.getLastTypedString();

      // Clear any previous debounce timeout
      if (this.debounceTimeout) clearTimeout(this.debounceTimeout);

      // Set a new debounce timeout
      this.debounceTimeout = setTimeout(async () => {
        if (!search) {
          this.typeaheadresult = [];
          this.hoveredItem = null;
          return;
        }

        try {
          const csrfToken = getCookie('csrftoken');
          const apiUrl =
                BASE_URL +
                "/network/api/getTypeaheadResults/" +
                "?s=" +
                encodeURIComponent(search) +
                "&c=" +
                (this.contextValue != null ? encodeURIComponent(this.contextValue) : "");

          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,
            },
            credentials: 'include',
          });

          if (!response.ok) throw new Error("Network response was not ok");

          const data = await response.json();

          // Map the response data and filter out already selected nodes
          this.typeaheadresult = Object.entries(data).map(([id, details]) => ({
            id,
            display_name: details.display_name,
            description: details.description,
            source_table: details.source_table,
            x_refs: details.x_refs,
          }));

          this.dropdownNodes = this.typeaheadresult.filter(node =>
            !this.selectedNodes.some(selected => selected && selected.id === node.id)
          );
        } catch (error) {
          console.error("Error fetching data:", error);
          this.typeaheadresult = [];
          this.dropdownNodes = [];
          this.infoText = "Could not load node suggestions. Please try again.";
          this.infoType = "error";
          this.showInfo = true;
        }
      }, 300); // Debounce delay in milliseconds
    },
    updateSearchText(){
      console.log("updateSearchText");
      const search = this.getLastTypedString();
      console.log("search", search);
      console.log("this.selectedNodes", this.selectedNodes);
      const nodeNames = this.selectedNodes
        .filter(node => node && node.display_name)
        .map(node => node.display_name);
      console.log("searchText", this.searchText);
      console.log("nodeNames", nodeNames);
      this.searchText = nodeNames.length > 0 ? nodeNames.join(", ") + ", " : search;
      console.log("searchText", this.searchText);
    },
    addPerDropDown(item) {
      // Re-join the array into comma-separated searchText
      //this.searchText = searchTextParts.join(', ') + ', ';
      this.deleteNodesNotInSearchText();
      this.selectedNodes.push(item);
      this.updateSearchText();
      this.fetchNodeRecommendations();
      // this.dropdownNodes = [];
      // this.hoverNodeLeave();
      console.log("this.searchText: ", this.searchText)
      console.log("this.selectedNodes: ", this.selectedNodes)

      // Focus the input field and move the cursor to the end
      this.$nextTick(() => {
        const input = this.$refs.textField.$el.querySelector('input');
        input.focus();
        input.setSelectionRange(this.searchText.length, this.searchText.length);
      });
    },
    async fetchNodeMatch(search) {
      if (!search) return [];
      try {
        const csrfToken = getCookie('csrftoken');
        const apiUrl =
                BASE_URL +
                "/network/api/getTypeaheadResults/" +
                "?s=" +
                encodeURIComponent(search) +
                "&c=" +
                (this.contextValue != null ? encodeURIComponent(this.contextValue) : "");
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();

        // Map response data and filter out already selected nodes
        return Object.entries(data)
          .map(([id, details]) => ({
            id,
            display_name: details.display_name,
            description: details.description,
            source_table: details.source_table,
            x_refs: details.x_refs,
          }))
          .filter(node => !this.selectedNodes.some(selected => selected && selected.id === node.id));
      } catch (error) {
        console.error("Error fetching data:", error);
        this.infoText = "Could not look up that node. Please try again.";
        this.infoType = "error";
        this.showInfo = true;
        return [];
      }
    },
    async findNodeMatch() {
      console.log("findNodeMatch")
      const searchElements = this.searchText.split(',').map(element => element.trim()).slice(0, -1);
      for (const element of searchElements) {
        console.log("curr element", element)
        if (!this.selectedNodes.some(node => node.display_name === element || node.id === element)) {
          console.log("not in selected nodes")
          try {
            const response = await this.fetchNodeMatch(element); // Assume this function exists
            if (response) {
              const match = response[0];
              if (response.length > 1){
                const match_sec = response[1];
                if (match_sec.display_name === element || match_sec.id === element) {
                  console.log("response.length >= 1")
                  this.infoText = "The typed node description is not unique. " +
                      "Please select the desired node from the dropdown menu or use the unique internal id."
                  this.infoType = "info";
                  this.showInfo = true;
                  continue;
                }
              }
              if (match.display_name === element || match.id === element) {
                console.log("match matched")
                console.log("match", match)
                console.log("this.selectedNodes", this.selectedNodes)
                if (!this.selectedNodes.some(node => node.id === match.id)) {
                  this.selectedNodes.push(match); // Add the matched node from backend
                }
              }
            }
          } catch (error) {
            console.error(`Backend search failed for: ${element}`, error);
            this.infoText = "The typed node cannot be found in the database."
            this.infoType =  "info";
            this.showInfo =  true;
          }
        }
      }
      this.updateSearchText();
    },
    hoverNode(item) {
      if (!this.hoveredItem || this.hoveredItem !== item) {
        this.hoveredItem = item;

        if (item) {
          const dropdown = this.$refs.dropdownMenu?.$el; // Accessing the actual DOM element
          const dropdownRect = dropdown.getBoundingClientRect();
          const centerX = (window.innerWidth) / 2; // Center of the page

          // Calculate fixed position: right-center of the dropdown
          this.tooltipStyle = {
            backgroundColor: `rgb(var(--v-theme-primary-darken-1))`,
            color: `rgb(var(--v-theme-surface))`,
            borderRadius: '5px',
            padding: '10px',
            position: 'absolute',
            top: `${dropdownRect.top + dropdownRect.height / 2 + window.scrollY - 80}px`, // Vertically centered
            left: `${centerX}px`,  // Right of the dropdown
            zIndex: 1000,
          };
        }
      }
    },
    hoverNodeLeave() {
      // Hide the tooltip when the item is no longer hovered
      this.hoveredItem = null;
      this.activeIndex = -1;
    },
    getIcon(sourceTable) {
      switch (sourceTable) {
        case 'Protein':
          return new URL('../assets/figures/proteins.png', import.meta.url).href;
        case 'Metabolite':
          return new URL('../assets/figures/metabolites.png', import.meta.url).href;
        case 'Variants':
          return new URL('../assets/figures/genetic_variants.png', import.meta.url).href;
        default:
          return new URL('../assets/figures/phenotypes.png', import.meta.url).href;
      }
    },
    // node_group/source_table has no fixed set of values (see colorForGroup()) --
    // derive the label the same way the color system derives its group key
    // (strip any "cohort_"-style prefix, take the trailing segment) instead of a
    // hardcoded lookup that only recognized the original 6 categories and fell
    // back to a literal "None" for everything else.
    getPrettyType(sourceTable) {
      if (!sourceTable) return 'Unknown';
      return this.capitalizeFirstLetter(sourceTable.split('_').pop());
    },
    labelColor(colorName) {
      // chartjs does not support theme colors so we just directly call the theme color
      if (this.$vuetify.theme.global.name === 'dyHealthNetTheme') {
        return this.$vuetify.theme.themes.dyHealthNetTheme.colors[colorName];
      } else {
        return this.$vuetify.theme.themes.dyHealthNetThemeDark.colors[colorName];
      }

    },
    capitalizeFirstLetter(str) {
      if (typeof str !== "string" || str.length === 0) return str;
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    handleClickOutside(event) {
      if (this.isReadOnly){
        this.closeDropdown()
        return;
      }
      const dropdown = this.$refs.dropdownMenu?.$el; // Accessing the actual DOM element
      const textField = this.$refs.textField?.$el; // Accessing the actual DOM element

      // Check if dropdown and textField are not undefined and if the clicked element is NOT inside either
      if (
        dropdown && !dropdown.contains(event.target) &&
        textField && !textField.contains(event.target)
      ) {
        this.closeDropdown()
        return;
      }
    },
    editText() {
      this.isReadOnly = false;
      //this.searchText = '';  // Optionally clear the input
      //this.selectedNodes = [];  // Optionally clear selected nodes
    },
    handleClearNodeInput(){
      this.searchText = "";
      this.selectedNodes = [];
      this.saveState();
    },
    moveFocus(direction) {
      if (this.isReadOnly) return;
      const length = this.limitedDropdownNodes.length;
      if (direction === "down") {
        this.activeIndex = (this.activeIndex + 1) % length;
      } else if (direction === "up") {
        if (this.activeIndex === -1) {
          this.activeIndex = length - 1;  // Start from the last item if moving up from -1
        } else {
          this.activeIndex = (this.activeIndex - 1 + length) % length;
        }
      }
       if (this.activeIndex === -1) {
         return;
       }
      this.hoverNode(this.limitedDropdownNodes[this.activeIndex]);
    },
    selectFocusedItem() {
      if (this.activeIndex === -1) {
         return;
       }
      const selectedItem = this.limitedDropdownNodes[this.activeIndex];
      if (selectedItem) {
        this.addPerDropDown(selectedItem);
      }
    },
    closeDropdown() {
      this.showDropdown = false;
      this.hoveredItem = null;
      this.activeIndex = -1;
    },
    async sendToNetwork() {
      console.log("this.selectedNetworkNodes", this.selectedNetworkNodes)
      // Send selectedNodes to networkNodes and reset selectedNodes
      this.networkNodes= [];
      // filter selected Nodes for presence in searchText (if user deletes them)
      this.selectedNodes = this.selectedNodes.filter(node =>
        this.searchText.includes(node.display_name) || this.searchText.includes(node.id)
      );
      this.networkNodes = this.selectedNodes.map((node) => ({
          ...node,
          set: "CHRIS", //TODO change to internal/cohort or smth when backend became more modular
        }));
      console.log("this.networkNodes", this.networkNodes)
      // check that all selected nodes are unique and still present in the network
      this.selectedNetworkNodes = this.selectedNetworkNodes
        .filter(node => this.networkNodes.some(networkNode => networkNode.id === node.id))
        .reduce((unique, node) => {
          if (!unique.some(n => n.id === node.id)) {
            unique.push(node);
          }
          return unique;
        }, []);
      console.log("this.selectedNetworkNodes", this.selectedNetworkNodes)
      // make searchText pretty
      const nodeNames = this.selectedNodes
        .filter(node => node && node.display_name)
        .map(node => node.display_name);
      this.searchText = nodeNames.length > 0 ? nodeNames.join(", ") : "";
      this.isReadOnly = true;
      this.closeDropdown();
      //this.selectedNodes = []; // Clear the selection
      this.filterForNetworkEdges();

      await this.initializeCosmograph();
      this.applyDesign();
    },

    //Network Visualization
    async initializeCosmograph() {
      const container = this.$refs.network;
      if (!container) return;

      await this.destroyCosmograph();

      this.includedNodeTypes = new Set(
        this.networkNodes.filter((node) => node.source_table).map((node) => node.source_table.split("_").pop())
      );

      // Explicit sequential index lets us reliably map Cosmograph's click/color
      // callback indices back to our own node/edge objects (pointIndexBy pins it).
      // colorKey drives Cosmograph's own 'map' point-color strategy (see
      // buildPointColorMap) -- undefined for an unrecognized group falls back to
      // `unknownColor` natively instead of us having to guard against it.
      const pointsForCosmo = this.networkNodes.map((node, i) => {
        const group = node.source_table ? node.source_table.split("_").pop() : undefined;
        return {
          ...node,
          idx: i,
          colorKey: group ? (node.set === "external" ? `${group}_external` : group) : undefined,
        };
      });
      const nodeIdToIdx = new Map(pointsForCosmo.map((p) => [p.id, p.idx]));
      // linkSourceIndexBy/linkTargetIndexBy are validated as required alongside
      // linkSourceBy/linkTargetBy in this Cosmograph version, so every link
      // needs its endpoints' numeric point indices, not just their ids.
      // renderWidth bakes in the external-vs-internal width so linkWidthByFn can
      // be a trivial identity passthrough instead of a per-edge lookup.
      const linksForCosmo = this.networkEdges.map((edge) => ({
        ...edge,
        source: edge.from,
        target: edge.to,
        sourceIndex: nodeIdToIdx.get(edge.from),
        targetIndex: nodeIdToIdx.get(edge.to),
        renderWidth: edge.set === "external" ? 6 : (edge.width ?? 2),
      }));
      this.indexToNodeId = pointsForCosmo.map((p) => p.id);
      this.indexToEdgeId = linksForCosmo.map((l) => l.id);

      // Cosmograph's setConfig() merges the object it's given onto its DEFAULT
      // config, not onto the currently-active config -- so every setConfig call
      // (including the ones applyDesign() makes later) must carry the full
      // config, or fields like points/links/pointIdBy get silently reset.
      // Keep the authoritative copy on the instance and always pass all of it.
      this._cosmoConfig = {
        points: pointsForCosmo,
        links: linksForCosmo,
        pointIdBy: 'id',
        pointIndexBy: 'idx',
        // Cosmograph's own 'map' color strategy: a static colorKey -> hex lookup it
        // evaluates natively (falls back to unknownColor for unmapped colorKeys),
        // instead of a per-point JS callback that has to guard against bad data itself.
        pointColorBy: 'colorKey',
        pointColorStrategy: 'map',
        pointColorByMap: this.buildPointColorMap(),
        unknownColor: this.labelColor("text"),
        // Without an explicit pointDefaultSize, Cosmograph falls back to
        // sizing points by degree whenever links are present -- pin a fixed
        // size so all nodes render uniformly, matching the old vis-network look.
        pointDefaultSize: 11,
        // A single click now always puts the graph into "some selection active"
        // mode (see reapplySelection/computePointSize), so this greyout kicks in
        // on basically every click -- Cosmograph's own default for links (0.1) is
        // near-invisible, and leaving points on their implicit default made them
        // fade out hard too. Keep non-selected elements clearly present, just
        // visually deprioritized, instead of the graph seeming to lose most of
        // its nodes/edges every time something's clicked.
        pointGreyoutOpacity: 0.55,
        linkGreyoutOpacity: 0.35,
        // pointSizeBy just needs to name an existing column so Cosmograph actually
        // invokes pointSizeByFn per point -- the column's own value is unused,
        // computePointSize looks the point up by index instead (see there for why:
        // the currently-clicked node needs to render much bigger than the rest).
        pointSizeBy: 'id',
        pointSizeByFn: (value, index) => this.computePointSize(index),
        linkSourceBy: 'source',
        linkTargetBy: 'target',
        linkSourceIndexBy: 'sourceIndex',
        linkTargetIndexBy: 'targetIndex',
        linkColorBy: 'set',
        linkWidthBy: 'renderWidth',
        pointLabelBy: 'display_name',
        showLabels: true,
        showDynamicLabels: true,
        // Labels are colored like their point by default (no pointLabelColor set);
        // the hovered label gets its own CSS class instead so it can be forced to
        // plain white regardless of the node's group color -- see :deep() rule below.
        showHoveredPointLabel: true,
        hoveredPointLabelClassName: 'cosmo-hovered-label',
        enableSimulation: this.physics_on,
        // Cosmograph's own native click-to-select ('single') fires independently of
        // our onPointClick callback and drives its own selection dimming + label
        // highlight, competing with our own selectedNetworkNodes-driven selection
        // below. We handle all click/selection semantics ourselves, so this stays off.
        selectPointOnClick: false,
        renderHoveredPointRing: true,
        resetSelectionOnEmptyCanvasClick: false,
        backgroundColor: this.labelColor("background"),
        hoveredPointRingColor: this.labelColor("primary-darken-1"),
        // linkColorBy/linkWidthBy have no built-in 'map' strategy, but `value` here
        // is already the row's raw column value (edge.set / edge.renderWidth) --
        // no per-edge lookup needed, these are O(1) and can't throw.
        linkColorByFn: (value) => (value === "external" ? "black" : this.labelColor("text")),
        linkWidthByFn: (value) => value,
        onPointClick: (index) => this.handlePointClick(index),
        onLinkClick: (linkIndex) => this.handleLinkClick(linkIndex),
        onBackgroundClick: () => this.handleBackgroundClick(),
        // Rectangular/polygonal selection (see the toolbar's mode toggle and
        // applySelectionMode()) picks points natively; fold the result into
        // selectedNetworkNodes so it's not just a visual flash that the next
        // reapplySelection() call (from any subsequent click) would overwrite.
        onRectSelected: (selection, pointIndices) => this.handleAreaSelected(pointIndices),
        onPolygonSelected: () => this.handleAreaSelected(this.cosmographInstance?.getSelectedPointIndices()),
        // Physics keeps spreading points across the simulation space; re-center
        // the camera on the graph whenever the layout settles so nodes don't
        // drift out of view with no way to find them again. But skip it while a
        // node is focused (single/double-clicked) -- otherwise this can fire
        // shortly after handlePointSingleClick's zoomToPoint() and immediately
        // zoom back out to the full graph, undoing the "center on this node" the
        // click just asked for.
        onSimulationEnd: () => {
          if (this.displayedElementType !== 'node') {
            this.cosmographInstance?.fitView();
          }
        },
      };
      this.cosmographInstance = new Cosmograph(container, this._cosmoConfig);
      // The constructor already fired its own setConfig()/data-upload cycle (every
      // design/theme option above is already part of the config it was constructed
      // with) -- wait for that to land before touching the instance again.
      // Cosmograph's setConfig() never waits for a prior in-flight config update
      // before starting a new one, so calling it again here (applyDesign() used to)
      // before the first upload finished raced two concurrent uploads of the same
      // points/links data into the shared, page-wide DuckDB-WASM worker (whose WASM
      // heap only ever grows, never shrinks) -- that's what was driving
      // "InternalError: out of memory" after just a couple of graph rebuilds.
      await this.cosmographInstance.dataUploaded();
      // Physics-off case: onSimulationEnd never fires (no simulation runs), so fit here too.
      this.cosmographInstance?.fitView(0);
      this.reapplySelection();
      // The native dblclick.zoom interceptor is attached once, on the persistent
      // container (see mounted()) -- not here on the canvas, which gets destroyed
      // and recreated on every rebuild.
    },
    async destroyCosmograph() {
      if (this._clickTimer) {
        clearTimeout(this._clickTimer);
        this._clickTimer = null;
      }
      const inst = this.cosmographInstance;
      this.cosmographInstance = null;
      if (inst && typeof inst.destroy === 'function') {
        try {
          await inst.destroy();
        } catch (e) {
          console.warn('Cosmograph destroy failed', e);
        }
      }
    },
    // Cosmograph has no native double-click callback: a second click on the
    // same point within 280ms cancels the pending single-click and is treated
    // as a double-click instead.
    handlePointClick(index) {
      const now = Date.now();
      if (this._clickTimer && index === this._lastClickIndex && (now - this._lastClickTime) < 280) {
        clearTimeout(this._clickTimer);
        this._clickTimer = null;
        this.handlePointDoubleClick(index);
        return;
      }
      this._lastClickIndex = index;
      this._lastClickTime = now;
      this._clickTimer = setTimeout(() => {
        this._clickTimer = null;
        this.handlePointSingleClick(index);
      }, 280);
    },
    handlePointSingleClick(index) {
      const node = this.networkNodes.find((n) => n.id === this.indexToNodeId[index]);
      if (node) this.displayNode(node);
      // displayNode() changed displayedElement -- applyDesign() reads it to decide
      // which point gets the big "currently clicked" treatment (see computePointSize
      // / reapplySelection) and to recompute pointSizeByFn, so it must run after.
      this.applyDesign(false);
      // Center/zoom the camera on whatever's now shown in the Details panel.
      this.centerOnPoint(index);
    },
    // Details panel "search node in network" field: jumping to a result should
    // behave exactly like clicking that node on the canvas -- reuse
    // handlePointSingleClick() rather than duplicating its display/center logic.
    jumpToSearchedNode(nodeId) {
      if (!nodeId) return;
      const index = this.indexToNodeId.indexOf(nodeId);
      if (index === -1) return;
      this.handlePointSingleClick(index);
      // Reset for the next search rather than leaving the picked name sitting in
      // the field -- the Details panel below is the source of truth for what's
      // currently displayed, so a stale search value here would just be confusing
      // once the user selects a different node another way (e.g. clicking it).
      this.$nextTick(() => {
        this.searchedNodeId = null;
      });
    },
    handlePointDoubleClick(index) {
      const node = this.networkNodes.find((n) => n.id === this.indexToNodeId[index]);
      if (!node) return;
      const existingIndex = this.selectedNetworkNodes.findIndex((n) => n.id === node.id);
      if (existingIndex !== -1) {
        this.selectedNetworkNodes.splice(existingIndex, 1);
      } else {
        this.selectedNetworkNodes.push(node);
      }
      // Double-click is purely a selection toggle -- it doesn't show the node in
      // the Details panel or give it the exclusive "as if selected" highlight/size
      // (that's single-click's job, see handlePointSingleClick/reapplySelection).
      // If this node happens to already be the displayed one (from an earlier
      // single click), clear that so the real selectedNetworkNodes highlight shows
      // through immediately instead of the stale single-node exclusive one.
      if (this.displayedElementType === 'node' && this.displayedElement?.id === node.id) {
        this.displayedElement = null;
        this.displayedElementType = null;
      }
      this.checkSelectAll();
      this.applyDesign();
      this.centerOnPoint(index);
    },
    // zoomToPoint() picks between two different transition strategies depending
    // on how far the camera currently is from the target point, which made single-
    // vs double-click centering behave inconsistently (whichever branch a given
    // click happened to hit). Going straight to the position-based transform
    // instead is a single deterministic code path, so it centers the same way
    // regardless of where the camera already was.
    centerOnPoint(index) {
      const position = this.cosmographInstance?.getPointPositionByIndex(index);
      if (position) {
        // Pass the CURRENT zoom level, not a fixed one -- otherwise this forces
        // the view to whatever scale we hardcode here on every click (zooming out
        // if you'd zoomed in further than that, or in if you'd zoomed out past
        // it). Reusing the live zoom level makes this a pure pan/center, no
        // zoom change at all.
        const currentZoom = this.cosmographInstance.getZoomLevel();
        this.cosmographInstance.setZoomTransformByPointPositions(new Float32Array(position), 700, currentZoom);
      }
    },
    handleLinkClick(linkIndex) {
      const edge = this.networkEdges.find((e) => e.id === this.indexToEdgeId[linkIndex]);
      if (edge) this.displayEdge(edge);
      // Clears the "currently clicked node" big/highlighted treatment, since the
      // details panel is now showing an edge instead of a node.
      this.applyDesign(false);
    },
    handleBackgroundClick() {
      this.displayedElement = null;
      this.displayedElementType = null;
      this.applyDesign(false);
    },
    displayNode(node) {
      node.type = this.getPrettyType(node.source_table);
      this.displayedElement = node;
      this.displayedElementType = "node";
      this.isDetailsNodeSelected = this.isNodeInNetworkSelected(node);
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
      edge.node0_type = this.getPrettyType(node0.source_table);
      edge.node1_type = this.getPrettyType(node1.source_table);
      this.displayedElement = edge;
      this.displayedElementType = "edge";
    },
    isNodeInNetworkSelected(node) {
      return this.selectedNetworkNodes.some(existingNode => existingNode.id === node.id);

    },
    toggleNetworkNodeSelection() {
      const index = this.selectedNetworkNodes.findIndex(n => n.id === this.displayedElement.id); // Check for the node by unique identifier (id)

      if (this.isDetailsNodeSelected && index === -1) {
        this.selectedNetworkNodes.push(this.displayedElement);
        this.applyDesign();
      } else if (!this.isDetailsNodeSelected && index !== -1) {
        this.selectedNetworkNodes.splice(index, 1);
      }
      this.checkSelectAll();
    },
    toggleALLNetworkNodeSelection(){
      if(this.selectAll) {
        for (const node of this.networkNodes) {
          if (!this.selectedNetworkNodes.includes(node)) {
            this.selectedNetworkNodes.push(node);  // Add the node if it's not already selected
          }
        }
      }
      else{
        this.selectedNetworkNodes = [];
      }
      this.applyDesign();
    },
    groupNodesFor(groupKey) {
      return this.networkNodes.filter(
        (node) => node.source_table && node.source_table.split("_").pop() === groupKey
      );
    },
    isGroupFullySelected(groupKey) {
      const groupNodes = this.groupNodesFor(groupKey);
      if (!groupNodes.length) return false;
      return groupNodes.every((node) => this.isNodeInNetworkSelected(node));
    },
    // Legend click: toggle-selects every node of that group, reusing the same
    // selectedNetworkNodes -> applyDesign() pipeline as double-click/Select All,
    // so it feeds the Selection and Connect Nodes panels for free.
    selectNodesByGroup(groupKey) {
      const groupNodes = this.groupNodesFor(groupKey);
      if (!groupNodes.length) return;
      if (this.isGroupFullySelected(groupKey)) {
        const groupIds = new Set(groupNodes.map((node) => node.id));
        this.selectedNetworkNodes = this.selectedNetworkNodes.filter((node) => !groupIds.has(node.id));
      } else {
        for (const node of groupNodes) {
          if (!this.isNodeInNetworkSelected(node)) {
            this.selectedNetworkNodes.push(node);
          }
        }
      }
      this.checkSelectAll();
      this.applyDesign();
    },
    removeSelectedNetworkNode(index){
      this.selectedNetworkNodes.splice(index, 1);
      this.applyDesign();
      this.checkSelectAll();
    },
    checkSelectAll(){
      if (this.selectedNetworkNodes.length === 0){
        this.selectAll = false;
      } else if (this.selectedNetworkNodes.length === this.networkNodes.length) {
        this.selectAll = true;
      }
    },
    // editThreshold(){
    //   if (this.fixThreshold){
    //     // do a popup here asking the user if he/she really wants to change the significance threshold as this
    //     // would result in inconcistencies or would delete the current network
    //     this.fixThreshold = false;
    //   } else {
    //     // do a popup here asking the user if he/she really wants to change the significance threshold as this
    //     // would result in inconcistencies or would delete the current network
    //     this.fixThreshold = true;
    //     this.signThresh = this.signThreshTemp
    //     this.clearNetwork();
    //   }
    // },
    async connectIndividualNode(count=false) {
      // Use the first element of selectedNetworkNodes
      const firstNode = this.selectedNetworkNodes?.[0];

      if (firstNode) {

        if (firstNode.set === "CHRIS") { //TODO change to internal/cohort or smth when backend became more modular
          await this.fetchNodesAndEdges(firstNode, count); // Pass the first node to fetchNodesAndEdges
          this.filterForNetworkEdges();
          await this.initializeCosmograph();
          this.applyDesign();
        }
      } else {
        console.warn("No nodes in selectedNetworkNodes to process.");
      }
    },
    async connectGroupNodes(minSpanTree) {
      // Check if selectedNetworkNodes is not null/undefined and has at least two elements
      if (this.selectedNetworkNodes && this.selectedNetworkNodes.length > 1) {
        const filteredNodeIds = this.selectedNetworkNodes
            .filter(node => node.set === "CHRIS")  // Filter nodes with .set == "CHRIS"
            .map(node => node.id);  // Extract the node IDs
        if (filteredNodeIds.length === 0) {
          console.warn("No nodes in selectedNetworkNodes to process.");
        }
        await this.fetchNodeGroupEdges(filteredNodeIds, minSpanTree);
        this.filterForNetworkEdges();
        await this.initializeCosmograph();
        this.applyDesign();
      }
    },
    async fetchNodesAndEdges(node, count=false) {
      setIsLoading(true);
      try {
        const csrfToken = getCookie('csrftoken');
        const nodeID = node.id;
        const type = node.source_table.split("_").pop();
        const limit = count ? this.topNodesNumber : "";
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
          encodeURIComponent(this.topPerNodeCount) +
          "&s=" +
          this.signThresh +
            (this.contextValue != null ? "&c=" + encodeURIComponent(this.contextValue) : "") +
          "&o=" +
          encodeURIComponent(JSON.stringify(this.selectedTests));

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
          this.infoText = data.message;
          this.infoType = "info";
          this.showInfo = true;
        }

        this.setNetworkNodes(data);
      } catch (error) {
        console.error("Error fetching edges:", error);
        this.infoText = "Could not build the network for this node. Please try again.";
        this.infoType = "error";
        this.showInfo = true;
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
          encodeURIComponent(JSON.stringify(nodes)) +
          "&s=" +
          this.signThresh +
            (this.contextValue != null ? "&c=" + encodeURIComponent(this.contextValue) : "") +
          "&o=" +
          encodeURIComponent(JSON.stringify(this.selectedTests)) +
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
          const edgeIdsToRemove = new Set(
            this.networkEdges
              .filter(edge => nodeSet.has(edge.from) && nodeSet.has(edge.to))
              .map(edge => edge.id)
          );
          this.networkEdges = this.networkEdges.filter(edge => !edgeIdsToRemove.has(edge.id));
          this.allInternalEdges = this.networkEdges;
        }
        if (data.message != ""){
          this.infoText = data.message;
          this.infoType = "info";
          this.showInfo = true;
        }
        this.setNetworkNodes(data);


      } catch (error) {
        console.error("Error fetching edges:", error);
        this.infoText = "Could not build the network for this selection. Please try again.";
        this.infoType = "error";
        this.showInfo = true;
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
            const renamedEdge = {
              ...edge,
              from: edge.source ?? edge.node_id_1,
              to: edge.target ?? edge.node_id_2,
            };
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
      // (rendering style for 'external' edges is applied via linkColorByFn/renderWidth
      // in initializeCosmograph(), not baked into the data model here)
      this.networkEdges = [
        ...this.allInternalEdges.filter(isValidEdge),
        ...this.allExternalEdges.filter(isValidEdge),
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
    // Reflects selectedNetworkNodes onto the live Cosmograph selection. Doesn't
    // touch setConfig()/data at all, so it's safe to call right after construction
    // (before the instance's own initial data upload has settled) as well as after
    // every selection change.
    // The currently-displayed node (single click, not necessarily in
    // selectedNetworkNodes) gets the same crossfilter "selected" dimming
    // treatment as a real multi-select, without actually joining
    // selectedNetworkNodes / the Selection panel.
    reapplySelection() {
      if (!this.cosmographInstance) return;
      // While a rect/polygon selection tool is active, don't reassert our own
      // point-selection constraint here. Cosmograph's crossfilter intersects a
      // new drag with whatever's already selected, so re-imposing selectedNetworkNodes
      // after every drag (handleAreaSelected -> applyDesign -> here) meant each
      // subsequent selection could only narrow further within the last one, never
      // reach the full graph again -- "selection of selection". applySelectionMode()
      // clears the constraint when entering rect/polygon mode and calls this again
      // to reassert it once back in zoom mode.
      if (this.selectionMode !== 'zoom') return;
      // A displayed node (single- or double-clicked, shown in the Details panel)
      // is an *exclusive* highlight -- just that node plus its direct neighbors
      // (and, since selectPoints() also un-dims links between two selected
      // points, the edges connecting them), standing in for whatever the real
      // selectedNetworkNodes highlight would otherwise be. Clicking away from any
      // node (background or an edge) clears displayedElement, which falls through
      // to the real multi-select highlight again.
      let selectedIndices;
      if (this.displayedElementType === 'node' && this.displayedElement) {
        const clickedIndex = this.indexToNodeId.indexOf(this.displayedElement.id);
        selectedIndices = clickedIndex === -1
          ? []
          : [clickedIndex, ...(this.cosmographInstance.getConnectedPointIndices(clickedIndex) || [])];
      } else {
        const ids = new Set(this.selectedNetworkNodes.map((n) => n.id));
        selectedIndices = Array.from(ids)
          .map((id) => this.indexToNodeId.indexOf(id))
          .filter((i) => i !== -1);
      }
      // selectPoints() replaces the current selection outright -- calling
      // unselectAllPoints() first (unconditionally, on every click) inserted a
      // visible intermediate "nothing selected" frame (no dimming = everything
      // reads as highlighted) before the real selection landed a moment later.
      // Only actually clearing when there's nothing to select avoids that flash.
      if (selectedIndices.length) {
        this.cosmographInstance.selectPoints(selectedIndices);
      } else {
        this.cosmographInstance.unselectAllPoints();
      }
    },
    // The currently-displayed node (see reapplySelection) also renders much larger
    // than the rest -- the previous ring-based "what's clicked" indicator was too
    // subtle to notice, size is not.
    computePointSize(index) {
      const isDisplayed =
        this.displayedElementType === 'node' &&
        this.displayedElement &&
        this.indexToNodeId[index] === this.displayedElement.id;
      return isDisplayed ? 26 : 11;
    },
    // Recolors/reweights nodes+edges based on current selection/external/theme
    // state without rebuilding the whole graph (kept lightweight so pan/zoom/
    // camera state isn't reset on every click or theme toggle).
    async applyDesign(saveState = true) {
      if (!this.cosmographInstance) return;

      // Instant, synchronous -- safe to run every time regardless of any
      // in-flight setConfig() below.
      this.reapplySelection();

      // Merge onto the full stored config (not a bare partial) -- see the note
      // in initializeCosmograph() about setConfig() resetting anything omitted.
      this._cosmoConfig = {
        ...this._cosmoConfig,
        backgroundColor: this.labelColor("background"),
        hoveredPointRingColor: this.labelColor("primary-darken-1"),
        // The map's colors are static hex, so only the fallback needs refreshing on theme change.
        unknownColor: this.labelColor("text"),
        // New function reference each call so Cosmograph's config-change detection
        // (reference equality) actually re-invokes it -- displayedElement (which it
        // reads via computePointSize) can change without pointsForCosmo changing.
        pointSizeByFn: (value, index) => this.computePointSize(index),
        linkColorByFn: (value) => (value === "external" ? "black" : this.labelColor("text")),
        linkWidthByFn: (value) => value,
      };
      // applyDesign() runs unawaited from every click handler, so rapid clicks
      // (e.g. a node then immediately the background) can have two setConfig()
      // calls in flight together. Cosmograph's setConfig() doesn't serialize
      // against a prior in-flight call (the same race that caused the "out of
      // memory" bug in initializeCosmograph() before it was serialized there) --
      // here it instead let a slower, now-stale update finish *after* a faster,
      // fresher one and briefly repaint the old sizes/selection, i.e. exactly the
      // "everything flashes highlighted for a moment" symptom. Chain onto any
      // in-flight call so they always apply in order, never overlapping.
      this._configUpdateChain = (this._configUpdateChain || Promise.resolve())
        .then(() => this.cosmographInstance?.setConfig(this._cosmoConfig))
        .catch((e) => console.warn('Cosmograph setConfig failed', e));
      await this._configUpdateChain;

      if (saveState) {
        this.saveState();
      }
    },
    // Builds the colorKey -> hex lookup consumed by Cosmograph's 'map' point-color
    // strategy: one entry per known group plus a darkened '<group>_external' variant,
    // so a single static object handles both dimensions instead of a per-point function.
    buildPointColorMap() {
      const colorMap = {};
      for (const key of this.includedNodeTypes) {
        const color = this.colorForGroup(key);
        colorMap[key] = color;
        colorMap[`${key}_external`] = darkenHexColor(color, 0.35);
      }
      return colorMap;
    },
    // node_group/source_table is fully user-defined on the backend, not a fixed
    // set of categories -- every group's color is generated from its name (a pure
    // hash -> hue function, see generateGroupColor), so any group value just works
    // without a hardcoded lookup table to keep in sync with the database.
    colorForGroup(key) {
      return generateGroupColor(key);
    },
    getShapeStyle(color) {
      return { borderRadius: "50%", backgroundColor: color, width: "13px", height: "13px" };
    },
    updatePhysics() {
      if (!this.cosmographInstance) return;
      if (this.physics_on) {
        this.cosmographInstance.unpause();
      } else {
        this.cosmographInstance.pause();
      }
    },
    // Toolbar mode toggle: only one of rect/polygon selection can be active at a
    // time (or neither, for plain zoom/pan) -- always deactivate both first so
    // switching modes (or back to "zoom") doesn't leave a stale one still armed.
    applySelectionMode() {
      if (!this.cosmographInstance) return;
      this.cosmographInstance.deactivateRectSelection?.();
      this.cosmographInstance.deactivatePolygonalSelection?.();
      if (this.selectionMode === 'rect' || this.selectionMode === 'polygon') {
        // Clear any leftover point-selection constraint (from a prior click or
        // drag) before handing off to the tool -- see reapplySelection() for why
        // leaving one active would scope every subsequent drag down to it.
        this.cosmographInstance.unselectAllPoints();
        if (this.selectionMode === 'rect') {
          this.cosmographInstance.activateRectSelection?.();
        } else {
          this.cosmographInstance.activatePolygonalSelection?.();
        }
      } else {
        // Back to zoom/pan: reassert the real selectedNetworkNodes/displayed-node
        // highlight, which reapplySelection() skipped touching while a selection
        // tool was active.
        this.reapplySelection();
      }
    },
    // Adds whatever a rect/polygon drag just picked out to selectedNetworkNodes
    // (additive, like double-click -- doesn't clear any prior selection), then
    // runs it through the normal pipeline so it's reflected in the Selection
    // panel and persists past the next click instead of just flashing briefly.
    handleAreaSelected(pointIndices) {
      if (!pointIndices || !pointIndices.length) return;
      const newNodes = pointIndices
        .map((index) => this.networkNodes.find((n) => n.id === this.indexToNodeId[index]))
        .filter((node) => node && !this.isNodeInNetworkSelected(node));
      if (!newNodes.length) return;
      this.selectedNetworkNodes.push(...newNodes);
      this.checkSelectAll();
      this.applyDesign();
    },
    async clearNetwork(full = true, saveState=true){
      this.clearNetworkWarn = false;
      this.networkNodes = [];
      this.networkEdges = []; // do i also need allInternalEdges??
      this.displayedNodes = null;
      this.displayedEdges = null;
      this.allInternalEdges = [];
      this.allExternalEdges = [];
      this.displayedElement = null;
      this.displayedElementType = null;
      this.isDetailsNodeSelected = false;
      this.selectedNetworkNodes = [];
      if(full){
        await this.initializeCosmograph();
        this.applyDesign(saveState);
      } else{
        this.sendToNetwork()
      }
    },
    async clearUnselectedNodes(){
      this.clearNetworkWarn = false;
      // Set to only selected Nodes
      this.networkNodes =  [...this.selectedNetworkNodes];
      // filter edges now
      this.filterForNetworkEdges();
      // override internal edges with filtered edges
      this.allInternalEdges = this.networkEdges;
      await this.initializeCosmograph();
      this.checkSelectAll();
      this.applyDesign(true);
    },
    // saveNetworkFile() {
    //   if (this.vis_network_nodes.length > 0) {
    //     const nodes = this.vis_network_nodes.get();
    //     const edges = this.vis_network_edges.get();
    //
    //     const exportData = { options: this.selectedTests, nodes: nodes, edges: edges };
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
      const container = this.$refs.network;
      const canvas = container?.querySelector('canvas');

      if (canvas) {

        // Create a temporary offscreen canvas to avoid triggering redraw
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;

        // Draw the current content of the network on the offscreen canvas
        offscreenCtx.drawImage(canvas, 0, 0);

        // Legend entries: whatever groups are actually present, same as the on-screen legend
        const includedGroups = this.legendGroups;

        // Adjust legend height dynamically based on included groups
        const legendHeight = 40 + includedGroups.length * 35; // Title + 35px per group

        // Define the position for the legend (left bottom corner)
        const legendX = 20;
        const legendY = Math.max(50,offscreenCanvas.height/2 - legendHeight - 100);

        // Loop over the groups to draw the legend dynamically
        let yOffset = 50; // Starting Y position for the first item
        includedGroups.forEach((groupKey) => {
          // Draw larger color circles
          offscreenCtx.beginPath();
          offscreenCtx.arc(legendX + 25, legendY + yOffset + 15, 15, 0, 2 * Math.PI, false); // Radius increased to 15
          offscreenCtx.fillStyle = this.colorForGroup(groupKey); // Set the color
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

    // Advanced Settings methods
    addSettings(data) {
      //console.log("data: ", data)
      Object.entries(data).forEach(([key, value]) => {
        if (key in this) {
          this[key] = value; // Update the corresponding variable in the parent
        } else {
          console.warn(`Unhandled key: ${key}`);
        }
      });
      const selectedNodesSave = this.selectedNetworkNodes;
      this.clearNetwork(false);
      this.selectedNetworkNodes = selectedNodesSave;
      this.sendToNetwork();
    },

    // Context methods
    async updateData(val) {
      //console.log("updateData val ", val)
      this.contextValue = val ? val.value : null;
      const context = await this.getContexts(this.contextValue);
      this.searchText = "";
      this.selectedNodes = [];
      this.isReadOnly = false;
      this.dropdownNodes= [];
      if (context) {
        console.log("context.content.contextName",context.content.contextName)
        console.log("context.content.tests",context.content.tests)
        this.selectedTests = {
          testType: context.content.testType ?? 'parametric',
          correction: context.content.correction ?? 'bh',
        };
        this.disableSelections = true;
        this.clearNetwork(true,false);
      }
      else{
        this.selectedTests = { testType: 'parametric', correction: this.staticCorrection };
        this.disableSelections = false;
        this.clearNetwork(true, false);
      }
      this.loadState();
    },
    // Real multiple-testing correction used to precompute the static network's
    // edges (the UI can't meaningfully offer a different one -- see
    // readOnlyCorrection on AdvancedSettings/StatisticalTestLine).
    async fetchNetworkConfig() {
      try {
        const response = await fetch(`${BASE_URL}/general/api/networkConfig/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
          credentials: 'include',
        });
        const data = await response.json();
        if (data?.correction) this.staticCorrection = data.correction;
      } catch (error) {
        console.warn('Could not fetch network config, defaulting correction to bh:', error);
      }
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
          this.infoText = "Could not load the selected study's details.";
          this.infoType = "error";
          this.showInfo = true;
          return null;  // Return null in case of error
        }
      }
      return null;  // Return null if contextVal/ val = null
    },

    // Page/ State Reload
    saveState() {
      //console.log("saveState")
      const nodes = this.networkNodes;
      const edges = this.networkEdges;
      const user_settings = {
        selectedNodes: this.selectedNodes,
        selectedNetworkNodes: this.selectedNetworkNodes,
        selectedTests: this.selectedTests,
        signThresh: this.signThresh,
        fixThreshold: this.fixThreshold,
        topNodesNumber: this.topNodesNumber,
        topPerNodeCount: this.topPerNodeCount,
        selectAll: this.selectAll,
      }

      const exportData = { nodes: nodes, edges: edges ,
        vis_options: {simulation: {enabled: this.physics_on}}, user_settings: { ...user_settings }};
      console.log("Save State exportData", exportData)
      saveNetworkState(this.contextValue, exportData);
    },
    async loadState() {
      const savedState = loadNetworkState(this.contextValue);
      if (savedState) {
        console.log("Load State savedState", savedState)
        const { nodes, edges, vis_options, user_settings } = savedState;
        this.networkNodes = nodes;
        // Guard against a stale/edited saved state where an edge references a node id
        // no longer present: initializeCosmograph() looks up each edge endpoint's point
        // index by id, and an edge with no matching node produces an undefined
        // sourceIndex/targetIndex that crashes the Cosmograph rebuild entirely.
        // filterForNetworkEdges() isn't usable here since it rebuilds from
        // allInternalEdges/allExternalEdges, which aren't part of the persisted state.
        const nodeIds = new Set(nodes.map((node) => node.id));
        this.networkEdges = edges.filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to));
        // vis_options.physics is the pre-Cosmograph-migration shape; fall back to it
        // so localStorage state saved before this change still loads correctly.
        this.physics_on = vis_options?.simulation?.enabled ?? vis_options?.physics?.enabled ?? true;
        this.physics_on = vis_options?.physics?.enabled ?? true;

        this.selectedNodes = user_settings.selectedNodes;
        this.selectAll = user_settings.selectAll;
        this.updateSearchText();

        this.selectedNetworkNodes = user_settings.selectedNetworkNodes;
        const loaded = user_settings.selectedTests;
        this.selectedTests = (loaded?.testType !== undefined)
          ? loaded
          : { testType: 'parametric', correction: loaded?.correction ?? 'bh' };
        this.signThresh = parseFloat(user_settings.signThresh);
        this.fixThreshold = user_settings.fixThreshold;
        this.topNodesNumber = parseInt(user_settings.topNodesNumber);
        this.topPerNodeCount = user_settings.topPerNodeCount;
        await this.initializeCosmograph(); // Reapply the state to the new network
        this.applyDesign(false);
      }
    },
  },
  watch: {
    showDropdown(newVal) {
      // Add or remove the global click listener when dropdown visibility changes
      if (newVal) {
        document.addEventListener('click', this.handleClickOutside);
        this.activeIndex = -1;
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    },
    '$vuetify.theme.global.name'(newTheme, oldTheme) {
      console.log(`Theme changed from ${oldTheme} to ${newTheme}`);
      this.applyDesign(false); // Trigger the network update
    },
    // fetchNetworkConfig() is async and may resolve after updateData() already ran
    // with the 'bh' fallback -- re-sync selectedTests.correction once the real
    // value arrives, but only if still in static (no-context) mode.
    staticCorrection(newVal) {
      if (this.contextValue == null) {
        this.selectedTests = { ...this.selectedTests, correction: newVal };
      }
    },
    },
    beforeUnmount() {
      // Clean up event listener when component is destroyed
      document.removeEventListener('click', this.handleClickOutside);
      this.destroyCosmograph();
    },

  mounted() {
    const theme = useTheme();
    this.loadState(); // Load state when the component is mounted
    this.fetchNetworkConfig(); // Real correction used for the static network (see watch)
    this.selectedBorderColor = theme.current.value.colors['primary']; // Correct way to access the primary color
    // @cosmos.gl/graph wires up d3-zoom internally, which attaches its own native
    // dblclick.zoom handler (zoom in centered on the cursor) directly to the canvas
    // by default -- there's no public config to turn it off, and it fires on every
    // double-click (node or background), overriding centerOnPoint()'s result right
    // after it runs. A capture-phase listener added directly on the canvas doesn't
    // help here: for listeners on the *same* element, the capture flag doesn't
    // determine order, registration order does -- and d3-zoom's listener is already
    // attached by the time ours would be, so it always runs first regardless. Doing
    // this on `network` instead (an ancestor of the canvas, and stable across
    // Cosmograph instance rebuilds, unlike the canvas itself) means the capture
    // phase genuinely reaches this listener before the event ever reaches the
    // canvas, so stopPropagation() here keeps it from reaching d3-zoom at all. Our
    // own double-click detection is built from two onPointClick calls within
    // 280ms, not the native dblclick DOM event, so it's unaffected.
    this.$refs.network?.addEventListener('dblclick', (e) => e.stopPropagation(), true);
  },
};
</script>

<style scoped>

/* Cosmograph mounts label elements into #network itself, outside Vue's own
   render tree -- :deep() reaches them anyway since they're still inside this
   component's DOM subtree. Overrides the label's own point-color inheritance
   (no pointLabelColor is set, so labels default to their point's color) with
   plain white specifically for whichever label is currently hovered. */
:deep(.cosmo-hovered-label) {
  color: #fff !important;
}

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
  margin-right: 8px; /* Space between the color and the text */
}
.legend-item {
  cursor: pointer;
}
.legend-item-active .legend-text span {
  font-weight: 700;
  text-decoration: underline;
}
/* Style for the legend container */
.legend {
  position: absolute;  /* Position relative to the nearest positioned ancestor (network container) */
  bottom: 60px;  /* Shifted further into the graph so it doesn't hug the corner */
  left: 40px;    /* Shifted further into the graph so it doesn't hug the corner */
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