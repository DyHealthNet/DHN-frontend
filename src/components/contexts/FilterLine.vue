<template>
<v-col cols="3" class="filter-padding">
  <v-autocomplete
    v-model="columnName"
    :items="columnItems"
    density="compact"
    variant="outlined"
    @change="updateData"
    ></v-autocomplete>
</v-col>
  <v-col cols="2" class="filter-padding">
  <v-select
    v-model="selectedOperator"
    :items="operators"
    density="compact"
    variant="outlined"
    @change="updateData"
    ></v-select>
</v-col>
  <v-col cols="4" class="filter-padding">
  <v-combobox
    v-model="selectedValue"
    :items="possibleValues"
    density="compact"
    variant="outlined"
    @change="updateData"
    ></v-combobox>
</v-col>
  <v-col class="center-button">
    <v-btn
        class="center-button"
    :color="connectCol"
    @click="handleClick({action: 'new', id: rowId})"
    >
      <v-icon
          :color="iconCol"
          size="19"
          class="justify-center my-0 mr-2"
      >mdi-plus-circle-outline</v-icon>
      {{ connection }}
    </v-btn>
  </v-col>
  <v-col class="center-icon">
      <v-icon v-if="!first"
              color="black"
              size="25"
              class="my-1 center-icon"
              @click="handleClick({action: 'delete', id: rowId})">
        mdi-close-circle-outline</v-icon>
  </v-col>
</template>

<script>
export default {
  name: 'FilterLine',
  emits: ['button-clicked', 'data-changed'],
  props: {
    connection: {
      type: String,
      default: 'AND'
    },
    first: {
      type: Boolean,
      default: false
    },
    rowId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      columnName: "",
      columnItems: [
        'Sex (x0_sex)',
        'Food frequency: Meat (x0fd01)',
        'Type of diabetes (x0dm02)',
        'NEIL2 / Protein (x0so3291)',
        'Diabetes treatment (x0dm03)',
      ],
      selectedOperator: "",
      operators: [
          'equals (=)',
          'less than (<)',
          'greater than (>)',
          'in'
      ],
      selectedValue: "",
      possibleValues: [
          'Male',
          'Female'
      ]
    };
  },
  methods: {
    handleClick(action) {
      this.$emit('button-clicked', action);
    },
    updateData() {
      this.$emit('data-changed', {
        ruleId: this.rowId,
        columnName: this.columnName,
        selectedOperator: this.selectedOperator,
        selectedValue: this.selectedValue
      });
    }
  },
  computed:{
    connectCol() {
      return this.connection === 'AND' ? 'primary' : 'primary-darken-1';
    },
    iconCol() {
      return this.connection === 'AND' ? 'black' : 'white';
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

.filter-padding {
  padding-top: 1px;
  padding-bottom: 1px;
}

</style>