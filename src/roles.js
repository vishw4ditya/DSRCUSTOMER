export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  REGIONAL_MANAGER: 'RegionalManager',
  BRANCH_HEAD: 'BranchHead',
  TECHNICIAN: 'Technician',
  SALESPERSON: 'Salesperson',
};

export const ALL_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.REGIONAL_MANAGER,
  ROLES.BRANCH_HEAD,
  ROLES.TECHNICIAN,
  ROLES.SALESPERSON,
];

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.REGIONAL_MANAGER]: 'Regional Manager',
  [ROLES.BRANCH_HEAD]: 'Branch Manager',
  [ROLES.TECHNICIAN]: 'Technician',
  [ROLES.SALESPERSON]: 'Salesperson',
};

// Roles offered on the public self-registration form (Super Admin is excluded on purpose)
export const REGISTERABLE_ROLES = [
  ROLES.REGIONAL_MANAGER,
  ROLES.BRANCH_HEAD,
  ROLES.TECHNICIAN,
  ROLES.SALESPERSON,
];

export const DASHBOARD_PATH = {
  [ROLES.SUPER_ADMIN]: '/super-admin',
  [ROLES.REGIONAL_MANAGER]: '/regional-manager',
  [ROLES.BRANCH_HEAD]: '/branch-head',
  [ROLES.TECHNICIAN]: '/technician',
  [ROLES.SALESPERSON]: '/salesperson',
};

export const STATUSES = {
  ACTIVE: 'active',
  PENDING: 'pending',
  REJECTED: 'rejected',
  DISABLED: 'disabled',
};

export function hasRole(user, allowedRoles) {
  if (!user || !user.role) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(user.role);
}

export function isSuperAdmin(user) {
  return user?.role === ROLES.SUPER_ADMIN && user?.status === 'active';
}

export function isRegionalManager(user) {
  return user?.role === ROLES.REGIONAL_MANAGER;
}

export function isBranchHead(user) {
  return user?.role === ROLES.BRANCH_HEAD;
}

export function isTechnician(user) {
  return user?.role === ROLES.TECHNICIAN;
}

export function isSalesperson(user) {
  return user?.role === ROLES.SALESPERSON;
}
