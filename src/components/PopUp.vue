<template>
  <v-snackbar v-model="popUpStore.showInfo" :color="popUpStore.infoType">
    <v-icon class="my-0 mr-2">mdi-information-outline</v-icon>
    {{ popUpStore.infoText }}
    <template v-slot:actions>
      <v-btn variant="text" @click="popUpStore.showInfo = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import {popUpStore} from "@/stores/popUpStore.js";
import {nodeInputStore} from "@/stores/nodeInputStore.js";

export default {
  name: 'PopUp',
  computed: {
    popUpStore() {
      return popUpStore(); // this makes this.store available
    },
  },
};
</script>