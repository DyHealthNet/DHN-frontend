<template>
<v-col cols="3" class="filter-padding">
  <v-autocomplete
    v-model="columnName"
    :items="filteredColumnItems"
    :item-title="identifier => meta(identifier).title"
    :readonly="disableSelections"
    density="compact"
    variant="outlined"
    :menu-props="{maxWidth: 520, minWidth: 340}"
    @update:model-value="updateData"
    @update:search="onSearch"
    >
    <!-- Same row layout as the network page's node dropdown and the Data Overview plot
         selectors: type icon, "display name (id)", description underneath. Items stay
         plain identifier strings, so the rule's saved `column` is unchanged. -->
    <template v-slot:item="{ props: itemProps, item }">
      <v-list-item
          v-bind="itemProps"
          :title="meta(item.value).title"
          :subtitle="meta(item.value).description || undefined"
      >
        <template v-slot:prepend>
          <v-img
              v-if="meta(item.value).layer"
              :src="getIcon(meta(item.value).layer)"
              :alt="meta(item.value).layer"
              width="28"
              height="28"
              max-width="28"
              max-height="28"
              class="me-3 rounded-circle flex-grow-0"
          ></v-img>
        </template>
        <template v-slot:append>
          <span class="text-caption text-medium-emphasis ms-4">{{ meta(item.value).type }}</span>
        </template>
      </v-list-item>
    </template>
    </v-autocomplete>
</v-col>
  <v-col cols="2" class="filter-padding">
  <v-select
    v-model="selectedOperator"
    :items="availableOperators"
    :readonly="disableSelections"
    density="compact"
    variant="outlined"
    @update:model-value="updateData"
    ></v-select>
</v-col>
  <v-col cols="4" class="filter-padding d-flex">
    <FilterRuleValue :value-component="valueComponent"
                     :possible-values="possibleValues"
                     :disable-selections="disableSelections"
                     v-model:selectedValue="selectedValue"
                      @update:selectedValue="newData"
                     />
</v-col>
  <v-col cols="1" class="center-button">
    <v-btn
        v-if="enableConnector"
        :readonly="disableSelections"
        class="center-button"
    :color="connectCol"
    @click="handleClick({action: 'new', id: this.ruleId, group: this.ruleGroup})"
    >
      <v-icon
          :color="iconCol"
          size="19"
          class="justify-center my-0 mr-2"
      >mdi-plus-circle-outline</v-icon>
      {{ connection }}
    </v-btn>
  </v-col>
    <v-col cols="1" class="mx-0 d-flex center-graph">
    <VariableHistogram :bar-data="histogramData" />
  </v-col>
  <v-col cols="1" class="center-icon">
    <v-btn icon="mdi-close"
           density="comfortable"
           :disabled="disableSelections"
            color="error"
            @click="handleClick({action: 'delete', onlyRule: this.onlyRule, id: this.ruleId, group: this.ruleGroup})">
           </v-btn>

  </v-col>
</template>

<script>
import {computed, toRefs} from "vue";
import FilterRuleValue from "@/components/contexts/FilterRuleValue.vue";
import VariableHistogram from "@/components/contexts/VariableHistogram.vue";
import {BASE_URL} from "@/components/constants.js";
import {getNodeIcon} from "@/components/network/networkData.js";

export default  {
  name: 'FilterLine',
  components: {VariableHistogram, FilterRuleValue},
  emits: ['button-clicked', 'data-changed', 'column-type'],
  props: {
    allVariables: {
      type: Object,
      required: false,
      default: () => ({})
    },
    // identifier -> selector item, for display only (see ContextSetup's variableMeta).
    // The rule's `column` stays the identifier string.
    variableMeta: {
      type: Object,
      required: false,
      default: () => ({})
    },
    connection: {
      type: String,
      default: 'AND'
    },
    onlyRule: {
      type: Boolean,
      default: false
    },
    disableSelections: {
      type: Boolean,
      default: false,
    },
    ruleGroup: {
      type: String,
      required: true
    },
    enableConnector: {
      type: Boolean,
      default: true
    },
    ruleId: {
      type: String,
      required: true,
    },
    rule: {
      type: Object,
    },
  },
  data() {
    return {
      searchQuery: '',
      reverseAllVariables: {},
      columnType: "combobox",
      prevColumnName: "",
      columnName: "",
      columnItems: [],
      selectedOperator: "",
      prevSelectedOperator: "",
      operators: [
          'equals (=)',
          'unequals (!=)',
          'less than (<)',
          'more than (>)',
          'in',
          'in range'
      ],
      selectedValue: "",
      possibleValues: [],

      ComponentTypes: ['combobox', 'select', 'num-text'],
      valueComponent: 'combobox',

      histogramData: {values: [], labels: [], type: 'bar'},
    };
  },
  methods: {
    // Display fields for one identifier; anything missing from the catalog still renders
    // as its bare identifier rather than an empty row.
    meta(identifier) {
      return this.variableMeta[identifier] ?? {title: identifier};
    },

    getIcon(layer) {
      return getNodeIcon(layer);
    },

    handleClick(action) {
      if (action.action === 'delete' && this.onlyRule) {
        this.columnName = "";
        this.selectedOperator = "";
        this.selectedValue = "";
        this.changeColumnType();
      }
      this.$emit('button-clicked', action);
    },

    newData(value) {
      this.selectedValue = value;
      this.updateData();
    },

    updateData() {
      if (this.selectedOperator && this.selectedOperator !== this.prevSelectedOperator) {
        this.changeColumnType()
        this.prevSelectedOperator = this.selectedOperator;
      }

      if (this.columnName && this.columnName !== this.prevColumnName) {
        this.getAvailableValues();
        this.prevColumnName = this.columnName;
      }

      // first check if all fields are filled, if not return.
      // The empty multi-select ('in' with nothing picked) is its own case: it's an empty
      // ARRAY, which is truthy and never equals "", so it slips past every other clause
      // here. It used to be checked as `selectedValue === []`, which compares references
      // and is therefore false for every input. Letting it through emitted a rule whose
      // backend form is isin([]) - false for every row - so the context silently came
      // back with zero participants instead of the row counting as unfinished.
      if (this.columnName === "" || this.selectedOperator === "" || this.selectedValue === ""
          || !this.selectedValue || !this.columnName || !this.selectedOperator
          || (Array.isArray(this.selectedValue) && this.selectedValue.length === 0)) {
        return;
      }

      this.$emit('data-changed', {
        ruleId: this.ruleId,
        column: this.columnName,
        operator: this.selectedOperator,
        value: this.selectedValue
      });
    },

    onSearch(query) {
      this.searchQuery = query;
    },

    changeColumnType() {
      // column Type needs to be one of value, range or category.
      // possibleValues is left alone when it's empty: it's filled by getAvailableValues()
      // with the column's real {value, label} entries, and an empty dropdown while that's
      // in flight is far better than the placeholder lists that used to be seeded here
      // ('a'..'k' / '0'..'10' / [0, 100]). Those were selectable and bare strings rather
      // than {value, label} objects, so picking one wrote a value into the rule that
      // matches nothing in the data (see OPERATORS in network/contexts/contexts.py).
      if (this.selectedOperator === 'in range') {
        this.columnType = "range";
        this.valueComponent = 'num-text';
        // Default the bounds to the column's full [min, max], but never over a value that
        // is already a valid range - a restored rule's saved bounds have to survive
        // getAvailableValues() having populated possibleValues before this runs.
        const isRangePair = Array.isArray(this.selectedValue) && this.selectedValue.length === 2
            && this.selectedValue.every(bound => bound !== null && bound !== '' && !isNaN(Number(bound)));
        if (this.possibleValues.length > 0 && !isRangePair) {
          this.selectedValue = this.possibleValues;
        }
      } else if (this.selectedOperator === 'in') {
        this.columnType = "category";
        this.valueComponent = 'select';
      } else {
        this.columnType = "value";
        this.valueComponent = 'combobox';
      }
      this.$emit('column-type', this.columnType);
    },

    getHistogramData(distribution, type) {
      let labels = distribution.labels.map(value => {
        let label = this.possibleValues.find(val => String(val.value) === value);
        return label ? label.label : value;
      });
      console.log("mapped values");
      console.log(labels);
      this.histogramData = {
        values: distribution.values,
        labels: labels,
        type: type || 'bar'
      }
    },

    async getAvailableValues() {
      let variableId;
      if (this.columnName.includes('(')) {
        variableId = this.columnName.split('(').at(-1).split(')')[0];
      } else {
        variableId = this.columnName.split("/")[0].trim();
      }

      let url = new URL(`${BASE_URL}/context/api/singleVariableInfo`);
      url.search = new URLSearchParams({variableId: variableId}).toString();

      // Failures leave possibleValues empty (an empty dropdown) rather than throwing -
      // created() awaits this now, and a failed lookup shouldn't take the whole rule row
      // down with it.
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Variable info request failed with ${response.status}`);
        }

        const data = await response.json();
        this.possibleValues = data.result ?? [];
        if (data.distribution) {
          this.getHistogramData(data.distribution, data.type);
        }
      } catch (error) {
        console.error("Could not load values for", variableId, error);
        this.possibleValues = [];
      }
    }
  },
  computed:{
    connectCol() {
      return this.connection === 'AND' ? 'primary' : 'primary-darken-1';
    },
    iconCol() {
      return this.connection === 'AND' ? 'darken-1' : 'surface-light';
    },
    availableOperators() {
      const column = this.columnName;
      if (column in this.reverseAllVariables) {
        const variable = this.reverseAllVariables[column];
        switch (variable) {
          case 'binaryCategorical':
            return ['equals (=)', 'unequals (!=)', 'in'];
          case 'continuous':
            return ['less than (<)', 'more than (>)', 'in range'];
          case 'nonbinaryCategorical':
            return ['equals (=)', 'unequals (!=)', 'in'];
          default:
            return this.operators;
        }
      } else {
        return this.operators;
      }
    },

    filteredColumnItems() {
      let items;
      if (!this.searchQuery) {
        items = this.columnItems.slice(0, 100);
      } else {
        const needle = this.searchQuery.toLowerCase();
        // Matches the same three fields the network page's node typeahead searches
        // server-side (id, display name, description), plus the raw identifier so a
        // variable without catalog metadata is still findable.
        items = this.columnItems.filter(identifier => {
          const variable = this.variableMeta[identifier];
          return [identifier, variable?.id, variable?.displayName, variable?.description].some(
            field => field && String(field).toLowerCase().includes(needle)
          );
        });
      }

      // Whatever is currently selected has to stay in `items`, even when the 100-item cap
      // or the active search would drop it. Vuetify only applies item-title (and the #item
      // slot) to values it can find here - for anything else it renders the raw model
      // value, which for a restored rule means the bare identifier, i.e. the old
      // "description (id)" look with no icon or type.
      if (this.columnName && !items.includes(this.columnName)) {
        return [this.columnName, ...items];
      }
      return items;
    },
  },
  setup(props) {
  const { allVariables } = toRefs(props);

  const columnItems = computed(() => {
    return [...new Set(Object.values(allVariables.value).flat())];
  });

  const reverseAllVariables = computed(() => {
    return Object.entries(allVariables.value).reduce((acc, [key, value]) => {
      value.forEach(v => {
        acc[v] = key;
      });
      return acc;
    }, {});
  });

  return { columnItems, reverseAllVariables };
  },
  async created() {
    if (this.rule) {
      // A brand-new row is created as `rule: {}` (see ContextSetup.newInnerGroupRule), so
      // these are all undefined there. FilterRuleValue declares selectedValue as a
      // required String|Array|Number|Object prop, so passing undefined through trips a
      // Vue prop type warning - keep the declared "" default instead.
      this.columnName = this.rule.column ?? "";
      this.selectedOperator = this.rule.operator ?? "";
      this.selectedValue = this.rule.value ?? "";
      // A restored rule (reopened or copied context) already has its column, but nothing
      // had ever fetched that column's real values here - updateData() is the only other
      // caller of getAvailableValues() and it doesn't run until the user edits the row.
      // Without this the value dropdown opened on placeholder data. prevColumnName is set
      // so the first updateData() doesn't refetch what we just loaded.
      if (this.columnName) {
        this.prevColumnName = this.columnName;
        await this.getAvailableValues();
      }
      this.changeColumnType();
    }
  }
};
</script>

<style scoped>

.center-button {
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 1px;
}
.center-icon {
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 5px;
}

.center-graph {
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 10px;
}

.filter-padding {
  padding-top: 1px;
  padding-bottom: 1px;
}

</style>