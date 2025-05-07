<template>
<v-btn
class="conn-button"
:color="buttonColor"
:readonly="disableSelections"
> {{ connection }}</v-btn>
</template>

<script>
export default {
  name: 'ConnectorButton',
  props: {
    connection: {
      type: String,
      required: true
    },
    disableSelections: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    buttonColor() {
      return this.connection === 'AND' ? 'primary' : 'primary-darken-1';
    }
  }
}
</script>


<style>
.conn-button {
  margin: 5px;
  border-radius: 10px;
  height: 10px;
  padding: 5px 10px;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
}
</style>