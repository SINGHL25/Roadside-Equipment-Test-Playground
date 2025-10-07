import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Upload, Download, Plus, Settings, Activity, AlertCircle, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

// Data types
const DEVICE_TYPES = {
  VR: { name: 'Video Recognition', color: '#3b82f6', icon: '📷' },
  VDC: { name: 'Vehicle Data Collector', color: '#8b5cf6', icon: '🚗' },
  TSMC: { name: 'Traffic Station Controller', color: '#ec4899', icon: '🎛️' },
  TSC: { name: 'Traffic Signal Controller', color: '#f59e0b', icon: '🚦' },
  MOXA: { name: 'Serial/IoT Gateway', color: '#10b981', icon: '🔌' },
  TRX: { name: 'DSRC Transceiver', color: '#06b6d4', icon: '📡' },
  Gantry: { name: 'Gantry System', color: '#6366f1', icon: '🏗️' },
  Shelter: { name: 'Tech Shelter', color: '#64748b', icon: '🏠' }
};

const SEVERITY_COLORS = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800'
};

// Sample seed data
const generateSeedData = () => {
  const devices = [
    { id: 'VR-01', type: 'VR', model: 'VRX-200', status: 'normal', location: { x: 100, y: 200 } },
    { id: 'VDC-1', type: 'VDC', model: 'VDC-500', status: 'normal', location: { x: 300, y: 200 } },
    { id: 'TSMC-1', type: 'TSMC', model: 'TSMC-100', status: 'normal', location: { x: 500, y: 200 } },
    { id: 'MOXA-1', type: 'MOXA', model: 'MOXA-G1', status: 'normal', location: { x: 200, y: 350 } },
    { id: 'TRX-01', type: 'TRX', model: 'TRX-300', status: 'normal', location: { x: 400, y: 350 } },
    { id: 'GANTRY-1', type: 'Gantry', model: 'GNT-XL', status: 'normal', location: { x: 300, y: 100 } }
  ];

  const scenarios = [
    {
      id: 'SC-001',
      name: 'Time Sync Drift Scenario',
      duration: 120,
      events: [
        { time: 0, device: 'MOXA-1', type: 'TIME_SYNC_DRIFT', value: 0.05, severity: 'MEDIUM' },
        { time: 30, device: 'VDC-1', type: 'SYNC_ERROR', value: 0.05, severity: 'MEDIUM' },
        { time: 45, device: 'VR-01', type: 'FRAME_LOST', severity: 'HIGH' },
        { time: 60, device: 'VDC-1', type: 'RECOVERY', severity: 'LOW' },
        { time: 90, device: 'MOXA-1', type: 'SYNC_RESTORED', severity: 'LOW' }
      ]
    },
    {
      id: 'SC-002',
      name: 'TRX Message Flood',
      duration: 180,
      events: [
        { time: 0, device: 'TRX-01', type: 'MESSAGE_FLOOD', value: 1000, severity: 'HIGH' },
        { time: 20, device: 'VDC-1', type: 'BUFFER_OVERFLOW', severity: 'CRITICAL' },
        { time: 40, device: 'TSMC-1', type: 'PROCESSING_DELAY', value: 2.5, severity: 'HIGH' },
        { time: 90, device: 'TRX-01', type: 'RATE_LIMITING', severity: 'MEDIUM' },
        { time: 120, device: 'VDC-1', type: 'RECOVERY', severity: 'LOW' }
      ]
    }
  ];

  return { devices, scenarios };
};

const RoadsideTestPlayground = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [devices, setDevices] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [logs, setLogs] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize with seed data
  useEffect(() => {
    const { devices: seedDevices, scenarios: seedScenarios } = generateSeedData();
    setDevices(seedDevices);
    setScenarios(seedScenarios);
  }, []);

  // Animation loop for simulator
  useEffect(() => {
    if (isPlaying && selectedScenario) {
      animationRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + (0.1 * playbackSpeed);
          if (newTime >= selectedScenario.duration) {
            setIsPlaying(false);
            return selectedScenario.duration;
          }
          return newTime;
        });
      }, 100);
    } else {
      if (animationRef.current) clearInterval(animationRef.current);
    }
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isPlaying, playbackSpeed, selectedScenario]);

  // Process events based on current time
  useEffect(() => {
    if (selectedScenario && currentTime > 0) {
      const recentEvents = selectedScenario.events.filter(
        e => e.time <= currentTime && e.time > currentTime - 0.5
      );
      
      recentEvents.forEach(event => {
        // Update device status
        setDevices(prev => prev.map(d => 
          d.id === event.device 
            ? { ...d, status: event.severity === 'CRITICAL' ? 'alarm' : event.severity === 'HIGH' ? 'degraded' : 'normal' }
            : d
        ));

        // Add log entry
        const logEntry = {
          timestamp: new Date().toISOString(),
          device: event.device,
          level: event.severity,
          message: `${event.type}: ${event.value || 'Event triggered'}`,
          time: currentTime.toFixed(1)
        };
        setLogs(prev => [logEntry, ...prev].slice(0, 100));
      });
    }
  }, [currentTime, selectedScenario]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    devices.forEach((device, i) => {
      devices.slice(i + 1).forEach(otherDevice => {
        ctx.beginPath();
        ctx.moveTo(device.location.x, device.location.y);
        ctx.lineTo(otherDevice.location.x, otherDevice.location.y);
        ctx.stroke();
      });
    });

    // Draw devices
    devices.forEach(device => {
      const typeInfo = DEVICE_TYPES[device.type];
      
      // Device circle
      ctx.beginPath();
      ctx.arc(device.location.x, device.location.y, 30, 0, 2 * Math.PI);
      ctx.fillStyle = device.status === 'alarm' ? '#ef4444' : 
                      device.status === 'degraded' ? '#f59e0b' : typeInfo.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Device label
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(typeInfo.icon, device.location.x, device.location.y + 7);
      
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(device.id, device.location.x, device.location.y + 50);
    });
  }, [devices]);

  const handlePlayPause = () => {
    if (!selectedScenario) return;
    if (currentTime >= selectedScenario.duration) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setLogs([]);
    const { devices: seedDevices } = generateSeedData();
    setDevices(seedDevices);
  };

  const runAutomatedTests = () => {
    const results = [
      { id: 'TC-001', name: 'Time Sync Recovery Test', status: 'passed', duration: 2.3 },
      { id: 'TC-002', name: 'Message Flood Handling', status: 'passed', duration: 3.1 },
      { id: 'TC-003', name: 'Device Failover Test', status: 'passed', duration: 1.8 },
      { id: 'TC-004', name: 'Alarm Propagation Test', status: 'passed', duration: 2.5 },
      { id: 'TC-005', name: 'Data Integrity Check', status: 'failed', duration: 4.2 }
    ];
    setTestResults(results);
    setActiveTab('reports');
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      scenario: selectedScenario?.name || 'N/A',
      testResults,
      logs: logs.slice(0, 50),
      devices: devices.map(d => ({ id: d.id, type: d.type, status: d.status }))
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Roadside Equipment Test Playground</h1>
                <p className="text-sm text-slate-400">E2E Testing & Simulation Platform</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center gap-2 transition-colors">
                <Upload className="w-4 h-4" />
                Import Logs
              </button>
              <button onClick={exportReport} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-800/30 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {['inventory', 'simulator', 'tests', 'reports'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-slate-700 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Device Inventory</h2>
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Device
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map(device => {
                const typeInfo = DEVICE_TYPES[device.type];
                return (
                  <div key={device.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{typeInfo.icon}</div>
                        <div>
                          <h3 className="font-bold text-lg">{device.id}</h3>
                          <p className="text-sm text-slate-400">{typeInfo.name}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        device.status === 'alarm' ? 'bg-red-900/50 text-red-300' :
                        device.status === 'degraded' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {device.status}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Model:</span>
                        <span className="font-medium">{device.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Type:</span>
                        <span className="font-medium">{device.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Simulator Tab */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Scenario Selection */}
              <div className="col-span-1 space-y-4">
                <h2 className="text-xl font-bold">Scenarios</h2>
                {scenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    onClick={() => {
                      setSelectedScenario(scenario);
                      handleReset();
                    }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedScenario?.id === scenario.id
                        ? 'bg-cyan-600/20 border-cyan-500'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <h3 className="font-bold mb-1">{scenario.name}</h3>
                    <p className="text-sm text-slate-400">Duration: {scenario.duration}s</p>
                    <p className="text-sm text-slate-400">{scenario.events.length} events</p>
                  </div>
                ))}
              </div>

              {/* Visualization */}
              <div className="col-span-2 space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h2 className="text-xl font-bold mb-4">System Map</h2>
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={500}
                    className="w-full bg-slate-900/50 rounded-lg"
                  />
                </div>

                {/* Playback Controls */}
                {selectedScenario && (
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center gap-4 mb-4">
                      <button onClick={handleReset} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
                        <SkipBack className="w-5 h-5" />
                      </button>
                      <button onClick={handlePlayPause} className="p-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg">
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </button>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max={selectedScenario.duration}
                          value={currentTime}
                          onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-slate-400 mt-1">
                          <span>{currentTime.toFixed(1)}s</span>
                          <span>{selectedScenario.duration}s</span>
                        </div>
                      </div>
                      <select
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                        className="px-3 py-2 bg-slate-700 rounded-lg text-sm"
                      >
                        <option value="0.5">0.5x</option>
                        <option value="1">1x</option>
                        <option value="2">2x</option>
                        <option value="5">5x</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Log */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold mb-4">Event Log</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg text-sm">
                    <span className="text-slate-500">{log.time}s</span>
                    <span className="font-mono text-cyan-400">{log.device}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[log.level]}`}>
                      {log.level}
                    </span>
                    <span className="flex-1 text-slate-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Test Suite</h2>
              <button
                onClick={runAutomatedTests}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Run Automated Tests
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {['Unit Tests', 'Component Tests', 'Integration Tests', 'System Tests'].map((suite, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{suite}</h3>
                    <span className="text-sm text-slate-400">12 tests</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${85 + idx * 3}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Test Results & Reports</h2>
            
            {/* KPI Dashboard */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Test Pass Rate', value: '92.3%', icon: CheckCircle, color: 'text-green-400' },
                { label: 'System Uptime', value: '99.8%', icon: Activity, color: 'text-cyan-400' },
                { label: 'Avg Response Time', value: '245ms', icon: Clock, color: 'text-yellow-400' },
                { label: 'Active Alarms', value: '3', icon: AlertCircle, color: 'text-red-400' }
              ].map((kpi, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                    <div>
                      <p className="text-sm text-slate-400">{kpi.label}</p>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold mb-4">Latest Test Run</h3>
                <div className="space-y-2">
                  {testResults.map(result => (
                    <div key={result.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {result.status === 'passed' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-slate-400">{result.id}</p>
                        </div>
                      </div>
                      <span className="text-sm text-slate-400">{result.duration}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default RoadsideTestPlayground;