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
                    outlined
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
                  :icon="progressIcon" />
          </v-col>

          <v-col cols="auto" class="filter-padding">
            <StatusBox
            :title="participantNumber"
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
                    <ConnectorLine :inner="true" :connection="innerConnection" />
                  </v-row>

                  <v-row class="my-1">
                    <FilterLine
                      :connection="innerConnection"
                      :first="outerIndex === 0 && innerIndex === 0"
                      :rule-group="innerRow.group"
                      :rule-id="innerRow.id"
                      :enable-connector="innerRows.filter(item => item.group === outerRow).length - 1 === innerIndex"
                      @button-clicked="(data) => newInnerGroupRule(data)"
                      @data-changed="addToRules"
                    />
                  </v-row>
                </template>
            </div>
          <v-row class="mt-0 mb-5" v-if="this.outerRows.indexOf(outerRow) !== this.outerRows.length - 1">
            <NewFilterButton :connection="outerConnection"
                             :visual-only="true"
                             :last="this.outerRows.indexOf(outerRow) === this.outerRows.length - 1" />
          </v-row>
        </template>
        <v-row class="mt-0 mb-5">
          <NewFilterButton :connection="outerConnection" @addFilter="newOuterGroupRule" />
        </v-row>

      </div>

      <v-row>
        <AdvancedSettings />
      </v-row>

      <v-row>
        <v-col>
        <v-btn color="primary-darken-1" @click="getProgressStatus">
          <v-icon color="white" class="my-0 mr-2">mdi-check-outline</v-icon>
          Submit Context
        </v-btn>
          </v-col>
      </v-row>

    </v-container>
</template>

<script>
import StatusBox from "@/components/contexts/StatusBox.vue";
import ConnectorButton from "@/components/contexts/ConnectorButton.vue";
import FilterLine from "@/components/contexts/FilterLine.vue";
import ConnectorLine from "@/components/contexts/ConnectorLine.vue";
import NewFilterButton from "@/components/contexts/NewFilterButton.vue";
import AdvancedSettings from "@/components/contexts/AdvancedSettings.vue";
import { v4 as uuidv4 } from 'uuid';

export default {
  components: {AdvancedSettings, NewFilterButton, ConnectorLine, FilterLine, ConnectorButton, StatusBox},
  emits: ['data-changed'],
  props: {
    title: {
      type: String,
      required: true
    },
    content: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      contextName: "",
      contextNameMaxLength: [v => v.length <= 40 || 'Max 40 characters'],

      layers: ["Phenomics", "Metabolomics", "Proteomics"],
      layerValues: ["Layer 1", "Layer 2", "Layer 3"],
      selectedLayers: [],

      outerRows: ['group-0'],
      innerRows: [{group: 'group-0', id: uuidv4(), rule: []}],
      outerConnection: "OR",
      innerConnection: "AND",

      progressIcon: "mdi-clock-outline",
      progressStatus: "Waiting",
      participantNumber: "100",

      rules: {}
    };
  },
  methods: {
     changeButtonDirection() {
       this.outerConnection = this.outerConnection === "OR" ? "AND" : "OR";
        this.innerConnection = this.innerConnection === "AND" ? "OR" : "AND";
    },

    sendContextName() {
       this.$emit('data-changed', this.contextName)
    },

    newInnerGroupRule(action) {
      console.log(action);
      console.log(`Action: ${action.action}, Id: ${action.id}`);

      if (action.action === 'new') {
        // get the latest rule in the group and increment it by 1
        this.innerRows.push({group: action.group, id: uuidv4(), rule: []});
      } else {
        try {
          if (this.innerRows.filter(data => data.group === action.group).length === 1) {
            const removeElement = this.innerRows.filter(data => data.group === action.group)[0];
            this.innerRows.splice(this.innerRows.indexOf(removeElement), 1);
            this.outerRows.splice(this.outerRows.indexOf(action.group), 1);
          } else {
            const removeElement = this.innerRows.filter(data => data.id === action.id)[0];
            this.innerRows.splice(this.innerRows.indexOf(removeElement), 1);
          }
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
      console.log(this.innerRows);
    },

    fetchParticipants(params) {
      // Fetch participants from API
      this.participantNumber = "200";
    },

    async getProgressStatus() {
      // sleep for 2 seconds
      const sleep = ms => new Promise(r => setTimeout(r, ms));

      await sleep(2000);

      const isDone = false;
      if (isDone) {
        this.progressStatus = "Completed";
        this.progressIcon = "mdi-check-circle-outline";
      } else {
        this.progressStatus = "0% done lol";
        this.progressIcon = "mdi-autorenew";
      }
    },

    addToRules(data) {
      this.rules = data;
    }
  },
  computed: {
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