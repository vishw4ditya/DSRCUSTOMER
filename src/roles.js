export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  REGIONAL_MANAGER: 'RegionalManager',
  BRANCH_HEAD: 'BranchHead',
  TECHNICIAN: 'Technician',
  SALESPERSON: 'Salesperson',
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.REGIONAL_MANAGER]: 'Regional Manager',
  [ROLES.BRANCH_HEAD]: 'Branch Manager',
  [ROLES.TECHNICIAN]: 'Technician',
  [ROLES.SALESPERSON]: 'Salesperson',
};

// Roles offered on the public registration form (Super Admin is excluded on purpose)
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
