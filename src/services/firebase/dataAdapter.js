import { isFirebaseConfigured } from './config';
import { getCollectionDocs, COLLECTIONS } from './firestore';

/**
 * Role-based Scoping Helper
 */
export function scopeDataForUser(data = [], currentUser = null) {
  if (!currentUser || !Array.isArray(data)) return [];
  const { role, zoneId, branchId, uid } = currentUser;

  if (role === 'SuperAdmin') {
    return data;
  }

  if (role === 'RegionalManager') {
    if (!zoneId) return data;
    return data.filter((item) => item.zoneId === zoneId || item.zone === zoneId || !item.zoneId);
  }

  if (role === 'BranchHead') {
    if (!branchId) return data.filter((item) => item.zoneId === zoneId || !item.zoneId);
    return data.filter((item) => item.branchId === branchId || item.branch === branchId || (!item.branchId && item.zoneId === zoneId));
  }

  if (role === 'Technician' || role === 'Salesperson') {
    return data.filter((item) => (
      item.addedByUserId === uid ||
      item.assignedToUid === uid ||
      item.createdBy === uid ||
      (branchId && item.branchId === branchId)
    ));
  }

  return data;
}

/**
 * Date matching helper for "Today"
 */
export function isTodayDate(dateStrOrTimestamp) {
  if (!dateStrOrTimestamp) return false;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (typeof dateStrOrTimestamp === 'string') {
    return dateStrOrTimestamp.startsWith(todayStr);
  }
  if (dateStrOrTimestamp?.toDate && typeof dateStrOrTimestamp.toDate === 'function') {
    const d = dateStrOrTimestamp.toDate();
    const dYyyy = d.getFullYear();
    const dMm = String(d.getMonth() + 1).padStart(2, '0');
    const dDd = String(d.getDate()).padStart(2, '0');
    return `${dYyyy}-${dMm}-${dDd}` === todayStr;
  }
  if (dateStrOrTimestamp instanceof Date) {
    const dYyyy = dateStrOrTimestamp.getFullYear();
    const dMm = String(dateStrOrTimestamp.getMonth() + 1).padStart(2, '0');
    const dDd = String(dateStrOrTimestamp.getDate()).padStart(2, '0');
    return `${dYyyy}-${dMm}-${dDd}` === todayStr;
  }
  return false;
}

/**
 * Calculates timeGroup for follow-ups
 */
export function formatFollowUpTimeGroup(dueDateStr, status) {
  if (!dueDateStr) return 'Upcoming';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) return 'Upcoming';
  due.setHours(0, 0, 0, 0);

  if (due.getTime() === today.getTime()) {
    return 'Due Today';
  }
  if (due.getTime() === tomorrow.getTime()) {
    return 'Due Tomorrow';
  }
  if (due.getTime() < today.getTime() && status !== 'Completed') {
    return 'Overdue';
  }
  return 'Upcoming';
}

/**
 * Pure Firestore Dashboard Stats Calculator
 */
export async function getDashboardStats(currentUser = null) {
  if (!isFirebaseConfigured()) {
    return getEmptyStats();
  }

  try {
    const [customers, leads, visits, followUps, users, zones, branches] = await Promise.all([
      getCollectionDocs(COLLECTIONS.CUSTOMERS),
      getCollectionDocs(COLLECTIONS.LEADS),
      getCollectionDocs(COLLECTIONS.VISITS),
      getCollectionDocs(COLLECTIONS.FOLLOW_UPS),
      getCollectionDocs(COLLECTIONS.USERS),
      getCollectionDocs(COLLECTIONS.ZONES),
      getCollectionDocs(COLLECTIONS.BRANCHES),
    ]);

    return computeStatsFromRawData({ customers, leads, visits, followUps, users, zones, branches }, currentUser);
  } catch (err) {
    console.warn('[DataAdapter] Error calculating Firestore stats:', err);
    return getEmptyStats();
  }
}

export function computeStatsFromRawData({ customers = [], leads = [], visits = [], followUps = [], users = [], zones = [], branches = [] }, currentUser = null) {
  const scopedUsers = scopeDataForUser(users, currentUser);
  const scopedCustomers = scopeDataForUser(customers, currentUser);
  const scopedLeads = scopeDataForUser(leads, currentUser);
  const scopedVisits = scopeDataForUser(visits, currentUser);
  const scopedFollowUps = scopeDataForUser(followUps, currentUser);

  // If visits collection is empty, merge customer visit records
  const allVisits = scopedVisits.length > 0 ? scopedVisits : scopedCustomers.filter((c) => c.visitType || c.date || c.visitDate);

  const totalSuperAdmins = users.filter((u) => u.role === 'SuperAdmin').length;
  const totalRegionalManagers = scopedUsers.filter((u) => u.role === 'RegionalManager').length;
  const totalBranchHeads = scopedUsers.filter((u) => u.role === 'BranchHead').length;
  const totalTechnicians = scopedUsers.filter((u) => u.role === 'Technician').length;
  const totalSalespersons = scopedUsers.filter((u) => u.role === 'Salesperson').length;
  const pendingApprovals = scopedUsers.filter((u) => u.status === 'pending').length;
  const activeStaff = scopedUsers.filter((u) => u.status === 'active' || u.isActive === true).length;

  const todaysVisits = allVisits.filter((v) => isTodayDate(v.date || v.visitDate)).length;
  const dueToday = scopedFollowUps.filter((f) => {
    const tg = f.timeGroup || formatFollowUpTimeGroup(f.dueDate || f.date, f.status);
    return tg === 'Due Today' && f.status !== 'Completed';
  }).length;

  const hotLeads = scopedLeads.filter((l) => {
    const temp = l.leadTemperature || l.customerType || l.temperature;
    return temp === 'Hot';
  }).length + scopedCustomers.filter((c) => (c.customerType === 'Hot' || c.leadTemperature === 'Hot')).length;

  return {
    totalCustomers: scopedCustomers.length,
    newLeads: scopedLeads.length || scopedCustomers.filter((c) => c.customerType === 'Hot' || c.customerType === 'Warm').length,
    todaysVisits,
    dueToday,
    hotLeads,
    activeStaff,
    pendingApprovals,
    totalSuperAdmins,
    totalRegionalManagers,
    totalBranchHeads,
    totalTechnicians,
    totalSalespersons,
    totalZones: zones.length,
    totalBranches: branches.length,
  };
}

export function getEmptyStats() {
  return {
    totalCustomers: 0,
    newLeads: 0,
    todaysVisits: 0,
    dueToday: 0,
    hotLeads: 0,
    activeStaff: 0,
    pendingApprovals: 0,
    totalSuperAdmins: 0,
    totalRegionalManagers: 0,
    totalBranchHeads: 0,
    totalTechnicians: 0,
    totalSalespersons: 0,
    totalZones: 0,
    totalBranches: 0,
  };
}

export async function getLeadOverviewData(currentUser = null) {
  if (isFirebaseConfigured()) {
    const [leads, customers] = await Promise.all([
      getCollectionDocs(COLLECTIONS.LEADS),
      getCollectionDocs(COLLECTIONS.CUSTOMERS),
    ]);
    const scopedLeads = scopeDataForUser(leads, currentUser);
    const scopedCustomers = scopeDataForUser(customers, currentUser);
    const combined = [...scopedLeads, ...scopedCustomers];

    return computeLeadOverviewFromRawData(combined);
  }
  return {
    hot: { count: 0, percentage: 0 },
    warm: { count: 0, percentage: 0 },
    cold: { count: 0, percentage: 0 },
    total: 0,
  };
}

export function computeLeadOverviewFromRawData(combinedItems = []) {
  if (!combinedItems || combinedItems.length === 0) {
    return {
      hot: { count: 0, percentage: 0 },
      warm: { count: 0, percentage: 0 },
      cold: { count: 0, percentage: 0 },
      total: 0,
    };
  }

  const hotCount = combinedItems.filter((l) => (l.leadTemperature === 'Hot' || l.customerType === 'Hot')).length;
  const warmCount = combinedItems.filter((l) => (l.leadTemperature === 'Warm' || l.customerType === 'Warm')).length;
  const coldCount = combinedItems.filter((l) => (l.leadTemperature === 'Cold' || l.customerType === 'Cold')).length;
  const total = hotCount + warmCount + coldCount || combinedItems.length;

  return {
    hot: { count: hotCount, percentage: total > 0 ? Math.round((hotCount / total) * 100) : 0 },
    warm: { count: warmCount, percentage: total > 0 ? Math.round((warmCount / total) * 100) : 0 },
    cold: { count: coldCount, percentage: total > 0 ? Math.round((coldCount / total) * 100) : 0 },
    total,
  };
}

export async function getCustomerVisitsData(currentUser = null) {
  if (isFirebaseConfigured()) {
    const [visits, customers] = await Promise.all([
      getCollectionDocs(COLLECTIONS.VISITS),
      getCollectionDocs(COLLECTIONS.CUSTOMERS),
    ]);
    const scopedVisits = scopeDataForUser(visits, currentUser);
    const scopedCustomers = scopeDataForUser(customers, currentUser);

    const merged = scopedVisits.length > 0 ? scopedVisits : scopedCustomers;
    return merged.map((v) => ({
      id: v.id,
      customer: v.customer || v.name || 'Unknown Customer',
      phone: v.phone || '-',
      salesperson: v.salesperson || v.addedByName || 'Field Staff',
      salespersonRole: v.salespersonRole || v.addedByRole || 'Staff',
      branch: v.branch || v.branchId || 'Main Branch',
      location: v.location || v.address || '-',
      status: v.status || 'Pending',
      visitType: v.visitType || 'Routine Visit',
      leadTemperature: v.leadTemperature || v.customerType || 'Warm',
      date: v.date || v.visitDate || v.createdAt || new Date().toISOString().split('T')[0],
      notes: v.notes || '-',
    }));
  }
  return [];
}

export async function getFollowUpsData(currentUser = null) {
  if (isFirebaseConfigured()) {
    const followUps = await getCollectionDocs(COLLECTIONS.FOLLOW_UPS);
    const scoped = scopeDataForUser(followUps, currentUser);

    return scoped.map((f) => {
      const timeGroup = f.timeGroup || formatFollowUpTimeGroup(f.dueDate || f.date, f.status);
      return {
        id: f.id,
        customer: f.customer || f.name || 'Unknown Customer',
        phone: f.phone || '-',
        assignedTo: f.assignedTo || f.assignedStaff || 'Unassigned',
        branch: f.branch || f.branchId || 'Main Branch',
        dueDate: f.dueDate || f.date || new Date().toISOString().split('T')[0],
        timeGroup,
        leadTemperature: f.leadTemperature || f.customerType || 'Warm',
        status: f.status || 'Pending',
        notes: f.notes || 'Follow-up required',
      };
    });
  }
  return [];
}

export async function getNotificationsData(currentUser = null) {
  if (isFirebaseConfigured()) {
    const notifications = await getCollectionDocs(COLLECTIONS.NOTIFICATIONS);
    const scoped = currentUser?.uid
      ? notifications.filter((n) => !n.recipientUid || n.recipientUid === currentUser.uid)
      : notifications;

    return scoped.map((n) => ({
      id: n.id,
      type: n.type || 'info',
      badgeColor: n.badgeColor || (n.unread ? 'red' : 'blue'),
      title: n.title || 'Notification',
      message: n.message || '',
      timestamp: n.timestamp || (n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : 'Recently'),
      unread: n.unread ?? true,
    }));
  }
  return [];
}
