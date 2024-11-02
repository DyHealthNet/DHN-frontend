<template>
  <v-container class="text-center">
    <v-row>
      <v-col>
        <h1 class="title mt-4">Create a custom context</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col class="d-flex justify-center">
        <v-divider class="my-2" thickness="2"></v-divider>
      </v-col>
    </v-row>
  </v-container>

  <v-container class="d-flex justify-center mt-4">
    <v-card class="outlined-card">
      <v-tabs v-model="contextTab" align-tabs="center">
        <v-tab v-for="tab in tabs" :key="tab.value" :text="tab.name" :value="tab.value"></v-tab>
      </v-tabs>
      <v-tabs-window v-model="contextTab">
        <v-tabs-window-item v-for="tab in tabs" :key="tab.value" :value="tab.value">
          <v-card color="background">
            <v-card-text>
              <template v-if="tab.value === 1">
                <v-row>
                  <ContextSetup :title="tab.name" :content="tab.content" @data-changed="updateTabName" />
                </v-row>
              </template>

              <template v-if="tab.value === 2">
                <v-row>
                  <ContextSetup :title="tab.name" :content="tab.content" @data-changed="updateTabName" />
                </v-row>
              </template>

              <template v-if="tab.value === 3">
                <v-row>
                  <ContextSetup :title="tab.name" :content="tab.content" @data-changed="updateTabName" />
                </v-row>
              </template>

              <template v-if="tab.value === 4">
                <v-row>
                  <ContextSetup :title="tab.name" :content="tab.content" @data-changed="updateTabName" />
                </v-row>
              </template>

              <template v-if="tab.value === 5">
                <v-row>
                  <ContextSetup :title="tab.name" :content="tab.content" @data-changed="updateTabName" />
                </v-row>
              </template>
            </v-card-text>
          </v-card>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </v-container>
</template>

<script>

import ContextSetup from "@/components/contexts/ContextSetup.vue";

export default {
  name: "ContextCreation",
  components: {
    ContextSetup
  },
  data() {
    return {
      contextTab: 1,
      tabs: [
        { name: "Context 1", value: 1, content: { inside: 'or', outside: 'and' } },
        { name: "Context 2", value: 2, content: { inside: 'and', outside: 'or' } },
        { name: "Context 3", value: 3, content: null },
        { name: "Context 4", value: 4 },
        { name: "Context 5", value: 5 }],
    };
  },
  methods: {
    updateTabName(tabName) {
      console.log(this.contextTab);
      let newTabName = "";
      if (tabName.length > 15) {
        newTabName = tabName.substring(0, 15) + "...";
      }
      else {
        newTabName = tabName;
      }
      this.tabs[this.contextTab - 1].name = newTabName;
    },
  },
};
</script>

<style scoped>
.title {
  font-weight: bold;
}

.divider {
  width: 10%;
  margin-top: 16px;
  margin-bottom: 16px;
}

.outlined-card {
  width: 80%;
  border-radius: 10px;
}

/* as something seems bugged with the default color of the tabs, we need to overwrite it */
.v-tab:hover {
  background-color: initial !important;
}
.v-tabs {
  color: #22425B !important;
}

.v-tab--active {
  background-color: #ffffff !important;
  color: #000 !important;
}

</style>
