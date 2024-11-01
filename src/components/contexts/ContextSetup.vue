<template>
    <v-container>
      <!--First row (name & layers) -->
        <v-row class="py-1">
          <v-col cols="3">
            <p><b>Context name</b></p>
          </v-col>
          <v-col cols="3">
            <p><b>Select layers</b></p>
          </v-col>
        </v-row>
        <v-row justify="space-between">
            <v-col cols="3">
                <v-text-field
                    outlined
                    density="compact"
                    variant="outlined"
                    v-model="contextName"
                    required
                ></v-text-field>
            </v-col>

            <v-col cols="3">
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

          <v-col cols="auto">
              <StatusBox
                  title="Completed"
                  subtitle="Progress"
                  icon="mdi-check-circle-outline" />
          </v-col>

          <v-col cols="auto">
            <StatusBox
            title="100"
            subtitle="Participants"
            icon="mdi-account-multiple-outline"
            />
          </v-col>
        </v-row>

      <!-- Second row (connectors) -->
        <v-row>
          <div class="mx-3">
            <p><b>Define Rules for Context</b></p>
          </div>
        </v-row>

      <v-row align="center" >
          <v-col cols="2">
            <p>Inner Operator / Connector</p>
          </v-col>
          <v-col cols="1">
            <ConnectorButton :connection="buttonDirection[0]" @click="changeButtonDirection"></ConnectorButton>
          </v-col>
          <v-col cols="2">
            <p>Outer Operator / Connector</p>
          </v-col>
          <v-col cols="1">
            <ConnectorButton :connection="buttonDirection[1]" @click="changeButtonDirection"></ConnectorButton>
          </v-col>
        </v-row>

      <!-- Thrid row (variables) -->
      <v-row>
        <v-col cols="3">
          <p><b>Variable</b></p>
        </v-col>
        <v-col cols="3">
          <p><b>Operator</b></p>
        </v-col>
        <v-col cols="3">
          <p><b>Value</b></p>
        </v-col>
      </v-row>

      <v-row class="my-1">
        <FilterLine :connection="buttonDirection[2]" />
      </v-row>

      <v-row>
            <v-col class="d-flex justify-center">
                <v-divider class="my-4" style="width: 50%;"></v-divider>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import StatusBox from "@/components/contexts/StatusBox.vue";
import ConnectorButton from "@/components/contexts/ConnectorButton.vue";
import FilterLine from "@/components/contexts/FilterLine.vue";

export default {
  components: {FilterLine, ConnectorButton, StatusBox},
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
      layers: ["Layer 1", "Layer 2", "Layer 3"],
      layerValues: ["Layer 1", "Layer 2", "Layer 3"],
      selectedLayers: [],

      buttonDirection: ['AND', 'OR', "AND"]
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
    }
  }
};
</script>