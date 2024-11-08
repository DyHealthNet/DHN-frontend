<template>

  <v-col>
    <v-expansion-panels variant="popout">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon color="black" size="30" class="mr-3 my-0">mdi-cog-outline</v-icon>
            <span>Advanced settings</span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <StatisticalTestLine @data-changed="updateData" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-col>
</template>

<script>
import StatisticalTestLine from "@/components/contexts/StatisticalTestLine.vue";

export default {
  name: 'AdvancedSettings',
  emits: ['data-changed'],
  components: {StatisticalTestLine},
  methods: {
    updateData(data) {
      this.$emit('data-changed', data);
    },
  },
};
</script>

<style scoped>
.v-expansion-panel-title:hover {
  background-color: initial !important;
}
.v-expansion-panel {
  color: #22425B !important;
}

.v-expansion-panel-title--active {
  background-color: #ffffff !important;
  color: #000 !important;
}

</style>