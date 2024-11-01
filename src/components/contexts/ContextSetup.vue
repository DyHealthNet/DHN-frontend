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
                  title="Completed"
                  subtitle="Progress"
                  icon="mdi-check-circle-outline" />
          </v-col>

          <v-col cols="auto" class="filter-padding">
            <StatusBox
            title="100"
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
            <ConnectorButton :connection="buttonDirection[0]" @click="changeButtonDirection"></ConnectorButton>
          </v-col>
          <v-col cols="2" class="filter-padding">
            <p>Outer Operator / Connector</p>
          </v-col>
          <v-col cols="1" class="filter-padding">
            <ConnectorButton :connection="buttonDirection[1]" @click="changeButtonDirection"></ConnectorButton>
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

      <div>
        <v-row class="my-1">
          <FilterLine :connection="buttonDirection[2]" :first="true" />
        </v-row>

        <v-row class="my-0">
          <ConnectorLine :inner="true" :connection="buttonDirection[3]" />
        </v-row>

        <v-row class="my-1">
          <FilterLine :connection="buttonDirection[4]" />
        </v-row>

        <v-row class="mt-0 mb-5">
          <NewFilterButton :connection="buttonDirection[7]"  />
        </v-row>
      </div>

      <v-row>
        <AdvancedSettings />
      </v-row>

      <v-row>
        <v-col>
        <v-btn color="primary-darken-1">
          <v-icon color="white" class="my-0">mdi-check-outline</v-icon>
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

export default {
  components: {AdvancedSettings, NewFilterButton, ConnectorLine, FilterLine, ConnectorButton, StatusBox},
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

      buttonDirection: ['AND', 'OR', "AND", "AND", 'AND', 'AND', 'AND', 'OR']
    };
  },
  methods: {
     changeButtonDirection() {
       this.buttonDirection.forEach((button, index) => {
         if (button === "AND") {
           this.buttonDirection[index] = "OR";
         } else if (button === "OR") {
           this.buttonDirection[index] = "AND";
         }
       });
    },
    sendContextName() {
       this.$emit('data-changed', this.contextName)
    }
  },
  computed: {
    changeInner() {
      return this.buttonDirection[0] === 'AND';
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