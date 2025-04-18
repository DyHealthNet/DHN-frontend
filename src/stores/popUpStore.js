import { defineStore } from 'pinia';

export const popUpStore = defineStore('popup', {
  state: () => ({
    showInfo: false,
    infoText: '',
    infoType: 'info',
  }),
  actions: {
    clearState() {
      this.showInfo = false
      this.infoText = ''
      this.infoType = 'info'
    }
  }
})