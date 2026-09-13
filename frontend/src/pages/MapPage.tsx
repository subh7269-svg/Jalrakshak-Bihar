import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LocationItem, ShelterItem, ResourceItem, RoadStatusItem } from '../types';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  ShieldAlert, 
  Home, 
  Boxes, 
  Compass, 
  Info, 
  Radio, 
  Eye, 
  Filter,
  Navigation,
  X,
  Send,
  Waves,
  Maximize2
} from 'lucide-react';
import { WhyAtRiskModal } from '../components/risk/WhyAtRiskModal';
import { QuickDispatchModal } from '../components/dashboard/QuickDispatchModal';

export const MapPage: React.FC = () => {
  const { selectedDistrict } = useAuth();
  const { showToast, playTacticalSound } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [shelters, setShelters] = useState<ShelterItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [roads, setRoads] = useState<RoadStatusItem[]>([]);
  const [selectedLocId, setSelectedLocId] = useState<number | null>(null);
  const [inspectorLocation, setInspectorLocation] = useState<LocationItem | null>(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);

  // Layer Visibility Filters
  const [showFloodZones, setShowFloodZones] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showResources, setShowResources] = useState(true);

  // Sector jump presets
  const sectors = [
    { name: 'Supaul (Kosi)', lat: 26.54, lng: 86.85, zoom: 11 },
    { name: 'Darbhanga (Bagmati)', lat: 26.15, lng: 85.90, zoom: 11 },
    { name: 'Saharsa', lat: 25.88, lng: 86.60, zoom: 11 },
    { name: 'Patna (Ganga)', lat: 25.60, lng: 85.14, zoom: 11 },
    { name: 'Bhagalpur', lat: 25.24, lng: 86.98, zoom: 11 },
    { name: 'Muzaffarpur', lat: 26.12, lng: 85.39, zoom: 11 },
    { name: 'Statewide Overview', lat: 25.85, lng: 85.85, zoom: 8 },
  ];

  // Fetch data
  useEffect(() => {
    Promise.all([
      api.getLocations(selectedDistrict),
      api.getShelters(selectedDistrict),
      api.getResources(selectedDistrict),
      api.getRoadStatuses(selectedDistrict),
    ]).then(([locRes, shelterRes, resRes, roadRes]) => {
      setLocations(locRes || []);
      setShelters(shelterRes || []);
      setResources(resRes || []);
      setRoads(roadRes || []);
      if (locRes && locRes.length > 0 && !inspectorLocation) {
        setInspectorLocation(locRes[0]);
      }
    });
  }, [selectedDistrict]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [25.85, 85.85],
      zoom: 8,
      zoomControl: true,
    });

    // Dark-styled OpenStreetMap Carto tiles for high-contrast command center
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 18,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers when data or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // 1. Draw Major Bihar River Channels
    const riverLines = [
      {
        name: 'Kosi River Channel',
        coords: [
          [26.85, 86.95],
          [26.54, 86.85],
          [26.15, 86.60],
          [25.85, 86.48],
          [25.45, 87.05]
        ],
        color: '#0284c7'
      },
      {
        name: 'Bagmati River Channel',
        coords: [
          [26.60, 85.30],
          [26.28, 85.52],
          [26.02, 85.90],
          [25.80, 86.10]
        ],
        color: '#0369a1'
      },
      {
        name: 'Ganga River Main Stem',
        coords: [
          [25.68, 84.40],
          [25.65, 84.88],
          [25.60, 85.20],
          [25.40, 86.00],
          [25.26, 87.24]
        ],
        color: '#0c4a6e'
      }
    ];

    riverLines.forEach(riv => {
      L.polyline(riv.coords as any, {
        color: riv.color,
        weight: 4,
        opacity: 0.85,
        dashArray: '4, 8'
      }).bindTooltip(`<strong>${riv.name}</strong> (Active Channel)`, { sticky: true }).addTo(layerGroup);
    });

    // 2. Locations / Flood Risk Zones
    if (showFloodZones) {
      locations.forEach(loc => {
        const riskLevel = loc.risk_assessment?.risk_level || 'LOW';
        const riskPct = loc.risk_assessment?.risk_score_pct || 30;
        const color = riskLevel === 'CRITICAL' ? '#f43f5e' :
                      riskLevel === 'HIGH' ? '#fb923c' :
                      riskLevel === 'MODERATE' ? '#facc15' : '#10b981';

        // Draw flood risk radius circle
        L.circle([loc.latitude, loc.longitude], {
          radius: riskLevel === 'CRITICAL' ? 8500 : riskLevel === 'HIGH' ? 6000 : 3500,
          color: color,
          fillColor: color,
          fillOpacity: 0.22,
          weight: 2
        }).addTo(layerGroup);

        // Marker with modern HTML icon
        const iconHtml = `
          <div style="
            background: ${color};
            color: white;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            border: 2px solid white;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            cursor: pointer;
          ">
            <span>${riskLevel === 'CRITICAL' ? '⚠️' : '🌊'}</span>
            <span>${loc.name} (${riskPct.toFixed(0)}%)</span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-flood-marker',
          iconSize: [120, 24],
          iconAnchor: [60, 12]
        });

        const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon }).addTo(layerGroup);

        marker.on('click', () => {
          setInspectorLocation(loc);
          playTacticalSound('click');
        });
      });
    }

    // 3. Shelters
    if (showShelters) {
      shelters.forEach(s => {
        const shelterHtml = `
          <div style="
            background: #10b981;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            cursor: pointer;
          ">
            🏠
          </div>
        `;
        const icon = L.divIcon({ html: shelterHtml, className: 'shelter-marker', iconSize: [28, 28], iconAnchor: [14, 14] });
        const marker = L.marker([s.latitude, s.longitude], { icon }).addTo(layerGroup);
        marker.bindPopup(`
          <div style="font-family: Inter, sans-serif; font-size: 12px; color: #f8fafc;">
            <div style="font-weight: 700; font-size: 13px; color: #38bdf8; margin-bottom: 2px;">${s.name}</div>
            <div style="color: #94a3b8; margin-bottom: 6px;">${s.district} District</div>
            <div style="line-height: 1.5;">
              • Total Capacity: <strong>${s.total_capacity.toLocaleString()}</strong><br/>
              • Occupancy: <strong>${s.current_occupancy.toLocaleString()} (${s.occupancy_pct}%)</strong><br/>
              • Available Headroom: <strong style="color: #34d399;">${s.available_capacity.toLocaleString()} beds</strong><br/>
              • Status: <strong>${s.accessibility_status}</strong><br/>
              • Contact: ${s.contact_person || 'DEOC In-Charge'}
            </div>
          </div>
        `);
      });
    }

    // 4. Resource Stations
    if (showResources) {
      const stations = Array.from(new Set(resources.map(r => r.station_name)));
      stations.slice(0, 5).forEach((st) => {
        const matchingRes = resources.filter(r => r.station_name === st);
        const locId = matchingRes[0]?.location_id;
        const matchingLoc = locations.find(l => l.id === locId);
        if (!matchingLoc) return;

        const lat = matchingLoc.latitude + 0.035;
        const lng = matchingLoc.longitude - 0.035;

        const resHtml = `
          <div style="
            background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            cursor: pointer;
          ">
            🚤
          </div>
        `;
        const icon = L.divIcon({ html: resHtml, className: 'resource-marker', iconSize: [28, 28], iconAnchor: [14, 14] });
        const marker = L.marker([lat, lng], { icon }).addTo(layerGroup);
        marker.bindPopup(`
          <div style="font-family: Inter, sans-serif; font-size: 12px; color: #f8fafc;">
            <div style="font-weight: 700; font-size: 13px; color: #38bdf8; margin-bottom: 2px;">${st}</div>
            <div style="color: #94a3b8; margin-bottom: 6px;">Staging Base • ${matchingLoc.district} District</div>
            <div style="line-height: 1.5;">
              ${matchingRes.map(r => `• ${r.resource_type}: <strong style="color: #38bdf8;">${r.available_quantity} avail</strong> / ${r.deployed_quantity} deployed`).join('<br/>')}
            </div>
          </div>
        `);
      });
    }

  }, [locations, shelters, resources, showFloodZones, showShelters, showResources]);

  const flyToSector = (lat: number, lng: number, zoom: number, name: string) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
    playTacticalSound('click');
    showToast({
      type: 'info',
      title: `Map Centered: ${name}`,
      message: `Surveillance view zoomed to ${name} river sector.`,
    });
  };

  const boatResources = resources.filter(r => r.resource_type.toLowerCase().includes('boat'));

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', padding: '1.25rem 2rem' }}>
      {/* Top Map Control Bar */}
      <div className="glass-panel" style={{
        padding: '0.75rem 1.25rem',
        marginBottom: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.45rem', borderRadius: '8px', color: '#38bdf8' }}>
            <Layers size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Tactical GIS Geospatial Command Map
              </span>
              <span className="badge badge-demo" style={{ fontSize: '0.62rem' }}>LIVE GIS</span>
            </div>
          </div>
        </div>

        {/* Layer Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div 
            className={`filter-chip ${showFloodZones ? 'active' : ''}`}
            onClick={() => setShowFloodZones(!showFloodZones)}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e' }} />
            <span>Flood Risk Zones</span>
          </div>
          <div 
            className={`filter-chip ${showShelters ? 'active' : ''}`}
            onClick={() => setShowShelters(!showShelters)}
          >
            <span>🏠 Shelters</span>
          </div>
          <div 
            className={`filter-chip ${showResources ? 'active' : ''}`}
            onClick={() => setShowResources(!showResources)}
          >
            <span>🚤 SDRF Bases</span>
          </div>
        </div>
      </div>

      {/* Sector Quick Jump Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '2px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', flexShrink: 0 }}>
          Sector Jump:
        </span>
        {sectors.map((sec) => (
          <button
            key={sec.name}
            onClick={() => flyToSector(sec.lat, sec.lng, sec.zoom, sec.name)}
            className="filter-chip"
            style={{ fontSize: '0.74rem', padding: '0.25rem 0.75rem', whiteSpace: 'nowrap' }}
          >
            <Navigation size={11} />
            <span>{sec.name}</span>
          </button>
        ))}
      </div>

      {/* Map Canvas with Interactive Side-Inspector Drawer */}
      <div style={{ flex: 1, position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 12px 36px rgba(0,0,0,0.5)' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Floating Sector Telemetry Inspector Drawer */}
        {inspectorLocation && (
          <div style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '320px',
            background: 'rgba(11, 17, 33, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '12px',
            padding: '1.15rem',
            boxShadow: '0 16px 40px rgba(0,0,0,0.7), 0 0 25px rgba(56, 189, 248, 0.15)',
            zIndex: 400,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
              <div>
                <span className={`badge badge-${inspectorLocation.risk_assessment?.risk_level?.toLowerCase() || 'low'}`} style={{ fontSize: '0.62rem', marginBottom: '0.3rem' }}>
                  {inspectorLocation.risk_assessment?.risk_level || 'UNKNOWN'} RISK ({inspectorLocation.risk_assessment?.risk_score_pct.toFixed(0) || 0}%)
                </span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                  {inspectorLocation.name}
                </h4>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {inspectorLocation.district} District • {inspectorLocation.river_basin} Basin
                </div>
              </div>
              <button
                onClick={() => setInspectorLocation(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Hydrological Readings */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '0.85rem', fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>River Level:</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: '#f43f5e' }}>
                  {inspectorLocation.hydrology?.river_level_m} m
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Danger Mark:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                  {inspectorLocation.hydrology?.danger_mark_m} m
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>3h Rise Velocity:</span>
                <strong style={{ color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>
                  +{inspectorLocation.hydrology?.river_rise_rate_3h_m} m/3h
                </strong>
              </div>
            </div>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.85rem' }}>
              Estimated Population Exposed: <strong style={{ color: '#ffffff' }}>~{(inspectorLocation.risk_assessment?.estimated_exposed_population || 0).toLocaleString()}</strong>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <button
                onClick={() => setSelectedLocId(inspectorLocation.id)}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Eye size={13} />
                <span>Why At Risk? Breakdown</span>
              </button>
              <button
                onClick={() => setDispatchModalOpen(true)}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
              >
                <Send size={13} />
                <span>Task Rescue Boats</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Legend */}
        <div style={{
          position: 'absolute',
          bottom: '15px',
          right: '15px',
          background: 'rgba(11, 17, 33, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          fontSize: '0.74rem',
          color: 'var(--text-main)',
          zIndex: 400,
          boxShadow: '0 8px 25px rgba(0,0,0,0.6)'
        }}>
          <div style={{ fontWeight: 800, marginBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.2rem' }}>
            GIS Map Legend
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e' }} />
              <span>Critical Risk (&gt;80%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fb923c' }} />
              <span>High Risk (60-80%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <span>Relief Shelter (🏠)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#0284c7' }} />
              <span>SDRF/NDRF Boat Depot (🚤)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drill-down Why At Risk Modal */}
      <WhyAtRiskModal 
        locationId={selectedLocId} 
        onClose={() => setSelectedLocId(null)}
      />

      {/* Quick Dispatch Modal */}
      <QuickDispatchModal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        targetLocation={inspectorLocation ? {
          rank: 1,
          location_id: inspectorLocation.id,
          location_name: inspectorLocation.name,
          district: inspectorLocation.district,
          priority_score: 95,
          priority_category: 'CRITICAL',
          flood_risk_pct: inspectorLocation.risk_assessment?.risk_score_pct || 85,
          estimated_exposed_population: inspectorLocation.risk_assessment?.estimated_exposed_population || 12000,
          road_accessibility_status: 'BLOCKED',
          shelter_capacity_gap: 500,
          river_rise_rate_3h_m: inspectorLocation.hydrology?.river_rise_rate_3h_m || 0.6,
          why_ranked_here: 'Active map inspection dispatch',
          key_drivers: ['Rapid River Surge', 'Critical Inundation Depth'],
          factor_breakdown: []
        } : null}
        boatResources={boatResources}
        onDispatched={() => {
          showToast({
            type: 'success',
            title: 'Tasking Order Committed',
            message: 'Resource ledger synchronized with active deployment.',
          });
        }}
      />
    </div>
  );
};
