<template>
  <v-col>
  <v-btn
          class="center-button"
      :color="connectCol"
      @click="printValue"
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
      return this.connection === 'AND' ? '#adbfd3' : '#23425b';
    },
    iconCol() {
      return this.connection === 'AND' ? 'black' : 'white';
    },
  }
}

</script>

<style scoped>

</style>