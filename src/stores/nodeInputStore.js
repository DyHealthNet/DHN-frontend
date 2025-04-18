import { defineStore } from 'pinia'

export const nodeInputStore = defineStore('nodeInput', {
  state: () => ({
    searchText: '',
    isReadOnly: false,
    //activeIndex: -1,
    //showDropdown: false,
    //dropdownNodes: [] ,
    selectedNodes: [],
    //hoveredItem: null,
    //tooltipStyle: {},

    selectedNetworkNodes : [],

    //Advanced Settings
    selectedTests: {
        catCat: {label: 'Chi-squared test', value: 'chi2'}, catContM: {label: 'ANOVA', value: 'anova'},
        multTest: {label: 'Benjamini Hochberg (FDR)', value: 'benjamini_hb'},
        catContB: {label: 'T-test', value: 'ttest'}, contCont: {label: 'Pearson correlation', value: 'pearson'}
      },
    signThresh: 0.999,
    topNodesNumber: 5,
    topPerNodeCount: true,

    //Context selected/ Advanced Settings
    disableSelections: false,
  }),
  actions: {
    clearState() {
      this.searchText = ''
      this.isReadOnly = false
      //this.activeIndex = -1
      //this.showDropdown = false
      //this.dropdownNodes = []
      this.selectedNodes = []
      //this.hoveredItem =  null
      //this.tooltipStyle = {}

      this.selectedNetworkNodes = []

      this.selectedTests = {
        catCat: {label: 'Chi-squared test', value: 'chi2'}, catContM: {label: 'ANOVA', value: 'anova'},
        multTest: {label: 'Benjamini Hochberg (FDR)', value: 'benjamini_hb'},
        catContB: {label: 'T-test', value: 'ttest'}, contCont: {label: 'Pearson correlation', value: 'pearson'}
      }
      this.signThresh = 0.999
      this.topNodesNumber = 5
      this.topPerNodeCount = true

      //Context selected/ Advanced Settings
      this.disableSelections = false
    }
  }
})