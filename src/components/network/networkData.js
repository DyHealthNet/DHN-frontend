// Darkens a '#rrggbb' color by `amount` (0-1); used to visually distinguish
// "external" nodes from internal nodes of the same type without a per-point border.
export function darkenHexColor(hex, amount) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const factor = 1 - amount;
  const toHex = (channel) => Math.round(channel * factor).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Linearly interpolates between two '#rrggbb' colors at `t` (0-1) -- used for
// continuous gradients (e.g. rank/weighted-degree node coloring) that should
// stay within the app's own theme colors instead of an unrelated generic scale.
export function interpolateHexColor(hexA, hexB, t) {
  const clampedT = Math.max(0, Math.min(1, t));
  const parse = (hex) => {
    const clean = hex.replace('#', '');
    return [0, 2, 4].map((start) => parseInt(clean.substring(start, start + 2), 16));
  };
  const [r1, g1, b1] = parse(hexA);
  const [r2, g2, b2] = parse(hexB);
  const mix = (a, b) => Math.round(a + (b - a) * clampedT);
  const toHex = (channel) => channel.toString(16).padStart(2, '0');
  return `#${toHex(mix(r1, r2))}${toHex(mix(g1, g2))}${toHex(mix(b1, b2))}`;
}

// Normalizes `value` into [0, 1] against [min, max] for a color gradient --
// 0.5 (mid-gradient) when the range is degenerate (min === max, e.g. every
// displayed node/edge has the same value).
export function normalizeInRange(value, min, max) {
  return max > min ? (value - min) / (max - min) : 0.5;
}

// Significance score for one edge under `mode` -- null for an 'external' edge
// (no p_value/effect_size) or 'unweighted' mode, in which case the caller
// falls back to its own flat width/color. Shared by data-network.vue's
// edge-style dropdown (see edgeStyleMode/computeLinkWidth/computeLinkColor).
export function computeEdgeScore(edge, mode) {
  if (edge.set === 'external' || edge.p_value == null || edge.effect_size == null) return null;
  const negLogP = -Math.log10(edge.p_value);
  const absEffect = Math.abs(edge.effect_size);
  switch (mode) {
    case 'combined': return negLogP * absEffect;
    case 'pvalue': return negLogP;
    // 'effect' (diverging, signed) and 'effectAbs' (sequential, magnitude-only)
    // share the same width ranking -- only their color mapping differs, see
    // data-network.vue's computeLinkColor.
    case 'effect':
    case 'effectAbs':
      return absEffect;
    default: return null;
  }
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (n) => Math.round(f(n) * 255).toString(16).padStart(2, '0');
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
}

// Standard sRGB relative luminance (WCAG formula) -- used to judge how *dark* a
// color actually reads to the eye, since HSL's "lightness" isn't perceptually
// uniform: blue/purple/magenta hues look noticeably darker and more intense than
// green/yellow hues at the exact same L/S values.
function relativeLuminance(hex) {
  const clean = hex.replace('#', '');
  const channel = (start) => parseInt(clean.substring(start, start + 2), 16) / 255;
  const linearize = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const [r, g, b] = [channel(0), channel(2), channel(4)].map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// `node_group`/`source_table` values are fully user-defined on the backend
// (DATA_GROUP_COLUMNS) -- there's no fixed set of node types, so colors can't be a
// hardcoded lookup table. Hashing the name into a hue keeps the generated color
// stable for that name across renders/reloads without remembering assignments
// anywhere, and every group (known or not) goes through this same path.
const MIN_RELATIVE_LUMINANCE = 0.4;

export function generateGroupColor(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  const saturation = 65;
  let lightness = 50;
  let hex = hslToHex(hue, saturation, lightness);
  // Whatever hue the hash lands on, push lightness up until it actually reads as
  // bright enough -- rather than a fixed L=50 for every hue, which leaves
  // blue/purple/magenta results looking dark while yellow/green ones look fine.
  while (relativeLuminance(hex) < MIN_RELATIVE_LUMINANCE && lightness < 85) {
    lightness += 5;
    hex = hslToHex(hue, saturation, lightness);
  }
  return hex;
}

// Fixed, validated categorical palette (see the dataviz skill's color-formula.md /
// palette.md): this ordering clears the CVD and normal-vision distinctness floors
// for every *adjacent* pair, which is exactly the regime a small group count falls
// into. Hash-based hues (generateGroupColor) don't guarantee any separation
// between two arbitrary names -- two group labels can easily land within a few
// degrees of each other, which reads as "colors too similar" when there are only
// a handful of groups on screen.
const CATEGORICAL_PALETTE = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
];

// Assigns a color to each of `keys` (pass them pre-sorted so the same group keeps
// the same slot across re-renders/reloads). The first CATEGORICAL_PALETTE.length
// keys get the fixed palette in order -- maximally distinct, which matters most
// when there are only a few groups. Any keys beyond that fall back to
// generateGroupColor's hash, since a hand-picked distinct palette doesn't extend
// indefinitely and a large group count is much less likely to visually collide.
export function assignGroupColors(keys) {
  const colorMap = {};
  keys.forEach((key, index) => {
    colorMap[key] = index < CATEGORICAL_PALETTE.length
      ? CATEGORICAL_PALETTE[index]
      : generateGroupColor(key);
  });
  return colorMap;
}

// Shared by data-network.vue and differential-network.vue's detail panels so a node's
// group icon looks the same everywhere. Same caveat as generateGroupColor: node_group is
// user-defined (DATA_GROUP_COLUMNS), so anything outside this fixed set falls back to the
// phenotype icon rather than being left unrecognized.
export function getNodeIcon(sourceTable) {
  // import.meta.url resolves relative to *this* file (src/components/network/), not the
  // caller -- one directory deeper than data-network.vue (src/pages/), where this switch
  // originally lived, hence '../../' here vs '../' there.
  // Case-insensitive so callers don't need to pre-capitalize the raw node_group value
  // (data-network.vue does so anyway for display purposes, but differential-network.vue's
  // detail panels pass the raw lowercase group straight through).
  switch (sourceTable?.toLowerCase()) {
    case 'protein':
      return new URL('../../assets/figures/proteins.png', import.meta.url).href;
    case 'metabolite':
      return new URL('../../assets/figures/metabolites.png', import.meta.url).href;
    case 'variants':
      return new URL('../../assets/figures/genetic_variants.png', import.meta.url).href;
    default:
      return new URL('../../assets/figures/phenotypes.png', import.meta.url).href;
  }
}

// Shared by data-network.vue and differential-network.vue's legends so group names
// (freeform node_group/source_table values, or backend group strings) read the same
// way in both places instead of one page showing them raw/lowercase.
export function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Resolves a node's raw '|'/';'-separated xrefs string into clickable {label, url}
// entries, routed to the database matching `groupHint` (the node's GROUP -- e.g.
// "protein"/"metabolite"/"phenotype", case-insensitive substring match -- NOT its
// data_type). Shared by NodeDetails.vue (main network page) and DiffNodeDetails.vue
// (moDiNA page), which key their own "group" field differently (derived from
// source_table vs. node_group directly) but resolve xrefs the same way. A few
// datasets still carry the legacy "db.accession" form ('|'-separated, vs. the more
// common bare-accession ';'-separated form) -- that's only kept if the embedded db
// matches groupHint's own target too. Anything that doesn't resolve to a
// valid-looking id for the target database is dropped instead of falling back to
// a dead "#" link.
export function resolveXrefs(xrefsString, groupHint) {
  if (!xrefsString || !xrefsString.length) return [];
  const targetDb = targetDbForGroup(groupHint);
  return xrefsString
    .split(/[;|]/)
    .map((xref) => xref.trim())
    .filter(Boolean)
    .map((xref) => resolveOneXref(xref, targetDb))
    .filter(Boolean);
}

function targetDbForGroup(group) {
  const g = (group || "").toLowerCase();
  if (g.includes("protein")) return "uniprot";
  if (g.includes("metabolite")) return "hmdb";
  if (g.includes("phenotype")) return "snomedct";
  return null;
}

function resolveOneXref(xref, targetDb) {
  let db = targetDb;
  let id = xref;
  if (xref.includes(".")) {
    const [prefix, ...rest] = xref.split(".");
    db = prefix.toLowerCase();
    id = rest.join(".");
    if (targetDb && db !== targetDb) return null;
  }
  if (!db || !id) return null;
  const url = buildXrefUrl(db, id);
  return url ? { label: xref, url } : null;
}

function buildXrefUrl(db, id) {
  switch (db) {
    case "uniprot":
      return /^[A-Z0-9]{6,10}(-\d+)?$/i.test(id)
        ? `https://www.uniprot.org/uniprotkb/${id}`
        : null;
    case "hmdb":
      return /^HMDB\d{5,7}$/i.test(id)
        ? `https://hmdb.ca/metabolites/${id}`
        : null;
    case "snomedct":
      return /^\d{6,18}$/.test(id)
        ? `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${id}`
        : null;
    default:
      return null; // only Uniprot/HMDB/SNOMED CT are linked out to
  }
}

// Round color dot used next to each legend label, on both pages' on-screen legends.
export function getShapeStyle(color) {
  return { borderRadius: "50%", backgroundColor: color, width: "13px", height: "13px" };
}

// Picks black or white text so it stays legible against a `color` background --
// used for the node-group chips in tables, which (unlike the legend's dot-plus-label
// layout) put text directly on top of the group color. Reuses the same luminance
// floor as generateGroupColor's own brightness search, so any color that path
// generates always resolves to dark text here.
export function getReadableTextColor(color) {
  return relativeLuminance(color) >= MIN_RELATIVE_LUMINANCE ? '#111111' : '#ffffff';
}

// Bottom-left rounded panel with a color swatch + label per row, drawn onto an
// offscreen canvas for the "save image" export -- shared so both pages' exported
// legends look identical instead of drifting independently. `colors` is resolved by
// the caller (via its own labelColor()/theme lookup) since this file has no access
// to $vuetify. `title` is optional -- e.g. "Communities (Leiden)" -- and mirrors
// the on-screen NetworkLegend's own title prop, drawn as a bold heading row above
// the entries.
export function drawLegendPanel(ctx, canvas, entries, colors, title = '') {
  if (!entries.length) return;
  ctx.save();

  const padding = 14;
  const circleRadius = 8;
  const gap = 10;
  const rowHeight = 26;
  const titleRowHeight = title ? 22 : 0;
  const font = '14px system-ui, -apple-system, sans-serif';
  const titleFont = 'bold 14px system-ui, -apple-system, sans-serif';
  const textColor = colors?.textColor || '#111111';
  const panelColor = colors?.panelColor || '#ffffff';
  const borderColor = colors?.borderColor || '#dddddd';

  ctx.font = font;
  const maxEntryTextWidth = Math.max(...entries.map(({ label }) => ctx.measureText(label).width));
  ctx.font = titleFont;
  const titleTextWidth = title ? ctx.measureText(title).width : 0;
  const maxTextWidth = Math.max(maxEntryTextWidth, titleTextWidth - circleRadius * 2 - gap);

  const panelWidth = padding * 2 + circleRadius * 2 + gap + maxTextWidth;
  const panelHeight = padding * 2 + titleRowHeight + entries.length * rowHeight;
  const panelX = 20;
  const panelY = canvas.height - panelHeight - 20;
  const cornerRadius = 10;

  ctx.beginPath();
  ctx.moveTo(panelX + cornerRadius, panelY);
  ctx.arcTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + panelHeight, cornerRadius);
  ctx.arcTo(panelX + panelWidth, panelY + panelHeight, panelX, panelY + panelHeight, cornerRadius);
  ctx.arcTo(panelX, panelY + panelHeight, panelX, panelY, cornerRadius);
  ctx.arcTo(panelX, panelY, panelX + panelWidth, panelY, cornerRadius);
  ctx.closePath();
  ctx.fillStyle = panelColor;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  if (title) {
    ctx.font = titleFont;
    ctx.fillStyle = textColor;
    ctx.fillText(title, panelX + padding, panelY + padding + titleRowHeight / 2);
    ctx.font = font;
  }

  entries.forEach(({ color, label }, i) => {
    const rowCenterY = panelY + padding + titleRowHeight + rowHeight * i + rowHeight / 2;
    const circleCenterX = panelX + padding + circleRadius;

    ctx.beginPath();
    ctx.arc(circleCenterX, rowCenterY, circleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.fillText(label, circleCenterX + circleRadius + gap, rowCenterY);
  });

  ctx.restore();
}

//import crypto from "crypto";
//import {authState, checkLogin, getCookie} from '@/components/authentication/auth.js';


export function saveNetworkState(contextValue, networkState) {
  if (contextValue) {
    const key = `context_${contextValue}`;
    // const csrfToken = getCookie('csrftoken');
    // const hashedToken = crypto.createHash("sha256").update(csrfToken).digest("hex");
    console.log("saveNetworkState key", key)
    localStorage.setItem(key, JSON.stringify(networkState));
  } else {
    const key = `staticNetwork`;
    console.log("saveNetworkState key", key)
    localStorage.setItem(key, JSON.stringify(networkState));
  }
}

export function loadNetworkState(contextValue) {
  if (contextValue) {
    const key = `context_${contextValue}`;
    console.log("loadNetworkState key", key)
    console.log("loadNetworkState savedState", contextValue)
    const savedState = localStorage.getItem(key);
    return savedState ? JSON.parse(savedState) : null;
  } else {
    const key = `staticNetwork`;
    const savedState = localStorage.getItem(key);
    console.log("loadNetworkState key", key)
    return savedState ? JSON.parse(savedState) : null;
  }
}

export function clearNetworkState(contextValue) {
  if (contextValue) {
      const key = `context_${contextValue}`;
      console.log("clearNetworkState key", key)
      localStorage.removeItem(key);
  } else {
      const key = `staticNetwork`;
      console.log("clearNetworkState key", key)
      localStorage.removeItem(key);
  }
}


export const nodeData = [
  { id: 1, label: 'EGFR', group: 'Protein' },
  { id: 2, label: 'TP53', group: 'Protein' },
  { id: 3, label: 'Glucose', group: 'Metabolites' },
  { id: 4, label: 'ATP', group: 'Metabolites' },
  { id: 5, label: 'Insulin', group: 'Protein' },
  { id: 6, label: 'Pyruvate', group: 'Metabolites' },
  { id: 7, label: 'Obesity', group: 'Phenotypes' },
  { id: 8, label: 'Hypertension', group: 'Phenotypes' },
  { id: 9, label: 'Diabetes', group: 'Disorder' },
  { id: 10, label: 'Cancer', group: 'Disorder' },
  { id: 11, label: 'BRCA1', group: 'Genes' },
  { id: 12, label: 'BRCA2', group: 'Genes' },
  { id: 13, label: 'Albumin', group: 'Protein' },
  { id: 14, label: 'Hemoglobin', group: 'Protein' },
  { id: 15, label: 'Creatinine', group: 'Metabolites' },
  { id: 16, label: 'Lactate', group: 'Metabolites' },
  { id: 17, label: 'Growth Hormone', group: 'Protein' },
  { id: 18, label: 'Cortisol', group: 'Metabolites' },
  { id: 19, label: 'BMI', group: 'Phenotypes' },
  { id: 20, label: 'Cholesterol', group: 'Metabolites' },
  { id: 21, label: 'Arthritis', group: 'Disorder' },
  { id: 22, label: 'Asthma', group: 'Disorder' },
  { id: 23, label: 'APOE', group: 'Genes' },
  { id: 24, label: 'CFTR', group: 'Genes' },
  { id: 25, label: 'Myosin', group: 'Protein' },
  { id: 26, label: 'Fibrinogen', group: 'Protein' },
  { id: 27, label: 'Urea', group: 'Metabolites' },
  { id: 28, label: 'Ammonia', group: 'Metabolites' },
  { id: 29, label: 'Leptin', group: 'Protein' },
  { id: 30, label: 'Adiponectin', group: 'Protein' },
  { id: 31, label: 'Height', group: 'Phenotypes' },
  { id: 32, label: 'Weight', group: 'Phenotypes' },
  { id: 33, label: 'COPD', group: 'Disorder' },
  { id: 34, label: 'Alzheimer\'s Disease', group: 'Disorder' },
  { id: 35, label: 'HLA-A', group: 'Genes' },
  { id: 36, label: 'HLA-B', group: 'Genes' },
  { id: 37, label: 'Troponin', group: 'Protein' },
  { id: 38, label: 'Collagen', group: 'Protein' },
  { id: 39, label: 'Bilirubin', group: 'Metabolites' },
  { id: 40, label: 'Uric Acid', group: 'Metabolites' },
  { id: 41, label: 'Ferritin', group: 'Protein' },
  { id: 42, label: 'Transferrin', group: 'Protein' },
  { id: 43, label: 'Vision', group: 'Phenotypes' },
  { id: 44, label: 'Hearing', group: 'Phenotypes' },
  { id: 45, label: 'Epilepsy', group: 'Disorder' },
  { id: 46, label: 'Parkinson\'s Disease', group: 'Disorder' },
  { id: 47, label: 'TNF', group: 'Genes' },
  { id: 48, label: 'IL6', group: 'Genes' },
  { id: 49, label: 'Keratin', group: 'Protein' },
  { id: 50, label: 'Elastin', group: 'Protein' },
  { id: 51, label: 'Fructose', group: 'Metabolites' },
  { id: 52, label: 'Glycogen', group: 'Metabolites' },
  { id: 53, label: 'IGF-1', group: 'Protein' },
  { id: 54, label: 'Prolactin', group: 'Protein' },
  { id: 55, label: 'Blood Pressure', group: 'Phenotypes' },
  { id: 56, label: 'Heart Rate', group: 'Phenotypes' },
  { id: 57, label: 'Multiple Sclerosis', group: 'Disorder' },
  { id: 58, label: 'Schizophrenia', group: 'Disorder' },
  { id: 59, label: 'MTHFR', group: 'Genes' },
  { id: 60, label: 'P53', group: 'Genes' },
  { id: 61, label: 'Myoglobin', group: 'Protein' },
  { id: 62, label: 'Hemocyanin', group: 'Protein' },
  { id: 63, label: 'Citrate', group: 'Metabolites' },
  { id: 64, label: 'Oxaloacetate', group: 'Metabolites' },
  { id: 65, label: 'Epinephrine', group: 'Metabolites' },
  { id: 66, label: 'Norepinephrine', group: 'Metabolites' },
  { id: 67, label: 'Testosterone', group: 'Metabolites' },
  { id: 68, label: 'Estrogen', group: 'Metabolites' },
  { id: 69, label: 'Osteoporosis', group: 'Disorder' },
  { id: 70, label: 'Gout', group: 'Disorder' },
  { id: 71, label: 'HFE', group: 'Genes' },
  { id: 72, label: 'ACE', group: 'Genes' },
  { id: 73, label: 'CRP', group: 'Protein' },
  { id: 74, label: 'Mucin', group: 'Protein' },
  { id: 75, label: 'Acetylcholine', group: 'Metabolites' },
  { id: 76, label: 'Serotonin', group: 'Metabolites' },
  { id: 77, label: 'Dopamine', group: 'Metabolites' },
  { id: 78, label: 'GABA', group: 'Metabolites' },
  { id: 79, label: 'Skin Color', group: 'Phenotypes' },
  { id: 80, label: 'Hair Color', group: 'Phenotypes' },
  { id: 81, label: 'Psoriasis', group: 'Disorder' },
  { id: 82, label: 'Eczema', group: 'Disorder' },
  { id: 83, label: 'HBB', group: 'Genes' },
  { id: 84, label: 'SOD1', group: 'Genes' },
  { id: 85, label: 'Albumin', group: 'Protein' },
  { id: 86, label: 'Fibrin', group: 'Protein' },
  { id: 87, label: 'Creatine', group: 'Metabolites' },
  { id: 88, label: 'Alanine', group: 'Metabolites' },
  { id: 89, label: 'Renin', group: 'Protein' },
  { id: 90, label: 'Angiotensin', group: 'Protein' },
  { id: 91, label: 'Muscle Mass', group: 'Phenotypes' },
  { id: 92, label: 'Body Fat', group: 'Phenotypes' },
  { id: 93, label: 'Crohn\'s Disease', group: 'Disorder' },
  { id: 94, label: 'Ulcerative Colitis', group: 'Disorder' },
  { id: 95, label: 'APC', group: 'Genes' },
  { id: 96, label: 'KRAS', group: 'Genes' },
  { id: 97, label: 'Thyroxine', group: 'Metabolites' }]



  export const edgeData = [
    { from: 1, to: 2, p_value: 0.01 },
    { from: 1, to: 3, p_value: 0.03 },
    { from: 2, to: 4, p_value: 0.02 },
    { from: 1, to: 5, p_value: 0.015 },
    { from: 5, to: 6, p_value: 0.025 },
    { from: 7, to: 8, p_value: 0.05 },
    { from: 9, to: 10, p_value: 0.04 },
    { from: 11, to: 12, p_value: 0.03 },
    { from: 13, to: 14, p_value: 0.02 },
    { from: 15, to: 16, p_value: 0.01 },
    { from: 17, to: 18, p_value: 0.03 },
    { from: 19, to: 20, p_value: 0.02 },
    { from: 21, to: 22, p_value: 0.04 },
    { from: 23, to: 24, p_value: 0.05 },
    { from: 25, to: 26, p_value: 0.01 },
    { from: 27, to: 28, p_value: 0.02 },
    { from: 29, to: 30, p_value: 0.03 },
    { from: 31, to: 32, p_value: 0.04 },
    { from: 33, to: 34, p_value: 0.05 },
    { from: 35, to: 36, p_value: 0.01 },
    { from: 37, to: 38, p_value: 0.02 },
    { from: 39, to: 40, p_value: 0.03 },
    { from: 41, to: 42, p_value: 0.04 },
    { from: 43, to: 44, p_value: 0.05 },
    { from: 45, to: 46, p_value: 0.01 },
    { from: 47, to: 48, p_value: 0.02 },
    { from: 49, to: 50, p_value: 0.03 },
    { from: 51, to: 52, p_value: 0.04 },
    { from: 53, to: 54, p_value: 0.05 },
    { from: 55, to: 56, p_value: 0.01 },
    { from: 57, to: 58, p_value: 0.02 },
    { from: 59, to: 60, p_value: 0.03 },
    { from: 61, to: 62, p_value: 0.04 },
    { from: 63, to: 64, p_value: 0.05 },
    { from: 65, to: 66, p_value: 0.01 },
    { from: 67, to: 68, p_value: 0.02 },
    { from: 69, to: 70, p_value: 0.03 },
    { from: 71, to: 72, p_value: 0.04 },
    { from: 73, to: 74, p_value: 0.05 },
    { from: 75, to: 76, p_value: 0.01 },
    { from: 77, to: 78, p_value: 0.02 },
    { from: 79, to: 80, p_value: 0.03 },
    { from: 81, to: 82, p_value: 0.04 },
    { from: 83, to: 84, p_value: 0.05 },
    { from: 85, to: 86, p_value: 0.01 },
    { from: 87, to: 88, p_value: 0.02 },
    { from: 89, to: 90, p_value: 0.03 },
    { from: 91, to: 92, p_value: 0.04 },
    { from: 93, to: 94, p_value: 0.05 },
    { from: 95, to: 96, p_value: 0.01 },
    { from: 97, to: 1, p_value: 0.02 }, // Linking to an existing node
    // Additional 500 edges
    { from: 10, to: 25, p_value: 0.05 },
    { from: 15, to: 30, p_value: 0.03 },
    { from: 20, to: 35, p_value: 0.02 },
    { from: 25, to: 40, p_value: 0.01 },
    { from: 30, to: 45, p_value: 0.04 },
    { from: 35, to: 50, p_value: 0.03 },
    { from: 40, to: 55, p_value: 0.02 },
    { from: 45, to: 60, p_value: 0.05 },
    { from: 50, to: 65, p_value: 0.01 },
    { from: 55, to: 70, p_value: 0.03 },
    { from: 60, to: 75, p_value: 0.02 },
    { from: 65, to: 80, p_value: 0.04 },
    { from: 70, to: 85, p_value: 0.01 },
    { from: 75, to: 90, p_value: 0.02 },
    { from: 80, to: 95, p_value: 0.03 },
    { from: 85, to: 100, p_value: 0.05 },
    { from: 90, to: 5, p_value: 0.04 },
    { from: 95, to: 10, p_value: 0.01 },
    { from: 3, to: 30, p_value: 0.02 },
    { from: 7, to: 35, p_value: 0.03 },
    { from: 11, to: 40, p_value: 0.05 },
    { from: 14, to: 45, p_value: 0.01 },
    { from: 18, to: 50, p_value: 0.04 },
    { from: 22, to: 55, p_value: 0.03 },
    { from: 26, to: 60, p_value: 0.02 },
    { from: 29, to: 65, p_value: 0.01 },
    { from: 33, to: 70, p_value: 0.04 },
    { from: 37, to: 75, p_value: 0.05 },
    { from: 41, to: 80, p_value: 0.02 },
    { from: 44, to: 85, p_value: 0.03 },
    { from: 48, to: 90, p_value: 0.01 },
    { from: 52, to: 95, p_value: 0.02 },
    { from: 56, to: 100, p_value: 0.05 },
    { from: 60, to: 2, p_value: 0.03 },
    { from: 65, to: 7, p_value: 0.02 },
    { from: 70, to: 11, p_value: 0.01 },
    { from: 75, to: 14, p_value: 0.04 },
    { from: 80, to: 18, p_value: 0.05 },
    { from: 85, to: 22, p_value: 0.03 },
    { from: 90, to: 26, p_value: 0.02 },
    { from: 95, to: 29, p_value: 0.01 },
    { from: 100, to: 33, p_value: 0.04 },
    { from: 5, to: 37, p_value: 0.02 },
    { from: 10, to: 41, p_value: 0.03 },
    { from: 15, to: 44, p_value: 0.01 },
    { from: 20, to: 48, p_value: 0.02 },
    { from: 25, to: 52, p_value: 0.05 },
    { from: 30, to: 56, p_value: 0.04 },
    { from: 35, to: 60, p_value: 0.03 },
    { from: 40, to: 65, p_value: 0.02 },
    { from: 45, to: 70, p_value: 0.01 },
    { from: 50, to: 75, p_value: 0.04 },
    { from: 55, to: 80, p_value: 0.05 },
    { from: 60, to: 85, p_value: 0.02 },
    { from: 65, to: 90, p_value: 0.03 },
    { from: 70, to: 95, p_value: 0.01 },
    { from: 75, to: 100, p_value: 0.02 },
    { from: 80, to: 3, p_value: 0.05 },
    { from: 85, to: 7, p_value: 0.04 },
    { from: 90, to: 11, p_value: 0.03 },
    { from: 95, to: 14, p_value: 0.02 },
    { from: 100, to: 18, p_value: 0.01 },
    { from: 2, to: 22, p_value: 0.04 },
    { from: 7, to: 26, p_value: 0.05 },
    { from: 11, to: 29, p_value: 0.03 },
    { from: 14, to: 33, p_value: 0.02 },
    { from: 18, to: 37, p_value: 0.01 },
    { from: 22, to: 41, p_value: 0.04 },
    { from: 26, to: 44, p_value: 0.05 },
    { from: 29, to: 48, p_value: 0.03 },
    { from: 33, to: 52, p_value: 0.02 },
    { from: 37, to: 56, p_value: 0.01 },
    { from: 41, to: 60, p_value: 0.04 },
    { from: 44, to: 65, p_value: 0.05 },
    { from: 48, to: 70, p_value: 0.03 },
    { from: 52, to: 75, p_value: 0.02 },
    { from: 56, to: 80, p_value: 0.01 },
    { from: 60, to: 85, p_value: 0.04 },
    { from: 65, to: 90, p_value: 0.05 },
    { from: 70, to: 95, p_value: 0.03 },
    { from: 75, to: 100, p_value: 0.02 },
    { from: 80, to: 5, p_value: 0.01 },
    { from: 85, to: 10, p_value: 0.04 },
    { from: 90, to: 15, p_value: 0.05 },
    { from: 95, to: 20, p_value: 0.03 },
    { from: 100, to: 25, p_value: 0.02 },
    { from: 3, to: 30, p_value: 0.01 },
    { from: 7, to: 35, p_value: 0.04 },
    { from: 11, to: 40, p_value: 0.05 },
    { from: 14, to: 45, p_value: 0.03 },
    { from: 18, to: 50, p_value: 0.02 },
    { from: 22, to: 55, p_value: 0.01 },
    { from: 26, to: 60, p_value: 0.04 },
    { from: 29, to: 65, p_value: 0.05 },
    { from: 33, to: 70, p_value: 0.03 },
    { from: 37, to: 75, p_value: 0.02 },
    { from: 41, to: 80, p_value: 0.01 },
    { from: 44, to: 85, p_value: 0.04 },
    { from: 48, to: 90, p_value: 0.05 },
    { from: 52, to: 95, p_value: 0.03 },
    { from: 56, to: 100, p_value: 0.02 },
    { from: 60, to: 2, p_value: 0.01 },
    { from: 65, to: 7, p_value: 0.04 },
    { from: 70, to: 11, p_value: 0.05 },
    { from: 75, to: 14, p_value: 0.03 },
    { from: 80, to: 18, p_value: 0.02 },
    { from: 85, to: 22, p_value: 0.01 },
    { from: 90, to: 26, p_value: 0.04 },
    { from: 95, to: 29, p_value: 0.05 },
    { from: 100, to: 33, p_value: 0.03 },
    { from: 5, to: 37, p_value: 0.02 },
    { from: 10, to: 41, p_value: 0.01 },
    { from: 15, to: 44, p_value: 0.04 },
    { from: 20, to: 48, p_value: 0.05 },
    { from: 25, to: 52, p_value: 0.03 },
    { from: 30, to: 56, p_value: 0.02 },
    { from: 35, to: 60, p_value: 0.01 },
    { from: 40, to: 65, p_value: 0.04 },
    { from: 45, to: 70, p_value: 0.05 },
    { from: 50, to: 75, p_value: 0.03 },
    { from: 55, to: 80, p_value: 0.02 },
    { from: 60, to: 85, p_value: 0.01 },
    { from: 65, to: 90, p_value: 0.04 },
    { from: 70, to: 95, p_value: 0.05 },
    { from: 75, to: 100, p_value: 0.03 },
    { from: 80, to: 3, p_value: 0.02 },
    { from: 85, to: 7, p_value: 0.01 },
    { from: 90, to: 11, p_value: 0.04 },
    { from: 95, to: 14, p_value: 0.05 },
    { from: 100, to: 18, p_value: 0.03 },
    { from: 2, to: 22, p_value: 0.02 },
    { from: 7, to: 26, p_value: 0.01 },
    { from: 11, to: 29, p_value: 0.04 },
    { from: 14, to: 33, p_value: 0.05 },
    { from: 18, to: 37, p_value: 0.03 },
    { from: 22, to: 41, p_value: 0.02 },
    { from: 26, to: 44, p_value: 0.01 },
    { from: 29, to: 48, p_value: 0.04 },
    { from: 33, to: 52, p_value: 0.05 },
    { from: 37, to: 56, p_value: 0.03 },
    { from: 41, to: 60, p_value: 0.02 },
    { from: 44, to: 65, p_value: 0.01 },
    { from: 48, to: 70, p_value: 0.04 },
    { from: 52, to: 75, p_value: 0.05 },
    { from: 56, to: 80, p_value: 0.03 },
    { from: 60, to: 85, p_value: 0.02 },
    { from: 65, to: 90, p_value: 0.01 },
    { from: 70, to: 95, p_value: 0.04 },
    { from: 75, to: 100, p_value: 0.05 },
    { from: 81, to: 55, p_value: 0.064 },
    { from: 13, to: 69, p_value: 0.012 },
    { from: 96, to: 49, p_value: 0.089 },
    { from: 45, to: 92, p_value: 0.097 },
    { from: 11, to: 89, p_value: 0.031 },
    { from: 64, to: 85, p_value: 0.053 },
    { from: 33, to: 22, p_value: 0.074 },
    { from: 63, to: 51, p_value: 0.034 },
    { from: 29, to: 3, p_value: 0.082 },
    { from: 76, to: 34, p_value: 0.016 },
    { from: 8, to: 72, p_value: 0.038 },
    { from: 42, to: 18, p_value: 0.041 },
    { from: 82, to: 39, p_value: 0.027 },
    { from: 94, to: 14, p_value: 0.048 },
    { from: 58, to: 35, p_value: 0.068 },
    { from: 79, to: 83, p_value: 0.019 },
    { from: 17, to: 66, p_value: 0.073 },
    { from: 61, to: 87, p_value: 0.026 },
    { from: 20, to: 77, p_value: 0.099 },
    { from: 70, to: 7, p_value: 0.015 },
    { from: 98, to: 36, p_value: 0.056 },
    { from: 19, to: 80, p_value: 0.087 },
    { from: 6, to: 97, p_value: 0.057 },
    { from: 52, to: 2, p_value: 0.095 },
    { from: 54, to: 41, p_value: 0.024 },
    { from: 67, to: 23, p_value: 0.025 },
    { from: 12, to: 53, p_value: 0.043 },
    { from: 24, to: 40, p_value: 0.006 },
    { from: 91, to: 93, p_value: 0.032 },
    { from: 71, to: 27, p_value: 0.01 },
    { from: 26, to: 16, p_value: 0.08 },
    { from: 46, to: 99, p_value: 0.075 },
    { from: 10, to: 31, p_value: 0.028 },
    { from: 59, to: 65, p_value: 0.01 },
    { from: 9, to: 37, p_value: 0.059 },
    { from: 84, to: 15, p_value: 0.03 },
    { from: 78, to: 50, p_value: 0.07 },
    { from: 44, to: 1, p_value: 0.094 },
    { from: 5, to: 75, p_value: 0.054 },
    { from: 88, to: 38, p_value: 0.022 },
    { from: 28, to: 56, p_value: 0.021 },
    { from: 25, to: 74, p_value: 0.085 },
    { from: 57, to: 43, p_value: 0.037 },
    { from: 90, to: 47, p_value: 0.065 },
    { from: 86, to: 68, p_value: 0.045 },
    { from: 60, to: 21, p_value: 0.017 },
    { from: 32, to: 48, p_value: 0.033 },
    { from: 62, to: 4, p_value: 0.058 },
    { from: 30, to: 28, p_value: 0.011 },
    { from: 95, to: 91, p_value: 0.014 },
    { from: 43, to: 81, p_value: 0.088 },
    { from: 3, to: 60, p_value: 0.004 },
    { from: 73, to: 79, p_value: 0.018 },
    { from: 15, to: 57, p_value: 0.09 },
    { from: 69, to: 30, p_value: 0.007 },
    { from: 77, to: 71, p_value: 0.047 },
    { from: 55, to: 10, p_value: 0.086 },
    { from: 37, to: 70, p_value: 0.046 },
    { from: 14, to: 32, p_value: 0.05 },
    { from: 18, to: 6, p_value: 0.096 },
    { from: 50, to: 88, p_value: 0.078 },
    { from: 74, to: 8, p_value: 0.002 },
    { from: 56, to: 67, p_value: 0.081 },
    { from: 65, to: 94, p_value: 0.052 },
    { from: 7, to: 5, p_value: 0.029 },
    { from: 75, to: 82, p_value: 0.013 },
    { from: 36, to: 46, p_value: 0.076 },
    { from: 83, to: 12, p_value: 0.084 },
    { from: 27, to: 58, p_value: 0.001 },
    { from: 34, to: 61, p_value: 0.042 },
    { from: 92, to: 42, p_value: 0.09 },
    { from: 87, to: 9, p_value: 0.05 },
    { from: 39, to: 78, p_value: 0.083 },
    { from: 68, to: 25, p_value: 0.098 },
    { from: 40, to: 44, p_value: 0.03 },
    { from: 66, to: 86, p_value: 0.035 },
    { from: 35, to: 59, p_value: 0.036 },
    { from: 53, to: 19, p_value: 0.003 },
    { from: 2, to: 76, p_value: 0.062 },
    { from: 16, to: 24, p_value: 0.099 },
    { from: 22, to: 13, p_value: 0.071 },
    { from: 41, to: 63, p_value: 0.023 },
    { from: 80, to: 29, p_value: 0.04 },
    { from: 4, to: 62, p_value: 0.091 },
    { from: 1, to: 17, p_value: 0.093 },
    { from: 23, to: 26, p_value: 0.04 },
    { from: 21, to: 20, p_value: 0.066 },
    { from: 31, to: 54, p_value: 0.007 },
    { from: 47, to: 11, p_value: 0.008 },
    { from: 48, to: 98, p_value: 0.005 },
    { from: 99, to: 100, p_value: 0.06 },
    { from: 93, to: 4, p_value: 0.094 },
    { from: 38, to: 95, p_value: 0.002 },
    { from: 28, to: 37, p_value: 0.065 },
    { from: 89, to: 64, p_value: 0.015 },
    { from: 3, to: 96, p_value: 0.031 },
    { from: 9, to: 65, p_value: 0.028 },
    { from: 61, to: 77, p_value: 0.073 },
    { from: 90, to: 90, p_value: 0.074 },
    { from: 70, to: 14, p_value: 0.054 },
    { from: 66, to: 53, p_value: 0.048 },
    { from: 24, to: 36, p_value: 0.085 },
    { from: 94, to: 34, p_value: 0.09 },
    { from: 47, to: 7, p_value: 0.016 },
    { from: 73, to: 72, p_value: 0.042 },
    { from: 15, to: 35, p_value: 0.017 },
    { from: 12, to: 79, p_value: 0.067 },
    { from: 8, to: 91, p_value: 0.069 },
    { from: 49, to: 51, p_value: 0.032 },
    { from: 30, to: 1, p_value: 0.012 },
    { from: 58, to: 75, p_value: 0.06 },
    { from: 40, to: 81, p_value: 0.043 },
    { from: 87, to: 69, p_value: 0.06 },
    { from: 33, to: 97, p_value: 0.011 },
    { from: 2, to: 83, p_value: 0.025 },
    { from: 45, to: 32, p_value: 0.022 },
    { from: 5, to: 56, p_value: 0.075 },
    { from: 39, to: 84, p_value: 0.055 },
    { from: 71, to: 50, p_value: 0.044 },
    { from: 67, to: 43, p_value: 0.064 },
    { from: 74, to: 23, p_value: 0.003 },
    { from: 60, to: 78, p_value: 0.039 },
    { from: 46, to: 19, p_value: 0.007 },
    { from: 52, to: 27, p_value: 0.01 },
    { from: 59, to: 6, p_value: 0.076 },
    { from: 88, to: 48, p_value: 0.046 },
    { from: 25, to: 38, p_value: 0.084 },
    { from: 18, to: 86, p_value: 0.04 },
    { from: 82, to: 98, p_value: 0.001 },
    { from: 44, to: 80, p_value: 0.029 },
    { from: 68, to: 31, p_value: 0.021 },
    { from: 26, to: 11, p_value: 0.05 },
    { from: 16, to: 0, p_value: 0.037 },
    { from: 4, to: 70, p_value: 0.004 },
    { from: 10, to: 55, p_value: 0.072 },
    { from: 62, to: 3, p_value: 0.063 },
    { from: 76, to: 29, p_value: 0.033 },
    { from: 95, to: 21, p_value: 0.008 },
    { from: 20, to: 13, p_value: 0.047 },
    { from: 56, to: 61, p_value: 0.099 },
    { from: 1, to: 63, p_value: 0.018 },
    { from: 91, to: 24, p_value: 0.035 },
    { from: 81, to: 90, p_value: 0.002 },
    { from: 41, to: 15, p_value: 0.052 },
    { from: 73, to: 93, p_value: 0.009 },
    { from: 84, to: 94, p_value: 0.091 },
    { from: 37, to: 39, p_value: 0.057 },
    { from: 75, to: 99, p_value: 0.077 },
    { from: 48, to: 88, p_value: 0.058 },
    { from: 22, to: 62, p_value: 0.014 },
    { from: 96, to: 82, p_value: 0.065 },
    { from: 7, to: 58, p_value: 0.049 },
    { from: 27, to: 64, p_value: 0.086 },
    { from: 53, to: 68, p_value: 0.03 },
    { from: 66, to: 4, p_value: 0.05 },
    { from: 18, to: 12, p_value: 0.045 },
    { from: 43, to: 46, p_value: 0.003 },
    { from: 19, to: 85, p_value: 0.033 },
    { from: 50, to: 80, p_value: 0.006 },
    { from: 25, to: 57, p_value: 0.096 },
    { from: 6, to: 28, p_value: 0.094 },
    { from: 8, to: 40, p_value: 0.07 },
    { from: 45, to: 5, p_value: 0.036 },
    { from: 3, to: 87, p_value: 0.005 },
    { from: 74, to: 92, p_value: 0.083 },
    { from: 30, to: 86, p_value: 0.04 },
    { from: 31, to: 9, p_value: 0.038 },
    { from: 54, to: 26, p_value: 0.028 },
    { from: 72, to: 74, p_value: 0.001 },
    { from: 69, to: 69, p_value: 0.018 },
    { from: 14, to: 33, p_value: 0.056 },
    { from: 97, to: 16, p_value: 0.007 },
    { from: 65, to: 75, p_value: 0.078 },
    { from: 17, to: 76, p_value: 0.071 },
    { from: 2, to: 49, p_value: 0.06 },
    { from: 95, to: 1, p_value: 0.063 },
    { from: 23, to: 43, p_value: 0.022 },
    { from: 34, to: 52, p_value: 0.075 },
    { from: 61, to: 56, p_value: 0.037 },
    { from: 13, to: 66, p_value: 0.055 },
    { from: 67, to: 47, p_value: 0.032 },
    { from: 51, to: 37, p_value: 0.031 },
    { from: 42, to: 41, p_value: 0.081 },
    { from: 11, to: 70, p_value: 0.017 },
    { from: 38, to: 3, p_value: 0.087 },
    { from: 63, to: 0, p_value: 0.057 },
    { from: 60, to: 24, p_value: 0.004 },
    { from: 39, to: 54, p_value: 0.091 },
    { from: 21, to: 14, p_value: 0.084 },
    { from: 81, to: 98, p_value: 0.059 },
    { from: 29, to: 10, p_value: 0.043 },
    { from: 94, to: 91, p_value: 0.072 },
    { from: 20, to: 19, p_value: 0.088 },
    { from: 28, to: 7, p_value: 0.015 },
    { from: 79, to: 93, p_value: 0.023 },
    { from: 6, to: 90, p_value: 0.012 },
    { from: 53, to: 38, p_value: 0.096 },
    { from: 88, to: 25, p_value: 0.061 },
    { from: 22, to: 32, p_value: 0.086 },
    { from: 4, to: 50, p_value: 0.009 },
    { from: 52, to: 55, p_value: 0.007 },
    { from: 18, to: 36, p_value: 0.048 },
    { from: 91, to: 82, p_value: 0.028 },
    { from: 35, to: 59, p_value: 0.045 },
    { from: 75, to: 83, p_value: 0.019 },
    { from: 48, to: 5, p_value: 0.025 },
    { from: 80, to: 58, p_value: 0.066 },
    { from: 9, to: 15, p_value: 0.026 },
    { from: 57, to: 27, p_value: 0.034 },
    { from: 78, to: 68, p_value: 0.047 },
    { from: 41, to: 85, p_value: 0.094 },
    { from: 31, to: 65, p_value: 0.073 },
    { from: 87, to: 44, p_value: 0.052 },
    { from: 64, to: 69, p_value: 0.033 },
    { from: 16, to: 77, p_value: 0.032 },
    { from: 71, to: 34, p_value: 0.064 },
    { from: 46, to: 11, p_value: 0.081 },
    { from: 92, to: 18, p_value: 0.07 },
    { from: 97, to: 23, p_value: 0.016 },
    { from: 40, to: 6, p_value: 0.027 },
    { from: 62, to: 78, p_value: 0.079 },
    { from: 3, to: 95, p_value: 0.015 },
    { from: 11, to: 12, p_value: 0.011 },
    { from: 64, to: 94, p_value: 0.024 },
    { from: 85, to: 89, p_value: 0.01 },
    { from: 33, to: 50, p_value: 0.042 },
    { from: 63, to: 16, p_value: 0.01 },
    { from: 29, to: 42, p_value: 0.08 },
    { from: 76, to: 43, p_value: 0.048 },
    { from: 8, to: 60, p_value: 0.06 },
    { from: 42, to: 32, p_value: 0.034 },
    { from: 82, to: 19, p_value: 0.04 },
    { from: 94, to: 9, p_value: 0.013 },
    { from: 58, to: 99, p_value: 0.039 },
    { from: 79, to: 87, p_value: 0.054 },
    { from: 17, to: 31, p_value: 0.008 },
    { from: 61, to: 26, p_value: 0.014 },
    { from: 20, to: 49, p_value: 0.065 },
    { from: 70, to: 25, p_value: 0.027 },
    { from: 98, to: 27, p_value: 0.053 },
    { from: 19, to: 39, p_value: 0.029 },
    { from: 6, to: 53, p_value: 0.055 },
    { from: 52, to: 71, p_value: 0.019 },
    { from: 54, to: 37, p_value: 0.046 },
    { from: 67, to: 14, p_value: 0.029 },
    { from: 12, to: 76, p_value: 0.069 },
    { from: 24, to: 46, p_value: 0.091 },
    { from: 91, to: 88, p_value: 0.068 },
    { from: 71, to: 75, p_value: 0.063 },
    { from: 26, to: 3, p_value: 0.035 },
    { from: 46, to: 30, p_value: 0.071 },
    { from: 10, to: 23, p_value: 0.01 },
    { from: 59, to: 4, p_value: 0.025 },
    { from: 9, to: 69, p_value: 0.017 },
    { from: 84, to: 73, p_value: 0.022 },
    { from: 78, to: 66, p_value: 0.079 },
    { from: 44, to: 13, p_value: 0.082 },
    { from: 5, to: 83, p_value: 0.043 },
    { from: 88, to: 48, p_value: 0.044 },
    { from: 28, to: 56, p_value: 0.018 },
    { from: 25, to: 74, p_value: 0.041 },
    { from: 57, to: 43, p_value: 0.064 },
    { from: 90, to: 47, p_value: 0.083 },
    { from: 86, to: 68, p_value: 0.002 },
    { from: 60, to: 21, p_value: 0.04 },
    { from: 32, to: 48, p_value: 0.072 },
    { from: 62, to: 4, p_value: 0.037 },
    { from: 30, to: 28, p_value: 0.051 },
    { from: 95, to: 91, p_value: 0.07 },
    { from: 43, to: 81, p_value: 0.023 },
    { from: 3, to: 60, p_value: 0.032 },
    { from: 73, to: 79, p_value: 0.003 },
    { from: 15, to: 57, p_value: 0.037 },
    { from: 69, to: 30, p_value: 0.027 },
    { from: 77, to: 71, p_value: 0.097 },
    { from: 55, to: 10, p_value: 0.089 },
    { from: 37, to: 70, p_value: 0.001 },
    { from: 14, to: 32, p_value: 0.074 },
    { from: 18, to: 6, p_value: 0.005 },
    { from: 50, to: 88, p_value: 0.057 },
    { from: 74, to: 8, p_value: 0.058 },
    { from: 56, to: 67, p_value: 0.027 },
    { from: 65, to: 94, p_value: 0.081 },
    { from: 7, to: 5, p_value: 0.014 },
    { from: 75, to: 82, p_value: 0.091 },
    { from: 36, to: 46, p_value: 0.06 },
    { from: 83, to: 12, p_value: 0.095 },
    { from: 27, to: 58, p_value: 0.006 },
    { from: 34, to: 61, p_value: 0.037 },
    { from: 92, to: 42, p_value: 0.073 },
    { from: 87, to: 9, p_value: 0.074 },
    { from: 39, to: 78, p_value: 0.038 },
    { from: 68, to: 25, p_value: 0.018 },
    { from: 40, to: 44, p_value: 0.055 },
    { from: 66, to: 86, p_value: 0.066 },
    { from: 35, to: 59, p_value: 0.087 },
    { from: 53, to: 19, p_value: 0.01 },
    { from: 2, to: 76, p_value: 0.026 },
    { from: 16, to: 24, p_value: 0.031 },
    { from: 22, to: 13, p_value: 0.048 },
    { from: 41, to: 63, p_value: 0.078 },
    { from: 80, to: 29, p_value: 0.064 },
    { from: 4, to: 62, p_value: 0.093 },
    { from: 1, to: 17, p_value: 0.054 },
    { from: 93, to: 45, p_value: 0.034 },
    { from: 20, to: 7, p_value: 0.047 },
    { from: 72, to: 64, p_value: 0.02 },
    { from: 48, to: 96, p_value: 0.084 },
    { from: 89, to: 90, p_value: 0.016 },
    { from: 31, to: 49, p_value: 0.056 },
    { from: 0, to: 28, p_value: 0.04 },
    { from: 11, to: 51, p_value: 0.098 },
    { from: 91, to: 84, p_value: 0.092 },
    { from: 74, to: 3, p_value: 0.053 },
    { from: 55, to: 77, p_value: 0.007 },
    { from: 14, to: 81, p_value: 0.029 },
    { from: 47, to: 85, p_value: 0.061 },
    { from: 95, to: 75, p_value: 0.052 },
    { from: 79, to: 56, p_value: 0.007 },
    { from: 66, to: 33, p_value: 0.069 },
    { from: 18, to: 54, p_value: 0.045 },
    { from: 34, to: 37, p_value: 0.02 },
    { from: 38, to: 50, p_value: 0.094 },
    { from: 69, to: 57, p_value: 0.063 },
    { from: 36, to: 67, p_value: 0.074 },
    { from: 87, to: 35, p_value: 0.095 },
    { from: 30, to: 42, p_value: 0.008 },
    { from: 61, to: 65, p_value: 0.082 },
    { from: 73, to: 24, p_value: 0.03 },
    { from: 26, to: 96, p_value: 0.033 },
    { from: 93, to: 94, p_value: 0.09 },
    { from: 5, to: 8, p_value: 0.089 },
    { from: 97, to: 11, p_value: 0.02 },
    { from: 60, to: 82, p_value: 0.012 },
    { from: 15, to: 46, p_value: 0.04 },
    { from: 77, to: 43, p_value: 0.081 },
    { from: 52, to: 80, p_value: 0.017 },
    { from: 21, to: 68, p_value: 0.087 },
    { from: 6, to: 22, p_value: 0.088 },
    { from: 78, to: 45, p_value: 0.01 },
    { from: 41, to: 16, p_value: 0.006 },
    { from: 92, to: 71, p_value: 0.092 },
    { from: 32, to: 72, p_value: 0.005 },
    { from: 70, to: 58, p_value: 0.084 },
    { from: 2, to: 53, p_value: 0.036 },
    { from: 1, to: 76, p_value: 0.062 },
    { from: 89, to: 59, p_value: 0.048 },
    { from: 39, to: 27, p_value: 0.093 },
    { from: 33, to: 10, p_value: 0.066 },
    { from: 12, to: 91, p_value: 0.01 },
    { from: 25, to: 20, p_value: 0.011 },
    { from: 50, to: 44, p_value: 0.097 },
    { from: 19, to: 86, p_value: 0.025 },
    { from: 4, to: 28, p_value: 0.02 },
    { from: 85, to: 64, p_value: 0.065 },
    { from: 88, to: 40, p_value: 0.016 },
    { from: 56, to: 83, p_value: 0.035 },
    { from: 76, to: 95, p_value: 0.031 },
    { from: 24, to: 51, p_value: 0.062 },
    { from: 66, to: 97, p_value: 0.072 },
    { from: 35, to: 74, p_value: 0.032 },
    { from: 53, to: 36, p_value: 0.015 },
    { from: 11, to: 67, p_value: 0.072 },
    { from: 87, to: 41, p_value: 0.051 },
    { from: 78, to: 7, p_value: 0.089 },
    { from: 60, to: 15, p_value: 0.068 },
    { from: 8, to: 31, p_value: 0.056 },
    { from: 56, to: 90, p_value: 0.093 },
    { from: 16, to: 43, p_value: 0.033 },
    { from: 18, to: 65, p_value: 0.04 },
    { from: 14, to: 30, p_value: 0.06 },
    { from: 10, to: 55, p_value: 0.017 },
    { from: 74, to: 77, p_value: 0.075 },
    { from: 46, to: 6, p_value: 0.029 },
    { from: 54, to: 68, p_value: 0.058 },
    { from: 32, to: 0, p_value: 0.025 },
    { from: 1, to: 40, p_value: 0.034 },
    { from: 84, to: 98, p_value: 0.022 },
    { from: 81, to: 75, p_value: 0.081 },
    { from: 9, to: 47, p_value: 0.057 },
    { from: 67, to: 14, p_value: 0.037 },
    { from: 3, to: 33, p_value: 0.007 },
    { from: 95, to: 20, p_value: 0.024 },
    { from: 83, to: 59, p_value: 0.066 },
    { from: 80, to: 12, p_value: 0.016 },
    { from: 51, to: 21, p_value: 0.01 },
    { from: 73, to: 86, p_value: 0.054 },
    { from: 23, to: 4, p_value: 0.062 },
    { from: 48, to: 34, p_value: 0.053 },
    { from: 58, to: 25, p_value: 0.046 },
    { from: 93, to: 91, p_value: 0.031 },
    { from: 6, to: 28, p_value: 0.03 },
    { from: 36, to: 2, p_value: 0.091 },
    { from: 29, to: 79, p_value: 0.065 },
    { from: 90, to: 64, p_value: 0.073 },
    { from: 75, to: 50, p_value: 0.038 },
    { from: 87, to: 63, p_value: 0.098 },
    { from: 69, to: 13, p_value: 0.005 },
    { from: 70, to: 92, p_value: 0.035 },
    { from: 66, to: 88, p_value: 0.095 },
    { from: 5, to: 97, p_value: 0.052 },
    { from: 7, to: 89, p_value: 0.084 },
    { from: 41, to: 72, p_value: 0.006 },
    { from: 45, to: 62, p_value: 0.069 },
    { from: 50, to: 57, p_value: 0.01 },
    { from: 17, to: 18, p_value: 0.028 },
  ];



