<template>
  <v-col cols="1" class="filter-padding d-flex flex-column align-center position-relative">
    <template v-if="inner">
      <div :class="`vertical-line-top ${connection === 'AND' ? 'light-background' : 'dark-background'}`"></div>
    </template>
    <v-btn :class="btnClasses" variant="flat" :color="buttonColor">{{ connection }}</v-btn>
    <template v-if="inner">
      <div :class="`vertical-line-bottom ${connection === 'AND' ? 'light-background' : 'dark-background'}`"></div>
    </template>
  </v-col>
</template>

<script>
export default {
  name: 'ConnectorLine',
  props: {
    connection: {
      type: String,
      required: true
    },
    inner: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      // add my-0 to button if inner is true
      btnClasses: {
        'my-0': this.inner,
        'elevated-button': true
      }

    }
  },
  computed: {
    buttonColor() {
      return this.connection === 'AND' ? 'primary' : 'primary-darken-1';
    }
  },
}

</script>

<style scoped>
.filter-padding {
  padding-top: 1px;
  padding-bottom: 1px;
}
.elevated-button {
  position: relative;
  top: -10px;
  z-index: 2;
}

.dark-background {
  background-color: rgb(var(--v-theme-primary-darken-1));
}
.light-background {
  background-color: rgb(var(--v-theme-primary));
}

.vertical-line-bottom {
  width: 4px;
  height: 20px;
  position: absolute;
  left: 50%;
  top: 60%;
  transform: translateX(-50%);
  z-index: 1;
}

.vertical-line-top {
  width: 4px;
  height: 20px;
  position: absolute;
  left: 50%;
  top: -70%;
  transform: translateX(-50%);
  z-index: 1;
}
</style>