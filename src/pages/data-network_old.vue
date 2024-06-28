<template>
  <div>
    <drugst-one id='d0'
   groups='{"nodeGroups":{"protein":{"type":"protein","color":"#4da300","font":{"color":"#000000"},"groupName":"protein","shape":"circle","id":"protein"},"metabolite":{"type":"metabolite","color":"#e900f5","font":{"color":"#103601"},"groupName":"metabolite","shape":"diamond","id":"metabolite"}},"edgeGroups":{"pr_pr":{"color":"#000000","groupName":"pr_pr","id":"pr_pr"},"pr_me":{"groupName":"pr_me","color":"#ffe70d","dashes":[3,3],"id":"pr_me"},"me_me":{"groupName":"me_me","color":"#e900f5","dashes":false,"id":"me_me"}}}'
   config='{"identifier":"symbol","title":"Breast cancer example network","nodeShadow":true,"edgeShadow":false,"autofillEdges":false,"physicsOn":true}'>
</drugst-one>
  </div>
</template>


<script>
export default {
  name: 'YourComponentName', // You can change this to whatever you like
  mounted() {
  const script = document.createElement('script');
  script.src = 'https://cdn.drugst.one/latest/drugstone.js';
  script.async = true;
  document.head.appendChild(script);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.drugst.one/latest/styles.css';
  document.head.appendChild(link);
  
  const networkString = '{"nodes":[{"id":"AHNAK","group":"protein"},{"id":"STX1A","group":"protein"},{"id":"Alanine","group":"metabolite"},{"id":"Prostaglandin","group":"metabolite"}],"edges":[{"from":"AHNAK","to":"STX1A","group":"pr_pr"},{"from":"AHNAK","to":"Alanine","group":"pr_me"},{"from":"Alanine","to":"Prostaglandin","group":"me_me"}]}';

  const drugstonePlugin = document.getElementById('d0');
  drugstonePlugin.setAttribute('network', networkString);
}

}
</script>


<style scoped>
/* You can add component-specific styles here if needed */
</style>
