import { useState } from 'react';
import Modal from './Modal';
import { updateCustomer, updateVisit } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function toDateInputValue(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    if (value.includes('T')) return value.split('T')[0];
    if (value.length >= 10 && value.includes('-')) return value.slice(0, 10);
  }
  if (value?.toDate && typeof value.toDate === 'function') {
    const d = value.toDate();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

export default function CustomerEditModal({ record = {}, onClose, onSaved }) {
  const { user } = useAuth();
  const recId = record.id || record._id;

  // Determine if this is a Technician-created record vs Salesperson-created record
  const isTechnicianRecord =
    record.addedByRole === 'Technician' ||
    record.createdByRole === 'Technician' ||
    record.salespersonRole === 'Technician' ||
    Boolean(record.technicianId) ||
    Boolean(record.visitType && !record.customerType);

  // Role-based authorization check
  const isAuthorized =
    user?.role === 'SuperAdmin' ||
    user?.role === 'RegionalManager' ||
    user?.role === 'BranchHead' ||
    record.addedByUserId === user?.uid ||
    record.createdBy === user?.uid ||
    record.technicianId === user?.uid ||
    record.salespersonId === user?.uid ||
    (user?.branchId && record.branchId === user?.branchId);

  const initialCustomerType = record.customerType || record.leadTemperature || record.temperature || 'Warm';
  const initialVisitType = record.visitType || record.serviceType || 'Installation';

  const [form, setForm] = useState({
    name: record.customerName || record.customer || record.name || '',
    phone: record.phone || '',
    address: record.detailedAddress || record.location || record.address || record.liveLocation?.address || '',
    productName: record.productName || '',
    visitType: initialVisitType,
    customerType: initialCustomerType,
    visitDate: toDateInputValue(record.visitDate || record.date),
    nextVisitDate: toDateInputValue(record.nextVisitDate),
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) {
      setError('You are not authorized to edit this customer record.');
      return;
    }
    setError('');
    setSaving(true);

    try {
      const updatedFields = {
        customer: form.name.trim(),
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        location: form.address.trim(),
        address: form.address.trim(),
        detailedAddress: form.address.trim(),
        productName: form.productName.trim(),
        date: form.visitDate || new Date().toISOString().split('T')[0],
        visitDate: form.visitDate || new Date().toISOString().split('T')[0],
        nextVisitDate: form.nextVisitDate || null,
        updatedAt: new Date().toISOString(),
      };

      if (isTechnicianRecord) {
        updatedFields.visitType = form.visitType;
      } else {
        updatedFields.customerType = form.customerType;
        updatedFields.leadTemperature = form.customerType;
      }

      await updateCustomer(recId, updatedFields);
      try {
        await updateVisit(recId, updatedFields);
      } catch {
        // Best-effort update if separate visits doc exists
      }

      onSaved();
    } catch (err) {
      console.error('[CustomerEditModal] Update error:', err);
      setError(err.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const currentTypeNormalized = (form.customerType || '').toLowerCase();
  const currentVisitTypeNormalized = (form.visitType || '').toLowerCase();

  return (
    <Modal title={`Edit Customer Visit (${isTechnicianRecord ? 'Technician' : 'Salesperson'})`} onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}
        {!isAuthorized && (
          <div className="alert alert-warning">
            Warning: You do not have permission to modify this customer record.
          </div>
        )}

        <div className="form-row-2">
          <div>
            <label>Customer Name</label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              disabled={saving || !isAuthorized}
              placeholder="Customer Name"
            />
          </div>
          <div>
            <label>Phone</label>
            <input
              required
              value={form.phone}
              onChange={set('phone')}
              disabled={saving || !isAuthorized}
              placeholder="Phone Number(s)"
            />
          </div>
        </div>

        <div>
          <label>Detailed Address</label>
          <input
            required
            value={form.address}
            onChange={set('address')}
            disabled={saving || !isAuthorized}
            placeholder="Detailed Address"
          />
        </div>

        <div className="form-row-2">
          <div>
            <label>Product Name</label>
            <input
              required
              value={form.productName}
              onChange={set('productName')}
              disabled={saving || !isAuthorized}
              placeholder="Product Name"
            />
          </div>
          <div>
            <label>Visit Date</label>
            <input
              required
              type="date"
              value={form.visitDate}
              onChange={set('visitDate')}
              disabled={saving || !isAuthorized}
            />
          </div>
        </div>

        <div className="form-row-2">
          {isTechnicianRecord ? (
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Visit Type</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="modalVisitType"
                    value="Installation"
                    checked={currentVisitTypeNormalized === 'installation'}
                    onChange={() => setForm((f) => ({ ...f, visitType: 'Installation' }))}
                    disabled={saving || !isAuthorized}
                  />
                  Installation
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="modalVisitType"
                    value="Service"
                    checked={currentVisitTypeNormalized === 'service'}
                    onChange={() => setForm((f) => ({ ...f, visitType: 'Service' }))}
                    disabled={saving || !isAuthorized}
                  />
                  Service
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Customer Type</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="modalCustomerType"
                    value="Hot"
                    checked={currentTypeNormalized === 'hot'}
                    onChange={() => setForm((f) => ({ ...f, customerType: 'Hot' }))}
                    disabled={saving || !isAuthorized}
                  />
                  Hot
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="modalCustomerType"
                    value="Cold"
                    checked={currentTypeNormalized === 'cold'}
                    onChange={() => setForm((f) => ({ ...f, customerType: 'Cold' }))}
                    disabled={saving || !isAuthorized}
                  />
                  Cold
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="modalCustomerType"
                    value="Warm"
                    checked={currentTypeNormalized === 'warm'}
                    onChange={() => setForm((f) => ({ ...f, customerType: 'Warm' }))}
                    disabled={saving || !isAuthorized}
                  />
                  Warm
                </label>
              </div>
            </div>
          )}

          <div>
            <label>Next Visit Date</label>
            <input
              required
              type="date"
              value={form.nextVisitDate}
              onChange={set('nextVisitDate')}
              disabled={saving || !isAuthorized}
            />
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || !isAuthorized}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
