/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { adminApi } from '../api/admin.api';
import { toast } from '../stores/toast.store';
import { formatDate } from '../utils/format';
import { MapPin, Train, GitBranch, Calendar, Search } from 'lucide-react';

const SEAT_TYPES = ['LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER'];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('stations'); // stations | trains | routes | schedules

  // Shared Data States
  const [stations, setStations] = useState([]);
  const [trains, setTrains] = useState([]);
  const [schedules, setSchedules] = useState([]);
  
  // Loading & Pagination States
  const [loading, setLoading] = useState(false);
  const [stationPage, setStationPage] = useState(1);
  const [stationTotalPages, setStationTotalPages] = useState(1);
  const [stationSearch, setStationSearch] = useState('');

  // Creation forms states
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 1. Station Form
  const [stationForm, setStationForm] = useState({ name: '', code: '', city: '', state: '' });
  
  // 2. Train Form
  const [trainForm, setTrainForm] = useState({ trainNumber: '', trainName: '', coachName: '' });
  const [seatRows, setSeatRows] = useState([{ seatNumber: '', seatType: 'LOWER', price: '' }]);
  
  // 3. Route Form
  const [selectedRouteTrain, setSelectedRouteTrain] = useState('');
  const [routeStops, setRouteStops] = useState([{ stationId: '', sequenceNumber: 1, arrivalTime: '', departureTime: '', distanceFromOrigin: 0 }]);
  
  // 4. Schedule Form
  const [selectedScheduleTrain, setSelectedScheduleTrain] = useState('');
  const [scheduleDepartureDate, setScheduleDepartureDate] = useState('');

  // Fetch functions
  const fetchStationsList = async (page = 1) => {
    try {
      const res = await adminApi.getStations(page, 10, stationSearch);
      setStations(res.data || []);
      setStationTotalPages(res.pagination?.totalPages || 1);
      setStationPage(res.pagination?.page || 1);
    } catch (err) {
      toast.error(err.message || 'Failed to retrieve stations');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainsList = async () => {
    try {
      const res = await adminApi.getTrains();
      setTrains(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to retrieve trains');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulesList = async () => {
    try {
      const res = await adminApi.getSchedules();
      setSchedules(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to retrieve schedules');
    } finally {
      setLoading(false);
    }
  };

  // Load initial tab data
  useEffect(() => {
    if (activeTab === 'stations') fetchStationsList(1);
    if (activeTab === 'trains') fetchTrainsList();
    if (activeTab === 'routes') {
      fetchTrainsList();
      adminApi.getStations(1, 100).then(r => setStations(r.data || [])).catch(() => {});
    }
    if (activeTab === 'schedules') {
      fetchTrainsList();
      fetchSchedulesList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setLoading(true);
  };

  // CRUD Submit Handlers
  const handleCreateStation = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminApi.createStation(stationForm);
      toast.success(`Station ${stationForm.code} created!`);
      setStationForm({ name: '', code: '', city: '', state: '' });
      fetchStationsList(1);
    } catch (err) {
      toast.error(err.message || 'Failed to create station');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTrain = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const seats = seatRows.map((r) => ({
        seatNumber: parseInt(r.seatNumber, 10),
        seatType: r.seatType,
        price: parseFloat(r.price)
      }));
      await adminApi.createTrain({ ...trainForm, seats });
      toast.success(`Train ${trainForm.trainName} created!`);
      setTrainForm({ trainNumber: '', trainName: '', coachName: '' });
      setSeatRows([{ seatNumber: '', seatType: 'LOWER', price: '' }]);
      fetchTrainsList();
    } catch (err) {
      toast.error(err.message || 'Failed to create train');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    if (!selectedRouteTrain) {
      toast.error('Please select a train for this route');
      return;
    }
    setIsSubmitting(true);
    try {
      const stationsPayload = routeStops.map((s) => ({
        stationId: s.stationId,
        sequenceNumber: parseInt(s.sequenceNumber, 10),
        arrivalTime: s.arrivalTime || null,
        departureTime: s.departureTime || null,
        distanceFromOrigin: parseInt(s.distanceFromOrigin, 10) || 0
      }));
      await adminApi.createRoute({ trainId: selectedRouteTrain, stations: stationsPayload });
      toast.success('Route config saved successfully');
      setSelectedRouteTrain('');
      setRouteStops([{ stationId: '', sequenceNumber: 1, arrivalTime: '', departureTime: '', distanceFromOrigin: 0 }]);
    } catch (err) {
      toast.error(err.message || 'Failed to create route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!selectedScheduleTrain || !scheduleDepartureDate) {
      toast.error('Select train and date');
      return;
    }
    setIsSubmitting(true);
    try {
      await adminApi.createSchedule({ trainId: selectedScheduleTrain, departureDate: scheduleDepartureDate });
      toast.success('Schedule published successfully!');
      setSelectedScheduleTrain('');
      setScheduleDepartureDate('');
      fetchSchedulesList();
    } catch (err) {
      toast.error(err.message || 'Failed to publish schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSchedule = async (id) => {
    try {
      await adminApi.cancelSchedule(id);
      toast.success('Schedule cancelled successfully');
      fetchSchedulesList();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel schedule');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 font-sans">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary-950">Admin Control Panel</h1>
        <p className="text-sm text-slate-500">Configure schedules, manage train segments, and lookup station matrices</p>
      </div>

      {/* Tabs Menu */}
      <div className="bg-white border border-slate-100 rounded-3xl p-3 shadow-premium flex flex-wrap gap-2">
        {[
          { id: 'stations', label: 'Stations', icon: MapPin },
          { id: 'trains', label: 'Trains', icon: Train },
          { id: 'routes', label: 'Routes config', icon: GitBranch },
          { id: 'schedules', label: 'Schedules', icon: Calendar }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer
                ${
                  activeTab === tab.id
                    ? 'bg-secondary-600 text-white shadow-md shadow-secondary-500/20'
                    : 'text-slate-650 hover:bg-slate-50'
                }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Tab Form Panels */}
        <div className="xl:col-span-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-premium">
          
          {/* 1. STATIONS TAB */}
          {activeTab === 'stations' && (
            <form onSubmit={handleCreateStation} className="space-y-4">
              <h3 className="font-extrabold text-sm text-primary-950 uppercase mb-4 border-b border-slate-50 pb-2">
                Create Station
              </h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Station Name</label>
                <input
                  type="text"
                  placeholder="e.g. New Delhi Junction"
                  value={stationForm.name}
                  onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="NDLS"
                    maxLength={10}
                    value={stationForm.code}
                    onChange={(e) => setStationForm({ ...stationForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Delhi"
                    value={stationForm.city}
                    onChange={(e) => setStationForm({ ...stationForm, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">State</label>
                <input
                  type="text"
                  placeholder="Delhi"
                  value={stationForm.state}
                  onChange={(e) => setStationForm({ ...stationForm, state: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Submitting...' : 'Create Station'}
              </button>
            </form>
          )}

          {/* 2. TRAINS TAB */}
          {activeTab === 'trains' && (
            <form onSubmit={handleCreateTrain} className="space-y-4">
              <h3 className="font-extrabold text-sm text-primary-950 uppercase mb-4 border-b border-slate-50 pb-2">
                Create Train
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Number</label>
                  <input
                    type="text"
                    placeholder="12002"
                    value={trainForm.trainNumber}
                    onChange={(e) => setTrainForm({ ...trainForm, trainNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Coach</label>
                  <input
                    type="text"
                    placeholder="C1"
                    value={trainForm.coachName}
                    onChange={(e) => setTrainForm({ ...trainForm, coachName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Train Name</label>
                <input
                  type="text"
                  placeholder="Shatabdi Express"
                  value={trainForm.trainName}
                  onChange={(e) => setTrainForm({ ...trainForm, trainName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none"
                  required
                />
              </div>

              {/* Dynamic Seat rows list */}
              <div className="border-t border-slate-50 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase">Configure Seats</h4>
                  <button
                    type="button"
                    onClick={() => setSeatRows([...seatRows, { seatNumber: '', seatType: 'LOWER', price: '' }])}
                    className="text-[10px] font-bold text-secondary-600 hover:underline cursor-pointer"
                  >
                    + Add row
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {seatRows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Seat #"
                        value={row.seatNumber}
                        onChange={(e) => {
                          const updated = [...seatRows];
                          updated[i].seatNumber = e.target.value;
                          setSeatRows(updated);
                        }}
                        className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold font-mono"
                        required
                      />
                      <select
                        value={row.seatType}
                        onChange={(e) => {
                          const updated = [...seatRows];
                          updated[i].seatType = e.target.value;
                          setSeatRows(updated);
                        }}
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer"
                      >
                        {SEAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input
                        type="number"
                        placeholder="Price"
                        value={row.price}
                        onChange={(e) => {
                          const updated = [...seatRows];
                          updated[i].price = e.target.value;
                          setSeatRows(updated);
                        }}
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                        required
                      />
                      {seatRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSeatRows(seatRows.filter((_, idx) => idx !== i))}
                          className="text-red-500 hover:text-red-700 text-sm font-bold cursor-pointer"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Creating...' : 'Create Train & Seats'}
              </button>
            </form>
          )}

          {/* 3. ROUTES TAB */}
          {activeTab === 'routes' && (
            <form onSubmit={handleCreateRoute} className="space-y-4">
              <h3 className="font-extrabold text-sm text-primary-950 uppercase mb-4 border-b border-slate-50 pb-2">
                Create Route Configuration
              </h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Select Train</label>
                <select
                  value={selectedRouteTrain}
                  onChange={(e) => setSelectedRouteTrain(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white cursor-pointer"
                  required
                >
                  <option value="">Choose train</option>
                  {trains.map(t => <option key={t.id} value={t.id}>{t.trainNumber} — {t.trainName}</option>)}
                </select>
              </div>

              {/* Route Stops */}
              <div className="border-t border-slate-50 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase">Configure Station Stops</h4>
                  <button
                    type="button"
                    onClick={() => setRouteStops([...routeStops, { stationId: '', sequenceNumber: routeStops.length + 1, arrivalTime: '', departureTime: '', distanceFromOrigin: 0 }])}
                    className="text-[10px] font-bold text-secondary-600 hover:underline cursor-pointer"
                  >
                    + Add Stop
                  </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {routeStops.map((stop, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 relative flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-secondary-650">Stop Sequence #{i + 1}</span>
                        {routeStops.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setRouteStops(routeStops.filter((_, idx) => idx !== i))}
                            className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <select
                        value={stop.stationId}
                        onChange={(e) => {
                          const updated = [...routeStops];
                          updated[i].stationId = e.target.value;
                          setRouteStops(updated);
                        }}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white cursor-pointer"
                        required
                      >
                        <option value="">Select Station</option>
                        {stations.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                      </select>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Arrival</label>
                          <input
                            type="time"
                            value={stop.arrivalTime}
                            onChange={(e) => {
                              const updated = [...routeStops];
                              updated[i].arrivalTime = e.target.value;
                              setRouteStops(updated);
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Departure</label>
                          <input
                            type="time"
                            value={stop.departureTime}
                            onChange={(e) => {
                              const updated = [...routeStops];
                              updated[i].departureTime = e.target.value;
                              setRouteStops(updated);
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Dist. (km)</label>
                          <input
                            type="number"
                            value={stop.distanceFromOrigin}
                            onChange={(e) => {
                              const updated = [...routeStops];
                              updated[i].distanceFromOrigin = e.target.value;
                              setRouteStops(updated);
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Saving Route...' : 'Publish Train Route'}
              </button>
            </form>
          )}

          {/* 4. SCHEDULES TAB */}
          {activeTab === 'schedules' && (
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <h3 className="font-extrabold text-sm text-primary-950 uppercase mb-4 border-b border-slate-50 pb-2">
                Create Schedule
              </h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Select Train</label>
                <select
                  value={selectedScheduleTrain}
                  onChange={(e) => setSelectedScheduleTrain(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white cursor-pointer"
                  required
                >
                  <option value="">Choose train</option>
                  {trains.map(t => <option key={t.id} value={t.id}>{t.trainNumber} — {t.trainName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Departure Date</label>
                <input
                  type="date"
                  value={scheduleDepartureDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduleDepartureDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white cursor-pointer"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Departure'}
              </button>
            </form>
          )}

        </div>

        {/* Right Side: Data Listing Table (8 cols) */}
        <div className="xl:col-span-8 bg-white border border-slate-100 rounded-3xl p-5 shadow-premium">
          
          {/* Active Data Listing Header */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
            <h3 className="font-extrabold text-sm text-primary-950 uppercase tracking-wide">
              {activeTab} Registry
            </h3>

            {/* Stations Search */}
            {activeTab === 'stations' && (
              <div className="flex gap-2">
                <input
                  placeholder="Search stations..."
                  value={stationSearch}
                  onChange={(e) => setStationSearch(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-secondary-500 bg-white"
                />
                <button
                  onClick={() => { setLoading(true); fetchStationsList(1); }}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-150 hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Table List View */}
          {loading ? (
            <div className="py-20 flex justify-center text-slate-400">
              <div className="w-8 h-8 border-2 border-secondary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[300px]">
              
              {/* STATIONS TABLE */}
              {activeTab === 'stations' && (
                <table className="w-full text-xs font-semibold text-slate-655">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 text-left font-bold pl-1">Station Code</th>
                      <th className="py-2.5 text-left font-bold">Station Name</th>
                      <th className="py-2.5 text-left font-bold">City</th>
                      <th className="py-2.5 text-left font-bold">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.map((s) => (
                      <tr key={s.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pl-1 font-bold text-secondary-650 uppercase font-mono">{s.code}</td>
                        <td className="py-3 text-slate-800 font-bold">{s.name}</td>
                        <td className="py-3 text-slate-600">{s.city}</td>
                        <td className="py-3 text-slate-450">{s.state}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TRAINS TABLE */}
              {activeTab === 'trains' && (
                <table className="w-full text-xs font-semibold text-slate-655">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 text-left font-bold pl-1">Train Number</th>
                      <th className="py-2.5 text-left font-bold">Train Name</th>
                      <th className="py-2.5 text-left font-bold">Coach Name</th>
                      <th className="py-2.5 text-right font-bold pr-1">Total Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trains.map((t) => (
                      <tr key={t.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pl-1 font-bold text-secondary-650 font-mono">{t.trainNumber}</td>
                        <td className="py-3 text-slate-800 font-bold">{t.trainName}</td>
                        <td className="py-3">{t.coachName}</td>
                        <td className="py-3 text-right pr-1 font-bold font-mono">
                          {t.totalSeats || t.seats?.length || '—'} berths
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* SCHEDULES TABLE */}
              {activeTab === 'schedules' && (
                <table className="w-full text-xs font-semibold text-slate-655">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 text-left font-bold pl-1">Departure Train</th>
                      <th className="py-2.5 text-left font-bold">Date Published</th>
                      <th className="py-2.5 text-left font-bold">Status</th>
                      <th className="py-2.5 text-right font-bold pr-1">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((s) => (
                      <tr key={s.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pl-1 font-bold text-slate-800">
                          {s.train?.trainName || s.trainId}
                          <span className="text-[10px] font-bold text-slate-450 ml-1.5 font-mono">
                            #{s.train?.trainNumber}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 font-bold">{formatDate(s.departureDate)}</td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block
                            ${s.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 text-right pr-1">
                          {s.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleCancelSchedule(s.id)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 rounded-lg text-[10px] transition-colors cursor-pointer"
                            >
                              Cancel Departure
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          )}

          {/* Table Pagination Controls for stations tab */}
          {activeTab === 'stations' && stationTotalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => { setLoading(true); fetchStationsList(stationPage - 1); }}
                disabled={stationPage <= 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-600"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-500">
                Page {stationPage} of {stationTotalPages}
              </span>
              <button
                onClick={() => { setLoading(true); fetchStationsList(stationPage + 1); }}
                disabled={stationPage >= stationTotalPages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-600"
              >
                Next
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
