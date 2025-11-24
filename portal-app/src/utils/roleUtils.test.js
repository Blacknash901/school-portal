import { getRoleFromGroups, GROUP_PRIORITY, GROUP_ROLE_MAP } from "./roleUtils";

describe("getRoleFromGroups", () => {
  it("should return 'AdminIT' for CECRESG Admin IT group", () => {
    const groups = ["CECRESG Admin IT", "CECRESG Students"];
    expect(getRoleFromGroups(groups)).toBe("AdminIT");
  });

  it("should return 'AdminBilling' for CECRESG Admin Billing group", () => {
    const groups = ["CECRESG Admin Billing"];
    expect(getRoleFromGroups(groups)).toBe("AdminBilling");
  });

  it("should return 'Admin' for CECRESG Admins group", () => {
    const groups = ["CECRESG Admins"];
    expect(getRoleFromGroups(groups)).toBe("Admin");
  });

  it("should return 'Teacher' for CECRESG Teachers group", () => {
    const groups = ["CECRESG Teachers"];
    expect(getRoleFromGroups(groups)).toBe("Teacher");
  });

  it("should return 'Student' for CECRESG Students group", () => {
    const groups = ["CECRESG Students"];
    expect(getRoleFromGroups(groups)).toBe("Student");
  });

  it("should return 'Parent' for CECRESG Parents group", () => {
    const groups = ["CECRESG Parents"];
    expect(getRoleFromGroups(groups)).toBe("Parent");
  });

  it("should return highest priority role when multiple groups present", () => {
    const groups = ["CECRESG Students", "CECRESG Teachers", "CECRESG Parents"];
    // Teachers has higher priority than Students and Parents
    expect(getRoleFromGroups(groups)).toBe("Teacher");
  });

  it("should prioritize AdminIT over other roles", () => {
    const groups = ["CECRESG Students", "CECRESG Admin IT", "CECRESG Teachers"];
    expect(getRoleFromGroups(groups)).toBe("AdminIT");
  });

  it("should return 'Guest' when no matching groups", () => {
    const groups = ["Unknown Group", "Random Group"];
    expect(getRoleFromGroups(groups)).toBe("Guest");
  });

  it("should return 'Guest' when empty groups array", () => {
    const groups = [];
    expect(getRoleFromGroups(groups)).toBe("Guest");
  });

  it("should use roleOverride when provided", () => {
    const groups = ["CECRESG Teachers"];
    expect(getRoleFromGroups(groups, "CustomRole")).toBe("CustomRole");
  });

  it("should return override even with empty groups", () => {
    const groups = [];
    expect(getRoleFromGroups(groups, "OverrideRole")).toBe("OverrideRole");
  });

  it("should export GROUP_PRIORITY array", () => {
    expect(Array.isArray(GROUP_PRIORITY)).toBe(true);
    expect(GROUP_PRIORITY.length).toBeGreaterThan(0);
  });

  it("should export GROUP_ROLE_MAP object", () => {
    expect(typeof GROUP_ROLE_MAP).toBe("object");
    expect(Object.keys(GROUP_ROLE_MAP).length).toBeGreaterThan(0);
  });
});
