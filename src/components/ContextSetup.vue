<template>
    <v-container>
        <v-row justify="space-between">
            <v-col cols="3">
                <v-text-field
                    label="Context Name"
                    outlined
                    density="compact"
                    solo
                    v-model="contextName"
                    required
                ></v-text-field>
            </v-col>

            <v-col cols="3">
              <v-select
                v-model="selectedLayers"
                :items="layers"
                chips
                label="Select layers"
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
            icon="mdi-account-multiple"
            />
          </v-col>
        </v-row>

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
            <ConnectorButton connection="AND"></ConnectorButton>
          </v-col>
          <v-col cols="2">
            <p>Outer Operator / Connector</p>
          </v-col>
          <v-col cols="1">
            <ConnectorButton connection="OR"></ConnectorButton>
          </v-col>
        </v-row>

      <v-row>
            <v-col class="d-flex justify-center">
                <v-divider class="my-4" style="width: 50%;"></v-divider>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import StatusBox from "@/components/StatusBox.vue";
import ConnectorButton from "@/components/ConnectorButton.vue";

export default {
  components: {ConnectorButton, StatusBox},
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
      selectedLayers: []
    };
  },
  methods: {
  }
};
</script>