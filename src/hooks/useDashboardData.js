import { useState, useEffect } from 'react';
import { subscribeCollectionDocs, COLLECTIONS } from '../services/firebase/firestore';
import {
  computeStatsFromRawData,
  computeLeadOverviewFromRawData,
  scopeDataForUser,
  formatFollowUpTimeGroup,
  getEmptyStats,
} from '../services/firebase/dataAdapter';

export function useDashboardData(currentUser = null) {
  const [data, setData] = useState({
    stats: getEmptyStats(),
    leadOverview: { hot: { count: 0, percentage: 0 }, warm: { count: 0, percentage: 0 }, cold: { count: 0, percentage: 0 }, total: 0 },
    visits: [],
    followUps: [],
    notifications: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const collectionsData = {
      customers: [],
      leads: [],
      visits: [],
      followUps: [],
      users: [],
      zones: [],
      branches: [],
      notifications: [],
    };

    const updateCalculatedData = () => {
      if (!isMounted) return;
      try {
        const stats = computeStatsFromRawData(collectionsData, currentUser);

        const scopedLeads = scopeDataForUser(collectionsData.leads, currentUser);
        const scopedCustomers = scopeDataForUser(collectionsData.customers, currentUser);
        const leadOverview = computeLeadOverviewFromRawData([...scopedLeads, ...scopedCustomers]);

        const scopedVisits = scopeDataForUser(collectionsData.visits, currentUser);
        const mergedVisitsRaw = scopedVisits.length > 0 ? scopedVisits : scopedCustomers;
        const visits = mergedVisitsRaw.map((v) => ({
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

        const scopedFollowUps = scopeDataForUser(collectionsData.followUps, currentUser);
        const followUps = scopedFollowUps.map((f) => {
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

        const scopedNotifs = currentUser?.uid
          ? collectionsData.notifications.filter((n) => !n.recipientUid || n.recipientUid === currentUser.uid)
          : collectionsData.notifications;

        const notifications = scopedNotifs.map((n) => ({
          id: n.id,
          type: n.type || 'info',
          badgeColor: n.badgeColor || (n.unread ? 'red' : 'blue'),
          title: n.title || 'Notification',
          message: n.message || '',
          timestamp: n.timestamp || (n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : 'Recently'),
          unread: n.unread ?? true,
        }));

        setData({
          stats,
          leadOverview,
          visits,
          followUps,
          notifications,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('[useDashboardData] Calculation error:', err);
        if (isMounted) {
          setData((prev) => ({ ...prev, loading: false, error: 'Unable to process dashboard analytics.' }));
        }
      }
    };

    const unsubCustomers = subscribeCollectionDocs(COLLECTIONS.CUSTOMERS, (docs) => {
      collectionsData.customers = docs;
      updateCalculatedData();
    });

    const unsubLeads = subscribeCollectionDocs(COLLECTIONS.LEADS, (docs) => {
      collectionsData.leads = docs;
      updateCalculatedData();
    });

    const unsubVisits = subscribeCollectionDocs(COLLECTIONS.VISITS, (docs) => {
      collectionsData.visits = docs;
      updateCalculatedData();
    });

    const unsubFollowUps = subscribeCollectionDocs(COLLECTIONS.FOLLOW_UPS, (docs) => {
      collectionsData.followUps = docs;
      updateCalculatedData();
    });

    const unsubUsers = subscribeCollectionDocs(COLLECTIONS.USERS, (docs) => {
      collectionsData.users = docs;
      updateCalculatedData();
    });

    const unsubZones = subscribeCollectionDocs(COLLECTIONS.ZONES, (docs) => {
      collectionsData.zones = docs;
      updateCalculatedData();
    });

    const unsubBranches = subscribeCollectionDocs(COLLECTIONS.BRANCHES, (docs) => {
      collectionsData.branches = docs;
      updateCalculatedData();
    });

    const unsubNotifs = subscribeCollectionDocs(COLLECTIONS.NOTIFICATIONS, (docs) => {
      collectionsData.notifications = docs;
      updateCalculatedData();
    });

    const timer = setTimeout(() => {
      if (isMounted && data.loading) {
        updateCalculatedData();
      }
    }, 800);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubCustomers();
      unsubLeads();
      unsubVisits();
      unsubFollowUps();
      unsubUsers();
      unsubZones();
      unsubBranches();
      unsubNotifs();
    };
  }, [currentUser?.uid, currentUser?.role, currentUser?.zoneId, currentUser?.branchId]);

  return data;
}
