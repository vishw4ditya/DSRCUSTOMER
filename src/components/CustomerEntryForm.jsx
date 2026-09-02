import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CUSTOMER_TYPES } from '../customerTypes';

const emptyForm = {
  name: '',
  phone: '',
  address: '',
  productName: '',
  visitDate: '',
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
          // Reverse-geocode the coordinates into a full postal address so the
          // field isn't left with just a pin - this pre-fills, but the user
          // can still edit/correct it before saving.
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { Accept: 'application/json' } }
          );
          const data = await res.json();
          if (data?.display_name) {
            setForm((f) => ({ ...f, address: data.display_name }));
          }
        } catch {
          // Reverse geocoding is best-effort only - if it fails, the user just types the address manually
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
      await api.post('/customers', {
        name: form.name,
        phone: form.phone,
        address: form.address,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        productName: form.productName,
        visitDate: form.visitDate,
        nextVisitDate: form.nextVisitDate || null,
        visitType: isTechnician ? form.visitType : undefined,
        customerType: isSalesperson ? form.customerType : undefined,
      });
      setSuccess('Customer visit recorded successfully');
      setForm(emptyForm);
      setCoords(null);
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Add Customer Visit</h2>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form className="form-grid" onSubmit={submit}>
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
          <label>Live Location</label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={captureLocation} disabled={locating}>
              {locating ? 'Getting location...' : coords ? 'Location captured ✓' : 'Capture Current Location'}
            </button>
            {coords && (
              <span className="helper-text">
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              </span>
            )}
          </div>
          <label>Detailed Address</label>
          <textarea
            required
            rows={3}
            placeholder="House/flat no., street, area, landmark, city, state, PIN code"
            value={form.address}
            onChange={set('address')}
          />
          <p className="helper-text">
            Tap "Capture Current Location" to auto-fill this from GPS, then edit it so it's a complete, accurate
            address (not just a pin).
          </p>
        </div>

        <div className="form-row-2">
          <div>
            <label>Product Name</label>
            <input required value={form.productName} onChange={set('productName')} />
          </div>
          {isTechnician && (
            <div>
              <label>Visit Type</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="visitType"
                    value="Installation"
                    checked={form.visitType === 'Installation'}
                    onChange={set('visitType')}
                  />
                  Installation
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="visitType"
                    value="Service"
                    checked={form.visitType === 'Service'}
                    onChange={set('visitType')}
                  />
                  Service
                </label>
              </div>
            </div>
          )}
          {isSalesperson && (
            <div>
              <label>Customer Type</label>
              <div className="radio-group">
                {CUSTOMER_TYPES.map((t) => (
                  <label className="radio-option" key={t}>
                    <input
                      type="radio"
                      name="customerType"
                      value={t}
                      checked={form.customerType === t}
                      onChange={set('customerType')}
                    />
                    {t}
                  </label>
                ))}
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

        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Visit Record'}
        </button>
      </form>
    </div>
  );
}
