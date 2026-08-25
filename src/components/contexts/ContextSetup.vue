<template>
  <v-responsive class="pa-4">
    <!--First row (name) -->
    <v-row class="py-1">
      <v-col cols="3" class="no-bottom-padding">
        <p><b>Context name</b></p>
      </v-col>
    </v-row>
    <v-row justify="space-between" align="start" class="filter-padding">
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
      <v-col cols="6" class="no-bottom-padding d-flex align-center">
        <p class="mr-2"><b>Select variables for context</b></p>
        <v-chip size="small" density="compact">{{ selectedVariables.length }}</v-chip>
      </v-col>
    </v-row>
    <v-row class="filter-padding">
      <v-col cols="6" class="filter-padding">
        <v-menu :close-on-content-click="false" location="bottom">
          <template v-slot:activator="{ props }">
            <v-text-field
                v-bind="props"
                :readonly="true"
                variant="outlined"
                density="compact"
                :model-value="selectedVariablesLayersSummary"
                append-inner-icon="mdi-menu-down"
            ></v-text-field>
          </template>
          <v-card class="pa-2">
            <LayerVariableSelector
                :items="allVariablesGlobalFlat"
                :variable-layers="variableLayers"
                :variable-sub-layers="variableSubLayers"
                :model-value="selectedVariables"
                :disable-selections="disableSelections"
                @update:model-value="updateSelectedVariables"
            ></LayerVariableSelector>
          </v-card>
        </v-menu>
      </v-col>
    </v-row>
    <v-row class="py-1">
      <v-col cols="6" class="no-bottom-padding d-flex align-center">
        <p class="mr-2"><b>Remove samples with missing values in</b></p>
        <v-chip size="small" density="compact">{{ missingnessVariables.length }}</v-chip>
      </v-col>
    </v-row>
    <v-row class="filter-padding">
      <v-col cols="6" class="filter-padding">
        <v-menu :close-on-content-click="false" location="bottom">
          <template v-slot:activator="{ props }">
            <v-text-field
                v-bind="props"
                :readonly="true"
                variant="outlined"
                density="compact"
                :model-value="missingnessVariablesLayersSummary"
                append-inner-icon="mdi-menu-down"
            ></v-text-field>
          </template>
          <v-card class="pa-2">
            <LayerVariableSelector
                :items="selectedVariables"
                :variable-layers="variableLayers"
                :variable-sub-layers="variableSubLayers"
                :model-value="missingnessVariables"
                :disable-selections="disableSelections"
                @update:model-value="updateMissingnessVariables"
            ></LayerVariableSelector>
          </v-card>
        </v-menu>
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
      <v-col cols="auto" class="d-flex ga-2">
        <v-tooltip bottom :disabled="!calculating && !titleMissing">
          <template v-slot:activator="{ props }">
              <div v-bind="props" class="d-inline-block">
                <v-btn color="primary-darken-1" @click="sendContext" :disabled="sendDisabled || calculating || titleMissing">
                    <v-icon class="my-0 mr-2">mdi-check-outline</v-icon>
                    Submit Context
                  </v-btn>
              </div>
          </template>
          <span>{{ calculating ? 'A context calculation is already in progress. Please wait...' : 'Please enter a context name first.' }}</span>
        </v-tooltip>

        <v-tooltip bottom :disabled="hasFreeTab && contextCreated">
          <template v-slot:activator="{ props }">
              <div v-bind="props" class="d-inline-block">
                <v-btn color="secondary" variant="outlined" @click="copyContext" :disabled="!hasFreeTab || !contextCreated || calculating">
                    <v-icon class="my-0 mr-2">mdi-content-copy</v-icon>
                    Copy to next tab
                  </v-btn>
              </div>
          </template>
          <span>{{ !contextCreated ? 'Submit this context before copying it.' : 'No free tab available to copy this context into.' }}</span>
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
        <div class="context-log">
          <div class="context-log-title">
            <v-icon size="small" class="mr-1">mdi-text-box-outline</v-icon>
            Variable removal log
          </div>
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
        </div>
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

    <v-dialog width="auto" v-model="variableRemovalConfirm.show">
        <v-card color="warning" rounded="lg">
          <v-card-title class="headline">
            <v-icon class="my-0 mr-2">mdi-alert-outline</v-icon>
            <b>Remove affected rule{{ variableRemovalConfirm.affectedColumns.length === 1 ? '' : 's' }}?</b>
          </v-card-title>
          <v-card-text>
            Deselecting this changes {{ variableRemovalConfirm.affectedColumns.length }}
            variable{{ variableRemovalConfirm.affectedColumns.length === 1 ? '' : 's' }}
            ({{ variableRemovalConfirm.affectedColumns.join(', ') }}) that
            {{ variableRemovalConfirm.affectedColumns.length === 1 ? 'is' : 'are' }} currently used in a rule for
            this context. Continuing will remove those rule row{{ variableRemovalConfirm.affectedColumns.length === 1 ? '' : 's' }}.
          </v-card-text>
          <v-card-actions>
            <v-btn @click="confirmVariableRemoval">Yes, remove</v-btn>
            <v-btn @click="cancelVariableRemoval">Cancel</v-btn>
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
import LayerVariableSelector from "@/components/contexts/LayerVariableSelector.vue";
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
    // an empty (or whitespace-only) name is not a valid context name - blocks Submit
    // proactively, on top of the same check repeated in sendContext() as a safety net.
    titleMissing() {
      return this.contextName.trim().length === 0;
    },
    // whether this context has actually been submitted to the backend - `content` is only
    // non-null for a tab loaded from a saved context, and sendDisabled also flips true right
    // after a successful sendContext() this session (before a reload would refresh `content`).
    // False for a tab that's still being edited and was never submitted - copying that would
    // just be copying in-progress scratch state, not a real context.
    contextCreated() {
      return !!this.content || this.sendDisabled;
    },
    // the FULL catalog, unrestricted - the pool LayerVariableSelector groups into
    // Layer/Sublayer. Never narrowed by a separate layer/subLayer picking step.
    allVariablesGlobalFlat() {
      return this.flattenVariables(this.allVariables);
    },
    // Closed-state summary text for the two collapsible dropdowns below - lists
    // every layer with at least one selected variable, instead of just a total count
    // (the count now lives in the chip next to the field's header).
    selectedVariablesLayersSummary() {
      return this.layerNamesWithSelection(this.globalVariablesByLayer, this.selectedVariables);
    },
    missingnessVariablesLayersSummary() {
      return this.layerNamesWithSelection(this.selectedVariablesByLayer, this.missingnessVariables);
    },
    // Grouped once per change of the underlying list (not once per layer, per lookup) -
    // see groupVariablesByLayer(). selectedVariablesByLayer backs variablesInLayer*
    // (only recomputes when the selection changes), globalVariablesByLayer backs
    // variablesAvailableInLayer* (only recomputes when the catalog itself changes, i.e.
    // essentially once, right after fetchVariables() loads).
    selectedVariablesByLayer() {
      return this.groupVariablesByLayer(this.selectedVariables);
    },
    globalVariablesByLayer() {
      return this.groupVariablesByLayer(this.allVariablesGlobalFlat);
    },
    // rule variables must be part of the explicit variable selection - what's actually
    // going to be part of the calculated context.
    allVariablesForRules() {
      const selected = new Set(this.selectedVariables);
      return Object.fromEntries(
        Object.entries(this.allVariables).map(([key, value]) => [
          key,
          value.filter(item => selected.has(item)),
        ])
      );
    },
    // Derives the missingness selector's checkbox state directly from missingnessVariables
    // (the single source of truth): a layer counts as "checked" only if EVERY one of its
    // currently-selected variables is in missingnessVariables; a layer with some (but not
    // all) of its subgroups fully checked shows as checked+indeterminate with those
    // subgroups narrowed. A layer/subgroup that's only PARTIALLY checked below the
    // subgroup level (individual variable exceptions) simply shows as unchecked here -
    // it's still tracked in missingnessVariables and remains visible/editable directly.
    missingnessLayerStates() {
      const missing = new Set(this.missingnessVariables);
      const checkedLayers = [];
      const subLayers = {};
      for (const layer of this.layers) {
        const coverage = this.layerCoverage(layer, this.variablesInLayer(layer), missing);
        if (!coverage) {
          continue;
        }
        if (coverage.fullyChecked) {
          checkedLayers.push(layer);
        } else if (coverage.checkedSubgroups.length) {
          checkedLayers.push(layer);
          subLayers[layer.toLowerCase()] = coverage.checkedSubgroups;
        }
      }
      return {checkedLayers, subLayers};
    },
    // Compacts missingnessVariables for the backend: any (sub)layer that's fully checked
    // gets sent by name instead of enumerating every one of its variables; only the
    // leftover variables not covered by a fully-checked (sub)layer - e.g. a single
    // exception - are sent individually. That layer's OTHER variables then have to be
    // listed individually too, since "whole layer minus one" can't be expressed compactly.
    missingnessCompactPayload() {
      const {checkedLayers, subLayers} = this.missingnessLayerStates;
      const covered = new Set();
      for (const layer of checkedLayers) {
        const raw = layer.toLowerCase();
        if (subLayers[raw]) {
          for (const subgroup of subLayers[raw]) {
            this.variablesInLayerSubgroup(layer, subgroup).forEach(v => covered.add(v));
          }
        } else {
          this.variablesInLayer(layer).forEach(v => covered.add(v));
        }
      }
      return {
        missingnessVariables: this.missingnessVariables.filter(v => !covered.has(v)),
        missingnessLayers: checkedLayers.map(layer => layer.toLowerCase()),
        missingnessSubLayers: subLayers,
      };
    },
    // Same idea as missingnessLayerStates, but for the main "Select variables for
    // context" pool: a layer/subgroup counts as "checked" here only if EVERY variable
    // that globally exists in it (allVariablesGlobalFlat, not just what's currently
    // selected) is selected. This is what makes the resulting variablesLayers/
    // variablesSubLayers self-sufficient: a bare "phenotype" entry always means the WHOLE
    // layer, so it never needs any outside context to be interpreted correctly.
    selectedVariablesLayerStates() {
      const selected = new Set(this.selectedVariables);
      const checkedLayers = [];
      const subLayers = {};
      for (const layer of this.layers) {
        const coverage = this.layerCoverage(layer, this.variablesAvailableInLayer(layer), selected);
        if (!coverage) {
          continue;
        }
        if (coverage.fullyChecked) {
          checkedLayers.push(layer);
        } else if (coverage.checkedSubgroups.length) {
          checkedLayers.push(layer);
          subLayers[layer.toLowerCase()] = coverage.checkedSubgroups;
        }
      }
      return {checkedLayers, subLayers};
    },
    // Compacts selectedVariables for the backend the same way missingnessCompactPayload
    // does: a fully-selected (sub)layer is sent by name instead of enumerating every one
    // of its variables; only the leftover exceptions are sent individually. Always
    // written out explicitly - these three fields (variables/variablesLayers/
    // variablesSubLayers) are a complete, self-sufficient description of the context's
    // variable selection on their own; nothing else is saved or consulted to interpret them.
    selectedVariablesCompactPayload() {
      const {checkedLayers, subLayers} = this.selectedVariablesLayerStates;
      const covered = new Set();
      for (const layer of checkedLayers) {
        const raw = layer.toLowerCase();
        if (subLayers[raw]) {
          for (const subgroup of subLayers[raw]) {
            this.variablesAvailableInLayerSubgroup(layer, subgroup).forEach(v => covered.add(v));
          }
        } else {
          this.variablesAvailableInLayer(layer).forEach(v => covered.add(v));
        }
      }
      return {
        variables: this.selectedVariables.filter(v => !covered.has(v)),
        variablesLayers: checkedLayers.map(layer => layer.toLowerCase()),
        variablesSubLayers: subLayers,
      };
    },
  },
  components: {AdvancedSettings, NewFilterButton, ConnectorLine, FilterLine, ConnectorButton, StatusBox, LayerVariableSelector},
  emits: ['data-changed','calculation-start','calculation-end','copy-context'],
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
    },
    // whether some other tab is currently empty and could receive a copy of this context -
    // purely informational (disables/tooltips the Copy button), the parent re-checks this
    // itself when the copy actually happens.
    hasFreeTab: {
      type: Boolean,
      default: true,
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

    return {
      contextName: this.content?.contextName ?? `Context ${this.value}`,
      contextNameMaxLength: [v => v.length <= 40 || 'Max 40 characters'],

      deleteWarn: false,

      // pending variable deselection that would strip the column out from under an
      // existing rule - held here until the user confirms, so the deselection can still
      // be discarded on Cancel (selectedVariables is left untouched until then).
      variableRemovalConfirm: {
        show: false,
        pendingSelection: null,
        affectedColumns: [],
      },

      // the full catalog of layers/subgroups - not a "selection", just metadata used to
      // group LayerVariableSelector's Layer/Sublayer list and to resolve compact
      // variablesLayers/missingnessLayers references. Populated by fetchVariables().
      layers: layers,
      variableLayers: {},
      layerSubLayers: {},
      variableSubLayers: {},

      allVariables: {},
      // Identifiers of the variables selected to be part of this context's calculation.
      // Empty for a brand-new tab until fetchVariables() defaults it to "all available".
      selectedVariables: this.content?.variables ?? [],
      // opt-in subset of selectedVariables: drop any sample with a missing value in any
      // of THESE, though every selected variable stays part of the resulting data. Starts
      // with just whatever explicit leftover was saved - fetchVariables() merges in the
      // variables implied by any saved missingnessLayers/missingnessSubLayers once it has
      // the layer/variable metadata needed to expand them.
      missingnessVariables: this.content?.missingnessVariables ?? [],
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
      removedVariables: this.content?.removedVariables ?? [],
      droppedEdgeCount: this.content?.droppedEdgeCount ?? 0,
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
            this.variableLayers = variableLayers ?? {};
            this.variableSubLayers = variableSubLayers ?? {};
            this.layerSubLayers = layerSubLayers ?? {};
            this.layers = (availableLayers ?? []).map(
              layer => layer.charAt(0).toUpperCase() + layer.slice(1)
            );
            // only default to "all variables selected" for a brand new context;
            // an existing context's saved selection (this.content?.variables) takes priority.
            if (!this.content?.variables) {
              this.selectedVariables = this.allVariablesGlobalFlat;
            } else if (this.content?.variablesLayers?.length) {
              // saved selection may be compact - expand any (sub)layer references back
              // into their member variables and merge with the saved leftover picks.
              const expanded = this.expandVariablesLayers(
                this.content.variablesLayers, this.content.variablesSubLayers
              );
              this.selectedVariables = [...new Set([...this.selectedVariables, ...expanded])];
            }
            // now that layer/variable metadata is available, expand any saved compact
            // (sub)layer missingness selection back into its member variables and merge
            // it into missingnessVariables (which already holds the saved leftover
            // individual picks) - only needed once, right after loading a saved context.
            if (this.content?.missingnessLayers?.length) {
              const expanded = this.expandMissingnessLayers(
                this.content.missingnessLayers, this.content.missingnessSubLayers
              );
              this.missingnessVariables = [...new Set([...this.missingnessVariables, ...expanded])];
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
      if (Object.keys(params.conditions).length === 0 && (!params.variables || params.variables.length === 0) && (!params.variablesLayers || params.variablesLayers.length === 0)) {
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

    flattenVariables(variablesObj) {
      return [...new Set(Object.values(variablesObj).flat())];
    },

    // Removes a single rule row, mirroring the manual delete-button logic in
    // newInnerGroupRule(): the very last rule overall is just cleared in place (there's
    // always at least one row rendered), the last row of a group takes its group down
    // with it, otherwise just the row itself is spliced out.
    removeRuleRow(item) {
      if (this.innerRows.length === 1) {
        item.rule = {};
        return;
      }
      const groupRows = this.innerRows.filter(data => data.group === item.group);
      if (groupRows.length === 1) {
        this.innerRows.splice(this.innerRows.indexOf(item), 1);
        this.outerRows.splice(this.outerRows.indexOf(item.group), 1);
      } else {
        this.innerRows.splice(this.innerRows.indexOf(item), 1);
      }
    },

    // Drop any missingness-check variable that's no longer part of the (newly narrowed)
    // variable selection - it's only ever meant to be a subset of selectedVariables.
    // missingnessLayerStates/missingnessCompactPayload are pure derivations of
    // missingnessVariables, so pruning this one array keeps everything else consistent.
    pruneStaleMissingnessVariables() {
      const selected = new Set(this.selectedVariables);
      this.missingnessVariables = this.missingnessVariables.filter(item => selected.has(item));
    },

    // Groups a flat identifier list into layer -> {all, bySubgroup} in a single pass, so
    // repeated lookups per layer/subgroup (layerCoverage runs once per layer, for every
    // layer, on every selection change) don't each re-scan the whole list with .filter() -
    // that repeated O(layers x variables) rescanning was the main source of lag on a
    // large catalog. Used by both variablesInLayer* (selectedVariables) and
    // variablesAvailableInLayer* (allVariablesGlobalFlat) via the computeds below.
    groupVariablesByLayer(identifiers) {
      const result = new Map();
      for (const identifier of identifiers) {
        const layerKey = this.variableLayers[identifier];
        if (!layerKey) {
          continue;
        }
        if (!result.has(layerKey)) {
          result.set(layerKey, {all: [], bySubgroup: new Map()});
        }
        const entry = result.get(layerKey);
        entry.all.push(identifier);
        const subgroup = this.variableSubLayers[identifier];
        if (subgroup) {
          if (!entry.bySubgroup.has(subgroup)) {
            entry.bySubgroup.set(subgroup, []);
          }
          entry.bySubgroup.get(subgroup).push(identifier);
        }
      }
      return result;
    },

    // Comma-joined list of layer names that have at least one selected variable (fully or
    // partially) - the closed-state text for the variable/missingness dropdown fields.
    // Iterates this.layers (proper-cased) rather than the grouped map's keys so the order
    // is stable and alphabetized, matching LayerVariableSelector's own sort.
    layerNamesWithSelection(layerMap, selectedIdentifiers) {
      const selected = new Set(selectedIdentifiers);
      const names = this.layers.filter(layer => {
        const entry = layerMap.get(layer.toLowerCase());
        return entry && entry.all.some(v => selected.has(v));
      });
      return names.length ? names.join(', ') : 'None selected';
    },

    // currently-SELECTED variables (selectedVariables) belonging to a layer/subgroup -
    // the pool the missingness check picks from, since it can only require completeness
    // on variables that are actually part of the context.
    variablesInLayer(layer) {
      return this.selectedVariablesByLayer.get(layer.toLowerCase())?.all ?? [];
    },

    variablesInLayerSubgroup(layer, subgroup) {
      return this.selectedVariablesByLayer.get(layer.toLowerCase())?.bySubgroup.get(subgroup) ?? [];
    },

    // EVERY variable that globally exists in a layer/subgroup (allVariablesGlobalFlat -
    // the full catalog) - the pool for deciding whether the whole (sub)layer is selected
    // in its entirety, so the compacted variablesLayers/variablesSubLayers reference is
    // unambiguous on its own: it always means literally every variable in that (sub)layer.
    variablesAvailableInLayer(layer) {
      return this.globalVariablesByLayer.get(layer.toLowerCase())?.all ?? [];
    },

    variablesAvailableInLayerSubgroup(layer, subgroup) {
      return this.globalVariablesByLayer.get(layer.toLowerCase())?.bySubgroup.get(subgroup) ?? [];
    },

    // Bottom-up coverage check for one layer against `includedSet`, given its variable
    // `pool` (variablesInLayer for the missingness check, variablesAvailableInLayer for
    // the main selection): buckets the pool by subgroup - including an "ungrouped"
    // bucket for any variable whose layer has subgroups but that itself isn't in one -
    // in a single pass, then derives coverage from those bucket totals instead of
    // re-filtering the pool once per subgroup. A layer with no subgroup structure at all
    // only has the whole-pool granularity. Returns null for an empty pool (layer not
    // actually part of the current variable set), otherwise
    // {fullyChecked, checkedSubgroups}: fullyChecked is true only if every bucket
    // (subgroups and any ungrouped leftovers) is entirely within includedSet.
    layerCoverage(layer, pool, includedSet) {
      if (pool.length === 0) {
        return null;
      }
      const raw = layer.toLowerCase();
      const subgroupNames = this.layerSubLayers[raw];
      if (!subgroupNames) {
        return {fullyChecked: pool.every(v => includedSet.has(v)), checkedSubgroups: []};
      }
      const buckets = new Map();
      for (const v of pool) {
        const key = this.variableSubLayers[v] ?? null;
        const bucket = buckets.get(key) ?? {total: 0, covered: 0};
        bucket.total += 1;
        if (includedSet.has(v)) {
          bucket.covered += 1;
        }
        buckets.set(key, bucket);
      }
      const checkedSubgroups = subgroupNames.filter(subgroup => {
        const bucket = buckets.get(subgroup);
        return !!bucket && bucket.total === bucket.covered;
      });
      const ungrouped = buckets.get(null);
      const ungroupedCovered = !ungrouped || ungrouped.total === ungrouped.covered;
      return {
        fullyChecked: checkedSubgroups.length === subgroupNames.length && ungroupedCovered,
        checkedSubgroups,
      };
    },

    // Expands a saved compact (sub)layer missingness selection back into its member
    // variables (used once, right after a saved context's layer/variable metadata loads).
    expandMissingnessLayers(missingnessLayersLower, missingnessSubLayersMap) {
      const result = new Set();
      const subLayersMap = missingnessSubLayersMap ?? {};
      for (const raw of missingnessLayersLower ?? []) {
        const layer = this.layers.find(l => l.toLowerCase() === raw);
        if (!layer) {
          continue;
        }
        const wantedSubgroups = subLayersMap[raw];
        if (wantedSubgroups) {
          for (const subgroup of wantedSubgroups) {
            this.variablesInLayerSubgroup(layer, subgroup).forEach(v => result.add(v));
          }
        } else {
          this.variablesInLayer(layer).forEach(v => result.add(v));
        }
      }
      return result;
    },

    // Expands a saved compact (sub)layer VARIABLE selection back into its member
    // variables - same idea as expandMissingnessLayers, but against the available pool
    // (variablesAvailableIn*) since this reconstructs selectedVariables itself.
    expandVariablesLayers(variablesLayersLower, variablesSubLayersMap) {
      const result = new Set();
      const subLayersMap = variablesSubLayersMap ?? {};
      for (const raw of variablesLayersLower ?? []) {
        const layer = this.layers.find(l => l.toLowerCase() === raw);
        if (!layer) {
          continue;
        }
        const wantedSubgroups = subLayersMap[raw];
        if (wantedSubgroups) {
          for (const subgroup of wantedSubgroups) {
            this.variablesAvailableInLayerSubgroup(layer, subgroup).forEach(v => result.add(v));
          }
        } else {
          this.variablesAvailableInLayer(layer).forEach(v => result.add(v));
        }
      }
      return result;
    },

    updateSelectedVariables(newSelectedVariables) {
      const newSelectedSet = new Set(newSelectedVariables);
      const affected = this.innerRows.filter(
          item => item.rule.column !== undefined && !newSelectedSet.has(item.rule.column)
      );
      if (affected.length > 0) {
        this.variableRemovalConfirm = {
          show: true,
          pendingSelection: newSelectedVariables,
          affectedColumns: affected.map(item => item.rule.column),
        };
        return;
      }
      this.applySelectedVariables(newSelectedVariables);
    },

    applySelectedVariables(newSelectedVariables) {
      this.selectedVariables = newSelectedVariables;
      this.pruneStaleMissingnessVariables();
      this.$nextTick(() => this.fetchParticipants(this.createParams()));
    },

    // User confirmed dropping the affected rule rows - apply the deselection and remove
    // every rule row whose column is no longer part of the selection.
    confirmVariableRemoval() {
      const affectedSet = new Set(this.variableRemovalConfirm.affectedColumns);
      for (const item of [...this.innerRows]) {
        if (item.rule.column !== undefined && affectedSet.has(item.rule.column)) {
          this.removeRuleRow(item);
        }
      }
      this.applySelectedVariables(this.variableRemovalConfirm.pendingSelection);
      this.variableRemovalConfirm = {show: false, pendingSelection: null, affectedColumns: []};
    },

    // User declined - discard the pending deselection entirely, leaving selectedVariables
    // (and therefore the rule rows) untouched.
    cancelVariableRemoval() {
      this.variableRemovalConfirm = {show: false, pendingSelection: null, affectedColumns: []};
    },

    updateMissingnessVariables(newMissingnessVariables) {
      this.missingnessVariables = newMissingnessVariables;
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
        ...this.selectedVariablesCompactPayload,
        ...this.missingnessCompactPayload,
        testType: this.selectedTests?.testType ?? 'parametric',
        correction: this.selectedTests?.correction ?? 'bh',
        contextValue: this.value
      };
    },

    async sendContext() {
      this.$emit('calculation-start')
      console.log("sendContext()");
      // check for validity - also enforced proactively by the Submit button's :disabled
      // (titleMissing), this is the safety net for any other path that could call sendContext().
      if (this.titleMissing) {
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

    // Sends the CURRENT live configuration (not just what was last saved) up to the parent,
    // which seeds the next free tab with it - contextName is forced blank so the copy can't
    // be mistaken for the original and the user must name it before submitting (titleMissing
    // blocks Submit either way).
    copyContext() {
      const {contextValue, ...copyableParams} = this.createParams();
      this.$emit('copy-context', {sourceValue: this.value, params: {...copyableParams, contextName: ''}});
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
      this.selectedVariables = this.allVariablesGlobalFlat;
      this.missingnessVariables = [];
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
      this.removedVariables = [];
      this.droppedEdgeCount = 0;

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

.context-log {
  padding: 10px 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  border-left: 3px solid rgb(var(--v-theme-primary-darken-1));
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-size: 0.875rem;
}

.context-log-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  margin-bottom: 4px;
}
</style>
