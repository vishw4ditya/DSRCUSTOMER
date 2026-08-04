import { useState } from 'react';
import api from '../api/axios';
import Modal from './Modal';

// Converts an ISO date string to yyyy-mm-dd for an <input type="date">
function toDateInputValue(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export default function CustomerEditModal({ record, onClose, onSaved }) {
  const isTechnicianRecord = record.addedByRole === 'Technician';
  const [form, setForm] = useState({
    name: record.name || '',
    phone: record.phone || '',
    address: record.liveLocation?.address || '',
    productName: record.productName || '',
    visitDate: toDateInputValue(record.visitDate),
    nextVisitDate: toDateInputValue(record.nextVisitDate),
    visitType: record.visitType || 'Installation',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put(`/customers/${record._id}`, {
        name: form.name,
        phone: form.phone,
        address: form.address,
        productName: form.productName,
        visitDate: form.visitDate,
        nextVisitDate: form.nextVisitDate || null,
        visitType: isTechnicianRecord ? form.visitType : undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit Customer Visit" onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-row-2">
          <div>
            <label>Customer Name</label>
            <input required value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label>Phone</label>
            <input required value={form.phone} onChange={set('phone')} />
          </div>
        </div>

        <div>
          <label>Detailed Address</label>
          <textarea required rows={3} value={form.address} onChange={set('address')} />
        </div>

        <div className="form-row-2">
          <div>
            <label>Product Name</label>
            <input required value={form.productName} onChange={set('productName')} />
          </div>
          {isTechnicianRecord && (
            <div>
              <label>Visit Type</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="editVisitType"
                    value="Installation"
                    checked={form.visitType === 'Installation'}
                    onChange={set('visitType')}
                  />
                  Installation
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="editVisitType"
                    value="Service"
                    checked={form.visitType === 'Service'}
                    onChange={set('visitType')}
                  />
                  Service
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="form-row-2">
          <div>
            <label>Visit Date</label>
            <input required type="date" value={form.visitDate} onChange={set('visitDate')} />
          </div>
          <div>
            <label>Next Visit Date</label>
            <input type="date" value={form.nextVisitDate} onChange={set('nextVisitDate')} />
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
