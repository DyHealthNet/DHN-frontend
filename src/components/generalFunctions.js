// get the corresponding icon png for each node type
//TODO change default to something safe add phenotype as case
export function getIcon(nodeType) {
  switch (nodeType) {
    case 'Protein':
      return new URL('../assets/figures/proteins.png', import.meta.url).href;
    case 'Metabolite':
      return new URL('../assets/figures/metabolites.png', import.meta.url).href;
    case 'Variants':
      return new URL('../assets/figures/genetic_variants.png', import.meta.url).href;
    default:
      return new URL('../assets/figures/phenotypes.png', import.meta.url).href;
  }
}

export function getPrettyType(nodeType) {
  switch (nodeType) {
    case 'cohort_protein':
      return 'Protein';
    case 'cohort_metabolite':
      return 'Metabolite';
    case 'cohort_variants':
      return 'Variant';
    case 'cohort_disorder':
      return 'Disorder';
    case 'cohort_phenotype':
      return 'Phenotype';
    default:
      return 'None';
  }
}

export function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}