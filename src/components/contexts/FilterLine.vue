<template>
<v-col cols="3" class="filter-padding">
  <v-autocomplete
    v-model="columnName"
    :items="columnItems"
    density="compact"
    variant="outlined"
        @update:model-value="updateData"
    ></v-autocomplete>
</v-col>
  <v-col cols="2" class="filter-padding">
  <v-select
    v-model="selectedOperator"
    :items="operators"
    density="compact"
    variant="outlined"
    @update:model-value="updateData"
    ></v-select>
</v-col>
  <v-col cols="4" class="filter-padding">
  <v-combobox
    v-model="selectedValue"
    :items="possibleValues"
    density="compact"
    variant="outlined"
        @update:model-value="updateData"

    ></v-combobox>
</v-col>
  <v-col class="center-button">
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
  <v-col class="center-icon">
      <v-icon v-if="!first"
              color="black"
              size="25"
              class="my-1 center-icon custom-hover"
              @click="handleClick({action: 'delete', id: this.ruleId, group: this.ruleGroup})">
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
        'BCL2-like 1 protein (x0so5385)',
        'Histamine'
      ],
      selectedOperator: "",
      operators: [
          'equals (=)',
          'less than (<)',
          'more than (>)',
          'in'
      ],
      selectedValue: "",
      possibleValues: [
          '0',
          '1'
      ]
    };
  },
  methods: {
    handleClick(action) {
      this.$emit('button-clicked', action);
    },
    updateData() {
      // first check if all fields are filled, if not return
      if (this.columnName === "" || this.selectedOperator === "" || this.selectedValue === "") {
        return;
      }
      this.$emit('data-changed', {
        ruleId: this.ruleId,
        column: this.columnName,
        operator: this.selectedOperator.substring(0, 5).trim(),
        value: Number(this.selectedValue)
      });
    },
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

.custom-hover {
  filter: brightness(20%);
  transition: box-shadow 0.3s ease;
}

.custom-hover:hover {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
}

</style>