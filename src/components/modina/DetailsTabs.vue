<template>
  <div>
    <!-- Title and name stay above the tabs: whichever tab is open, it has to stay obvious what
         the numbers belong to. -->
    <p><span class="label-title">{{ title }}</span></p>
    <p class="display-name text-center">{{ subtitle }}</p>

    <v-tabs v-model="tab" density="compact" color="primary-darken-1" class="mt-2">
      <v-tab value="general">General</v-tab>
      <v-tab value="plot">Plot</v-tab>
    </v-tabs>
    <v-window v-model="tab" class="mt-2">
      <v-window-item value="general" :transition="false" :reverse-transition="false">
        <slot name="general" />
      </v-window-item>
      <!-- Lazy on purpose (no `eager`): the plots fetch their own data, so a node or edge
           selected only to read its numbers never issues that request. The transitions are off
           because the slide measures the item's height mid-animation, which is wasted work for
           a panel that just swaps two blocks of content. -->
      <v-window-item value="plot" :transition="false" :reverse-transition="false">
        <slot name="plot" />
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
export default {
  name: 'DetailsTabs',
  props: {
    // 'Node' / 'Edge' -- what kind of thing the panel is describing.
    title: { type: String, required: true },
    // Its display name, e.g. a variable name or "A <-> B" for an edge.
    subtitle: { type: String, default: '' },
  },
  data() {
    return {
      // Which section is open ('general' | 'plot'). Deliberately not reset when the selection
      // changes, so clicking through several nodes keeps showing the same section.
      tab: 'general',
    };
  },
};
</script>

<style scoped>
.label-title {
  font-size: 24px;
  color: rgb(var(--v-theme-primary-darken-1));
  display: flex;
  justify-content: center;
  align-items: center;
}
.display-name {
  font-size: 18px;
  color: rgb(var(--v-theme-darken-1));
}
</style>
