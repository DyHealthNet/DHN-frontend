<template>
  <div>
    <p><strong style="font-size: 24px">Selected Edge</strong></p>
    <p><strong>Set:</strong> {{ edge.set }}</p>
    <p><strong>Node 0</strong></p>
    <p><strong>Display Name:</strong> {{ edge.node0_label }}</p>
    <p><strong>ID:</strong> {{ edge.to }}</p>
    <p><strong>Type:</strong> {{ edge.node0_type }}</p>
    <p><strong>Node 1</strong></p>
    <p><strong>Display Name:</strong> {{ edge.node1_label }}</p>
    <p><strong>ID:</strong> {{ edge.from }}</p>
    <p><strong>Type:</strong> {{ edge.node1_type }}</p>
    <p><strong>P Value:</strong> {{ edge.p_value.toPrecision(3) }}</p>
    <p><strong>Adjusted P Value:</strong> {{ edge.adjusted_p_value !== null ? edge.adjusted_p_value.toPrecision(3) : 'null' }}</p>
    <p><strong>Effect Size:</strong> {{ edge.effect_size.toPrecision(3) }}</p>
    <p><strong>Effect Size Type:</strong> {{ capitalizeFirstLetter(edge.effect_size_type) }}</p>
  </div>
</template>

<script>
export default {
  props: {
    edge: Object,
  },
  methods: {
    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
  },
};
</script>

<style scoped>
.label {
  font-size: 12px;
  color: rgb(var(--v-theme-primary-darken-1));
}

.display-name {
  font-size: 18px; /* Larger text size */
  color: black;
}
.value {
  text-indent: 20px; /* Adjust the value as needed */
}
</style>