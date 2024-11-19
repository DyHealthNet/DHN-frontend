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
    @update:model-value="updateData"
  >
    <template v-slot:prepend-item>
      <v-list-item
        title="Select All"
        @click="toggleAll"
      >
        <template v-slot:prepend>
          <v-checkbox-btn
            :color="selectedValue.length > 0 ? 'grey' : undefined"
            :indeterminate="selectedValue.length > 0 && selectedValue.length < possibleValues.length"
            :model-value="selectedValue.length === possibleValues.length"
          ></v-checkbox-btn>
        </template>
      </v-list-item>

      <v-divider class="mt-2"></v-divider>
    </template>

  </v-select>
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
    }
  },
  methods: {
    getInitialValue(component) {
      // the problem here is the preselected value will get chosen even if the user changes the component, meaning it
      // will create visual bugs
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
      this.$emit('update:modelValue', {value: this.selectedValue})
    },
    toggleAll() {
      if (this.selectedValue.length === this.possibleValues.length) {
        this.selectedValue = [];
      } else {
        this.selectedValue = this.possibleValues;
      }
      this.updateData();
    }
  }
}

</script>

<style scoped>

</style>