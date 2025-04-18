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
                @keydown.down.prevent="$refs.DropdownHoverComponent.moveFocus('down')"
                @keydown.up.prevent="$refs.DropdownHoverComponent.moveFocus('up')"
                @keydown.enter.prevent="$refs.DropdownHoverComponent.selectFocusedItem()"
                @keydown.esc.prevent="closeDropdown"
                hide-details
                class="mb-0"
                @focus="showDropdown = true"
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
        <DropdownHover :showDropdown="showDropdown" :dropdown-nodes="dropdownNodes"
                       :is-read-only="store.isReadOnly" :text-field-ref="textFieldRef"
                       @update:showDropdown="showDropdown = $event"
                       @add-per-drop-down="addPerDropDown"  ref="DropdownHoverComponent"/>
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
import DropdownHover from "@/components/DropdownHover.vue";

//import NetworkEdgeLine from "@/components/network/NetworkEdgeLine.vue";
import {BASE_URL} from "@/components/constants.js";
import {getCookie} from "@/components/authentication/auth.js";

import {nodeInputStore} from "@/stores/nodeInputStore";
import {popUpStore} from "@/stores/popUpStore.js";

export default {
  name: "NodeInput",
  components: {DropdownHover, AdvancedSettings},
  emits: ['save-state', 'clear-network', 'send-to-network'],

  data() {
    return {
      typeaheadresult: [],
      debounceTimeout: null,
      textFieldRef: null,
      showDropdown: false,  // Control dropdown visibility
      dropdownNodes: [], // List of dropdown items
    };
  },
  computed: {
    store() {
      return nodeInputStore(); // this makes this.store available
    },
    popUpStore() {
      return popUpStore(); // this makes this.store available
    },
  },
  methods: {
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
      console.log("this.showDropdown", this.showDropdown);
      this.showDropdown = true;
      if (event && event.inputType) {
        if (event.inputType === "deleteContentBackward" || event.inputType === "deleteContentForward") {
          this.deleteNodesNotInSearchText();
        } else if (event.inputType === "insertText" || event.inputType === "insertFromPaste") {
          const lastChar = this.store.searchText[this.store.searchText.length - 1];
          if (lastChar === ",") {
            console.log("Comma was typed.");
            await this.findNodeMatch();
            this.typeaheadresult = [];
            this.closeDropdown();
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
          this.closeDropdown();
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
              !this.store.selectedNodes.some(selected => selected.id === node.id)
          );
        } catch (error) {
          console.error("Error fetching data:", error);
          this.typeaheadresult = [];
          this.dropdownNodes = [];
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
      console.log("addPerDropDown is called")
      // Re-join the array into comma-separated searchText
      //this.store.searchText = searchTextParts.join(', ') + ', ';
      this.deleteNodesNotInSearchText();
      this.store.selectedNodes.push(item);
      this.updateSearchText();
      this.fetchNodeRecommendations();
      // this.dropdownNodes = [];
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
    closeDropdown() {
      console.log("closeDropdown")
      // forward to Grandchild
      this.$refs.DropdownHoverComponent.closeDropdown();
    },
    // Advanced Settings methods
    addSettings(data) {
      console.log("data: ", data)
      console.log("this.store ",this.store)
      Object.entries(data).forEach(([key, value]) => {
        if (key in this.store) {
          console.log("key: ", key)
          console.log("this.store[key] before",this.store[key])
          this.store[key] = value; // Update the corresponding variable in the parent
          console.log("this.store[key] after", this.store[key])
        } else {
          console.warn(`Unhandled akey: ${key}`);
        }
      });
      const selectedNodesSave = this.store.selectedNetworkNodes;
      this.$emit('clear-network', false);
      this.store.selectedNetworkNodes = selectedNodesSave;
      this.$emit('send-to-network');
    },
  },
  mounted() {
    // Ensure the reference is assigned
    this.textFieldRef = this.$refs.textField;
  },
};
</script>

<style scoped>

</style>