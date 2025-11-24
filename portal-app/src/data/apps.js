import envelopeIcon from "../assets/images/Outlook_512.png";
import awsIcon from "../assets/images/AWS-Cloud-logo_32.svg";
import azureIcon from "../assets/images/10018-icon-service-Azure-A.svg";
import paymentIcon from "../assets/images/shopping-cart.svg";
import entraIcon from "../assets/images/Microsoft Entra ID BW icon.svg";
import m365adminIcon from "../assets/images/Microsoft Entra ID BW icon.svg";
import excelIcon from "../assets/images/Excel_512.png";
import wordIcon from "../assets/images/Word_512.png";
import powerpointIcon from "../assets/images/PowerPoint_512.png";
import teamsIcon from "../assets/images/Teams_512.png";
import wootitIcon from "../assets/images/wootit-logo.PNG";
import moodleIcon from "../assets/images/moodle-svgrepo-com.svg";
/**
 * Structured app definitions and helpers
 * - getAppsForRole(role, { includeCategories, extraApps })
 * - registerApps(), registerRoleMap(), loadRemoteApps()
 *
 * Colors use a pastel palette (matches UnifiedNews)
 */

/**
 * @typedef {Object} App
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string} [category]
 * @property {string} [target]
 * @property {string} [color]    // pastel hex color used as card background / icon bg
 * @property {string} [icon]     // emoji or image URL
 * @property {Object} [meta]
 */

const PASTEL_PALETTE = [
  "#FFD1DC", // pink
  "#FFECB3", // soft yellow
  "#C8E6C9", // light green
  "#BBDEFB", // light blue
  "#D1C4E9", // lavender
  "#FFE0B2", // peach
  "#B2EBF2", // aqua

  "#FFD1DC", // pink
  "#FFB3BA", // coral pink
  "#FFCCD5", // soft rose
  "#FADADD", // blush

  // 🍑 Oranges & Yellows
  "#FFE0B2", // peach
  "#FFECB3", // soft yellow
  "#FFF5BA", // light butter
  "#FEE1B9", // pale orange

  // 🌿 Greens
  "#C8E6C9", // light green
  "#DCEDC8", // mint
  "#E0F2F1", // teal mist
  "#D0F0C0", // honeydew

  // 🌊 Blues
  "#BBDEFB", // light blue
  "#B2EBF2", // aqua
  "#C5CAE9", // soft periwinkle
  "#D1C4E9", // lavender
];

// Category display names
export const CATEGORY_NAMES = {
  work: "Calificaciones y Trabajo",
  office: "Office",
  admin: "Administración de Usuarios y Portal",
};

const DEFAULT_APPS = [
  // Work category
  {
    id: "moodle",
    name: "Moodle",
    url: "https://moodle.cecre.net",
    category: "work",
    color: PASTEL_PALETTE[1],
    icon: moodleIcon,
  },
  {
    id: "wootit",
    name: "WootIt",
    url: "https://wootit.cr/cecre",
    category: "work",
    color: PASTEL_PALETTE[0],
    icon: wootitIcon,
  },
  {
    id: "teams",
    name: "Teams",
    url: "https://teams.microsoft.com",
    category: "work",
    color: PASTEL_PALETTE[3],
    icon: teamsIcon,
  },
  {
    id: "outlook",
    name: "Correo",
    url: "https://outlook.office.com",
    category: "work",
    color: PASTEL_PALETTE[6],
    icon: envelopeIcon,
  },

  // Office category
  {
    id: "office",
    name: "Office.com",
    url: "https://www.office.com",
    category: "office",
    color: PASTEL_PALETTE[4],
    icon: "O",
    hidden: true, // Keep in code but don't display
  },
  {
    id: "word",
    name: "Word",
    url: "https://word.office.com",
    category: "office",
    color: PASTEL_PALETTE[3],
    icon: wordIcon,
  },
  {
    id: "excel",
    name: "Excel",
    url: "https://excel.office.com",
    category: "office",
    color: PASTEL_PALETTE[2],
    icon: excelIcon,
  },
  {
    id: "powerpoint",
    name: "PowerPoint",
    url: "https://powerpoint.office.com",
    category: "office",
    color: PASTEL_PALETTE[5],
    icon: powerpointIcon,
  },

  {
    id: "entra",
    name: "Microsoft Entra",
    url: "https://entra.microsoft.com",
    category: "admin",
    color: PASTEL_PALETTE[6],
    icon: entraIcon,
  },
  {
    id: "m365admin",
    name: "Microsoft 365 Admin Center",
    url: "https://admin.microsoft.com",
    category: "admin",
    color: PASTEL_PALETTE[4],
    icon: m365adminIcon,
  },
  {
    id: "azure",
    name: "Azure Portal",
    url: "https://portal.azure.com",
    category: "admin",
    color: PASTEL_PALETTE[3],
    icon: azureIcon,
  },
  {
    id: "AWS",
    name: "AWS",
    url: "https://launcher.myapps.microsoft.com/api/signin/b87924f9-2f53-4d21-b261-e356b5ecf26a?tenantId=24369e0d-cf1e-434c-8c7c-7dc57a4e0adf",
    category: "admin",
    color: PASTEL_PALETTE[3],
    icon: awsIcon,
  },
  {
    id: "pagos",
    name: "Pagos en línea",
    url: "https://pagos.cecre.net",
    category: "payments",
    color: PASTEL_PALETTE[18],
    icon: paymentIcon,
  },
];

let ROLE_MAP = {
  Guest: ["wootit", "moodle", "teams"],

  Parent: ["wootit", "moodle", "teams", "pagos"],

  Student: [
    "wootit",
    "moodle",
    "teams",
    "office",
    "word",
    "excel",
    "powerpoint",
    "outlook",
  ],

  Teacher: [
    "wootit",
    "moodle",
    "teams",
    "office",
    "word",
    "excel",
    "powerpoint",
    "outlook",
  ],

  Admin: [
    "wootit",
    "moodle",
    "teams",
    "office",
    "word",
    "excel",
    "powerpoint",
    "outlook",
    "m365admin",
  ],

  AdminBilling: [
    "wootit",
    "moodle",
    "teams",
    "office",
    "word",
    "excel",
    "powerpoint",
    "outlook",
    "m365admin",
    "AWS",
    "pagos",
  ],

  AdminIT: [
    "wootit",
    "moodle",
    "teams",
    "office",
    "word",
    "excel",
    "powerpoint",
    "outlook",
    "m365admin",
    "azure",
    "AWS",
  ],
};

function findAppById(id) {
  return DEFAULT_APPS.find((a) => a.id === id);
}

/**
 * Get apps for a role.
 * @param {string} [role="Basic"]
 * @param {{ includeCategories?: string[] , extraApps?: any[] }} [options]
 * @returns {Array}
 */
export function getAppsForRole(role = "Guest", options = {}) {
  const { includeCategories = null, extraApps = [] } = options;
  const ids = ROLE_MAP[role] || ROLE_MAP.Guest;
  const apps = ids.map(findAppById).filter(Boolean);

  // merge extras (extras override by id)
  const extrasById = new Map((extraApps || []).map((e) => [e.id, e]));
  const baseFiltered = apps.filter((a) => !extrasById.has(a.id));
  const merged = [...baseFiltered, ...extraApps];

  return merged
    .map((a) => ({ ...a })) // shallow copy to avoid accidental mutation
    .filter((a) =>
      includeCategories ? includeCategories.includes(a.category) : true
    )
    .filter((a) => !a.hidden); // Filter out hidden apps
}

/**
 * Register or extend role map at runtime
 * @param {Object<string,string[]>} map
 */
export function registerRoleMap(map = {}) {
  ROLE_MAP = { ...ROLE_MAP, ...map };
}

/**
 * Add or override apps in DEFAULT_APPS
 * @param {Array} appsArray
 */
export function registerApps(appsArray = []) {
  for (const app of appsArray) {
    const idx = DEFAULT_APPS.findIndex((a) => a.id === app.id);
    if (idx >= 0) DEFAULT_APPS[idx] = { ...DEFAULT_APPS[idx], ...app };
    else DEFAULT_APPS.push(app);
  }
}

/**
 * Optionally load remote apps JSON and merge.
 * Expected remote shape: { apps: [...], mappings: {...} }
 * @param {string} [url=process.env.REACT_APP_APPS_URL]
 */
export async function loadRemoteApps(url = process.env.REACT_APP_APPS_URL) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const remote = await res.json();
    if (Array.isArray(remote.apps)) registerApps(remote.apps);
    if (remote.mappings) registerRoleMap(remote.mappings);
    return remote;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("loadRemoteApps:", err.message || err);
    return null;
  }
}

/**
 * Basic validator
 * @param {any} app
 * @returns {boolean}
 */
export function validateApp(app) {
  return !!(
    app &&
    typeof app.id === "string" &&
    typeof app.name === "string" &&
    typeof app.url === "string"
  );
}

export { DEFAULT_APPS as defaultApps, ROLE_MAP as defaultRoleMap };
