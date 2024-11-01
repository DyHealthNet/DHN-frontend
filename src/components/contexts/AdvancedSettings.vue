<template>

  <v-col>
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon color="black" size="30" class="mr-3 my-0">mdi-cog-outline</v-icon>
            <span>Advanced settings</span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <StatisticalTestLine />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-col>
</template>

<script>
import StatisticalTestLine from "@/components/contexts/StatisticalTestLine.vue";

export default {
  name: 'AdvancedSettings',
  components: {StatisticalTestLine},
  data() {
    return {
      continuousContinuous: false,
      categoricalCategorical: false,
      categoricalContinuous: false,
      binaryCategories: false,
      twoCategories: false,
    };
  },
};
</script>