<template>
<v-btn
class="conn-button"
:color="buttonColor"
> {{ connection }}</v-btn>
</template>

<script>
export default {
  name: 'ConnectorButton',
  props: {
    connection: {
      type: Object,
      required: true
    }
  },
  computed: {
    buttonColor() {
      return this.connection === 'AND' ? '#adbfd3' : '#23425b';
    }
  }
}
</script>


<style>
.conn-button {
  margin: 5px;
  background-color: #f5f5f5;
  border: 1px solid #333;
  border-radius: 10px;
  height: 10px;
  padding: 5px 10px;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
}
</style>