<template>
  <v-autocomplete
      v-model="internalValue"
      v-model:search="searchQuery"
      :items="filteredItems"
      :readonly="disableSelections"
      multiple
      density="compact"
      variant="outlined"
      :placeholder="items.length ? 'Select variables...' : 'No variables available'"
  >
    <template v-slot:selection="{ index }">
      <span v-if="index === 0" class="text-body-2">
        {{ internalValue.length }} variable{{ internalValue.length === 1 ? '' : 's' }} selected
      </span>
    </template>
    <template v-slot:prepend-item>
      <v-list-item title="Select All" :disabled="disableSelections" @click="selectAll">
        <template v-slot:prepend>
          <v-icon>mdi-checkbox-multiple-marked-outline</v-icon>
        </template>
      </v-list-item>
      <v-list-item title="Deselect All" :disabled="disableSelections" @click="deselectAll">
        <template v-slot:prepend>
          <v-icon>mdi-checkbox-multiple-blank-outline</v-icon>
        </template>
      </v-list-item>
      <v-divider class="mt-2"></v-divider>
    </template>
  </v-autocomplete>
</template>

<script>
export default {
  name: 'VariableSelector',
  emits: ['update:modelValue'],
  props: {
    // full pool of selectable variable identifiers (already scoped by the caller - e.g.
    // to a single layer/sublayer)
    items: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
    disableSelections: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      searchQuery: '',
    };
  },
  computed: {
    internalValue: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
        // clear the typed search text after a pick, so the user isn't stuck manually
        // clearing it before searching for the next variable
        this.searchQuery = '';
      },
    },
    filteredItems() {
      if (!this.searchQuery) {
        return this.items.slice(0, 100);
      }
      return this.items.filter(item =>
          item.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
  },
  methods: {
    selectAll() {
      this.$emit('update:modelValue', [...this.items]);
    },
    deselectAll() {
      this.$emit('update:modelValue', []);
    },
  },
};
</script>
