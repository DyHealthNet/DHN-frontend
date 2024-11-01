<template>
  <v-col cols="1" class="filter-padding position-relative">
    <template v-if="inner">
      <div class="vertical-line-top"></div>
    </template>
    <v-btn :class="btnClasses" variant="flat" :color="buttonColor">{{ connection }}</v-btn>
    <template v-if="inner">
      <div class="vertical-line-bottom"></div>
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

.vertical-line-bottom {
  width: 4px;
  height: 20px;
  background-color: #D8EBFF;
  position: absolute;
  left: 41%;
  top: 60%;
  transform: translateX(-50%);
  z-index: 1;
}

.vertical-line-top {
  width: 4px;
  height: 20px;
  background-color: #D8EBFF;
  position: absolute;
  left: 41%;
  top: -70%;
  transform: translateX(-50%);
  z-index: 1;
}
</style>