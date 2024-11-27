<template>
  <v-container class="text-center">
    <v-row>
      <v-col cols="12">
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
    <v-card rounded="lg" elevation="2" class="responsive-card">
      <v-tabs v-model="contextTab" align-tabs="center" bg-color="primary-darken-1" show-arrows>
        <v-tab v-for="tab in tabs" :key="tab.value" :text="tab.name" :value="tab.value"></v-tab>
      </v-tabs>
      <v-window v-model="contextTab">
        <v-window-item v-for="tab in tabs" :key="tab.value" :value="tab.value">
          <v-card color="surface">
            <v-card-text>
              <v-row>
                <ContextSetup :title="tab.name" :content="tab.content" :value="tab.value" @data-changed="updateTabName" />
              </v-row>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>
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
        { name: "Context 1", value: 1, content: null },
        { name: "Context 2",
          value: 2,
          content: {
            connect: { inside: "OR", outside: "AND" },
            conditions: {'group-0': [{column: 'Abc', operator: 'equals (=)', value: '1'},
                                     {column: 'def', operator: 'in range', value: [0, 5]}],
                         'group-1': [{column: 'Ghi', operator: 'in', value: ['male', 'female']}]},
            tests: {contCont: 'Spearman', catCat: 'Chi-square', catContM: 'ANOVA', catContB: 'ANOVA'},
            layers: ['Metabolomics', 'Phenomics'],
            contextName: "Test" },
            contextValue: 2
        },
        { name: "Context 3", value: 3, content: null },
        { name: "Context 4", value: 4, content: null },
        { name: "Context 5", value: 5, content: null }
      ],
    };
  },
  methods: {
    updateTabName(tabName) {
      let newTabName = "";
      if (tabName.length > 15) {
        newTabName = tabName.substring(0, 15) + "...";
      }
      else if (tabName.length === 0) {
        newTabName = "Context " + this.contextTab;
      }
      else {
        newTabName = tabName;
      }
      this.tabs[this.contextTab - 1].name = newTabName;
    },
    fillTabNames() {
      // for all tabs that have content, fill the tab name with the context name
      this.tabs.forEach((tab) => {
        if (tab.content) {
          tab.name = tab.content.contextName;
        }
      });
    }
  },
  mounted() {
    this.fillTabNames();
  }
};
</script>

<style scoped>
.responsive-card {
  width: 80%;
  transition: width 0.3s ease;
}
@media (max-width: 1500px) {
  .responsive-card {
    width: 100%;
  }
}

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
</style>
