<template>
  <v-container class="network-page page-container py-10">
    <v-row>
      <v-col cols="12">
            <div class="hero">
              <div>
                <p class="eyebrow">Network</p>
                <h1 class="title">Network Exploration</h1>
                <p class="subtitle">
                  Dynamically build and investigate the network of associations to confirm existing hypotheses or uncover novel relations.
                </p>
              </div>
            </div>
          </v-col>
        </v-row>

        <div class="filter-toolbar-slot">
          <FilterToolbar :disable-move="true" @change-context="updateData"></FilterToolbar>
        </div>
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

              <v-row class="align-center my-2">
                <v-col><v-divider></v-divider></v-col>
                <v-col cols="auto" class="text-medium-emphasis">OR</v-col>
                <v-col><v-divider></v-divider></v-col>
              </v-row>

              <v-row align="center">
                <v-col cols="12">
                  <v-btn color="primary-darken-1" block class="mt-0 mb-0" @click="sendWholeNetwork" :loading="showLoading" elevation="1">
                    <v-icon class="my-0 mr-2">mdi-web</v-icon>
                    Send Whole Network
                  </v-btn>
                </v-col>
              </v-row>

              <v-row>
                <v-col>
                  <WholeNetworkSettings :selected-tests="wholeNetworkTests"
                                        :density="density"
                                        expansion-panel-variant="default"
                                        @data-changed="updateWholeNetworkSettings"
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
                      :custom-filter="nodeSearchFilter"
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
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(node, index) in selectedNetworkNodes" :key="node.id">
                          <td>{{ node.display_name }}</td>
                          <td>{{ this.getPrettyType(node.source_table) }}</td>
                          <td>{{ node.description }}</td>
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
                    <p>Community Detection</p>
                    <template v-if="lastNetworkMode === 'whole'">
                      <v-select
                        v-model="selectedAlgorithm"
                        :items="communityAlgorithms"
                        item-title="label"
                        item-value="value"
                        label="Algorithm"
                        density="compact"
                        variant="outlined"
                        class="mt-2"
                        :disabled="isClusteringLoading"
                      ></v-select>
                      <p class="text-caption text-medium-emphasis mt-n2 mb-2">
                        {{ algorithmDescription }}
                      </p>
                      <v-btn
                        color="primary-darken-1"
                        block
                        class="mt-2"
                        :loading="isClusteringLoading"
                        :disabled="isClusteringLoading"
                        @click="runLeidenClustering"
                      >{{ clusteringActive ? `Re-run ${selectedAlgorithmLabel} Clustering` : `Run ${selectedAlgorithmLabel} Clustering` }}</v-btn>

                      <template v-if="clusteringActive">
                        <v-btn
                          class="mt-2"
                          variant="outlined"
                          block
                          @click="resetClusteringColors"
                        >Reset to Node Type Colors</v-btn>

                        <div class="mt-4">
                          <template v-if="algorithmUsesResolution">
                            <label class="text-caption">Leiden resolution: {{ leidenResolutions[resolutionIndex] }}</label>
                            <v-slider
                              v-model="resolutionIndex"
                              :min="0"
                              :max="leidenResolutions.length - 1"
                              :step="1"
                              show-ticks="always"
                              thumb-label="always"
                              density="compact"
                              color="primary"
                            >
                              <template #thumb-label>{{ leidenResolutions[resolutionIndex] }}</template>
                            </v-slider>
                            <p class="text-caption text-medium-emphasis">
                              {{ includedNodeTypes.size }} communities at this resolution. Higher values produce more communities.
                            </p>
                          </template>
                          <p v-if="currentModularity != null" class="text-caption text-medium-emphasis">
                            Modularity: {{ currentModularity.toFixed(3) }} · Conductance: {{ currentConductance.toFixed(3) }}
                          </p>

                          <v-btn
                            class="mt-2"
                            color="primary"
                            variant="outlined"
                            :disabled="legendGroups.length === 0"
                            @click="resultsPanelOpen = true; resultsPanelTab = 'communityAnnotation'; if (communityAnnotationStatus === 'idle') runCommunityAnnotation();"
                          >Community Annotation</v-btn>

                          <!-- <v-divider class="my-4"></v-divider>
                          <p class="text-caption text-medium-emphasis mb-2">
                            Scores the current clustering's biological coherence via DIGEST, against
                            random background partitions of the same size. Only one node type can be
                            scored per run.
                          </p>
                          <v-select
                            v-model="scoreClusteringNodeGroup"
                            :items="scoreClusteringNodeGroups"
                            label="Node type to score"
                            density="compact"
                            variant="outlined"
                            :disabled="scoreClusteringStatus === 'running'"
                          ></v-select>
                          <v-select
                            v-model="scoreClusteringType"
                            :items="scoreClusteringTypeOptions"
                            item-title="title"
                            item-value="value"
                            label="Category"
                            density="compact"
                            variant="outlined"
                            :disabled="scoreClusteringStatus === 'running'"
                          ></v-select>
                          <v-select
                            v-model="scoreClusteringTarId"
                            :items="scoreClusteringTarIdOptions"
                            item-title="title"
                            item-value="value"
                            label="Identifier scheme"
                            density="compact"
                            variant="outlined"
                            :disabled="scoreClusteringStatus === 'running'"
                          ></v-select>
                          <v-btn
                            block
                            color="primary"
                            variant="outlined"
                            :loading="scoreClusteringStatus === 'running'"
                            :disabled="scoreClusteringStatus === 'running' || !scoreClusteringNodeGroup || !scoreClusteringTarId"
                            @click="runScoreClustering"
                          >{{ scoreClusteringStatus === 'success' ? 'Re-score Clustering' : 'Score Clustering' }}</v-btn>

                          <div v-if="scoreClusteringStatus === 'success' && scoreClusteringResult" class="mt-3">
                            <v-table density="compact">
                              <thead>
                                <tr><th>Metric</th><th>Value</th><th>p-value</th></tr>
                              </thead>
                              <tbody>
                                <tr v-for="metric in ['DI-based', 'SS-based', 'DBI-based']" :key="metric">
                                  <td>{{ metric }}</td>
                                  <td>{{ formatScoreValue(scoreClusteringResult.input_values?.values?.[metric]) }}</td>
                                  <td>{{ formatScoreValue(scoreClusteringResult.p_values?.values?.[metric]) }}</td>
                                </tr>
                              </tbody>
                            </v-table>
                            <p class="text-caption text-medium-emphasis mt-2">
                              DBI-based is better when lower; DI-based and SS-based are better when
                              higher. Scored {{ scoreClusteringResult.coverage?.scoredNodeCount }} of
                              {{ scoreClusteringResult.coverage?.inputNodeCount }} clustered nodes
                              ({{ scoreClusteringResult.coverage?.nodeGroup }} via
                              {{ scoreClusteringResult.coverage?.tarId }}).
                            </p>
                          </div> -->
                        </div>
                      </template>
                    </template>
                    <p v-else class="text-medium-emphasis">
                      Community detection is available once you've sent the whole network above ("Send Whole Network") -- it isn't supported for node-set-built subnetworks.
                    </p>

                    <NodeSetActionsPanel
                      :selected-node-count="selectedNetworkNodes.length"
                      :has-selected-protein="hasSelectedProtein"
                      :has-selected-metabolite="hasSelectedMetabolite"
                      :selected-protein-count="selectedProteinAccessions.length"
                      :selected-metabolite-mapped-count="selectedMetaboliteCount - reactomeUnmappedMetabolites.length"
                      :selected-metabolites-without-chebi-count="selectedMetabolitesWithoutChebi.length"
                      :reactome-unmapped-metabolite-names="reactomeUnmappedMetabolites.map((node) => node.display_name)"
                      :reactome-run-disabled="selectedProteinAccessions.length + selectedMetaboliteChebiIds.length + selectedMetabolitesWithoutChebi.length === 0"
                      :reactome-enrichment-ran="reactomeEnrichmentRan"
                      :gemini-loading="geminiLoading"
                      :enrichment-loading="enrichmentLoading"
                      :reactome-enrichment-loading="reactomeEnrichmentLoading"
                      @run-gemini-label="runGeminiLabel(); resultsPanelOpen = true; resultsPanelTab = 'gemini';"
                      @run-protein-enrichment="runProteinEnrichment(); resultsPanelOpen = true; resultsPanelTab = 'enrichment';"
                      @run-reactome-enrichment="runReactomeEnrichment(); resultsPanelOpen = true; resultsPanelTab = 'reactomeEnrichment';"
                    />
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
                      <NetworkLegend
                        class="legend"
                        :items="legendItems"
                        :title="legendTitle"
                        selectable
                        @select="selectNodesByGroup"
                      />
                  </v-col>
                </v-row>
              </v-card-text>

              <!-- Card Header -->
              <GraphToolbar
                :physics-on="physics_on"
                @update:physics-on="onPhysicsChange"
                :show-hide-unconnected="true"
                :hide-unconnected="hideUnconnected"
                @update:hide-unconnected="onHideUnconnectedChange"
                @save-image="saveNetworkImage"
              >
                <template #prepend>
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
                </template>
                <template #append>
                  <v-btn
                    icon
                    @click="clearNetworkWarn=true;"
                  >
                    <v-icon class="m-3">mdi-trash-can-outline</v-icon>
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
                </template>
              </GraphToolbar>
              <a ref="downloadLink" style="display: none" :href="imageUrl" :download="downloadFileName"></a>

              <!-- Card Actions
              <v-card-actions>
                <v-btn color="primary" @click="console.log('saveNetwork')" title="Save network to .json and download it">
                  Save Network
                </v-btn>
              </v-card-actions>-->
              </v-card>
            </v-col>
          </v-row>

          <v-row v-if="resultsPanelOpen || enrichmentRan || reactomeEnrichmentRan || geminiRan">
            <v-col cols="12">
              <EnrichmentResultsPanel
                v-model:open="resultsPanelOpen"
                v-model:tab="resultsPanelTab"
                :enrichment-ran="enrichmentRan"
                :enrichment-results="enrichmentResults"
                :enrichment-loading="enrichmentLoading"
                :reactome-enrichment-ran="reactomeEnrichmentRan"
                :reactome-enrichment-results="reactomeEnrichmentResults"
                :reactome-enrichment-loading="reactomeEnrichmentLoading"
                :gemini-ran="geminiRan"
                :gemini-label="geminiLabel"
                :gemini-loading="geminiLoading"
                :community-annotation-available="clusteringActive"
                :community-annotation-status="communityAnnotationStatus"
                :community-annotation-progress="communityAnnotationProgress"
                :community-annotation-results="communityAnnotationResults"
                @run-community-annotation="runCommunityAnnotation"
              />
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
</template>

<script>
import AdvancedSettings from "@/components/AdvancedSettings.vue";
import FilterToolbar from "@/components/FilterToolbar.vue";
import {BASE_URL, isLoading, setIsLoading} from "@/components/constants.js";
import {darkenHexColor, assignGroupColors, getNodeIcon, loadNetworkState, saveNetworkState, capitalizeFirstLetter, drawLegendPanel} from "../components/network/networkData.js";
import {interpolateRainbow} from 'd3-scale-chromatic';
import NodeDetails from '@/components/network/NodeDetails.vue';
import EdgeDetails from '@/components/network/EdgeDetails.vue';
import NetworkLegend from '@/components/network/NetworkLegend.vue';
import {Cosmograph} from "@cosmograph/cosmograph";
import {getCookie} from "@/components/authentication/auth.js";
import StatisticalTestLine from "@/components/StatisticalTestLine.vue";
import NetworkEdgeLine from "@/components/network/NetworkEdgeLine.vue";
import WholeNetworkSettings from "@/components/network/WholeNetworkSettings.vue";
import GraphToolbar from "@/components/network/GraphToolbar.vue";
import EnrichmentResultsPanel from "@/components/network/EnrichmentResultsPanel.vue";
import NodeSetActionsPanel from "@/components/network/NodeSetActionsPanel.vue";
import {useTheme} from 'vuetify';



export default {
  components: {
    StatisticalTestLine, FilterToolbar, AdvancedSettings, NodeDetails, NetworkEdgeLine,
    WholeNetworkSettings, EdgeDetails, GraphToolbar, NetworkLegend, EnrichmentResultsPanel, NodeSetActionsPanel},
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
      // Graph-only: hides nodes with no edges in the currently displayed
      // network (networkEdges). Selection/rank panels are unaffected -- same
      // convention as the differential-network page's hideUnconnected.
      hideUnconnected: false,
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

      // Results panel (below the network) shown once an Analysis-panel
      // action -- Protein Enrichment, Reactome Enrichment, or Gemini Label -- has been run
      resultsPanelOpen: false,
      resultsPanelTab: 'enrichment',

      // Protein Enrichment (g:Profiler)
      enrichmentLoading: false,
      enrichmentRan: false,
      enrichmentResults: [],

      // Reactome Enrichment (joint UniProt protein + ChEBI-mapped metabolite over-representation)
      reactomeEnrichmentLoading: false,
      reactomeEnrichmentRan: false,
      reactomeEnrichmentResults: [],
      // Metabolites with neither a stored ChEBI xref nor a live UniChem mapping -- populated
      // after a run, distinct from selectedMetabolitesWithoutChebi (known before running).
      reactomeUnmappedMetabolites: [],

      // Gemini community labeling
      geminiLoading: false,
      geminiRan: false,
      geminiLabel: null,

      // Community Annotation (g:Profiler + Reactome + Gemini for every community at the
      // active resolution, run as a background job -- see runCommunityAnnotation()).
      communityAnnotationStatus: 'idle', // 'idle' | 'running' | 'success' | 'error'
      communityAnnotationProgress: null, // {stage: 'gprofiler'|'reactome'|'gemini', completed, total}
      communityAnnotationResults: {},
      // Persisted (see saveState/loadState) so a run survives a reload: the Celery task keeps
      // running server-side regardless of whether this tab is open, and the runId is the only
      // way to reconnect to it afterward.
      communityAnnotationRunId: null,
      communityAnnotationStartedAt: null,
      communityAnnotationPollTimer: null,

      // Score Clustering (biological coherence of the active clustering via a self-hosted
      // DIGEST instance -- see runScoreClustering()). scoreClusteringNodeGroup defaults once
      // scoreClusteringNodeGroups is known (see its watcher below).
      scoreClusteringNodeGroup: null,
      scoreClusteringType: 'gene', // 'gene' | 'disease'
      scoreClusteringTarId: 'uniprot',
      scoreClusteringStatus: 'idle', // 'idle' | 'running' | 'success'
      scoreClusteringResult: null,
      // Persisted (see saveState/loadState) so a run survives a reload, same reasoning as
      // communityAnnotationRunId above.
      scoreClusteringRunId: null,
      scoreClusteringStartedAt: null,
      scoreClusteringPollTimer: null,

      // Advanced Settings (default) values
      selectedTests: { testType: 'parametric', correction: 'bh' },
      // Real correction used to precompute the static (no-context) network's
      // edges -- fetched in mounted() via fetchNetworkConfig(). 'bh' fallback
      // matches today's default in case the fetch fails.
      staticCorrection: 'bh',
      signThresh: 0.01,
      fixThreshold: true,
      topNodesNumber: 5,
      topPerNodeCount: true,

      // Whole Network Settings (default) values
      wholeNetworkTests: { testType: 'parametric', correction: 'bh' },
      density: 0.01,
      // Which flow last populated the displayed network -- 'nodes' (node-search
      // "Send to Network") or 'whole' ("Send Whole Network"). Lets addSettings()/
      // updateWholeNetworkSettings() know which fetch to re-run when their
      // respective settings panel changes, so they don't clobber each other's
      // currently-displayed network.
      lastNetworkMode: null,

      // Community Detection (Leiden clustering) -- only available in 'whole'
      // mode, since the backend endpoint clusters the whole density-filtered
      // network, not an arbitrary node-search-built subgraph.
      clusteringActive: false,
      isClusteringLoading: false,
      leidenResolutions: [0.2, 0.5, 1.0, 1.5, 2.0, 3.0],
      resolutionIndex: 2, // default 1.0
      leidenMeta: {},
      // Algorithm that actually produced the communities currently colored on
      // the graph -- set from the response once a run succeeds, so it stays
      // correct even if the user changes selectedAlgorithm afterward without
      // clicking "Re-run" (selectedAlgorithm is just the dropdown's pending
      // choice; this is "what's actually on screen right now").
      clusteringAlgorithm: null,
      // Community detection algorithm. Only 'leiden' actually uses the
      // resolution slider above -- the others (see algorithmUsesResolution)
      // return one fixed partition regardless of resolution.
      selectedAlgorithm: 'leiden',
      communityAlgorithms: [
        { label: 'Leiden', value: 'leiden', description: 'Modularity optimization with a tunable resolution -- higher values split into more, smaller communities.' },
        { label: 'Louvain', value: 'louvain', description: 'Fast modularity optimization, single partition (no resolution parameter).' },
        { label: 'Infomap', value: 'infomap', description: 'Flow-based clustering that finds communities where a random walker gets "trapped"' },
        { label: 'HSBM', value: 'hsbm', description: 'Hierarchical stochastic block model -- fits a generative block model instead of optimizing modularity, so it can also detect bipartite/disassortative structure.' },
      ],

      // Popup
      showInfo: false,
      infoType: "info", // "error" "success"
      infoText: "",

    };
  },
  computed: {
    // Graph-only cutoff: networkNodes with no edge in networkEdges are dropped
    // when hideUnconnected is on. Every edge in networkEdges already connects
    // two nodes that are both in networkNodes (see filterForNetworkEdges), so
    // this never needs to filter networkEdges itself. Selection panels
    // (selectedNetworkNodes, groupNodesFor, ...) keep reading networkNodes
    // directly -- only what's fed into Cosmograph is trimmed.
    graphNodes() {
      if (!this.hideUnconnected) return this.networkNodes;
      const connectedIds = new Set();
      for (const edge of this.networkEdges) {
        connectedIds.add(edge.from);
        connectedIds.add(edge.to);
      }
      return this.networkNodes.filter((node) => connectedIds.has(node.id));
    },
    // Legend entries: whatever groups are actually present in the current network --
    // node_group/source_table has no fixed set of values (see colorForGroup()).
    // Sorted numerically when clustering (so "Community 2" comes before "Community
    // 14"), falling back to string order for plain node-type keys.
    legendGroups() {
      return this.sortLegendKeys(Array.from(this.includedNodeTypes));
    },
    // Render-ready form of legendGroups for NetworkLegend (shared with
    // differential-network.vue) and for the exported-PNG legend panel.
    legendItems() {
      return this.legendGroups.map((key) => ({
        key,
        label: this.legendLabel(key),
        color: this.colorForLegendKey(key),
        active: this.isGroupFullySelected(key),
      }));
    },
    hasSelectedProtein() {
      return this.selectedNetworkNodes.some((node) => node.source_table === 'protein');
    },
    // UniProt accessions for g:Profiler's query -- display_name holds the
    // accession(s) for protein nodes (semicolon-separated when a protein has
    // multiple isoforms, e.g. "P01042;P01042-2"); isoform suffixes are
    // stripped since g:Profiler expects base accessions.
    selectedProteinAccessions() {
      const accessions = new Set();
      this.selectedNetworkNodes
        .filter((node) => node.source_table === 'protein')
        .forEach((node) => {
          (node.display_name || '')
            .split(';')
            .map((accession) => accession.trim().replace(/-\d+$/, ''))
            .filter(Boolean)
            .forEach((accession) => accessions.add(accession));
        });
      return Array.from(accessions);
    },
    hasSelectedMetabolite() {
      return this.selectedNetworkNodes.some((node) => node.source_table === 'metabolite');
    },
    selectedMetaboliteCount() {
      return this.selectedNetworkNodes.filter((node) => node.source_table === 'metabolite').length;
    },
    // ChEBI ids for Reactome's Analysis Service (it doesn't recognize HMDB directly). x_refs is
    // a single CharField that packs multiple refs as pipe-delimited "prefix.value" pairs (e.g.
    // "hmdb.HMDB0001539|kegg.C00086") -- same convention NodeDetails.vue already parses via
    // generateLink() -- not a JS array and not a single bare value.
    selectedMetaboliteChebiIds() {
      const ids = new Set();
      this.selectedNetworkNodes
        .filter((node) => node.source_table === 'metabolite')
        .forEach((node) => {
          (this.parseXrefs(node.x_refs).chebi || []).forEach((id) => ids.add(id));
        });
      return Array.from(ids);
    },
    selectedMetabolitesWithoutChebi() {
      return this.selectedNetworkNodes.filter((node) => node.source_table === 'metabolite' &&
        !(this.parseXrefs(node.x_refs).chebi || []).length);
    },
    selectedAlgorithmLabel() {
      return this.communityAlgorithms.find((algo) => algo.value === this.selectedAlgorithm)?.label ?? this.selectedAlgorithm;
    },
    // Legend heading while clustering is active -- names whichever algorithm
    // actually produced what's on screen (clusteringAlgorithm), not whatever's
    // currently selected in the dropdown. Persisted/restored via saveState()/
    // loadState() so it's still correct after a localStorage reload.
    legendTitle() {
      if (!this.clusteringActive || !this.clusteringAlgorithm) return '';
      const label = this.communityAlgorithms.find((algo) => algo.value === this.clusteringAlgorithm)?.label ?? this.clusteringAlgorithm;
      return `Communities (${label})`;
    },
    algorithmDescription() {
      return this.communityAlgorithms.find((algo) => algo.value === this.selectedAlgorithm)?.description ?? '';
    },
    // Only Leiden's partition actually changes with the resolution parameter --
    // the backend computes the others once and reuses that result for every
    // resolution slot (see RESOLUTION_INDEPENDENT_METHODS in metagraph.py).
    algorithmUsesResolution() {
      return this.selectedAlgorithm === 'leiden';
    },
    // Matches the backend's resolution_to_key(): normalize to 6 decimals, strip
    // trailing zeros/dot, keep at least one decimal place.
    currentResolutionKey() {
      const resolution = this.leidenResolutions[this.resolutionIndex] ?? 1.0;
      let text = parseFloat(resolution).toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
      if (!text.includes('.')) text = text + '.0';
      return text;
    },
    // Names the per-node field (e.g. "community_r1.0") that getLeidenMetagraph()
    // attaches for the currently-selected resolution.
    communityField() {
      return `community_r${this.currentResolutionKey}`;
    },
    currentModularity() {
      return this.leidenMeta?.modularity_by_resolution?.[this.currentResolutionKey];
    },
    currentConductance() {
      return this.leidenMeta?.conductance_by_resolution?.[this.currentResolutionKey];
    },
    // Node types present in the active clustering -- DIGEST only scores one node type per run
    // (see network/views/biodigest_scoring.py), derived from source_table the same way
    // legendKeyFor's non-clustering fallback does, since legendKeyFor itself returns community
    // ids while clusteringActive.
    scoreClusteringNodeGroups() {
      return this.sortLegendKeys(Array.from(new Set(
        this.networkNodes
          .map((node) => (node.source_table ? node.source_table.split('_').pop() : undefined))
          .filter((key) => key !== undefined)
      )));
    },
    scoreClusteringTypeOptions() {
      return [{ title: 'Gene', value: 'gene' }, { title: 'Disease', value: 'disease' }];
    },
    // DIGEST's supported id schemes per category (see evaluation/config.py's
    // SUPPORTED_GENE_IDS/SUPPORTED_DISEASE_IDS in bionetslab/digest).
    scoreClusteringTarIdOptions() {
      return this.scoreClusteringType === 'disease'
        ? [
            { title: 'MONDO', value: 'mondo' },
            { title: 'OMIM', value: 'omim' },
            { title: 'SNOMED CT', value: 'snomedct' },
            { title: 'UMLS', value: 'umls' },
            { title: 'Orphanet', value: 'orpha' },
            { title: 'MeSH', value: 'mesh' },
            { title: 'DOID', value: 'doid' },
            { title: 'ICD-10', value: 'ICD-10' },
          ]
        : [
            { title: 'UniProt (Swiss-Prot)', value: 'uniprot' },
            { title: 'Gene Symbol', value: 'symbol' },
            { title: 'Entrez Gene ID', value: 'entrez' },
            { title: 'Ensembl Gene ID', value: 'ensembl' },
          ];
    },
    // Limit the number of displayed nodes to 5
    limitedDropdownNodes() {
      return this.dropdownNodes.slice(0, 5);
    },
    // Items for the Details panel's "search node in network" field -- searches
    // only the nodes already loaded into the current network (client-side),
    // unlike the Network Input field above which queries the backend. id,
    // description and x_refs ride along on the raw item (not shown in title)
    // so nodeSearchFilter can match against them too.
    networkNodeSearchItems() {
      return this.networkNodes.map((node) => ({
        title: `${node.display_name} (${this.getPrettyType(node.source_table)})`,
        value: node.id,
        id: node.id,
        description: node.description,
        x_refs: node.x_refs,
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
      return getNodeIcon(sourceTable);
    },
    // node_group/source_table has no fixed set of values (see colorForGroup()) --
    // derive the label the same way the color system derives its group key
    // (strip any "cohort_"-style prefix, take the trailing segment) instead of a
    // hardcoded lookup that only recognized the original 6 categories and fell
    // back to a literal "None" for everything else.
    getPrettyType(sourceTable) {
      if (!sourceTable) return 'Unknown';
      return capitalizeFirstLetter(sourceTable.split('_').pop());
    },
    // The legend/coloring key for a node: its community id (while Leiden
    // clustering is active) or its node-type group otherwise. Both
    // includedNodeTypes and groupNodesFor() go through this so the legend,
    // click-to-select, and point coloring all agree on what's currently
    // grouping the network, regardless of mode.
    legendKeyFor(node) {
      if (this.clusteringActive) {
        const community = node[this.communityField];
        return community !== undefined && community !== null ? String(community) : 'Unassigned';
      }
      return node.source_table ? node.source_table.split('_').pop() : undefined;
    },
    // colorKey additionally darkens "external" nodes within their group -- a
    // distinction that only exists for node-search-built networks (whole-network
    // nodes are never external), so it's skipped while clustering.
    colorKeyFor(node) {
      const key = this.legendKeyFor(node);
      if (!key) return undefined;
      if (this.clusteringActive) return key;
      return node.set === 'external' ? `${key}_external` : key;
    },
    // Community ids read as plain numbers/strings from the backend aren't
    // meaningful on their own -- label them explicitly instead of running them
    // through capitalizeFirstLetter (which is for node-type group names).
    legendLabel(key) {
      return this.clusteringActive ? `Community ${key}` : capitalizeFirstLetter(key);
    },
    labelColor(colorName) {
      // chartjs does not support theme colors so we just directly call the theme color
      if (this.$vuetify.theme.global.name === 'dyHealthNetTheme') {
        return this.$vuetify.theme.themes.dyHealthNetTheme.colors[colorName];
      } else {
        return this.$vuetify.theme.themes.dyHealthNetThemeDark.colors[colorName];
      }

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
      // Community coloring only applies to a 'whole' network fetch -- a fresh
      // node-search network has no community data on its nodes.
      this.clusteringActive = false;
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
      this.lastNetworkMode = 'nodes';

      await this.initializeCosmograph();
      this.applyDesign();
    },

    // Fetches the entire precomputed network (via the metagraph endpoint,
    // filtered only by test type + density) as an alternative to searching for
    // specific nodes above. Maps getCosmograph's leaner point/link shape onto
    // the node/edge shape the rest of this page (initializeCosmograph,
    // filterForNetworkEdges, NodeDetails/EdgeDetails, etc.) already expects.
    async sendWholeNetwork() {
      setIsLoading(true);
      // A fresh whole-network fetch has no community data on its nodes yet --
      // re-run "Run Leiden Clustering" afterward if you want it recolored.
      this.clusteringActive = false;
      try {
        const csrfToken = getCookie('csrftoken');
        const response = await fetch(this.buildWholeNetworkUrl(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
        });

        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();

        // Whole-network mode replaces the node-search selection entirely.
        this.searchText = "";
        this.selectedNodes = [];
        this.selectedNetworkNodes = [];

        this.networkNodes = (data.points || []).map((point) => ({
          id: point.id,
          display_name: point.label ?? point.id,
          description: point.description ?? "",
          source_table: point.source_table ?? point.type,
          subtype: point.subtype,
          x_refs: point.xrefs,
          set: "CHRIS", //TODO change to internal/cohort or smth when backend became more modular
        }));
        // getCosmograph doesn't return final_p_value (only final_e_value/test_type) --
        // EdgeDetails' "Ranking P Value" row renders blank for these edges.
        this.allInternalEdges = (data.links || []).map((link) => ({
          id: link.id,
          from: link.source,
          to: link.target,
          type: link.edge_type,
          set: "cohort (calculated)",
          width: 2,
          final_e_value: link.final_e_value,
          test_type: link.test_type,
        }));
        this.allExternalEdges = [];
        this.filterForNetworkEdges();
        this.lastNetworkMode = 'whole';
        this.isReadOnly = true;
        this.closeDropdown();

        await this.initializeCosmograph();
        this.applyDesign();
      } catch (error) {
        console.error("Error fetching whole network:", error);
        this.infoText = "Could not load the whole network. Please try again.";
        this.infoType = "error";
        this.showInfo = true;
      }
      setIsLoading(false);
    },
    buildWholeNetworkUrl() {
      const params = new URLSearchParams();
      params.set('testType', this.wholeNetworkTests.testType);
      params.set('density', String(this.density));
      // When a context is selected, the backend reads the context's own fixed
      // testType (from Context.params) and ignores the testType param above --
      // it's only kept for the no-context case.
      if (this.contextValue != null) params.set('c', this.contextValue);
      return `${BASE_URL}/metagraph/api/getCosmograph/?${params.toString()}`;
    },

    // Community Detection (Leiden clustering). Only available in 'whole' mode
    // (see the Analysis panel gating) -- reruns the whole-network fetch through
    // getLeidenMetagraph instead of getCosmograph, requesting every resolution
    // in one call so the slider below can switch resolutions client-side
    // (recolor via initializeCosmograph(), see resolutionIndex watcher) without
    // refetching.
    buildLeidenUrl() {
      const params = new URLSearchParams();
      params.set('testType', this.wholeNetworkTests.testType);
      params.set('density', String(this.density));
      params.set('resolutions', this.leidenResolutions.join(','));
      params.set('algorithm', this.selectedAlgorithm);
      if (this.contextValue != null) params.set('c', this.contextValue);
      return `${BASE_URL}/metagraph/api/getLeidenMetagraph/?${params.toString()}`;
    },
    async runLeidenClustering() {
      if (this.lastNetworkMode !== 'whole') return;
      this.isClusteringLoading = true;
      // Community numbering can change on recompute, so any previously-fetched or
      // in-progress Community Annotation / Score Clustering run no longer matches -- discard it.
      this.resetCommunityAnnotation();
      this.resetScoreClustering();
      try {
        const csrfToken = getCookie('csrftoken');
        const response = await fetch(this.buildLeidenUrl(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(errorText || "Network response was not ok");
        }
        const data = await response.json();
        this.leidenMeta = data.meta ?? {};
        // Backend is authoritative on what actually ran (data.meta.algorithm),
        // rather than trusting the request's own selectedAlgorithm.
        this.clusteringAlgorithm = data.meta?.algorithm ?? this.selectedAlgorithm;

        this.selectedNetworkNodes = [];
        this.networkNodes = (data.points || []).map((point) => {
          const node = {
            id: point.id,
            display_name: point.label ?? point.id,
            description: point.description ?? "",
            source_table: point.source_table ?? point.type,
            subtype: point.subtype,
            x_refs: point.xrefs,
            set: "CHRIS",
          };
          // Carry every requested resolution's community_rX field onto the
          // node so the slider can switch resolutions without refetching.
          for (const key of Object.keys(point)) {
            if (key.startsWith('community_r')) node[key] = point[key];
          }
          return node;
        });
        this.allInternalEdges = (data.links || []).map((link) => ({
          id: link.id,
          from: link.source,
          to: link.target,
          type: link.edge_type,
          set: "cohort (calculated)",
          width: 2,
          final_e_value: link.final_e_value,
          test_type: link.test_type,
        }));
        this.allExternalEdges = [];
        this.filterForNetworkEdges();
        this.resolutionIndex = 2; // default 1.0
        this.clusteringActive = true;
        this.isReadOnly = true;
        this.closeDropdown();

        await this.initializeCosmograph();
        this.applyDesign();
      } catch (error) {
        console.error("Error running community detection:", error);
        this.infoText = error?.message || "Could not run community detection. Please try again.";
        this.infoType = "error";
        this.showInfo = true;
      }
      this.isClusteringLoading = false;
    },
    // Back to node-type-group coloring, keeping the same nodes/edges displayed.
    async resetClusteringColors() {
      this.clusteringActive = false;
      this.clusteringAlgorithm = null;
      await this.initializeCosmograph();
      this.applyDesign();
    },

    //Network Visualization
    async initializeCosmograph() {
      const container = this.$refs.network;
      if (!container) return;

      await this.destroyCosmograph();

      this.includedNodeTypes = new Set(
        this.graphNodes.map((node) => this.legendKeyFor(node)).filter((key) => key !== undefined)
      );

      // Explicit sequential index lets us reliably map Cosmograph's click/color
      // callback indices back to our own node/edge objects (pointIndexBy pins it).
      // colorKey drives Cosmograph's own 'map' point-color strategy (see
      // buildPointColorMap) -- undefined for an unrecognized group falls back to
      // `unknownColor` natively instead of us having to guard against it.
      // graphNodes (not networkNodes) so hideUnconnected actually drops points --
      // every networkEdge already connects two graphNodes members either way (see
      // graphNodes' comment), so linksForCosmo below doesn't need the same filter.
      const pointsForCosmo = this.graphNodes.map((node, i) => ({
        ...node,
        idx: i,
        colorKey: this.colorKeyFor(node),
      }));
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
    // v-autocomplete's default filter only matches the displayed `title`, which
    // doesn't include id/description/x_refs -- custom-filter gets the raw item
    // instead (item.raw), so it can match those too. Mirrors NodeRankPanel's
    // nodeSearchFilter and the backend typeahead's id+name+description search.
    nodeSearchFilter(_itemTitle, query, item) {
      const q = String(query ?? '').toLowerCase();
      if (!q) return true;
      const raw = item?.raw || {};
      const haystack = `${raw.id ?? ''} ${raw.title ?? ''} ${raw.description ?? ''} ${raw.x_refs ?? ''}`.toLowerCase();
      return haystack.includes(q);
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
    async runProteinEnrichment() {
      if (this.selectedProteinAccessions.length === 0) return;
      this.enrichmentLoading = true;
      this.enrichmentRan = false;
      this.enrichmentResults = [];
      try {
        const response = await fetch('https://biit.cs.ut.ee/gprofiler/api/gost/profile/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organism: 'hsapiens',
            query: this.selectedProteinAccessions,
            sources: ['GO:BP', 'GO:CC', 'GO:MF', 'KEGG', 'REAC', 'WP'],
            user_threshold: 0.05,
            significance_threshold_method: 'g_SCS',
            no_evidences: true,
          }),
        });
        if (!response.ok) throw new Error("g:Profiler response was not ok");
        const data = await response.json();
        this.enrichmentResults = (data.result || [])
          .sort((a, b) => a.p_value - b.p_value)
          .slice(0, 20);
      } catch (error) {
        console.error("Error running protein enrichment:", error);
        this.infoText = "Could not fetch protein enrichment results from g:Profiler. Please try again.";
        this.infoType = "error";
        this.showInfo = true;
      }
      this.enrichmentRan = true;
      this.enrichmentLoading = false;
    },
    // x_refs packs multiple cross-references into one string for metabolites (e.g. HMDB0012107;HMDB0240635;CHEBI:74535) 
    // joined by ";" individual handling depending on prefix, a prefix can repeat
    // (e.g. multiple secondary HMDB accessions), so each maps to an array, not a single value.
    parseXrefs(xrefsString) {
      const map = {};
      if (typeof xrefsString !== 'string' || !xrefsString) return map;
      xrefsString.split(';').forEach((entry) => {
        if (entry.includes('HMDB')) (map['hmdb'] ??= []).push(entry);
        if (entry.includes('CHEBI:')) {
          const chebiIndex = entry.indexOf(':');
          const prefix = entry.slice(0, chebiIndex).trim().toLowerCase();
          const value = entry.slice(chebiIndex + 1).trim();
          if (!prefix || !value) return;
          (map[prefix] ??= []).push(value);
        }
      });
      return map;
    },
    // UniChem matches HMDB ids by exact string equality against "HMDB" + a zero-padded
    // 7-digit accession (e.g. "HMDB0000148") -- verified directly: the older 5-digit style
    // ("HMDB00148"), a missing/lowercase prefix, or stray whitespace all return zero matches
    // with no error, they just silently find nothing. Node ids come straight from whichever
    // raw column the cohort's data file uses for DATA_LABEL_COLUMNS, so they aren't guaranteed
    // to already be in that exact shape -- normalize before calling out.
    normalizeHmdbId(rawId) {
      const match = String(rawId).trim().match(/^hmdb0*(\d+)$/i);
      if (!match) return null;
      return `HMDB${match[1].padStart(7, '0')}`;
    },
    // Live HMDB -> ChEBI lookup via EBI's UniChem, for metabolites ingested before the
    // chebi_id xref extraction was added (or added via "Send Whole Network", which never
    // carries x_refs at all). UniChem source ids are fixed registry constants: 18 = HMDB,
    // 7 = ChEBI (see https://www.ebi.ac.uk/unichem/api/v1/sources). A compound can map to
    // more than one ChEBI id (e.g. stereoisomers) -- all are kept, same as IMPaLA mapping
    // "lactate" to both its R- and S- forms.
    async mapHmdbToChebi(hmdbId) {
      const normalizedId = this.normalizeHmdbId(hmdbId);
      if (!normalizedId) return [];
      try {
        const response = await fetch('https://www.ebi.ac.uk/unichem/api/v1/compounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'sourceID', compound: normalizedId, sourceID: 18 }),
        });
        if (!response.ok) return [];
        const data = await response.json();
        const compound = (data.compounds || [])[0];
        if (!compound) return [];
        return compound.sources
          .filter((source) => source.shortName === 'chebi')
          .map((source) => source.compoundId.replace(/^CHEBI:/i, ''));
      } catch (error) {
        console.error(`Could not map ${hmdbId} to ChEBI via UniChem:`, error);
        return [];
      }
    },
    // Reactome's Analysis Service auto-detects identifier type per line and treats
    // protein/metabolite as one physical-entity list -- unlike IMPaLA there are no
    // separate per-datatype p-values, just one combined pathway over-representation.
    async runReactomeEnrichment() {
      this.reactomeEnrichmentLoading = true;
      this.reactomeEnrichmentRan = false;
      this.reactomeEnrichmentResults = [];
      this.reactomeUnmappedMetabolites = [];
      try {
        const chebiIds = [...this.selectedMetaboliteChebiIds];
        const lookups = await Promise.all(
          this.selectedMetabolitesWithoutChebi.map(async (node) => {
            // A "sum composition" species (e.g. a Biocrates lipid like "PC ae C40:3") can list
            // several distinct HMDB ids for the different isomers the assay can't tell apart --
            // map *every* candidate (not just the first hit) and union the resulting ChEBI ids,
            // same convention IMPaLA uses for chiral/ambiguous compounds (e.g. lactate -> both
            // its R- and S- entries) rather than arbitrarily keeping only one.
            // x_refs delimits multiple entries with "|" in some sources and ";" in others (this
            // project's own data uses ";"), and entries are sometimes bare accessions with no
            // "prefix." at all (e.g. "HMDB0000191", not "hmdb.HMDB0000191") -- so every
            // pipe/semicolon-delimited raw segment is tried too, alongside any properly prefixed
            // "hmdb." entries and the node id itself. normalizeHmdbId() rejects non-matches for
            // free, so extra candidates cost nothing but an early-return, not a wasted call.
            const rawSegments = typeof node.x_refs === 'string' ? node.x_refs.split(/[|;]/).map((s) => s.trim()) : [];
            const candidates = [...new Set([...(this.parseXrefs(node.x_refs).hmdb || []), ...rawSegments, node.id])];
            const results = await Promise.all(candidates.map((candidate) => this.mapHmdbToChebi(candidate)));
            const chebiIds = [...new Set(results.flat())];
            return { node, chebiIds };
          }),
        );
        lookups.forEach(({ node, chebiIds: mapped }) => {
          if (mapped.length) {
            chebiIds.push(...mapped);
          } else {
            this.reactomeUnmappedMetabolites.push(node);
          }
        });

        const identifiers = [...this.selectedProteinAccessions, ...chebiIds];
        if (identifiers.length > 0) {
          const response = await fetch('https://reactome.org/AnalysisService/identifiers/projection', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: identifiers.join('\n'),
          });
          if (!response.ok) throw new Error("Reactome response was not ok");
          const data = await response.json();
          this.reactomeEnrichmentResults = (data.pathways || [])
            .sort((a, b) => a.entities.pValue - b.entities.pValue)
            .slice(0, 20);
        }
      } catch (error) {
        console.error("Error running Reactome enrichment:", error);
        this.infoText = "Could not fetch enrichment results from Reactome. Please try again.";
        this.infoType = "error";
        this.showInfo = true;
      }
      this.reactomeEnrichmentRan = true;
      this.reactomeEnrichmentLoading = false;
    },
    // Unlike g:Profiler/Reactome above, this goes through our own backend rather than
    // calling a third party directly from the browser -- the Gemini API key is a
    // secret and must stay server-side.
    async runGeminiLabel() {
      if (this.selectedNetworkNodes.length === 0) return;
      this.geminiLoading = true;
      this.geminiRan = false;
      this.geminiLabel = null;
      try {
        const csrfToken = getCookie('csrftoken');
        const response = await fetch(`${BASE_URL}/gemini/api/getGeminiLabel/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ node_ids: this.selectedNetworkNodes.map((node) => node.id) }),
        });
        if (!response.ok) throw new Error("Gemini labeling response was not ok");
        this.geminiLabel = await response.json();
      } catch (error) {
        console.error("Error running Gemini labeling:", error);
        this.infoText = "Could not fetch a label from Gemini. Please try again.";
        this.infoType = "error";
        this.showInfo = true;
      }
      this.geminiRan = true;
      this.geminiLoading = false;
    },
    // Kicks off the Community Annotation batch job (g:Profiler + Reactome enrichment, then a
    // single bulk Gemini call grounded in that enrichment) for every community at the active
    // resolution. Runs as a background Celery job (can take several minutes) rather than a
    // blocking request -- see pollCommunityAnnotationStatus.
    async runCommunityAnnotation() {
      const communityKeys = this.legendGroups.filter((key) => key !== 'Unassigned');
      if (communityKeys.length === 0) return;
      this.communityAnnotationStatus = 'running';
      this.communityAnnotationProgress = null;
      this.communityAnnotationResults = {};
      try {
        const csrfToken = getCookie('csrftoken');
        const response = await fetch(`${BASE_URL}/community-annotation/api/runCommunityAnnotation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({
            resolution: this.currentResolutionKey,
            communities: Object.fromEntries(
              communityKeys.map((key) => [key, this.groupNodesFor(key).map((node) => node.id)])
            ),
          }),
        });
        if (!response.ok) throw new Error("Community annotation could not be started.");
        const data = await response.json();
        this.communityAnnotationRunId = data.runId;
        this.communityAnnotationStartedAt = Date.now();
        // Persist the runId right away -- the Celery task keeps running server-side
        // regardless of this tab, and the runId is the only way to reconnect to it after
        // a reload (see resumeCommunityAnnotationIfNeeded).
        this.saveState();
        this.pollCommunityAnnotationStatus();
      } catch (error) {
        console.error("Error starting community annotation:", error);
        this.infoText = "Could not start community annotation. Please try again.";
        this.infoType = "error";
        this.showInfo = true;
        this.communityAnnotationStatus = 'idle';
      }
    },
    // Polls the run started by runCommunityAnnotation() (or resumed by
    // resumeCommunityAnnotationIfNeeded()) until it succeeds or fails.
    // giveUpAt (ms epoch, only set on resume-after-reload): Celery reports PENDING
    // identically for "queued, not started yet" and "unknown/expired runId" -- there's no way
    // to tell these apart from the status alone. A run just started by this tab is known-good
    // (no giveUpAt, poll indefinitely); a resumed run gets a generous ceiling so a stale
    // pointer from a past session doesn't spin a loading indicator forever.
    async pollCommunityAnnotationStatus(giveUpAt = null) {
      const runId = this.communityAnnotationRunId;
      if (!runId) return;
      try {
        const response = await fetch(
          `${BASE_URL}/community-annotation/api/runCommunityAnnotationStatus?runId=${encodeURIComponent(runId)}`,
          { credentials: 'include' },
        );
        if (!response.ok) throw new Error("Community annotation status request was not ok");
        const data = await response.json();

        if (data.status === 'SUCCESS') {
          this.communityAnnotationResults = data.result || {};
          this.communityAnnotationProgress = null;
          this.communityAnnotationStatus = 'success';
          this.communityAnnotationRunId = null;
          this.communityAnnotationStartedAt = null;
          this.saveState();
          return;
        }
        if (data.status === 'FAILURE') {
          throw new Error(data.result || "Community annotation failed.");
        }
        if (data.status === 'PROGRESS' && data.result) {
          this.communityAnnotationProgress = data.result;
        } else if (giveUpAt != null && Date.now() > giveUpAt) {
          this.communityAnnotationStatus = 'idle';
          this.communityAnnotationProgress = null;
          this.communityAnnotationRunId = null;
          this.communityAnnotationStartedAt = null;
          this.saveState();
          return;
        }
        this.communityAnnotationPollTimer = setTimeout(() => this.pollCommunityAnnotationStatus(giveUpAt), 3000);
      } catch (error) {
        console.error("Error polling community annotation status:", error);
        this.infoText = "Could not fetch community annotation results. Please try again.";
        this.infoType = "error";
        this.showInfo = true;
        this.communityAnnotationStatus = 'idle';
        this.communityAnnotationProgress = null;
        this.communityAnnotationRunId = null;
        this.communityAnnotationStartedAt = null;
        this.saveState();
      }
    },
    // Called once from loadState() after it restores a persisted runId -- reconnects to a run
    // that was still going (or had already finished) when the page was last closed/reloaded.
    resumeCommunityAnnotationIfNeeded() {
      if (!this.communityAnnotationRunId || !this.clusteringActive) return;
      this.communityAnnotationStatus = 'running';
      const giveUpAt = (this.communityAnnotationStartedAt ?? Date.now()) + 20 * 60 * 1000;
      this.pollCommunityAnnotationStatus(giveUpAt);
    },
    // Discards any in-progress or finished Community Annotation run -- communities are
    // renumbered on every re-cluster/resolution change, so a stale run must not linger or be
    // reconnected to after the fact.
    resetCommunityAnnotation() {
      clearTimeout(this.communityAnnotationPollTimer);
      this.communityAnnotationStatus = 'idle';
      this.communityAnnotationProgress = null;
      this.communityAnnotationResults = {};
      this.communityAnnotationRunId = null;
      this.communityAnnotationStartedAt = null;
    },
    // Scores the active clustering's biological coherence via a self-hosted DIGEST instance
    // (see network/views/biodigest_scoring.py) for the chosen node type/id scheme. Async job,
    // same submit-then-poll pattern as runCommunityAnnotation() above.
    async runScoreClustering() {
      if (!this.scoreClusteringNodeGroup || !this.scoreClusteringTarId) return;
      this.scoreClusteringStatus = 'running';
      this.scoreClusteringResult = null;
      try {
        const csrfToken = getCookie('csrftoken');
        const response = await fetch(`${BASE_URL}/biodigest/api/scoreClustering`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({
            clustering: Object.fromEntries(
              this.networkNodes
                .filter((node) => this.legendKeyFor(node) !== 'Unassigned')
                .map((node) => [node.id, this.legendKeyFor(node)])
            ),
            nodeGroup: this.scoreClusteringNodeGroup,
            tarId: this.scoreClusteringTarId,
            type: this.scoreClusteringType,
          }),
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(errorBody?.message || "Clustering scoring could not be started.");
        }
        const data = await response.json();
        this.scoreClusteringRunId = data.runId;
        this.scoreClusteringStartedAt = Date.now();
        // Persist right away -- DIGEST keeps running server-side regardless of this tab, and
        // the runId is the only way to reconnect to it after a reload (see
        // resumeScoreClusteringIfNeeded).
        this.saveState();
        this.pollScoreClusteringStatus();
      } catch (error) {
        console.error("Error starting clustering scoring:", error);
        this.infoText = error?.message || "Could not start clustering scoring. Please try again.";
        this.infoType = "error";
        this.showInfo = true;
        this.scoreClusteringStatus = 'idle';
      }
    },
    // Polls the run started by runScoreClustering() (or resumed by
    // resumeScoreClusteringIfNeeded()) until it succeeds or fails. giveUpAt: see
    // pollCommunityAnnotationStatus's comment -- same PENDING-forever-vs-stale-runId ambiguity.
    async pollScoreClusteringStatus(giveUpAt = null) {
      const runId = this.scoreClusteringRunId;
      if (!runId) return;
      try {
        const response = await fetch(
          `${BASE_URL}/biodigest/api/scoreClusteringStatus?runId=${encodeURIComponent(runId)}`,
          { credentials: 'include' },
        );
        if (!response.ok) throw new Error("Clustering scoring status request was not ok");
        const data = await response.json();

        if (data.status === 'SUCCESS') {
          this.scoreClusteringResult = data.result || null;
          this.scoreClusteringStatus = 'success';
          this.scoreClusteringRunId = null;
          this.scoreClusteringStartedAt = null;
          this.saveState();
          return;
        }
        if (data.status === 'FAILURE') {
          throw new Error(data.result || "Clustering scoring failed.");
        }
        if (giveUpAt != null && Date.now() > giveUpAt) {
          this.scoreClusteringStatus = 'idle';
          this.scoreClusteringRunId = null;
          this.scoreClusteringStartedAt = null;
          this.saveState();
          return;
        }
        this.scoreClusteringPollTimer = setTimeout(() => this.pollScoreClusteringStatus(giveUpAt), 3000);
      } catch (error) {
        console.error("Error polling clustering scoring status:", error);
        this.infoText = "Could not fetch clustering scoring results. Please try again.";
        this.infoType = "error";
        this.showInfo = true;
        this.scoreClusteringStatus = 'idle';
        this.scoreClusteringRunId = null;
        this.scoreClusteringStartedAt = null;
        this.saveState();
      }
    },
    // Called once from loadState() after it restores a persisted runId -- reconnects to a run
    // that was still going (or had already finished) when the page was last closed/reloaded.
    resumeScoreClusteringIfNeeded() {
      if (!this.scoreClusteringRunId || !this.clusteringActive) return;
      this.scoreClusteringStatus = 'running';
      const giveUpAt = (this.scoreClusteringStartedAt ?? Date.now()) + 20 * 60 * 1000;
      this.pollScoreClusteringStatus(giveUpAt);
    },
    // Discards any in-progress or finished scoring run -- communities are renumbered on every
    // re-cluster/resolution change, so a stale run must not linger or be reconnected to after
    // the fact (same reasoning as resetCommunityAnnotation).
    resetScoreClustering() {
      clearTimeout(this.scoreClusteringPollTimer);
      this.scoreClusteringStatus = 'idle';
      this.scoreClusteringResult = null;
      this.scoreClusteringRunId = null;
      this.scoreClusteringStartedAt = null;
    },
    formatScoreValue(value) {
      return typeof value === 'number' ? value.toFixed(4) : '—';
    },
    groupNodesFor(groupKey) {
      return this.networkNodes.filter((node) => this.legendKeyFor(node) === groupKey);
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

      // Merging a "Connect Nodes" fetch's nodes/edges into whatever's currently
      // displayed changes the graph out from under lastNetworkMode -- e.g. a
      // 'whole' network is no longer the untouched whole network once extra
      // nodes are spliced in, so gates like the Analysis panel's Leiden
      // clustering (only valid for an unmodified whole-network fetch) must stop
      // showing it as available.
      this.lastNetworkMode = null;

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
    // Builds the colorKey -> color lookup consumed by Cosmograph's 'map'
    // point-color strategy. Node-type mode: one entry per known group plus a
    // darkened '<group>_external' variant, so a single static object handles
    // both dimensions instead of a per-point function. Clustering mode has no
    // external variant (whole-network nodes are never external) and delegates
    // to buildCommunityColorMap() instead -- see there for why it can't reuse
    // colorForGroup's hash.
    buildPointColorMap() {
      if (this.clusteringActive) return this.buildCommunityColorMap();
      const colorMap = {};
      const groupColors = assignGroupColors(this.legendGroups);
      for (const key of this.includedNodeTypes) {
        const color = groupColors[key];
        colorMap[key] = color;
        colorMap[`${key}_external`] = darkenHexColor(color, 0.35);
      }
      return colorMap;
    },
    // node_group/source_table is fully user-defined on the backend, not a fixed
    // set of categories -- colors are assigned by index over legendGroups (the
    // sorted set of groups actually present), using the fixed validated palette
    // for the first few slots so a handful of groups stay maximally distinct; see
    // assignGroupColors.
    colorForGroup(key) {
      return assignGroupColors(this.legendGroups)[key];
    },
    // Shared comparator for legend/community keys: numeric keys sort by value
    // (so "2" comes before "14"), non-numeric keys (e.g. 'Unassigned') sort last
    // alphabetically. Used both for legend display order and community color
    // assignment, so the two stay consistent.
    sortLegendKeys(keys) {
      return keys.sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        const aIsNum = !Number.isNaN(na);
        const bIsNum = !Number.isNaN(nb);
        if (aIsNum && bIsNum) return na - nb;
        if (aIsNum) return -1;
        if (bIsNum) return 1;
        return a.localeCompare(b);
      });
    },
    // Community ids are short, similar-looking strings ("0", "1", "2", ...) that
    // generateGroupColor's per-character hash can't spread apart (their hues
    // land within a few degrees of each other). interpolateRainbow sampled
    // evenly across however many communities are actually present guarantees
    // distinct colors regardless of what the ids look like. Sorted numerically
    // first (falling back to string order for the 'Unassigned' bucket) purely
    // so the same community gets a stable color across re-renders at the same
    // resolution.
    buildCommunityColorMap() {
      const sortedKeys = this.sortLegendKeys(Array.from(this.includedNodeTypes));
      const count = sortedKeys.length;
      const colorMap = {};
      sortedKeys.forEach((key, index) => {
        colorMap[key] = interpolateRainbow(count > 1 ? index / count : 0);
      });
      return colorMap;
    },
    // Legend dot / exported-PNG legend color -- single-key lookup wrapper around
    // whichever map (node-type or community) is currently in play.
    colorForLegendKey(key) {
      if (this.clusteringActive) return this.buildCommunityColorMap()[key] ?? this.labelColor('text');
      return this.colorForGroup(key);
    },
    updatePhysics() {
      if (!this.cosmographInstance) return;
      if (this.physics_on) {
        this.cosmographInstance.unpause();
      } else {
        this.cosmographInstance.pause();
      }
    },
    // GraphToolbar's switches are v-model'd through props/events rather than a
    // direct v-model on physics_on/hideUnconnected (the toolbar no longer owns
    // that state).
    onPhysicsChange(value) {
      this.physics_on = value;
      this.updatePhysics();
    },
    // graphNodes' membership changes, so the graph needs a full rebuild (which
    // sets up indexToNodeId/includedNodeTypes fresh) rather than a targeted patch.
    async onHideUnconnectedChange(value) {
      this.hideUnconnected = value;
      await this.initializeCosmograph();
      this.applyDesign();
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
      this.clusteringActive = false;
      this.lastNetworkMode = null;
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
      // Pruning down to the selection changes the graph out from under
      // lastNetworkMode -- see setNetworkNodes() for why this must be reset.
      this.lastNetworkMode = null;
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
    async saveNetworkImage() {
      await this.captureImage();
      if (this.imageUrl) {
        this.$refs.downloadLink.click();
      } else {
        console.error("Image URL is not available yet");
      }
    },
    // this.$refs.network also holds Cosmograph's polygonal/rectangular area-select overlay
    // canvases, which sit before the real WebGL graph canvas in DOM order -- a plain
    // querySelector('canvas') grabs one of those (empty except mid-lasso-select) instead of the
    // graph. _cosmosElement is Cosmograph's own inner wrapper that holds only the graph canvas;
    // it's what captureScreenshot() itself reads from internally, so this targets the same element.
    async captureImage() {
      const canvas = this.cosmographInstance?._cosmosElement?.querySelector('canvas');

      if (canvas) {

        // Create a temporary offscreen canvas to avoid triggering redraw
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;

        // Draw the current content of the network on the offscreen canvas
        offscreenCtx.drawImage(canvas, 0, 0);

        this.drawNodeLabels(offscreenCtx, canvas);

        // Legend entries: whatever groups are actually present, same as the on-screen legend
        drawLegendPanel(offscreenCtx, offscreenCanvas, this.legendItems, {
          textColor: this.labelColor('text'),
          panelColor: this.labelColor('surface-bright'),
          borderColor: this.labelColor('surface-variant'),
        }, this.legendTitle);

        // Generate the image URL
        this.imageUrl = offscreenCanvas.toDataURL();
      } else {
        console.error('Canvas or context is undefined');
      }
    },

    // Node labels are rendered as absolutely-positioned DOM elements overlaid on the canvas (see
    // Cosmograph's Labels module), not drawn into the WebGL buffer -- so they never show up in a
    // canvas-only capture, even Cosmograph's own captureScreenshot(). Read each rendered label's
    // text and screen position directly off the DOM and draw it onto the capture ourselves,
    // instead of pulling in a whole-DOM screenshot library just for this.
    drawNodeLabels(ctx, canvas) {
      const labelsContainer = this.cosmographInstance?._labels?.labelsContainer;
      if (!labelsContainer) return;

      const canvasRect = canvas.getBoundingClientRect();
      if (!canvasRect.width || !canvasRect.height) return;
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;

      const labelEls = Array.from(labelsContainer.querySelectorAll('*'))
        .filter((el) => el.children.length === 0 && el.textContent?.trim());

      // save/restore so textAlign/textBaseline/font/fillStyle don't leak into whatever the
      // caller draws next (the legend panel assumes its own defaults, not these).
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      labelEls.forEach((el) => {
        const style = window.getComputedStyle(el);
        const opacity = parseFloat(style.opacity);
        // Cosmograph doesn't remove decluttered/off-screen labels from the DOM -- it fades them
        // to opacity 0.1 via a "hidden" class (see cosmographLabelHidden in its CSS) while keeping
        // shown labels at full opacity. Mirror that distinction instead of drawing every label
        // Cosmograph has ever created, which would make the export far busier than the live view.
        if (style.visibility === 'hidden' || style.display === 'none' || !(opacity > 0.5)) return;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = (rect.left - canvasRect.left + rect.width / 2) * scaleX;
        const y = (rect.top - canvasRect.top + rect.height / 2) * scaleY;
        ctx.font = `${parseFloat(style.fontSize) * scaleY}px ${style.fontFamily}`;
        ctx.fillStyle = style.color;
        ctx.fillText(el.textContent.trim(), x, y);
      });
      ctx.restore();
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
      // These settings only drive the node-search flow -- if a whole-network
      // graph is currently displayed, don't clobber it by re-running
      // sendToNetwork() against an empty node selection.
      if (this.lastNetworkMode === 'whole') return;
      const selectedNodesSave = this.selectedNetworkNodes;
      this.clearNetwork(false);
      this.selectedNetworkNodes = selectedNodesSave;
      this.sendToNetwork();
    },
    // Whole Network Settings methods
    updateWholeNetworkSettings(data) {
      Object.entries(data).forEach(([key, value]) => {
        if (key in this) {
          this[key] = value;
        } else {
          console.warn(`Unhandled key: ${key}`);
        }
      });
      // Mirrors addSettings()'s guard: only rebuild if a whole-network graph is
      // actually the one currently displayed.
      if (this.lastNetworkMode === 'whole') {
        this.sendWholeNetwork();
      }
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
      // getCosmograph/getLeidenMetagraph scope the whole network to whatever
      // context is currently selected, so a graph fetched under the old
      // context (or no context) is stale for the new one -- don't leave
      // lastNetworkMode pointing at it. User re-runs "Send Whole Network" /
      // "Run Leiden Clustering" to load it for the newly selected context.
      this.lastNetworkMode = null;
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
        wholeNetworkTests: this.wholeNetworkTests,
        density: this.density,
        lastNetworkMode: this.lastNetworkMode,
        // Community detection -- persisted so the legend still shows "Communities
        // (Infomap)" etc. (and the modularity/conductance readout still works)
        // after a localStorage reload, instead of silently reverting to node-type
        // colors. The nodes themselves already carry their community_rX fields.
        clusteringActive: this.clusteringActive,
        clusteringAlgorithm: this.clusteringAlgorithm,
        selectedAlgorithm: this.selectedAlgorithm,
        resolutionIndex: this.resolutionIndex,
        leidenMeta: this.leidenMeta,
        // Community Annotation -- only the runId/startedAt pointer is persisted, not the
        // (potentially large) result payload itself, so a reload can reconnect to a run
        // still in progress server-side rather than losing track of it entirely.
        communityAnnotationRunId: this.communityAnnotationRunId,
        communityAnnotationStartedAt: this.communityAnnotationStartedAt,
        // Score Clustering -- same runId/startedAt-only persistence reasoning as Community
        // Annotation above.
        scoreClusteringRunId: this.scoreClusteringRunId,
        scoreClusteringStartedAt: this.scoreClusteringStartedAt,
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
        this.wholeNetworkTests = user_settings.wholeNetworkTests ?? { testType: 'parametric', correction: 'bh' };
        this.density = user_settings.density !== undefined ? parseFloat(user_settings.density) : 0.01;
        this.lastNetworkMode = user_settings.lastNetworkMode ?? null;
        // Community detection -- older saved states won't have these fields, so
        // fall back to "no clustering" rather than showing a legend title for
        // data that isn't actually there.
        this.clusteringActive = user_settings.clusteringActive ?? false;
        this.clusteringAlgorithm = user_settings.clusteringAlgorithm ?? null;
        this.selectedAlgorithm = user_settings.selectedAlgorithm ?? 'leiden';
        this.resolutionIndex = user_settings.resolutionIndex ?? 2;
        this.leidenMeta = user_settings.leidenMeta ?? {};
        this.communityAnnotationRunId = user_settings.communityAnnotationRunId ?? null;
        this.communityAnnotationStartedAt = user_settings.communityAnnotationStartedAt ?? null;
        this.scoreClusteringRunId = user_settings.scoreClusteringRunId ?? null;
        this.scoreClusteringStartedAt = user_settings.scoreClusteringStartedAt ?? null;
        await this.initializeCosmograph(); // Reapply the state to the new network
        this.applyDesign(false);
        this.resumeCommunityAnnotationIfNeeded();
        this.resumeScoreClusteringIfNeeded();
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
    // Keeps the "Node type to score" select pointed at a node type that's actually present --
    // defaults it once node types become known, and re-defaults if the previously-selected one
    // disappears (e.g. after re-clustering a different network).
    scoreClusteringNodeGroups: {
      immediate: true,
      handler(groups) {
        if (!groups.includes(this.scoreClusteringNodeGroup)) {
          this.scoreClusteringNodeGroup = groups[0] ?? null;
        }
      },
    },
    // Switching between Gene/Disease invalidates the previously-selected id scheme (they're
    // disjoint option lists) -- reset to that category's first scheme.
    scoreClusteringType() {
      this.scoreClusteringTarId = this.scoreClusteringTarIdOptions[0]?.value ?? null;
    },
    // fetchNetworkConfig() is async and may resolve after updateData() already ran
    // with the 'bh' fallback -- re-sync selectedTests.correction once the real
    // value arrives, but only if still in static (no-context) mode.
    staticCorrection(newVal) {
      if (this.contextValue == null) {
        this.selectedTests = { ...this.selectedTests, correction: newVal };
      }
    },
    // Resolutions are all already loaded on the nodes (see runLeidenClustering),
    // so switching resolution just recolors -- no refetch needed. A full
    // initializeCosmograph() rebuild (rather than a lighter recolor) matches how
    // the old Metagraph page's own resolution slider already worked.
    // isClusteringLoading guard: runLeidenClustering() sets resolutionIndex as
    // part of its own setup and then calls initializeCosmograph() itself once
    // the fetch lands -- this watcher fires on that same assignment too (on the
    // next tick, by which point clusteringActive is already true), so without
    // the guard it raced a second, redundant rebuild against the one already in
    // flight (same "graph renders twice" bug already hit and fixed once before
    // on the old Metagraph page's own resolution slider).
    async resolutionIndex() {
      // Switching resolution changes which communities exist, so any previously-fetched or
      // in-progress Community Annotation / Score Clustering run no longer matches -- discard it.
      this.resetCommunityAnnotation();
      this.resetScoreClustering();
      if (this.clusteringActive && !this.isClusteringLoading) {
        await this.initializeCosmograph();
        this.applyDesign();
      }
    },
    // The selection changed, so any previously-fetched enrichment results no
    // longer match -- clear them rather than showing stale results next to a
    // different node selection.
    selectedNetworkNodes: {
      deep: true,
      handler() {
        this.enrichmentResults = [];
        this.enrichmentRan = false;
        this.geminiLabel = null;
        this.geminiRan = false;
      },
    },
    },
    beforeUnmount() {
      // Clean up event listener when component is destroyed
      document.removeEventListener('click', this.handleClickOutside);
      this.destroyCosmograph();
      // Only stops this tab's local polling loop -- the Celery task/DIGEST job itself keeps
      // running server-side, and its runId (already persisted via saveState) is what lets a
      // later reload reconnect to it instead of losing track of it.
      clearTimeout(this.communityAnnotationPollTimer);
      clearTimeout(this.scoreClusteringPollTimer);
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

.network-page {
  min-height: calc(100vh - 220px);
}

.hero {
  padding: 2rem;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.12), rgba(17, 24, 39, 0.04));
  border: 1px solid rgba(25, 118, 210, 0.16);
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary-darken-1));
}

.title {
  margin: 0;
  font-size: 2.5rem;
  line-height: 1.05;
}

.subtitle {
  margin-top: 0.9rem;
  max-width: 720px;
  font-size: 1.02rem;
  opacity: 0.82;
}

@media (max-width: 1919px) {
  .responsive-card {
    width: 95%;
  }
}

/* .legend-item/.legend-color/etc. now live in NetworkLegend.vue's own scoped
   styles; only the positioning of the legend within this page's graph area
   stays here, since that differs per page. */
.legend {
  position: absolute;  /* Position relative to the nearest positioned ancestor (network container) */
  bottom: 60px;  /* Shifted further into the graph so it doesn't hug the corner */
  left: 40px;    /* Shifted further into the graph so it doesn't hug the corner */
  background: transparent;  /* Transparent background */
  z-index: 10;  /* Ensure it appears above other elements */
  max-height: 400px;  /* Leaves room within the 550px network div for top/bottom offsets */
  overflow-y: auto;   /* Scroll instead of overflowing the graph when there are many communities */
  padding-right: 8px; /* Keep the scrollbar clear of the legend text */
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