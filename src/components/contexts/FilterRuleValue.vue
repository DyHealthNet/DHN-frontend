<template>
  <v-combobox
    v-if="valueComponent === 'combobox'"
    v-model="localSelectedValue"
    :items="possibleValues"
    density="compact"
    variant="outlined"
    item-title="label"
    ></v-combobox>

  <v-select
    v-if="valueComponent === 'select'"
    v-model="localSelectedValue"
    :items="possibleValues"
    variant="outlined"
    chips
    multiple
    density="compact"
    item-title="label"
    return-object
    >
    <template v-slot:prepend-item>
      <v-list-item
        title="Select All"
        @click="toggleAll"
      >
        <template v-slot:prepend>
          <v-checkbox-btn
            :color="localSelectedValue.length > 0 ? 'grey' : undefined"
            :indeterminate="localSelectedValue.length > 0 && localSelectedValue.length < possibleValues.length"
            :model-value="localSelectedValue.length === possibleValues.length"
          ></v-checkbox-btn>
        </template>
      </v-list-item>

      <v-divider class="mt-2"></v-divider>
    </template>
  </v-select>

  <template v-if="valueComponent === 'num-text'">
    <div class="d-flex align-center" style="width: 100%">
    <v-text-field
      v-model.number="lowerBound"
      type="number"
      :rules="[v => v >= possibleValues[0] || `No values less than ${possibleValues[0]}`]"
      variant="outlined"
      density="compact"
     >
    </v-text-field>
     <v-divider color="primary-darken-1" class="mx-2 mb-4" thickness="5" style="max-width: 100px"></v-divider>
    <v-text-field
      v-model.number="upperBound"
      type="number"
      :rules="[v => v <= possibleValues[1] || `No values greater than ${possibleValues[1]}`]"
      variant="outlined"
      density="compact"
    >
    </v-text-field>
    </div>
  </template>
</template>


<script>

export default {
  name: 'FilterRuleValue',
  emits: ['update:selectedValue'],
  props: {
    valueComponent: {
      type: String,
      default: 'combobox'
    },
    possibleValues: {
      type: Array,
      default: () => []
    },
    selectedValue: {
      type: [String, Array, Number],
      required: true
    }
  },

  data() {
    let lower = 0;
    let upper = 1;
    if (this.valueComponent === 'num-text' && this.selectedValue) {
      lower = this.selectedValue[0];
      upper = this.selectedValue[1];
    }
    return {
      localSelectedValue: this.selectedValue || this.getInitialValue(this.valueComponent),
      lowerBound: lower,
      upperBound: upper
    }
  },
  watch: {
    selectedValue(newVal) {
      if (this.valueComponent === 'num-text') {
        this.lowerBound = this.selectedValue[0];
        this.upperBound = this.selectedValue[1];
      }
    },
    lowerBound: 'updateSelectedValue',
    upperBound: 'updateSelectedValue'
  },
  methods: {
    getInitialValue(component) {
      // the problem here is the preselected value will get chosen even if the user changes the component, meaning it
      // will create visual bugs
      if (component === 'combobox') {
        return '';
      } else if (component === 'select') {
        return [];
      } else if (component === 'num-text') {
        return [0, 1];
      }
      return null;
    },
    toggleAll() {
      if (this.localSelectedValue.length === this.possibleValues.length) {
        this.$emit('update:selectedValue', []);
        this.localSelectedValue = [];
      } else {
        this.$emit('update:selectedValue', this.possibleValues);
        this.localSelectedValue = this.possibleValues;
      }
    },
    updateSelectedValue() {
      this.$emit('update:selectedValue', [this.lowerBound, this.upperBound])
    }
  },
  computed: {
    localSelectedValue: {
      get() {
        if (this.selectedValue) {
          return this.selectedValue;
        }
        return this.getInitialValue(this.valueComponent);
      },
      set(value) {
        this.$emit('update:selectedValue', value);
      }
    }
  }
}

</script>

<style scoped>

</style>