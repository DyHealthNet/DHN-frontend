<template>
  <tr>
    <td>{{ formattedKey1 }}</td>
    <td>{{ formattedKey2 }}</td>
    <td>{{ formattedValue }}</td>
  </tr>
</template>

<script>
export default {
  props: {
    keyName: String, // Rename 'key' to 'keyName'
    value: [String, Number],
    sep: String
  },
  computed: {
    // Split keyName by "_" and take the first and third parts (index 0 and index 2)
    formattedKey1() {
      const splitKey = this.keyName.split(this.sep);
      if (splitKey[0]) {
        // Capitalize the first letter only
        return splitKey[0].charAt(0).toUpperCase() + splitKey[0].slice(1);
      }
      return ''; // Return empty string if no first part
    },
    formattedKey2() {
      const splitKey = this.keyName.split(this.sep);
      return splitKey[1] ? splitKey[1] : ''; // Third element, unchanged
    },
    formattedValue() {
      if (typeof this.value === 'number') {
        return this.value.toPrecision(3); // Format numbers
      }
      return this.value; // Default case
    },
  },
};
</script>

<style scoped>
.label {
  font-size: 12px;
  color: rgb(var(--v-theme-primary-darken-1));
}

.value {
  padding-left: 0px; /* Adjust the value as needed */
}
</style>