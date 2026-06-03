import { useEffect, useState, useCallback } from 'react';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import { useCommand } from '../hooks/useCommand';
import { DoorOpen, DoorClosed, CreditCard, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import CommandButton from '../components/devices/CommandButton';
import LogViewer from '../components/dashboard/LogViewer';
import StatusIndicator from '../components/ui/StatusIndicator';
import {
  getLogs,
  getRfidWhitelist,
  getRfidScans,
  addRfidToWhitelist,
  removeRfidFromWhitelist,
  type DeviceLog,
  type RFIDEntry,
  type RFIDScan,
} from '../services/esp4Api';
import { POLLING_INTERVAL_MS } from '../config/esp4';

export default function ESP3() {
  const { devices } = useDeviceStatus(3);
  const { sendCommand } = useCommand();

  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [rfidScans, setRfidScans] = useState<RFIDScan[]>([]);
  const [rfidWhitelist, setRfidWhitelist] = useState<RFIDEntry[]>([]);
  const [newUid, setNewUid] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [addingRfid, setAddingRfid] = useState(false);

  const device = devices[0];
  const doorState = device?.doorState ?? 'CLOSE';
  const gateState = device?.gateState ?? 'CLOSE';
  const isOnline = device?.isOnline ?? false;

  // Fetch logs ESP3 via service layer
  const fetchLogs = useCallback(async () => {
    try {
      const data = await getLogs(3, 50);
      setLogs(data);
    } catch (err) {
      console.error('[ESP3] Failed to fetch logs:', err);
    }
  }, []);

  // Fetch RFID whitelist via service layer
  const fetchWhitelist = useCallback(async () => {
    try {
      const data = await getRfidWhitelist();
      setRfidWhitelist(data);
    } catch (err) {
      console.error('[ESP3] Failed to fetch RFID whitelist:', err);
    }
  }, []);

  // Fetch RFID scans via service layer
  const fetchRfidScans = useCallback(async () => {
    try {
      const data = await getRfidScans();
      setRfidScans(data);
    } catch (err) {
      console.error('[ESP3] Failed to fetch RFID scans:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchWhitelist();
    fetchRfidScans();
    const logsTimer = setInterval(fetchLogs, POLLING_INTERVAL_MS);
    const scansTimer = setInterval(fetchRfidScans, POLLING_INTERVAL_MS);
    return () => {
      clearInterval(logsTimer);
      clearInterval(scansTimer);
    };
  }, [fetchLogs, fetchWhitelist, fetchRfidScans]);

  const handleDoorControl = async (action: 'OPEN' | 'CLOSE') => {
    await sendCommand(3, `DOOR:${action}`);
  };

  const handleGateControl = async (action: 'OPEN' | 'CLOSE') => {
    await sendCommand(3, `GATE:${action}`);
  };

  const handleAddRfid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUid.trim()) return;
    setAddingRfid(true);
    try {
      const newEntry = await addRfidToWhitelist(newUid.trim(), newDescription.trim() || undefined);
      setRfidWhitelist((prev) => [...prev, newEntry]);
      setNewUid('');
      setNewDescription('');
    } catch (err: any) {
      console.error('[ESP3] Failed to add RFID:', err);
      alert(err?.message || 'Failed to add RFID UID');
    } finally {
      setAddingRfid(false);
    }
  };

  const handleRemoveRfid = async (uid: string) => {
    if (!confirm(`Are you sure you want to remove RFID UID: ${uid}?`)) return;
    try {
      await removeRfidFromWhitelist(uid);
      setRfidWhitelist((prev) => prev.filter((e) => e.uid !== uid));
    } catch (err) {
      console.error('[ESP3] Failed to remove RFID:', err);
      alert('Failed to remove RFID UID');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ESP32 #3 - Smart Door, Gate &amp; RFID Access</h1>
        <StatusIndicator isOnline={isOnline} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Door & Gate */}
        <div className="space-y-6">
          {/* Door Control */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              {doorState === 'OPEN' ? <DoorOpen className="text-green-400" size={24} /> : <DoorClosed className="text-gray-400" size={24} />}
              <h2 className="text-lg font-semibold">Smart Door</h2>
            </div>
            <div className="mb-6 p-4 bg-gray-900 rounded-lg text-center">
              <div className="text-sm text-gray-400 mb-2">Current Status</div>
              <div className={`text-3xl font-bold ${doorState === 'OPEN' ? 'text-green-400' : 'text-gray-400'}`}>{doorState}</div>
              {doorState === 'OPEN' && <div className="text-xs text-gray-500 mt-2">Auto-closes after 3 seconds</div>}
            </div>
            <div className="flex gap-2">
              <CommandButton label="OPEN" command="DOOR:OPEN" icon={DoorOpen} variant="primary" onSend={() => handleDoorControl('OPEN')} />
              <CommandButton label="CLOSE" command="DOOR:CLOSE" icon={DoorClosed} variant="danger" onSend={() => handleDoorControl('CLOSE')} />
            </div>
          </div>

          {/* Gate Control */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              {gateState === 'OPEN' ? <DoorOpen className="text-green-400" size={24} /> : <DoorClosed className="text-gray-400" size={24} />}
              <h2 className="text-lg font-semibold">Smart Gate</h2>
            </div>
            <div className="mb-6 p-4 bg-gray-900 rounded-lg text-center">
              <div className="text-sm text-gray-400 mb-2">Current Status</div>
              <div className={`text-3xl font-bold ${gateState === 'OPEN' ? 'text-green-400' : 'text-gray-400'}`}>{gateState}</div>
              {gateState === 'OPEN' && <div className="text-xs text-gray-500 mt-2">Auto-closes after 4 seconds</div>}
            </div>
            <div className="flex gap-2">
              <CommandButton label="OPEN" command="GATE:OPEN" icon={DoorOpen} variant="primary" onSend={() => handleGateControl('OPEN')} />
              <CommandButton label="CLOSE" command="GATE:CLOSE" icon={DoorClosed} variant="danger" onSend={() => handleGateControl('CLOSE')} />
            </div>
          </div>

          {/* Logs */}
          <div>
            <LogViewer logs={logs} espFilter={3} limit={50} />
          </div>
        </div>

        {/* Right — RFID */}
        <div className="space-y-6">
          {/* RFID Scan Log */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="text-purple-400" size={24} />
              <h2 className="text-lg font-semibold">RFID Scan Log</h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rfidScans.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-4">No RFID scans yet</div>
              ) : (
                rfidScans.map((scan, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex-1">
                      <div className="font-mono text-sm">{scan.uid}</div>
                      <div className="text-xs text-gray-400">{new Date(scan.scannedAt).toLocaleString()}</div>
                    </div>
                    {scan.authorized ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={18} />
                        <span className="text-xs font-semibold">Authorized</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-400">
                        <XCircle size={18} />
                        <span className="text-xs font-semibold">Unauthorized</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RFID Whitelist */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="text-blue-400" size={24} />
              <h2 className="text-lg font-semibold">RFID Whitelist</h2>
            </div>

            <form onSubmit={handleAddRfid} className="mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">RFID UID *</label>
                <input
                  type="text" value={newUid} onChange={(e) => setNewUid(e.target.value)}
                  placeholder="e.g., A1B2C3D4"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description (optional)</label>
                <input
                  type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g., John's access card"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit" disabled={addingRfid || !newUid.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50"
              >
                <Plus size={18} />
                {addingRfid ? 'Adding...' : 'Add to Whitelist'}
              </button>
            </form>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rfidWhitelist.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-4">No entries in whitelist</div>
              ) : (
                rfidWhitelist.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex-1">
                      <div className="font-mono text-sm">{entry.uid}</div>
                      {entry.description && <div className="text-xs text-gray-400">{entry.description}</div>}
                    </div>
                    <button
                      onClick={() => handleRemoveRfid(entry.uid)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                      title="Remove from whitelist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
