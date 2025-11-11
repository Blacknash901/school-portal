// Role detection helper for CECRESG portal

export const GROUP_PRIORITY = [
  "CECRESG Admin IT",
  "CECRESG Admin Billing",
  "CECRESG Admins",
  "CECRESG Teachers",
  "CECRESG Students",
  "CECRESG Parents",
];

export const GROUP_ROLE_MAP = {
  "CECRESG Admin IT": "AdminIT",
  "CECRESG Admin Billing": "AdminBilling",
  "CECRESG Admins": "Admin",
  "CECRESG Teachers": "Teacher",
  "CECRESG Students": "Student",
  "CECRESG Parents": "Parent",
};

/**
 * Returns the highest-priority role based on group membership
 * @param {string[]} groups
 * @param {string|null} override
 * @returns {string} role
 */
export function getRoleFromGroups(groups = [], override = null) {
  if (override) return override;
  if (!groups.length) return "Guest";

  // Iterate through GROUP_PRIORITY to find the first matching group
  for (const group of GROUP_PRIORITY) {
    if (groups.includes(group)) {
      return GROUP_ROLE_MAP[group]; // Return the role for the first matching group
    }
  }

  return "Guest";
}
