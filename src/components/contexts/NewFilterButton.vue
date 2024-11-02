<template>
  <v-col>
  <v-btn
      class="center-button"
      :color="connectCol"
      @click="$emit('addFilter')"
      >
        <v-icon
            :color="iconCol"
            size="19"
            class="justify-center my-0 mr-2"
        >mdi-plus-circle-outline</v-icon>
        {{ connection }}
      </v-btn>
    </v-col>
</template>

<script>
export default {
  name: "NewFilterButton",
  emits: ['addFilter'],
  props: {
    connection: {
      type: String,
      required: true,
    },
  },
  data() {
    return {

    };
  },
  computed: {
    connectCol() {
      return this.connection === 'AND' ? 'primary' : 'primary-darken-1';
    },
    iconCol() {
      return this.connection === 'AND' ? 'black' : 'white';
    },
  }
}

</script>

<style scoped>

</style>