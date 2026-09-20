import {getCookie} from "@/components/authentication/auth.js";
import {BASE_URL} from "@/components/constants.js";

// Human-readable labels for the statistical types the backend groups variables into
// (see list_group_variables() in network/utils/utils.py).
export const TYPE_LABELS = {
  continuous: 'Continuous',
  binaryCategorical: 'Binary',
  nonbinaryCategorical: 'Categorical',
};

// Plot type a variable gets when it's added straight from the Variable Overview table.
export const PLOT_TYPES = {
  continuous: 'Density',
  binaryCategorical: 'Bar',
  nonbinaryCategorical: 'Bar',
};

// Which statistical groups are offered for a given slot of a plot (the strings are
// PlotComponent's own xVarTypes/yVarTypes/cVarTypes values).
const GROUP_SETS = {
  'Continuous': ['continuous'],
  'Categorical': ['nonbinaryCategorical', 'binaryCategorical'],
  'Categorical/Continuous': ['nonbinaryCategorical', 'binaryCategorical', 'continuous'],
};

// contextValue -> in-flight or resolved fetch. The Data Overview page mounts up to 40
// PlotComponents that all need the same catalog, so without this each one would fire its
// own request for a response that's identical (and already cached server-side per context,
// see GetVariableCatalogView). Keyed by context because the catalog is context-scoped;
// pass {force: true} to refetch a key whose data may have changed underneath us.
const catalogCache = new Map();

function cacheKey(contextValue) {
  return contextValue === null || contextValue === undefined || contextValue === '' ? 'all' : String(contextValue);
}

/**
 * Fetch the variable catalog (one row per variable: id, displayName, description,
 * subgroup, missingCount, group, layer, identifier), restricted to a context if given.
 */
export function fetchVariableCatalog(contextValue, {force = false} = {}) {
  const key = cacheKey(contextValue);
  if (!force && catalogCache.has(key)) {
    return catalogCache.get(key);
  }

  const request = (async () => {
    const csrfToken = getCookie('csrftoken');
    let url = `${BASE_URL}/plotting/api/variableCatalog/`;

    if (contextValue) {
      url += `?contextValue=${encodeURIComponent(contextValue)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return response.json();
  })();

  // Don't let a failed request poison the cache - the next caller should retry.
  catalogCache.set(key, request);
  request.catch(() => catalogCache.delete(key));

  return request;
}

/**
 * Turn one catalog entry into an item for the variable selectors. `value` stays the
 * backend `identifier`, which is what every plot endpoint expects, so richer rendering
 * costs nothing downstream.
 *
 * `title` follows the network page's node dropdown ("display name (id)"), falling back to
 * the bare id for sources that have no display name configured (e.g. metabolites) rather
 * than padding the title with the long description - that goes in the subtitle.
 */
export function toSelectorItem(variable) {
  return {
    title: variable.displayName ? `${variable.displayName} (${variable.id})` : variable.id,
    value: variable.identifier,
    id: variable.id,
    identifier: variable.identifier,
    displayName: variable.displayName,
    description: variable.description,
    subgroup: variable.subgroup,
    missingCount: variable.missingCount,
    layer: variable.layer,
    type: TYPE_LABELS[variable.group] || variable.group,
  };
}

/**
 * Build the selectable items for one plot slot, keeping only the statistical types that
 * slot accepts. Sorted by layer then title so the rows cluster by node type the way the
 * Variable Overview table's group tabs (and these rows' icons) do.
 */
export function buildSelectorItems(catalog, varType) {
  const groups = GROUP_SETS[varType];
  if (!groups) {
    return [];
  }

  return (catalog?.variables || [])
    .filter((variable) => groups.includes(variable.group))
    .map(toSelectorItem)
    .sort((a, b) => (a.layer || '').localeCompare(b.layer || '') || a.title.localeCompare(b.title));
}
