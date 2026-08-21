<template>
  <v-responsive class="pa-4">
    <!--First row (name & layers) -->
    <v-row class="py-1">
      <v-col cols="3" class="no-bottom-padding">
        <p><b>Context name</b></p>
      </v-col>
      <v-col cols="3" class="no-bottom-padding">
        <p><b>Select layers</b></p>
      </v-col>
    </v-row>
    <v-row justify="space-between" class="filter-padding">
      <v-col cols="3" class="filter-padding">
        <v-text-field
            :rules="contextNameMaxLength"
            :readonly="disableSelections"
            counter="40"
            density="compact"
            variant="outlined"
            v-model="contextName"
            required
            @change="sendContextName"
        ></v-text-field>
      </v-col>

      <v-col cols="3" class="filter-padding">
        <v-menu :close-on-content-click="false" location="bottom">
          <template v-slot:activator="{ props }">
            <v-text-field
                v-bind="props"
                :readonly="true"
                variant="outlined"
                density="compact"
                :model-value="selectedLayersSummary"
                append-inner-icon="mdi-menu-down"
            ></v-text-field>
          </template>
          <v-card class="pa-2">
            <LayerSelector
                :layers="layers"
                :layer-sub-layers="layerSubLayers"
                :selected-layers="selectedLayers"
                :selected-sub-layers="selectedSubLayers"
                :disable-selections="disableSelections"
                @update:selected-layers="updateSelectedLayers"
                @update:selected-sub-layers="updateSelectedSubLayers"
            ></LayerSelector>
          </v-card>
        </v-menu>
      </v-col>

      <v-spacer></v-spacer>

      <v-col cols="auto" class="filter-padding">
        <StatusBox
            :title="progressStatus"
            subtitle="Progress"
            :icon="progressIcon"/>
      </v-col>

      <v-col cols="auto" class="filter-padding">
        <StatusBox
            :title="participantNumberDisplay"
            :remove="removedPatients"
            :rounded="preservePrivacy"
            subtitle="Participants"
            icon="mdi-account-multiple-outline"
        />
      </v-col>
    </v-row>

    <!-- Second row (variable selection) -->
    <v-row class="py-1">
      <v-col cols="6" class="no-bottom-padding">
        <p><b>Select variables for context</b></p>
      </v-col>
    </v-row>
    <v-row class="filter-padding">
      <v-col cols="6" class="filter-padding">
        <VariableSelector
            :items="allVariablesFlat"
            :model-value="selectedVariables"
            :disable-selections="disableSelections"
            @update:model-value="updateSelectedVariables"
        ></VariableSelector>
      </v-col>
    </v-row>
    <v-row class="py-1">
      <v-col cols="6" class="no-bottom-padding">
        <p><b>Remove samples with missing values in</b></p>
      </v-col>
    </v-row>
    <v-row class="filter-padding">
      <v-col cols="6" class="filter-padding">
        <v-tabs v-model="missingnessMode" density="compact" @update:model-value="onMissingnessModeChange">
          <v-tab value="variables">By Variable</v-tab>
          <v-tab value="layers">By Layer</v-tab>
        </v-tabs>
        <v-window v-model="missingnessMode">
          <v-window-item value="variables">
            <VariableSelector
                :items="selectedVariables"
                :model-value="missingnessVariables"
                :disable-selections="disableSelections"
                @update:model-value="updateMissingnessVariables"
            ></VariableSelector>
          </v-window-item>
          <v-window-item value="layers">
            <VariableSelector
                :items="selectedLayers"
                :model-value="missingnessLayers"
                :disable-selections="disableSelections"
                @update:model-value="updateMissingnessLayers"
            ></VariableSelector>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>

    <!-- Third row (connectors) -->
    <v-row class="no-bottom-padding">
      <div class="mx-3">
        <p><b>Define Rules for Context</b></p>
      </div>
    </v-row>

    <v-row align="center" class="my-2">
      <v-col cols="2" class="filter-padding">
        <p>Inner Operator / Connector</p>
      </v-col>
      <v-col cols="1" class="filter-padding">
        <ConnectorButton :connection="innerConnection" :disable-selections="disableSelections"
                         @click="changeButtonDirection"></ConnectorButton>
      </v-col>
      <v-col cols="2" class="filter-padding">
        <p>Outer Operator / Connector</p>
      </v-col>
      <v-col cols="1" class="filter-padding">
        <ConnectorButton :connection="outerConnection" :disable-selections="disableSelections"
                         @click="changeButtonDirection"></ConnectorButton>
      </v-col>
    </v-row>

    <!-- Rule column headers -->
    <v-row>
      <v-col cols="3">
        <p><b>Variable</b></p>
      </v-col>
      <v-col cols="2">
        <p><b>Operator</b></p>
      </v-col>
      <v-col cols="4">
        <p><b>Value</b></p>
      </v-col>
    </v-row>

    <div id="allRules">
      <template
          v-for="(outerRow, outerIndex) in outerRows" :key="outerRow">
        <div>
          <template
              v-for="(innerRow, innerIndex) in innerRows.filter(item => item.group === outerRow)"
              :key="`${innerRow.group}-${innerRow.id}`">

            <v-row class="my-0" v-if="innerIndex > 0">
              <ConnectorLine :inner="true" :connection="innerConnection"/>
            </v-row>

            <v-row class="my-1">
              <FilterLine
                  :all-variables="allVariablesForRules"
                  :connection="innerConnection"
                  :only-rule="(outerRows.length + innerRows.length) === 2"
                  :disable-selections="disableSelections"
                  :rule="innerRow.rule"
                  :rule-group="innerRow.group"
                  :rule-id="innerRow.id"
                  :enable-connector="innerRows.filter(item => item.group === outerRow).length - 1 === innerIndex"
                  @button-clicked="(data) => newInnerGroupRule(data)"
                  @data-changed="addToRules"
                  @column-type="setColumnType"
              />
            </v-row>
          </template>
        </div>
        <v-row class="mt-0 mb-5" v-if="this.outerRows.indexOf(outerRow) !== this.outerRows.length - 1">
          <NewFilterButton :connection="outerConnection"
                           :visual-only="true"
                           :last="this.outerRows.indexOf(outerRow) === this.outerRows.length - 1"/>
        </v-row>
      </template>
      <v-row class="mt-0 mb-5">
        <NewFilterButton :connection="outerConnection" :disable-selections="disableSelections" @addFilter="newOuterGroupRule"/>
      </v-row>

    </div>

    <v-row>
       <v-col>
         <!-- opinion: show header could be a default value that's always true, it is always useful
              opinion: show mult test could also be shown by default
              opinion: disableSelections could maybe be an object so that we can disable certain options
              opinion: I don't get useAdvancedTitle, what's the point?
          -->
      <AdvancedSettings :selected-tests="selectedTests"
                        :show-header="true"
                        @data-changed="addTests"
                        expansion-panel-variant="default"
                        :disable-selections="disableSelections"/>
       </v-col>
    </v-row>

    <v-row justify="space-between">
      <v-col cols="2">
        <v-tooltip bottom :disabled="!calculating">
          <template v-slot:activator="{ props }">
              <div v-bind="props" class="d-inline-block">
                <v-btn color="primary-darken-1" @click="sendContext" :disabled="sendDisabled || calculating">
                    <v-icon class="my-0 mr-2">mdi-check-outline</v-icon>
                    Submit Context
                  </v-btn>
              </div>
          </template>
          <span>{{'A context calculation is already in progress. Please wait...'}}</span>
        </v-tooltip>
      </v-col>
      <v-col cols="auto" class="d-flex justify-end">
        <v-btn color="error" elevation="1" @click="deleteWarn = true">
          <v-icon class="my-0 mr-2">mdi-close-circle-outline</v-icon>
          Clear context
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="removedVariables.length || droppedEdgeCount">
      <v-col>
        <v-alert
            type="warning"
            density="compact"
            variant="tonal"
            closable
            class="mb-2"
        >
          <div v-if="removedVariables.length">
            {{ removedVariables.length }} variable(s) were removed from this context because they
            have no usable variation (e.g. constant or entirely missing) in the selected patients:
            {{ removedVariables.join(', ') }}
          </div>
          <div v-if="droppedEdgeCount">
            Additionally, {{ droppedEdgeCount }} pairwise association(s) could not be calculated by
            the NaPy test (the underlying data was too sparse or unbalanced to produce a valid test
            statistic) and were excluded.
          </div>
        </v-alert>
      </v-col>
    </v-row>

    <v-dialog width="auto" v-model="deleteWarn">
        <v-card color="error" rounded="lg">
          <v-card-title class="headline">
            <v-icon class="my-0 mr-2">mdi-alert-outline</v-icon>
            <b>You are about to delete this context.</b>
          </v-card-title>
          <v-card-text>
            This action cannot be undone. Are you sure you want to continue?
          </v-card-text>
          <v-card-actions>
            <v-btn @click="clearContext">Yes</v-btn>
            <v-btn @click="deleteWarn = false">No</v-btn>
          </v-card-actions>
        </v-card>

      </v-dialog>

    <v-row>
      <div class="text-center ma-2">
        <v-snackbar
            v-model="taskStarted"
            :color="taskType"
        >
          <v-icon class="my-0 mr-2">
            mdi-information-outline
          </v-icon>
          {{ taskInfo }}

          <template v-slot:actions>
            <v-btn
                variant="text"
                @click="taskStarted = false"
            >
              Close
            </v-btn>
          </template>
        </v-snackbar>
      </div>
    </v-row>

  </v-responsive>
</template>

<script>
import {fi} from "vuetify/locale";
import {BASE_URL} from "../constants.js";

import StatusBox from "@/components/contexts/StatusBox.vue";
import ConnectorButton from "@/components/contexts/ConnectorButton.vue";
import FilterLine from "@/components/contexts/FilterLine.vue";
import ConnectorLine from "@/components/contexts/ConnectorLine.vue";
import NewFilterButton from "@/components/contexts/NewFilterButton.vue";
import AdvancedSettings from "@/components/AdvancedSettings.vue";
import LayerSelector from "@/components/contexts/LayerSelector.vue";
import VariableSelector from "@/components/contexts/VariableSelector.vue";
import {v4 as uuidv4} from 'uuid';
import { getCookie } from "@/components/authentication/auth.js";
import { contextState } from '@/components/contexts/contextStatus.js';
import {clearNetworkState} from "@/components/network/networkData.js";


export default {
  computed: {
    fi() {
      return fi
    },
    participantNumberDisplay() {
      return (this.preservePrivacy ? '~' : '') + this.participantNumber;
    },
    selectedLayersSummary() {
      return this.selectedLayers.join(', ');
    },
    allVariablesFlat() {
      return this.flattenVariables(this.allVariablesFiltered);
    },
    // rule variables must be both layer/subgroup-available AND part of the explicit
    // variable selection - what's actually going to be part of the calculated context.
    allVariablesForRules() {
      const selected = new Set(this.selectedVariables);
      return Object.fromEntries(
        Object.entries(this.allVariablesFiltered).map(([key, value]) => [
          key,
          value.filter(item => selected.has(item)),
        ])
      );
    },
    // the variable identifiers actually sent to the backend for the missingness check:
    // either the direct pick, or - when picking whole layers instead - every currently
    // selected variable that belongs to one of the chosen layers.
    effectiveMissingnessVariables() {
      if (this.missingnessMode === 'layers') {
        const layersLower = new Set(this.missingnessLayers.map(layer => layer.toLowerCase()));
        return this.selectedVariables.filter(item => layersLower.has(this.variableLayers[item]));
      }
      return this.missingnessVariables;
    },
  },
  components: {AdvancedSettings, NewFilterButton, ConnectorLine, FilterLine, ConnectorButton, StatusBox, LayerSelector, VariableSelector},
  emits: ['data-changed','calculation-start','calculation-end'],
  props: {
    title: {
      type: String,
      required: true
    },
    content: {
      type: [Object, null],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    calculating: {
      type: Boolean,
      required: true,
    }
  },
  data() {
    const layers = [];
    const groups = [];
    const rules = [];
    if (this.content) {
      for (const group in this.content.conditions) {
        groups.push(`group-${groups.length}`);
        this.content.conditions[group].forEach(rule => {
          rules.push({group: `group-${groups.length - 1}`, id: uuidv4(), rule: rule});
        });
      }
    }

    // make the layers uppercase if they exist
    if (this.content?.layers) {
      this.content.layers = this.content.layers.map(layer => layer.charAt(0).toUpperCase() + layer.slice(1));
    }

    return {
      contextName: this.content?.contextName ?? `Context ${this.value}`,
      contextNameMaxLength: [v => v.length <= 40 || 'Max 40 characters'],

      deleteWarn: false,

      layers: layers,
      selectedLayers: this.content?.layers ?? layers,
      variableLayers: {},
      // Raw lowercase-keyed map of layer -> selected subgroup names. A layer absent
      // from here is unrestricted (all its subgroups selected) - this keeps a context
      // saved before subgroups existed showing everything checked on reopen.
      selectedSubLayers: this.content?.subLayers ?? {},
      layerSubLayers: {},
      variableSubLayers: {},

      allVariables: {},
      allVariablesFiltered: {},
      // Identifiers of the variables selected to be part of this context's calculation.
      // Empty for a brand-new tab until fetchVariables() defaults it to "all available".
      selectedVariables: this.content?.variables ?? [],
      // opt-in subset of selectedVariables: drop any sample with a missing value in any
      // of THESE, though every selected variable stays part of the resulting data. Can be
      // picked directly (missingnessMode 'variables') or derived from whole layers
      // (missingnessMode 'layers', via missingnessLayers) - see effectiveMissingnessVariables.
      missingnessVariables: this.content?.missingnessVariables ?? [],
      missingnessLayers: this.content?.missingnessLayers ?? [],
      missingnessMode: this.content?.missingnessLayers?.length ? 'layers' : 'variables',
      columnType: "value",

      outerRows: groups.length > 0 ? groups : ['group-0'],
      innerRows: rules.length > 0 ? rules : [{group: 'group-0', id: uuidv4(), rule: {}}],
      outerConnection: this.content?.connect.outside ?? "OR",
      innerConnection: this.content?.connect.inside ?? "AND",

      //progressIcon: this.content? "mdi-check-circle-outline": "mdi-clock-outline",
      //progressStatus: this.content? "Finished" : "Waiting",
      progressStatus: this.status ?? "Waiting",
      progressIcon: this.progressStatus === "Success" ? "mdi-check-circle-outline" : "mdi-clock-outline",

      participantNumber: "0",
      initialParticipants: null,
      removedPatients: "",
      preservePrivacy: false,

      defaultSelectedTests: { testType: 'parametric', correction: 'bh' },
      selectedTests: this.content?.testType
        ? { testType: this.content.testType, correction: this.content.correction ?? 'bh' }
        : { testType: 'parametric', correction: 'bh' },
      disableSelections: false,

      taskMessage: null,
      taskStarted: false,
      taskInfo: "",
      taskType: "",
      sendDisabled: false,
      removedVariables: [],
      droppedEdgeCount: 0,
    };
  },
  methods: {
    changeButtonDirection() {
      this.outerConnection = this.outerConnection === "OR" ? "AND" : "OR";
      this.innerConnection = this.innerConnection === "AND" ? "OR" : "AND";

      // also fetch participants since rules have changed
      const ruleNum = this.innerRows.filter(item => item.rule.column !== undefined).length;
      if (ruleNum > 0) {
        this.fetchParticipants(this.createParams());
      }
    },

    sendContextName() {
      this.$emit('data-changed', this.contextName)
    },

    newInnerGroupRule(action) {

      if (action.action === 'new') {
        // get the latest rule in the group and increment it by 1
        this.innerRows.push({group: action.group, id: uuidv4(), rule: {}});
      } else {
        try {
          if (action.onlyRule) {
            const firstElement = this.innerRows.filter(data => data.group === action.group)[0];
            firstElement.rule = {};
          }
          else if (this.innerRows.filter(data => data.group === action.group).length === 1) {
            const removeElement = this.innerRows.filter(data => data.group === action.group)[0];
            this.innerRows.splice(this.innerRows.indexOf(removeElement), 1);
            this.outerRows.splice(this.outerRows.indexOf(action.group), 1);
          } else {
            const removeElement = this.innerRows.filter(data => data.id === action.id)[0];
            this.innerRows.splice(this.innerRows.indexOf(removeElement), 1);
          }
          this.fetchParticipants(this.createParams());
        } catch (e) {
          console.log(e);
        }
      }
    },

    newOuterGroupRule() {
      const latestGroup = this.outerRows[this.outerRows.length - 1];
      const groupName = `group-${parseInt(latestGroup.split('-')[1]) + 1}`;
      this.outerRows.push(groupName);
      this.innerRows.push({group: groupName, id: uuidv4(), rule: []});
    },

    setColumnType(data) {
        return this.columnType = data;
    },

    async getTableDataFromApi() {
      try {
        const csrfToken = getCookie('csrftoken');
        let url = `${BASE_URL}/plotting/api/table/`;
        // only scope to a context once it actually exists server-side (this.content is
        // null for a brand-new tab that has no saved conditions yet)
        if (this.content) {
          url += `?contextValue=${encodeURIComponent(this.value)}`;
        }

        const response = await fetch(url, {
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

        this.initialParticipants = data.Participants;
        this.preservePrivacy = data.preservePrivacy;
        console.log(this.initialParticipants);

        this.participantNumber = this.spacedNumber(this.initialParticipants);


        // return simulated data
        return data;
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        throw error;
      }
    },

    async fetchVariables() {
      await fetch(`${BASE_URL}/general/api/variables`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie("csrftoken")
        },
        credentials: 'include',
      })
          .then(response => response.json())
          .then(data => {
            const { variableLayers, availableLayers, variableSubLayers, layerSubLayers, ...statTypeGroups } = data;
            this.allVariables = statTypeGroups;
            this.allVariablesFiltered = statTypeGroups;
            this.variableLayers = variableLayers ?? {};
            this.variableSubLayers = variableSubLayers ?? {};
            this.layerSubLayers = layerSubLayers ?? {};
            this.layers = (availableLayers ?? []).map(
              layer => layer.charAt(0).toUpperCase() + layer.slice(1)
            );
            // only default to "all layers selected" for a brand new context;
            // an existing context's saved layers (this.content?.layers) take priority.
            if (!this.content?.layers) {
              this.selectedLayers = this.layers;
            }
            this.filterVariables();
            // only default to "all variables selected" for a brand new context;
            // an existing context's saved selection (this.content?.variables) takes priority.
            if (!this.content?.variables) {
              this.selectedVariables = this.allVariablesFlat;
            }
            // the variable selection just changed (empty -> populated, or a saved one just
            // arrived) - refresh the participant count so it reflects the no-missingness
            // filtering over that selection from the very start.
            this.$nextTick(() => this.fetchParticipants(this.createParams()));
          })
          .catch((error) => {
            console.error('Error:', error);
          });
    },

    async fetchParticipants(params) {
      let newParticipants = '';
      console.log("Fetching participants");
      console.log("count of rules" , this.outerRows.length + this.innerRows.length)
      // conditions alone used to gate this fetch, but the no-missingness filtering over
      // the selected variables can shrink the participant count even with zero rules
      // defined, so we still need to hit the backend whenever any variable is selected.
      if (Object.keys(params.conditions).length === 0 && (!params.variables || params.variables.length === 0)) {
        this.removedPatients = ("+ " + this.spacedNumber(Math.abs(parseInt(this.participantNumber.replace(/\s/g, ''))
            - this.initialParticipants)))
        this.participantNumber = this.spacedNumber(this.initialParticipants);
        return;
      }

      // fetch the participants
      await fetch(`${BASE_URL}/context/api/filterContext`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie("csrftoken")
        },
        credentials: 'include',
        body: JSON.stringify(params)
      })
          .then(response => response.json())
          .then(data => {
            newParticipants = data.result;
            this.preservePrivacy = data.preservePrivacy;
          })
          .catch((error) => {
            console.error('Error:', error);
            // get a random number of participants to test
            newParticipants = 0;
          });

      // calculate the number of removed patients
      const minusPatients = this.participantNumber === '' ? 0 : parseInt(this.participantNumber.replace(/\s/g, '')) - newParticipants;
      const patientsString = ("" + this.spacedNumber(Math.abs(minusPatients)))
      if (minusPatients === 0) {
        return;
      }
      this.removedPatients = minusPatients > 0 ? "- " + patientsString : "+ " + patientsString;
      // go backwards and add a space every 3 characters to comply with Resolution 10 of CGPM
      this.participantNumber = this.spacedNumber(newParticipants);
    },

    async getProgressStatus() {
      console.log("start", this.progressIcon)
      // sleep for 2 seconds
      const sleep = ms => new Promise(r => setTimeout(r, ms));

      await sleep(2000);

      while (this.taskMessage === null) {
        console.log("Task Message is null");
        await sleep(2000);
      }

      const url = new URL(`${BASE_URL}/context/api/contextStatus`);
      url.search = new URLSearchParams({context_value: this.value}).toString();

      await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie("csrftoken")
        },
        credentials: 'include'
      })
          .then(response => response.json())
          .then(data => {
            if (data.status==="error") {
              // something went wrong
              this.taskStarted = true;
              this.taskInfo = "An error occurred during context association calculations.";
              this.taskType = "error";
              this.$emit('calculation-end');
              //this.status = "error";
              this.clearContext(false);
              this.sendDisabled = false;
              return;
            }

            this.progressStatus = data.status === "SUCCESS" ? "Finished" : "Calculating";
            this.progressIcon = data.status === "SUCCESS" ? "mdi-check-circle-outline" : "mdi-autorenew";
            console.log(this.progressIcon)
            contextState.processFinished = data.status === "SUCCESS";
            if (contextState.processFinished) {
              this.removedVariables = data.result?.removed_variables ?? [];
              this.droppedEdgeCount = data.result?.dropped_edge_count ?? 0;
              this.$emit('calculation-end');
              contextState.taskInfo = "Context Creation of context " + this.contextName + " is finished.";
              contextState.taskStarted = true;
              contextState.taskType = "success";
              if (this.$route.path !== '/context') {
                contextState.showIndicator = true;
              }
            }
          })
          .catch((error) => {
            console.error('Error:', error);
          });
    },

    addToRules(data) {
      // find the correct rule and update it
      const rule = this.innerRows.filter(item => item.id === data.ruleId)[0];
      rule.rule = {
        column: data.column,
        operator: data.operator,
        value: data.value
      };

      // once the rule has been added we can fetch the participants
      this.fetchParticipants(this.createParams());
    },

    addTests(data) {
      //console.log("data: ", data)
      Object.entries(data).forEach(([key, value]) => {
        if (key in this) {
          this[key] = value; // Update the corresponding variable in the parent
        } else {
          console.warn(`Unhandled key: ${key}`);
        }
      });
    },

    // A variable whose layer has no entry in selectedSubLayers is unrestricted
    // (all its subgroups count as selected).
    isColumnAvailable(column, selectedLayersLower) {
      const layer = this.variableLayers[column];
      if (!selectedLayersLower.includes(layer)) {
        return false;
      }
      const subgroup = this.variableSubLayers[column];
      if (subgroup && this.selectedSubLayers[layer]) {
        return this.selectedSubLayers[layer].includes(subgroup);
      }
      return true;
    },

    filterVariables() {
      // filter allVariables down to whatever layers/subgroups are currently selected,
      // using the explicit per-variable layer/subgroup info returned alongside
      // allVariables.
      const selectedLayersLower = this.selectedLayers.map(layer => layer.toLowerCase());
      this.allVariablesFiltered = Object.fromEntries(
        Object.entries(this.allVariables).map(([key, value]) => [
          key,
          value.filter(item => this.isColumnAvailable(item, selectedLayersLower)),
        ])
      );
    },

    flattenVariables(variablesObj) {
      return [...new Set(Object.values(variablesObj).flat())];
    },

    // Clear any existing rule whose column belongs to a layer/subgroup that's no
    // longer selected, so a stale rule can't get sent to the backend for a column
    // that's about to be dropped from the context data.
    pruneStaleRules() {
      const selectedLayersLower = this.selectedLayers.map(layer => layer.toLowerCase());
      for (const item of this.innerRows) {
        if (item.rule.column !== undefined && !this.isColumnAvailable(item.rule.column, selectedLayersLower)) {
          item.rule = {};
        }
      }
    },

    // Drop any selected variable that's no longer part of the layer/subgroup-filtered
    // pool, so a stale selection can't get sent to the backend for a column that's
    // about to be dropped from the context data.
    pruneStaleVariables() {
      const available = new Set(this.allVariablesFlat);
      this.selectedVariables = this.selectedVariables.filter(item => available.has(item));
    },

    // Clear any existing rule whose column isn't part of the (newly narrowed) variable
    // selection, so a stale rule can't get sent to the backend for a column that's about
    // to be dropped from the context data.
    pruneStaleRulesByVariables() {
      const selected = new Set(this.selectedVariables);
      for (const item of this.innerRows) {
        if (item.rule.column !== undefined && !selected.has(item.rule.column)) {
          item.rule = {};
        }
      }
    },

    // Drop any missingness-check variable that's no longer part of the (newly narrowed)
    // variable selection - it's only ever meant to be a subset of selectedVariables.
    pruneStaleMissingnessVariables() {
      const selected = new Set(this.selectedVariables);
      this.missingnessVariables = this.missingnessVariables.filter(item => selected.has(item));
    },

    // Drop any missingness-check layer that's no longer selected - it's only ever meant
    // to be a subset of selectedLayers.
    pruneStaleMissingnessLayers() {
      const selected = new Set(this.selectedLayers);
      this.missingnessLayers = this.missingnessLayers.filter(item => selected.has(item));
    },

    updateSelectedVariables(newSelectedVariables) {
      this.selectedVariables = newSelectedVariables;
      this.pruneStaleRulesByVariables();
      this.pruneStaleMissingnessVariables();
      this.$nextTick(() => this.fetchParticipants(this.createParams()));
    },

    updateMissingnessVariables(newMissingnessVariables) {
      this.missingnessVariables = newMissingnessVariables;
      this.$nextTick(() => this.fetchParticipants(this.createParams()));
    },

    updateMissingnessLayers(newMissingnessLayers) {
      this.missingnessLayers = newMissingnessLayers;
      this.$nextTick(() => this.fetchParticipants(this.createParams()));
    },

    onMissingnessModeChange() {
      this.$nextTick(() => this.fetchParticipants(this.createParams()));
    },

    updateSelectedLayers(newSelectedLayers) {
      this.selectedLayers = newSelectedLayers;
      this.filterVariables();
      this.pruneStaleRules();
      this.pruneStaleVariables();
      this.pruneStaleMissingnessVariables();
      this.pruneStaleMissingnessLayers();
      this.$nextTick(() => this.fetchParticipants(this.createParams()));
    },

    updateSelectedSubLayers(newSelectedSubLayers) {
      this.selectedSubLayers = newSelectedSubLayers;
      this.filterVariables();
      this.pruneStaleRules();
      this.pruneStaleVariables();
      this.pruneStaleMissingnessVariables();
      this.$nextTick(() => this.fetchParticipants(this.createParams()));
    },

    createParams() {
      let conditions = {};

      for (const rule of this.innerRows) {
        if (rule.rule.column === undefined) {
          continue;
        }
        if (!conditions[rule.group]) {
          conditions[rule.group] = [];
        }
        conditions[rule.group].push(rule.rule);
      }

      return {
        connect: {inside: this.innerConnection, outside: this.outerConnection},
        conditions: conditions,
        contextName: this.contextName,
        layers: this.selectedLayers.map(layer => layer.toLowerCase()),
        subLayers: this.selectedSubLayers,
        variables: this.selectedVariables,
        missingnessVariables: this.effectiveMissingnessVariables,
        missingnessLayers: this.missingnessLayers,
        testType: this.selectedTests?.testType ?? 'parametric',
        correction: this.selectedTests?.correction ?? 'bh',
        contextValue: this.value
      };
    },

    async sendContext() {
      this.$emit('calculation-start')
      console.log("sendContext()");
      // check for validity
      if (this.selectedLayers.length === 0) {
        this.taskStarted = true;
        this.taskInfo = "Please select at least one layer";
        this.taskType = "error";
        return;
      }
      if (this.contextName.length === 0) {
        this.taskStarted = true;
        this.taskInfo = "Please enter a context name";
        this.taskType = "error";
        return;
      }
      if (this.selectedVariables.length === 0) {
        this.taskStarted = true;
        this.taskInfo = "Please select at least one variable";
        this.taskType = "error";
        return;
      }
      if (this.innerRows.length === 0) {
        this.taskStarted = true;
        this.taskInfo = "Please define at least one rule";
        this.taskType = "error";
        return;
      }
      const params = this.createParams();
      const csrfToken = getCookie("csrftoken");

      await fetch(`${BASE_URL}/context/api/createContext`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(params)
      })
          .then(response => response.json())
          .then(data => {
            if (data.status==="error") {
              // something went wrong
              this.taskStarted = true;
              this.taskInfo = "An error occurred while starting the context calculation";
              this.taskType = "error";
              return;
            }
            this.taskMessage = data.message;
            this.taskStarted = true;
            this.taskInfo = "Context calculation started successfully";
            // should not be needed unless database get cleaned and restarted
            clearNetworkState(this.value);
            this.taskType = data.status;
            this.sendDisabled = true;
            this.disableSelections = true;
            //contextState.indicatorSeen = true;
            this.getProgressStatus();
          })
          .catch((error) => {
            console.error('Error:', error);
          });

    },

    async intervalProgress() {

      while (this.taskMessage === null) {
        await new Promise(r => setTimeout(r, 20000));
      }

      while (this.progressStatus !== "Finished") {
        await this.getProgressStatus();
        await new Promise(r => setTimeout(r, 30000));
      }
    },

    async clearContext(deleteTables=true) {
      this.deleteWarn = false;
      this.contextName = `Context ${this.value}`;
      this.selectedLayers = this.layers;
      this.selectedSubLayers = {};
      this.filterVariables();
      this.selectedVariables = this.allVariablesFlat;
      this.missingnessVariables = [];
      this.missingnessLayers = [];
      this.missingnessMode = 'variables';
      this.outerRows = ['group-0'];
      this.innerRows = [{group: 'group-0', id: uuidv4(), rule: {}}];
      this.progressIcon = "mdi-clock-outline";
      this.progressStatus = "Waiting";
      this.participantNumber = this.spacedNumber(this.initialParticipants);
      this.removedPatients = "";
      this.selectedTests = { testType: 'parametric', correction: 'bh' };
      this.taskMessage = null;
      this.taskStarted = false;
      this.taskInfo = "";
      this.disableSelections = false;

      this.sendContextName();
      // selection just reset to "all variables" - refresh the participant count so it
      // reflects the no-missingness filtering instead of the raw unfiltered baseline.
      this.$nextTick(() => this.fetchParticipants(this.createParams()));

      // Only call api if there was a context created for this tab otherwise merely the form was being cleared
      if (this.status === "Finished" && deleteTables) {

        // Send a DELETE request to the backend deleting the context
        await fetch(`${BASE_URL}/context/api/deleteContext`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie("csrftoken")
          },
          credentials: 'include',
          body: JSON.stringify({contextValue: this.value})
        })
            .then(response => response.json())
            .then(data => {
              this.taskStarted = true;
              this.taskInfo = data.message;
              this.taskType = "success";
              this.sendDisabled = false;
              clearNetworkState(this.value);
            })
            .catch((error) => {
              console.error('Error:', error);
              this.taskStarted = true;
              this.taskInfo = "An error occurred while deleting the context";
              this.taskType = "error";
            });
      }
    },

    updateCreationIcon(status){
      if (status === "Finished") {
        //this.progressStatus = "Finished"
         this.progressIcon = "mdi-check-circle-outline";
      } else if (status === "Pending") {
        this.progressStatus = "Calculating"
        this.progressIcon = "mdi-autorenew";
      }
      else {
         //this.progressStatus = "Waiting"
         this.progressIcon = "mdi-clock-outline"; // Default to WAITING for any other value
      }
    },

    spacedNumber(number) {
      if (!number) {
        return "0";
      }
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },
  },
  mounted() {
    this.intervalProgress();
    this.fetchVariables();
    this.getTableDataFromApi()
  },
  created() {
    this.fetchParticipants(this.createParams());
    this.updateCreationIcon(this.progressStatus);
    if (this.progressStatus === 'Finished') {
      // disable the send button if the context is already created
      this.sendDisabled = true;
      this.disableSelections = true;
    }
  }
};
</script>

<style scoped>

.filter-padding {
  padding-top: 1px;
  padding-bottom: 1px;
}

.no-bottom-padding {
  padding-bottom: 0;
}

.v-checkbox input[type="checkbox"] {
  color: black !important;
}

.v-checkbox {
  color: inherit !important; /* Make text color inherit from theme */
}
</style>