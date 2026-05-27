import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import { useCommand } from '../hooks/useCommand';
import axios from 'axios';
import { DoorOpen, DoorClosed, CreditCard, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import CommandButton from '../components/devices/CommandButton';
import LogViewer from '../components/dashboard/LogViewer';
import StatusIndicator from '../components/ui/StatusIndicator';

interface DeviceLog {
  id: number;
  espNumber: number;
  messageType: string;
  message: string;
  createdAt: string;
}

interface RFIDEntry {
  id: number;
  uid: string;
  description?: string;
  createdAt: string;
}

interface RFIDScan {
  uid: string;
  authorized: boolean;
  espNumber: number;
  scannedAt: string;
}

export default function ESP3() {
  const { socket, connected } = useSocket();
  const { devices } = useDeviceStatus(3);
  const { sendCommand } = useCommand();
  
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [rfidScans, setRfidScans] = useState<RFIDScan[]>([]);
  const [rfidWhitelist, setRfidWhitelist] = useState<RFIDEntry[]>([]);
  const [newUid, setNewUid] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [addingRfid, setAddingRfid] = useState(false);

  const device = devices[0];
  const doorState = device?.doorState || 'CLOSE';
  const gateState = device?.gateState || 'CLOSE';
  const isOnline = device?.isOnline || false;

  // Fetch logs on mount
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get('/api/logs', {
          params: { esp: 3, limit: 50 }
        });
        if (response.data.success) {
          setLogs(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };
    fetchLogs();
  }, []);

  // Fetch RFID whitelist
  useEffect(() => {
    const fetchWhitelist = async () => {
      try {
        const response = await axios.get('/api/rfid/whitelist');
        if (response.data.success) {
          setRfidWhitelist(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch RFID whitelist:', error);
      }
    };
    fetchWhitelist();
  }, []);

  // Listen for real-time log updates
  useEffect(() => {
    if (!socket || !connected) return;

    const handleDeviceLog = (log: DeviceLog) => {
      if (log.espNumber === 3) {
        setLogs((prev) => [log, ...prev].slice(0, 50));
      }
    };

    socket.on('device:log', handleDeviceLog);

    return () => {
      socket.off('device:log', handleDeviceLog);
    };
  }, [socket, connected]);

  // Listen for RFID scans
  useEffect(() => {
    if (!socket || !connected) return;

    const handleRfidScan = (scan: RFIDScan) => {
      setRfidScans((prev) => [scan, ...prev].slice(0, 20));
    };

    socket.on('rfid:scan', handleRfidScan);

    return () => {
      socket.off('rfid:scan', handleRfidScan);
    };
  }, [socket, connected]);

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
      const response = await axios.post('/api/rfid/whitelist', {
        uid: newUid.trim(),
        description: newDescription.trim() || undefined,
      });
      
      if (response.data.success) {
        setRfidWhitelist((prev) => [...prev, response.data.data]);
        setNewUid('');
        setNewDescription('');
      }
    } catch (error: any) {
      console.error('Failed to add RFID:', error);
      alert(error.response?.data?.message || 'Failed to add RFID UID');
    } finally {
      setAddingRfid(false);
    }
  };

  const handleRemoveRfid = async (uid: string) => {
    if (!confirm(`Are you sure you want to remove RFID UID: ${uid}?`)) return;

    try {
      await axios.delete(`/api/rfid/whitelist/${uid}`);
      setRfidWhitelist((prev) => prev.filter((entry) => entry.uid !== uid));
    } catch (error) {
      console.error('Failed to remove RFID:', error);
      alert('Failed to remove RFID UID');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ESP32 #3 - Smart Door, Gate & RFID Access</h1>
        <StatusIndicator isOnline={isOnline} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Door & Gate Controls */}
        <div className="space-y-6">
          {/* Door Control */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              {doorState === 'OPEN' ? (
                <DoorOpen className="text-green-400" size={24} />
              ) : (
                <DoorClosed className="text-gray-400" size={24} />
              )}
              <h2 className="text-lg font-semibold">Smart Door</h2>
            </div>
            
            {/* Door Status with Animation */}
            <div className="mb-6 p-4 bg-gray-900 rounded-lg text-center">
              <div className="text-sm text-gray-400 mb-2">Current Status</div>
              <div className={`text-3xl font-bold ${doorState === 'OPEN' ? 'text-green-400' : 'text-gray-400'}`}>
                {doorState}
              </div>
              {doorState === 'OPEN' && (
                <div className="text-xs text-gray-500 mt-2">Auto-closes after 3 seconds</div>
              )}
            </div>

            <div className="flex gap-2">
              <CommandButton
                label="OPEN"
                command="DOOR:OPEN"
                icon={DoorOpen}
                variant="primary"
                onSend={() => handleDoorControl('OPEN')}
              />
              <CommandButton
                label="CLOSE"
                command="DOOR:CLOSE"
                icon={DoorClosed}
                variant="danger"
                onSend={() => handleDoorControl('CLOSE')}
              />
            </div>
          </div>

          {/* Gate Control */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              {gateState === 'OPEN' ? (
                <DoorOpen className="text-green-400" size={24} />
              ) : (
                <DoorClosed className="text-gray-400" size={24} />
              )}
              <h2 className="text-lg font-semibold">Smart Gate</h2>
            </div>
            
            {/* Gate Status with Animation */}
            <div className="mb-6 p-4 bg-gray-900 rounded-lg text-center">
              <div className="text-sm text-gray-400 mb-2">Current Status</div>
              <div className={`text-3xl font-bold ${gateState === 'OPEN' ? 'text-green-400' : 'text-gray-400'}`}>
                {gateState}
              </div>
              {gateState === 'OPEN' && (
                <div className="text-xs text-gray-500 mt-2">Auto-closes after 4 seconds</div>
              )}
            </div>

            <div className="flex gap-2">
              <CommandButton
                label="OPEN"
                command="GATE:OPEN"
                icon={DoorOpen}
                variant="primary"
                onSend={() => handleGateControl('OPEN')}
              />
              <CommandButton
                label="CLOSE"
                command="GATE:CLOSE"
                icon={DoorClosed}
                variant="danger"
                onSend={() => handleGateControl('CLOSE')}
              />
            </div>
          </div>

          {/* Device Logs */}
          <div>
            <LogViewer logs={logs} espFilter={3} limit={50} />
          </div>
        </div>

        {/* Right Column - RFID Management */}
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
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm">{scan.uid}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(scan.scannedAt).toLocaleString()}
                      </div>
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

          {/* RFID Whitelist Management */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="text-blue-400" size={24} />
              <h2 className="text-lg font-semibold">RFID Whitelist</h2>
            </div>

            {/* Add RFID Form */}
            <form onSubmit={handleAddRfid} className="mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  RFID UID *
                </label>
                <input
                  type="text"
                  value={newUid}
                  onChange={(e) => setNewUid(e.target.value)}
                  placeholder="e.g., A1B2C3D4"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g., John's access card"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={addingRfid || !newUid.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50"
              >
                <Plus size={18} />
                {addingRfid ? 'Adding...' : 'Add to Whitelist'}
              </button>
            </form>

            {/* Whitelist Entries */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rfidWhitelist.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-4">No entries in whitelist</div>
              ) : (
                rfidWhitelist.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm">{entry.uid}</div>
                      {entry.description && (
                        <div className="text-xs text-gray-400">{entry.description}</div>
                      )}
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
