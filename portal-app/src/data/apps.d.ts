export interface App {
  id: string;
  name: string;
  url: string;
  category?: string;
  target?: string;
  color?: string;
  icon?: string;
  meta?: Record<string, any>;
}

export interface GetAppsOptions {
  includeCategories?: string[];
  extraApps?: App[];
}

export function getAppsForRole(role?: string, options?: GetAppsOptions): App[];
export function registerRoleMap(map: Record<string, string[]>): void;
export function registerApps(appsArray: App[]): void;
export function loadRemoteApps(url?: string): Promise<any | null>;
export function validateApp(app: App): boolean;
export const defaultApps: App[];
export const defaultRoleMap: Record<string, string[]>;