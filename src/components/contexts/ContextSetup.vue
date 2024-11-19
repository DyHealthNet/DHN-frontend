<template>
  <v-container>
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
            counter="40"
            density="compact"
            variant="outlined"
            v-model="contextName"
            required
            @change="sendContextName"
        ></v-text-field>
      </v-col>

      <v-col cols="3" class="filter-padding">
        <v-select
            v-model="selectedLayers"
            :items="layers"
            variant="outlined"
            chips
            multiple
            density="compact"
        ></v-select>
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
            :title="participantNumber"
            :remove="removedPatients"
            subtitle="Participants"
            icon="mdi-account-multiple-outline"
        />
      </v-col>
    </v-row>

    <!-- Second row (connectors) -->
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
        <ConnectorButton :connection="innerConnection" @click="changeButtonDirection"></ConnectorButton>
      </v-col>
      <v-col cols="2" class="filter-padding">
        <p>Outer Operator / Connector</p>
      </v-col>
      <v-col cols="1" class="filter-padding">
        <ConnectorButton :connection="outerConnection" @click="changeButtonDirection"></ConnectorButton>
      </v-col>
    </v-row>

    <!-- Thrid row (variables) -->
    <v-row>
      <v-col cols="3">
        <p><b>Variable</b></p>
      </v-col>
      <v-col cols="2">
        <p><b>Operator</b></p>
      </v-col>
      <template v-if="columnType === 'value'">
        <v-col cols="4">
          <p><b>Value</b></p>
        </v-col>
      </template>
      <template v-if="columnType === 'range'">
        <v-col cols="2">
          <p><b>Min</b></p>
        </v-col>
        <v-col cols="2" class="text-end">
          <p><b>Max</b></p>
        </v-col>
      </template>
      <template v-if="columnType === 'category'">
        <v-col cols="4">
          <p><b>Categories</b></p>
        </v-col>
      </template>
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
                  :all-variables="allVariables"
                  :connection="innerConnection"
                  :first="outerIndex === 0 && innerIndex === 0"
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
        <NewFilterButton :connection="outerConnection" @addFilter="newOuterGroupRule"/>
      </v-row>

    </div>

    <v-row>
      <AdvancedSettings :selected-tests="selectedTests" @data-changed="addTests"/>
    </v-row>

    <v-row>
      <v-col>
        <v-btn color="primary-darken-1" @click="sendContext" :disabled="sendDisabled">
          <v-icon class="my-0 mr-2">mdi-check-outline</v-icon>
          Submit Context
        </v-btn>
      </v-col>
    </v-row>

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

  </v-container>
</template>

<script>
const BASE_URL =
    import.meta.env.VITE_BACKEND_URL ||
    `${window.location.protocol}//${window.location.host}`;
import StatusBox from "@/components/contexts/StatusBox.vue";
import ConnectorButton from "@/components/contexts/ConnectorButton.vue";
import FilterLine from "@/components/contexts/FilterLine.vue";
import ConnectorLine from "@/components/contexts/ConnectorLine.vue";
import NewFilterButton from "@/components/contexts/NewFilterButton.vue";
import AdvancedSettings from "@/components/contexts/AdvancedSettings.vue";
import {v4 as uuidv4} from 'uuid';
import { getCookie } from "@/components/authentication/auth.js";

export default {
  components: {AdvancedSettings, NewFilterButton, ConnectorLine, FilterLine, ConnectorButton, StatusBox},
  emits: ['data-changed'],
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
    }
  },
  data() {
    const layers = ["Phenomics", "Metabolomics", "Proteomics"];
    const groups = [];
    const rules = [];
    if (this.content) {
      for (const group in this.content.conditions) {
        groups.push(`group-${groups.length}`);
        this.content.conditions[group].forEach(rule => {
          rules.push({group: `group-${groups.length - 1}`, id: uuidv4(), rule: rule});
        });
      }
      console.log(rules);
    }

    return {
      contextName: this.content?.contextName ?? "",
      contextNameMaxLength: [v => v.length <= 40 || 'Max 40 characters'],

      layers: layers,
      selectedLayers: this.content?.layers ?? layers,

      allVariables: {},
      columnType: "value",

      outerRows: groups.length > 0 ? groups : ['group-0'],
      innerRows: rules.length > 0 ? rules : [{group: 'group-0', id: uuidv4(), rule: {}}],
      outerConnection: this.content?.connect.outside ?? "OR",
      innerConnection: this.content?.connect.inside ?? "AND",

      progressIcon: "mdi-clock-outline",
      progressStatus: "Waiting",
      participantNumber: "13 000",
      removedPatients: "",

      selectedTests: this.content?.tests ?? {
        catCat: 'Chi-squared', catContM: 'ANOVA',
        catContB: 'T-test', contCont: 'Pearson'
      },

      taskId: null,
      taskStarted: false,
      taskInfo: "",
      taskType: "",
      sendDisabled: false
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
          if (action.first) {
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

    async fetchVariables() {
      await fetch(`${BASE_URL}/network/api/variables`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie("csrftoken")
        },
        credentials: 'include',
      })
          .then(response => response.json())
          .then(data => {
            this.allVariables = data;
          })
          .catch((error) => {
            console.error('Error:', error);
          });
    },

    async fetchParticipants(params) {
      console.log(JSON.stringify(params));
      let newParticipants = '';

      if (Object.keys(params.conditions).length === 0) {
        this.removedPatients = ("+ " + Math.abs(parseInt(this.participantNumber.replace(/\s/g, ''))
                                                - 13000)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
        this.participantNumber = "13 000";
        return;
      }
      // fetch the participants
      await fetch(`${BASE_URL}/network/api/filterContext`, {
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
          })
          .catch((error) => {
            console.error('Error:', error);
            // get a random number of participants to test
            newParticipants = 0;
          });

      // calculate the number of removed patients
      const minusPatients = this.participantNumber === '' ? 0 : parseInt(this.participantNumber.replace(/\s/g, '')) - newParticipants;
      const patientsString = ("" + Math.abs(minusPatients)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      if (minusPatients === 0) {
        return;
      }
      this.removedPatients = minusPatients > 0 ? "- " + patientsString : "+ " + patientsString;
      // go backwards and add a space every 3 characters to comply with Resolution 10 of CGPM
      this.participantNumber = ('' + newParticipants).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },

    async getProgressStatus() {
      // sleep for 2 seconds
      const sleep = ms => new Promise(r => setTimeout(r, ms));

      await sleep(2000);

      while (this.taskId === null) {
        console.log("Task ID is null");
        await sleep(2000);
      }

      const url = new URL(`${BASE_URL}/network/api/contextStatus`);
      url.search = new URLSearchParams({taskId: this.taskId}).toString();

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
            this.progressStatus = data.status === "SUCCESS" ? "Finished" : "Calculating";
            this.progressIcon = data.status === "SUCCESS" ? "mdi-check-circle-outline" : "mdi-autorenew";
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
      this.selectedTests = data;
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
        tests: this.selectedTests,
        contextValue: this.value
      };
    },

    async sendContext() {
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
      if (this.innerRows.length === 0) {
        this.taskStarted = true;
        this.taskInfo = "Please define at least one rule";
        this.taskType = "error";
        return;
      }
      const params = this.createParams();
      const csrfToken = getCookie("csrftoken");

      await fetch(`${BASE_URL}/network/api/createContext`, {
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
            this.taskId = data.taskId;
            this.taskStarted = true;
            this.taskInfo = "Context calculation started successfully";
            this.taskType = "success";
            this.sendDisabled = true;
            this.getProgressStatus();
          })
          .catch((error) => {
            console.error('Error:', error);
          });

    },

    async intervalProgress() {

      while (this.taskId === null) {
        await new Promise(r => setTimeout(r, 20000));
      }

      while (this.progressStatus !== "SUCCESS") {
        await this.getProgressStatus();
        await new Promise(r => setTimeout(r, 30000));
      }
    }
  },
  mounted() {
    this.intervalProgress();
    this.fetchVariables();
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