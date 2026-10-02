import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { addCustomer, addVisit } from '../services/firebase';

const emptyForm = {
  name: '',
  phone: '',
  address: '',
  productName: '',
  visitDate: new Date().toISOString().split('T')[0],
  nextVisitDate: '',
  visitType: 'Installation',
  customerType: 'Warm',
};

export default function CustomerEntryForm({ onSaved }) {
  const { user } = useAuth();
  const isTechnician = user?.role === 'Technician';
  const isSalesperson = user?.role === 'Salesperson';
  const [form, setForm] = useState(emptyForm);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { Accept: 'application/json' } }
          );
          const data = await res.json();
          if (data?.display_name) {
            setForm((f) => ({ ...f, address: data.display_name }));
          }
        } catch {
          // Reverse geocoding best-effort fallback
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setError(`Could not get location: ${err.message}`);
        setLocating(false);
      }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.address.trim()) {
      setError('Please enter or capture a detailed address before saving');
      return;
    }
    setSaving(true);
    try {
      const visitRecord = {
        customer: form.name.trim(),
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        location: form.address.trim(),
        address: form.address.trim(),
        detailedAddress: form.address.trim(),
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        productName: form.productName.trim(),
        date: form.visitDate || new Date().toISOString().split('T')[0],
        visitDate: form.visitDate || new Date().toISOString().split('T')[0],
        nextVisitDate: form.nextVisitDate || null,
        visitType: isTechnician ? form.visitType : (isSalesperson ? 'Sales Demo' : 'General Visit'),
        customerType: isSalesperson ? form.customerType : 'Warm',
        leadTemperature: isSalesperson ? form.customerType : 'Warm',
        addedByUserId: user?.uid || null,
        salespersonId: isSalesperson ? user?.uid || null : null,
        technicianId: isTechnician ? user?.uid || null : null,
        createdBy: user?.uid || null,
        createdByRole: user?.role || 'Technician',
        zoneId: user?.zoneId || null,
        branchId: user?.branchId || null,
        salesperson: user?.name || 'Field Staff',
        salespersonRole: user?.role || 'Technician',
        addedByRole: user?.role || 'Technician',
        status: 'Completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addCustomer(visitRecord);
      await addVisit(visitRecord);

      setSuccess('Customer visit recorded successfully!');
      setForm({ ...emptyForm, visitDate: new Date().toISOString().split('T')[0] });
      setCoords(null);
      if (onSaved) onSaved();
    } catch (err) {
      console.error('[CustomerEntryForm] Submit error:', err);
      setError(err.message || 'Could not save this record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Add Customer Visit ({isTechnician ? 'Technician' : 'Salesperson'})</h2>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form className="form-grid" onSubmit={submit}>
        <div className="form-row-2">
          <div>
            <label>Customer Name</label>
            <input required value={form.name} onChange={set('name')} disabled={saving} placeholder="Customer Name" />
          </div>
          <div>
            <label>Phone Number</label>
            <input required value={form.phone} onChange={set('phone')} disabled={saving} placeholder="Phone Number(s)" />
          </div>
        </div>

        <div>
          <label>Detailed Address</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input required value={form.address} onChange={set('address')} disabled={saving} placeholder="Detailed Address" style={{ flex: 1 }} />
            <button type="button" className="btn btn-outline btn-sm" onClick={captureLocation} disabled={locating || saving}>
              {locating ? 'Locating...' : 'GPS Capture'}
            </button>
          </div>
        </div>

        <div className="form-row-2">
          <div>
            <label>Product Name</label>
            <input required value={form.productName} onChange={set('productName')} disabled={saving} placeholder="Product Name" />
          </div>
          <div>
            <label>Visit Date</label>
            <input required type="date" value={form.visitDate} onChange={set('visitDate')} disabled={saving} />
          </div>
        </div>

        <div className="form-row-2">
          {isTechnician ? (
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Visit Type</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="entryVisitType"
                    value="Installation"
                    checked={form.visitType === 'Installation'}
                    onChange={() => setForm((f) => ({ ...f, visitType: 'Installation' }))}
                    disabled={saving}
                  />
                  Installation
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="entryVisitType"
                    value="Service"
                    checked={form.visitType === 'Service'}
                    onChange={() => setForm((f) => ({ ...f, visitType: 'Service' }))}
                    disabled={saving}
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
                    name="entryCustomerType"
                    value="Hot"
                    checked={form.customerType === 'Hot'}
                    onChange={() => setForm((f) => ({ ...f, customerType: 'Hot' }))}
                    disabled={saving}
                  />
                  Hot
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="entryCustomerType"
                    value="Cold"
                    checked={form.customerType === 'Cold'}
                    onChange={() => setForm((f) => ({ ...f, customerType: 'Cold' }))}
                    disabled={saving}
                  />
                  Cold
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="entryCustomerType"
                    value="Warm"
                    checked={form.customerType === 'Warm'}
                    onChange={() => setForm((f) => ({ ...f, customerType: 'Warm' }))}
                    disabled={saving}
                  />
                  Warm
                </label>
              </div>
            </div>
          )}

          <div>
            <label>Next Visit Date</label>
            <input required type="date" value={form.nextVisitDate} onChange={set('nextVisitDate')} disabled={saving} />
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Recording visit...' : 'Record Visit'}
        </button>
      </form>
    </div>
  );
}
