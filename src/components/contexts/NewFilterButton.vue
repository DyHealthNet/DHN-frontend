<template>
  <v-col>
  <v-btn
      v-if = "!last"
      class="center-button"
      :color="connectCol"
      @click="$emit('addFilter')"
      >
        <v-icon
            v-if="!visualOnly"
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
    visualOnly: {
      type: Boolean,
      default: false,
    },
    last: {
      type: Boolean,
      default: false,
    }
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
      return this.connection === 'AND' ? 'primary-darken-1' : 'primary';
    },
  }
}

</script>

<style scoped>

</style>