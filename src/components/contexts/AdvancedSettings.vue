<template>

  <v-col>
    <v-expansion-panels variant="popout">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon color="primary-darken-1" size="30" class="mr-3 my-0">mdi-cog-outline</v-icon>
            <span>Advanced Settings</span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <StatisticalTestLine :selected-tests="selectedTests" @data-changed="updateData" />
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
  props: {
    selectedTests: {
      type: Object,
      required: false,
    },
  },
  methods: {
    updateData(data) {
      this.$emit('data-changed', data);
    },
  },
};
</script>

<style scoped>

</style>