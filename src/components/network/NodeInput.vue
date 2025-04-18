<template>
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
                v-model="store.searchText"
                density="compact"
                variant="outlined"
                :clearable="!store.isReadOnly && (store.searchText && store.searchText.length > 0)"
                label="Select one or a list of nodes"
                @input="fetchNodeRecommendations($event)"
                @keydown.arrow-down.prevent="moveFocus('down')"
                @keydown.arrow-up.prevent="moveFocus('up')"
                @keydown.enter.prevent="selectFocusedItem"
                @keydown.esc.prevent="closeDropdown"
                hide-details
                class="mb-0"
                @focus="store.showDropdown = true"
                ref="textField"
                :readonly="store.isReadOnly"
                @click:clear="handleClearNodeInput"
            >
              <template v-slot:append>
                <v-btn
                    v-if="store.isReadOnly"
                    icon
                    @click="editText"
                >
                  <v-icon color="primary-darken-1">mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-col>
        <v-col cols="2" class="d-flex align-center">
          <v-btn
            color="primary-darken-1"
            block
            class="mt-0 mb-0"
            @click="$emit('send-to-network')"
            :disabled="!store.selectedNodes.length"
            elevation="1"
          >
            <v-icon class="my-0 mr-2">mdi-arrow-down</v-icon>
            Send to Network
          </v-btn>
        </v-col>
        </v-row>

        <!-- Dropdown List -->
        <v-row v-if="limitedDropdownNodes.length && !store.isReadOnly">
          <v-col cols="12">
            <v-card class="dropdown"
                    v-if="store.showDropdown && limitedDropdownNodes.length"
                    ref="dropdownMenu"
                    tabindex="0">
              <v-list>
                <v-list-item
                    v-for="(item, index) in limitedDropdownNodes"
                    :key="index"
                    @click="addPerDropDown(item)"
                    @mouseover="hoverNode(item)"
                    @mouseleave="hoverNodeLeave"
                    :class="{ 'text-primary': index === store.activeIndex }"
                    :color="index === store.activeIndex ? 'primary' : ''"
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
                    {{ `${item.display_name} (${item.id})` }}
                    </span>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>

        <!-- Tooltip for Hovered Item (outside dropdown) -->
        <teleport to="body">
          <div v-if="store.hoveredItem" class="tooltip" :style="store.tooltipStyle">
            <strong>ID:</strong> {{ store.hoveredItem.id }}<br/>
            <strong>Display Name:</strong> {{ store.hoveredItem.display_name }}<br/>
            <strong>Node Type:</strong> {{ store.hoveredItem.source_table }}<br/>
            <strong>Description:</strong> {{ store.hoveredItem.description }}
          </div>
        </teleport>
        <v-row>
          <v-col>
            <AdvancedSettings :selected-tests="store.selectedTests"
                              :sign-thresh="store.signThresh"
                              :disable-selections="store.disableSelections"
                              :show-mult-test="true"
                              :show-header="true"
                              :use-advanced-title="true"
                              expansion-panel-variant="default"
                              header-text="Network Statistics Configuration"
                              @data-changed="addSettings"
                              :top-nodes-number="store.topNodesNumber"
                              :top-per-node-count="store.topPerNodeCount"
            />
          </v-col>
        </v-row>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import AdvancedSettings from "@/components/AdvancedSettings.vue";
//import NetworkEdgeLine from "@/components/network/NetworkEdgeLine.vue";
import {BASE_URL} from "@/components/constants.js";
import {getCookie} from "@/components/authentication/auth.js";
import {getIcon, getPrettyType} from "@/components/generalFunctions.js";

import {nodeInputStore} from "@/stores/nodeInputStore";
import {popUpStore} from "@/stores/popUpStore.js";

export default {
  name: "NodeInput",
  components: {AdvancedSettings},

  data() {
    return {
      typeaheadresult: [],
      debounceTimeout: null,
    };
  },
  computed: {
    store() {
      return nodeInputStore(); // this makes this.store available
    },
    popUpStore() {
      return popUpStore(); // this makes this.store available
    },
    limitedDropdownNodes() {
      return this.store.dropdownNodes.slice(0, 5);
    },
  },
  methods: {
    getIcon,
    getPrettyType,
    
    // Network Input methods
    // This should return the last typed string that is following the display names of the selected nodes seperated by commas
    getLastTypedString() {
      console.log("getLastTypedString");
      console.log("searchText: ", this.store.searchText);
      if (!this.store.searchText) {
        return null; // If searchText is empty, return an empty string
      }
      // Split by commas, trim whitespace, and return the last part
      const parts = this.store.searchText.split(",").map((part) => part.trim());
      return parts[parts.length - 1];
    },
    deleteNodesNotInSearchText() {
      this.store.selectedNodes = this.store.selectedNodes.filter(node =>
          this.store.searchText.includes(node.display_name) || this.store.searchText.includes(node.id)
      );
    },
    async fetchNodeRecommendations(event) {
      if (event && event.inputType) {
        if (event.inputType === "deleteContentBackward" || event.inputType === "deleteContentForward") {
          console.log("Somethings getting deleted");
          this.deleteNodesNotInSearchText();
          console.log("this.store.selectedNodes", this.store.selectedNodes);
        } else if (event.inputType === "insertText" || event.inputType === "insertFromPaste") {
          const lastChar = this.store.searchText[this.store.searchText.length - 1];
          if (lastChar === ",") {
            console.log("Comma was typed.");
            await this.findNodeMatch();
            this.typeaheadresult = [];
            this.store.hoveredItem = null;
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
          this.store.hoveredItem = null;
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

          this.store.dropdownNodes = this.typeaheadresult.filter(node =>
              !this.store.selectedNodes.some(selected => selected.id === node.id)
          );
        } catch (error) {
          console.error("Error fetching data:", error);
          this.typeaheadresult = [];
          this.store.dropdownNodes = [];
        }
      }, 300); // Debounce delay in milliseconds
    },
    updateSearchText() {
      console.log("updateSearchText");
      const search = this.getLastTypedString();
      console.log("search", search);
      console.log("this.store.selectedNodes", this.store.selectedNodes);
      const nodeNames = this.store.selectedNodes
          .filter(node => node && node.display_name)
          .map(node => node.display_name);
      console.log("searchText", this.store.searchText);
      console.log("nodeNames", nodeNames);
      this.store.searchText = nodeNames.length > 0 ? nodeNames.join(", ") + (search ? ", " + search : ",") : search;
      console.log("searchText", this.store.searchText);
    },
    addPerDropDown(item) {
      // Re-join the array into comma-separated searchText
      //this.store.searchText = searchTextParts.join(', ') + ', ';
      this.deleteNodesNotInSearchText();
      this.store.selectedNodes.push(item);
      this.updateSearchText();
      this.fetchNodeRecommendations();
      // this.store.dropdownNodes = [];
      // this.hoverNodeLeave();
      console.log("this.store.searchText: ", this.store.searchText)
      console.log("this.store.selectedNodes: ", this.store.selectedNodes)

      // Focus the input field and move the cursor to the end
      this.$nextTick(() => {
        const input = this.$refs.textField.$el.querySelector('input');
        input.focus();
        input.setSelectionRange(this.store.searchText.length, this.store.searchText.length);
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
            .filter(node => !this.store.selectedNodes.some(selected => selected.id === node.id));
      } catch (error) {
        console.error("Error fetching data:", error);
        return [];
      }
    },
    async findNodeMatch() {
      console.log("findNodeMatch")
      const searchElements = this.store.searchText.split(',').map(element => element.trim()).slice(0, -1);
      for (const element of searchElements) {
        console.log("curr element", element)
        if (!this.store.selectedNodes.some(node => node.display_name === element || node.id === element)) {
          console.log("not in selected nodes")
          try {
            const response = await this.fetchNodeMatch(element); // Assume this function exists
            if (response) {
              const match = response[0];
              if (response.length > 1) {
                const match_sec = response[1];
                if (match_sec.display_name === element || match_sec.id === element) {
                  console.log("response.length >= 1")
                  this.popUpStore.infoText = "The typed node description is not unique. " +
                      "Please select the desired node from the dropdown menu or use the unique internal id."
                  this.popUpStore.infoType = "info";
                  this.popUpStore.showInfo = true;
                  continue;
                }
              }
              if (match.display_name === element || match.id === element) {
                console.log("match matched")
                console.log("match", match)
                console.log("this.store.selectedNodes", this.store.selectedNodes)
                if (!this.store.selectedNodes.some(node => node.id === match.id)) {
                  this.store.selectedNodes.push(match); // Add the matched node from backend
                }
              }
            }
          } catch (error) {
            console.error(`Backend search failed for: ${element}`, error);
            this.popUpStore.infoText = "The typed node cannot be found in the database."
            this.popUpStore.infoType = "info";
            this.popUpStore.showInfo = true;
          }
        }
      }
      this.updateSearchText();
    },
    hoverNode(item) {
      if (!this.store.hoveredItem || this.store.hoveredItem !== item) {
        this.store.hoveredItem = item;

        if (item) {
          console.log("I am here")
          const dropdown = this.$refs.dropdownMenu?.$el; // Accessing the actual DOM element
          const dropdownRect = dropdown.getBoundingClientRect();
          const centerX = (window.innerWidth) / 2; // Center of the page

          // Calculate fixed position: right-center of the dropdown
          this.store.tooltipStyle = {
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
        console.log("tooltip style", this.store.tooltipStyle)
        console.log("tooltip style", this.store.tooltipStyle)
      }
    },
    hoverNodeLeave() {
      // Hide the tooltip when the item is no longer hovered
      this.store.hoveredItem = null;
      this.store.activeIndex = -1;
    },
    handleClickOutside(event) {
      if (this.store.isReadOnly) {
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
      this.store.isReadOnly = false;
      //this.store.searchText = '';  // Optionally clear the input
      //this.store.selectedNodes = [];  // Optionally clear selected nodes
    },
    handleClearNodeInput() {
      this.store.searchText = "";
      this.store.selectedNodes = [];
      this.$emit('save-state');
      //this.saveState();
    },
    moveFocus(direction) {
      if (this.store.isReadOnly) return;
      const length = this.limitedDropdownNodes.length;
      if (direction === "down") {
        this.store.activeIndex = (this.store.activeIndex + 1) % length;
      } else if (direction === "up") {
        if (this.store.activeIndex === -1) {
          this.store.activeIndex = length - 1;  // Start from the last item if moving up from -1
        } else {
          this.store.activeIndex = (this.store.activeIndex - 1 + length) % length;
        }
      }
      if (this.store.activeIndex === -1) {
        return;
      }
      this.hoverNode(this.limitedDropdownNodes[this.store.activeIndex]);
    },
    selectFocusedItem() {
      if (this.store.activeIndex === -1) {
        return;
      }
      const selectedItem = this.limitedDropdownNodes[this.store.activeIndex];
      if (selectedItem) {
        this.addPerDropDown(selectedItem);
      }
    },
    closeDropdown() {
      this.store.showDropdown = false;
      this.store.hoveredItem = null;
      this.store.activeIndex = -1;
    },
    // Advanced Settings methods
    addSettings(data) {
      //console.log("data: ", data)
      Object.entries(data).forEach(([key, value]) => {
        if (key in this.store) {
          this.store[key] = value; // Update the corresponding variable in the parent
        } else {
          console.warn(`Unhandled key: ${key}`);
        }
      });
      const selectedNodesSave = this.store.selectedNetworkNodes;
      this.$emit('clear-network', false);
      this.store.selectedNetworkNodes = selectedNodesSave;
      this.$emit('send-to-network');
    },
  },
    watch: {
    // Watch the store property explicitly
    'store.showDropdown'(newVal) {
      if (newVal) {
        document.addEventListener('click', this.handleClickOutside)
        this.store.activeIndex = -1
      } else {
        document.removeEventListener('click', this.handleClickOutside)
      }
    },
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  },
};
</script>

<style scoped>

.advanced-title {
  font-size: 2rem !important; /* Add !important to force the style */
  font-weight: 800;
}
</style>