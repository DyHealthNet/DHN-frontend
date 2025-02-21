<template>
<v-col cols="3" class="filter-padding">
  <v-autocomplete
    v-model="columnName"
    :items="filteredColumnItems"
    density="compact"
    variant="outlined"
    @update:model-value="updateData"
    @update:search="onSearch"
    ></v-autocomplete>
</v-col>
  <v-col cols="2" class="filter-padding">
  <v-select
    v-model="selectedOperator"
    :items="availableOperators"
    density="compact"
    variant="outlined"
    @update:model-value="updateData"
    ></v-select>
</v-col>
  <v-col cols="4" class="filter-padding d-flex">
    <FilterRuleValue :value-component="valueComponent"
                     :possible-values="possibleValues"
                     v-model:selectedValue="selectedValue"
                      @update:selectedValue="newData"
                     />
</v-col>
  <v-col cols="1" class="center-button">
    <v-btn
        v-if="enableConnector"
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
            color="error"
            @click="handleClick({action: 'delete', first: this.first, id: this.ruleId, group: this.ruleGroup})">
           </v-btn>

  </v-col>
</template>

<script>
import {computed, toRefs} from "vue";
import FilterRuleValue from "@/components/contexts/FilterRuleValue.vue";
import VariableHistogram from "@/components/contexts/VariableHistogram.vue";
import {BASE_URL} from "@/components/constants.js";

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
    connection: {
      type: String,
      default: 'AND'
    },
    first: {
      type: Boolean,
      default: false
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
    handleClick(action) {
      if (action.action === 'delete' && this.first) {
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

      // first check if all fields are filled, if not return
      if (this.columnName === "" || this.selectedOperator === "" || this.selectedValue === ""
          || !this.selectedValue || !this.columnName || !this.selectedOperator || this.selectedValue === []) {
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
      // column Type needs to be one of value, range or category
      if (this.selectedOperator === 'in range') {
        this.columnType = "range";
        this.valueComponent = 'num-text';
        if (this.possibleValues.length === 0) {
          this.possibleValues = [0, 100] // min and max values
        } else {
          this.selectedValue = this.possibleValues;
        }
      } else if (this.selectedOperator === 'in') {
        this.columnType = "category";
        this.valueComponent = 'select';
        if (this.possibleValues.length === 0) {
        this.possibleValues = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];
        }
      } else {
        this.columnType = "value";
        this.valueComponent = 'combobox';
        if (this.possibleValues.length === 0) {
          this.possibleValues = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        }
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

      await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          })
          .then(response => response.json())
          .then(data => {
            this.possibleValues = data.result;
            console.log(data);
            this.getHistogramData(data.distribution, data.type);
          })
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
            return ['equals (=)', 'in'];
          case 'continuous':
            return ['less than (<)', 'more than (>)', 'in range'];
          case 'nonbinaryCategorical':
            return ['equals (=)', 'in'];
          default:
            return this.operators;
        }
      } else {
        return this.operators;
      }
    },

    filteredColumnItems() {
      if (!this.searchQuery) {
        return this.columnItems.slice(0, 100);
      }
      return this.columnItems.filter(item =>
        item.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
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
  created() {
    if (this.rule) {
      this.columnName = this.rule.column;
      this.selectedOperator = this.rule.operator;
      this.selectedValue = this.rule.value;
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