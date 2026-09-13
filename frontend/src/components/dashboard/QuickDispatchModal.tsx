import React, { useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ResourceItem, LocationPriorityRank } from '../../types';
import { Boxes, X, Send, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

interface QuickDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLocation?: LocationPriorityRank | null;
  boatResources: ResourceItem[];
  onDispatched: () => void;
}

export const QuickDispatchModal: React.FC<QuickDispatchModalProps> = ({
  isOpen,
  onClose,
  targetLocation,
  boatResources,
  onDispatched,
}) => {
  const { showToast } = useToast();
  const [selectedResourceId, setSelectedResourceId] = useState<number>(
    boatResources.length > 0 ? boatResources[0].id : 0
  );
  const [dispatchCount, setDispatchCount] = useState<number>(10);
  const [notes, setNotes] = useState<string>('Emergency evacuation priority tasking');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentResource = boatResources.find((r) => r.id === selectedResourceId) || boatResources[0];
  const maxAvailable = currentResource ? currentResource.available_quantity : 0;

  const handleDispatch = async () => {
    if (!currentResource) return;
    if (dispatchCount <= 0 || dispatchCount > maxAvailable) {
      showToast({
        type: 'error',
        title: 'Invalid Dispatch Quantity',
        message: `Please select between 1 and ${maxAvailable} available boats.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.updateResource({
        resource_id: currentResource.id,
        available_quantity: currentResource.available_quantity - dispatchCount,
        deployed_quantity: currentResource.deployed_quantity + dispatchCount,
        destination: targetLocation ? `${targetLocation.location_name} (${targetLocation.district})` : 'North Bihar Frontline',
        notes: `Tactical Tasking: ${dispatchCount} units dispatched. ${notes}`,
      });

      showToast({
        type: 'success',
        title: 'Boats Dispatched Successfully!',
        message: `${dispatchCount} rescue boats deployed to ${targetLocation?.location_name || 'Frontline'} with audit log entry.`,
      });

      onDispatched();
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Dispatch Failed',
        message: err.message || 'Error executing resource dispatch transaction.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '560px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                padding: '0.5rem',
                borderRadius: '8px',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              <Boxes size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Emergency Boat Tasking
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Direct SDRF / NDRF motorized fleet deployment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Target Location Card */}
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.07)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                Dispatch Destination
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                {targetLocation ? targetLocation.location_name : 'Priority Hotspot Sector'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {targetLocation ? `${targetLocation.district} District • Rank #${targetLocation.rank}` : 'Statewide Staging'}
              </div>
            </div>
            {targetLocation && (
              <span
                className={`badge badge-${
                  targetLocation.flood_risk_pct >= 80 ? 'critical' : 'high'
                }`}
              >
                Risk: {targetLocation.flood_risk_pct.toFixed(0)}%
              </span>
            )}
          </div>

          {/* Select Staging Depot */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              Select Source Depot / Fleet
            </label>
            <select
              className="input-control"
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(Number(e.target.value))}
            >
              {boatResources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.resource_type} ({r.station_name}, {r.district}) — {r.available_quantity} available / {r.total_quantity} total
                </option>
              ))}
            </select>
          </div>

          {/* Slider for Quantity */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Boats to Deploy
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {dispatchCount}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  / {maxAvailable} avail
                </span>
              </div>
            </div>

            <input
              type="range"
              min={1}
              max={Math.max(1, maxAvailable)}
              value={dispatchCount}
              onChange={(e) => setDispatchCount(Number(e.target.value))}
              className="tactical-slider"
            />

            {/* Quick Preset Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
              {[5, 10, 20, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDispatchCount(Math.min(maxAvailable, preset))}
                  className="btn btn-secondary btn-sm"
                  style={{
                    flex: 1,
                    fontSize: '0.74rem',
                    background: dispatchCount === preset ? 'rgba(56, 189, 248, 0.2)' : undefined,
                    borderColor: dispatchCount === preset ? '#38bdf8' : undefined,
                  }}
                  disabled={preset > maxAvailable}
                >
                  +{preset} Units
                </button>
              ))}
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              Operational Directive / Tasking Order
            </label>
            <input
              type="text"
              className="input-control"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Evacuate elderly and isolated households along breach"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDispatch}
            disabled={submitting || maxAvailable === 0}
            style={{ gap: '0.5rem' }}
          >
            <Send size={15} />
            <span>{submitting ? 'Transmitting Order...' : `Confirm & Dispatch ${dispatchCount} Boats`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
