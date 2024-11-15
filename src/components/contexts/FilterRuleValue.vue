<template>
  <v-combobox
    v-if="valueComponent === 'combobox'"
    v-model="selectedValue"
    :items="possibleValues"
    density="compact"
    variant="outlined"
    @update:model-value="updateData"
    ></v-combobox>
  <v-select
      v-if="valueComponent === 'select'"
    v-model="selectedValue"
    :items="possibleValues"
    variant="outlined"
    chips
    multiple
    density="compact"
  ></v-select>
  <template v-if="valueComponent === 'num-text'">
    <div class="d-flex align-center" style="width: 100%">
    <v-text-field
      v-model="selectedValue[0]"
      type="number"
      :rules="[v => v >= possibleValues[0] || `No values less than ${possibleValues[0]}`]"
      variant="outlined"
      density="compact"
      @update:model-value="updateData">
    </v-text-field>
     <v-divider color="primary-darken-1" class="mx-2 mb-4" thickness="5" style="max-width: 100px"></v-divider>
    <v-text-field
      v-model="selectedValue[1]"
      type="number"
      :rules="[v => v <= possibleValues[1] || `No values greater than ${possibleValues[1]}`]"
      variant="outlined"
      density="compact"
      @update:model-value="updateData">
    </v-text-field>
    </div>
  </template>
</template>


<script>

export default {
  name: 'FilterRuleValue',
  emits: ['update:modelValue'],
  props: {
    valueComponent: {
      type: String,
      default: 'combobox'
    },
    possibleValues: {
      type: Array,
      default: () => []
    },
    preselectedValue: {
      type: [String, Array],
      default: () => []
    }
  },

  data() {
    return {
      selectedValue: this.getInitialValue(this.valueComponent)
    }
  },
  watch: {
    valueComponent(newVal) {
      this.selectedValue = this.getInitialValue(newVal);
      this.updateData();
    },
    preselectedValue(newVal) {
      this.selectedValue = newVal;
      this.updateData();
    }
  },
  methods: {
    getInitialValue(component) {
      if (component === 'combobox') {
        return this.preselectedValue ?? '';
      } else if (component === 'select') {
        return this.preselectedValue ?? [];
      } else if (component === 'num-text') {
        return this.preselectedValue ?? [0, 100];
      }
      return null;
    },
    updateData() {
      this.$emit('update:modelValue', this.selectedValue)
    }
  }
}

</script>

<style scoped>

</style>