<template>
<v-col cols="3">
  <v-autocomplete
    v-model="columnName"
    :items="columnItems"
    density="compact"
    variant="outlined"
    ></v-autocomplete>
</v-col>
  <v-col cols="3">
  <v-select
    v-model="selectedOperator"
    :items="operators"
    density="compact"
    variant="outlined"
    ></v-select>
</v-col>
  <v-col cols="3">
  <v-combobox
    v-model="selectedValue"
    :items="possibleValues"
    density="compact"
    variant="outlined"
    ></v-combobox>
</v-col>
  <v-col class="center-button">
    <v-btn
    :color="connectCol"
    @click="printValue"
    >
      <v-icon
          color="white"
          size="19"
          class="justify-center my-1 mr-2"
      >mdi-plus-circle-outline</v-icon>
      {{ connector }}
    </v-btn>
  </v-col>
  <v-col>
      <v-icon color="black" size="25" class="my-1 center-button" @click="printValue">mdi-close-circle-outline</v-icon>
  </v-col>
</template>

<script>
export default {
  name: 'FilterLine',
  props: {
    connector: {
      type: String,
      default: 'AND'
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
          'is (=)',
          'less than (<)',
          'greater than (>)',
          'in'
      ],
      selectedValue: "",
      possibleValues: [
          'Male',
          'Female'
      ],
      connectCol: this.connector === 'AND' ? '#adbfd3' : '#23425b'
    };
  },
  methods: {
    printValue() {
      console.log(this.columnName, this.selectedOperator, this.selectedValue);
    }
  }
};
</script>

<style scoped>

.center-button {
  padding-top: 8px;
}
</style>