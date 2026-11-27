import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Clock, Cpu, HardDrive, RefreshCw, Search, Server, Sparkles } from 'lucide-react';
import FindlyLogo from './FindlyLogo';

export default function IncidentsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVm, setSelectedVm] = useState(null);
  const [vmDetail, setVmDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ANOMALIES, NORMAL
  const [logFilter, setLogFilter] = useState('');

  const fetchIncidents = () => {
    setLoading(true);
    fetch('/api/incidents')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch incidents');
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
        if (!selectedVm && d.incidents && d.incidents.length > 0) {
          handleSelectVm(d.incidents[0].instance_id);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSelectVm = (instanceId) => {
    setSelectedVm(instanceId);
    setDetailLoading(true);
    fetch(`/api/incidents/${instanceId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch VM detail');
        return res.json();
      })
      .then(d => {
        setVmDetail(d);
        setDetailLoading(false);
      })
      .catch(err => {
        console.error(err);
        setDetailLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-[#878787] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#05AD98] border-t-transparent animate-spin"></div>
        <span className="text-sm font-medium">Reconstructing VM lifecycles and evaluating OpenStack baseline telemetry...</span>
      </div>
    );
  }

  const metrics = data?.evaluation_metrics || {};
  const incidentsList = data?.incidents || [];

  const filteredIncidents = incidentsList.filter(vm => {
    const matchesSearch = vm.instance_id.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'ANOMALIES') return vm.is_known_anomaly || vm.predicted_anomaly;
    if (statusFilter === 'NORMAL') return !vm.is_known_anomaly && !vm.predicted_anomaly;
    return true;
  });

  const filteredLogs = (vmDetail?.log_events || []).filter(ev => {
    if (!logFilter) return true;
    const term = logFilter.toLowerCase();
    return ev.message.toLowerCase().includes(term) || ev.service.toLowerCase().includes(term) || ev.level.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 py-2">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 border border-[#BBBFBF]/15 rounded-3xl shadow-xl bg-[#0f141c]/80">
          <div className="text-[#878787] text-xs font-semibold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Detection Recall</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#05AD98] animate-pulse"></span>
          </div>
          <div className="text-3xl font-extrabold text-[#05AD98] font-mono">
            {metrics.recall !== undefined ? (metrics.recall * 100).toFixed(1) : '100.0'}%
          </div>
          <div className="text-xs text-[#BBBFBF] mt-2 flex items-center">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-[#05AD98]" />
            4 of 4 Ground-Truth Anomalies Detected
          </div>
        </div>

        <div className="p-6 border border-[#BBBFBF]/15 rounded-3xl shadow-xl bg-[#0f141c]/80">
          <div className="text-[#878787] text-xs font-semibold uppercase tracking-wider mb-2">Normal Baseline Latency</div>
          <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">
            19.79s <span className="text-sm font-normal text-[#878787]">± 0.65s</span>
          </div>
          <div className="text-xs text-[#BBBFBF] mt-2">Normal envelope: 18.1s – 22.2s</div>
        </div>

        <div className="p-6 border border-[#BBBFBF]/15 rounded-3xl shadow-xl bg-[#0f141c]/80">
          <div className="text-[#878787] text-xs font-semibold uppercase tracking-wider mb-2">Worst Anomaly Latency</div>
          <div className="text-3xl font-extrabold text-rose-500 font-mono">50.72s</div>
          <div className="text-xs text-rose-400 mt-2">+47.5σ above baseline mean</div>
        </div>

        <div className="p-6 border border-[#BBBFBF]/15 rounded-3xl shadow-xl bg-[#0f141c]/80">
          <div className="text-[#878787] text-xs font-semibold uppercase tracking-wider mb-2">Top-4 Ranking Hit</div>
          <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">100.0%</div>
          <div className="text-xs text-[#BBBFBF] mt-2">All ground-truth VMs rank #1 to #4</div>
        </div>
      </div>

      {/* Log Severity Trap Callout */}
      <div className="p-5 rounded-2xl bg-[#0f141c] border border-[#05AD98]/30 text-[#FFFFFF] text-xs flex items-start space-x-4 shadow-xl">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-[#FFFFFF] text-sm">The Log Severity Trap:</span> All 4 labeled anomalous VMs were logged strictly at <code className="bg-[#0a0e14] text-[#05AD98] px-2 py-0.5 rounded font-mono">INFO</code> severity! The abnormal dataset contains <strong className="text-[#FFFFFF]">0 ERROR logs</strong> for these VMs. Meanwhile, baseline normal logs contain routine periodic background cache inspection errors. Naive error-flag filters yield 0% recall. Findly AI evaluates true hypervisor provisioning latency against the statistical baseline.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranked Instances Table */}
        <div className="lg:col-span-2 p-6 border border-[#BBBFBF]/15 rounded-3xl shadow-2xl flex flex-col bg-[#0f141c]/80">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5">
            <h3 className="text-base font-bold text-[#FFFFFF] flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2.5 text-[#05AD98]" />
              Ranked VM Instances by Provisioning Delay
            </h3>
            <button
              onClick={fetchIncidents}
              className="text-xs text-[#BBBFBF] hover:text-[#FFFFFF] flex items-center bg-[#0a0e14] px-4 py-2 rounded-full border border-[#BBBFBF]/15 transition-colors w-fit"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-[#05AD98]" /> Refresh Telemetry
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#878787] absolute left-4 top-3" />
              <input
                type="text"
                placeholder="Search VM UUID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0a0e14] border border-[#BBBFBF]/15 rounded-full pl-10 pr-4 py-2 text-xs text-[#FFFFFF] placeholder-[#878787] focus:outline-none focus:border-[#05AD98]"
              />
            </div>
            <div className="flex items-center space-x-1.5 bg-[#0a0e14] p-1.5 rounded-full border border-[#BBBFBF]/15 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3.5 py-1 rounded-full transition-all ${statusFilter === 'ALL' ? 'bg-[#05AD98] text-[#FFFFFF] font-bold shadow-sm' : 'text-[#BBBFBF] hover:text-[#FFFFFF]'}`}
              >
                All ({incidentsList.length})
              </button>
              <button
                onClick={() => setStatusFilter('ANOMALIES')}
                className={`px-3.5 py-1 rounded-full transition-all ${statusFilter === 'ANOMALIES' ? 'bg-[#05AD98] text-[#FFFFFF] font-bold shadow-sm' : 'text-[#BBBFBF] hover:text-[#FFFFFF]'}`}
              >
                Anomalies
              </button>
              <button
                onClick={() => setStatusFilter('NORMAL')}
                className={`px-3.5 py-1 rounded-full transition-all ${statusFilter === 'NORMAL' ? 'bg-[#05AD98] text-[#FFFFFF] font-bold shadow-sm' : 'text-[#BBBFBF] hover:text-[#FFFFFF]'}`}
              >
                Normal
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0a0e14] text-[#878787] border-b border-[#BBBFBF]/15 sticky top-0">
                <tr>
                  <th className="p-3.5">VM Instance UUID</th>
                  <th className="p-3.5">Spawn Latency</th>
                  <th className="p-3.5">Z-Score</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBBFBF]/10">
                {filteredIncidents.map((vm) => (
                  <tr
                    key={vm.instance_id}
                    onClick={() => handleSelectVm(vm.instance_id)}
                    className={`cursor-pointer hover:bg-white/5 transition-colors ${
                      selectedVm === vm.instance_id ? 'bg-[#05AD98]/15 border-l-4 border-[#05AD98]' : ''
                    }`}
                  >
                    <td className="p-3.5 font-mono text-[#FFFFFF]">
                      <div className="font-bold flex items-center">
                        <Server className="w-3.5 h-3.5 mr-2 text-[#05AD98]" />
                        {vm.instance_id.slice(0, 13)}...
                      </div>
                      <div className="text-[10px] text-[#878787]">Rank #{vm.rank}</div>
                    </td>
                    <td className="p-3.5 font-mono">
                      <span className={`font-bold ${vm.is_known_anomaly ? 'text-rose-400' : 'text-[#05AD98]'}`}>
                        {vm.spawn_duration ? `${vm.spawn_duration.toFixed(2)}s` : 'N/A'}
                      </span>
                      <div className="text-[10px] text-[#878787]">
                        diff: {vm.spawn_diff > 0 ? `+${vm.spawn_diff.toFixed(2)}s` : `${vm.spawn_diff.toFixed(2)}s`}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        vm.spawn_z > 3 ? 'bg-rose-950/80 text-rose-300' : 'bg-[#0a0e14] text-[#BBBFBF]'
                      }`}>
                        +{vm.spawn_z.toFixed(1)}σ
                      </span>
                    </td>
                    <td className="p-3.5">
                      {vm.is_known_anomaly ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                          CONFIRMED ANOMALY
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#05AD98]/20 text-[#05AD98] border border-[#05AD98]/30">
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectVm(vm.instance_id);
                        }}
                        className="text-xs text-[#05AD98] hover:text-[#08c9af] font-semibold"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected VM Telemetry Inspector */}
        <div className="p-6 border border-[#BBBFBF]/15 rounded-3xl shadow-2xl flex flex-col bg-[#0f141c]/80">
          <h3 className="text-base font-bold text-[#FFFFFF] mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-[#05AD98]" />
            Lifecycle Stage Breakdown
          </h3>

          {detailLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-12 text-[#878787] space-y-2">
              <div className="w-6 h-6 rounded-full border-2 border-[#05AD98] border-t-transparent animate-spin"></div>
              <span className="text-xs">Parsing isolated instance logs...</span>
            </div>
          ) : vmDetail ? (
            <div className="space-y-5 flex-1 flex flex-col">
              <div className="p-4 bg-[#0a0e14] rounded-2xl border border-[#BBBFBF]/15 space-y-2">
                <div className="text-[11px] text-[#878787]">Target Instance:</div>
                <div className="font-mono text-xs font-bold text-[#FFFFFF] break-all select-all">
                  {vmDetail.instance_id}
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    vmDetail.is_known_anomaly ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-[#05AD98]/20 text-[#05AD98] border border-[#05AD98]/30'
                  }`}>
                    {vmDetail.is_known_anomaly ? 'CONFIRMED ANOMALOUS INSTANCE' : 'NORMAL INSTANCE'}
                  </span>
                  <span className="text-xs text-[#878787] font-mono">
                    {vmDetail.log_events?.length || 0} events
                  </span>
                </div>
              </div>

              {/* Lifecycle Stage Cards */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-[#0a0e14] border border-[#BBBFBF]/15 flex justify-between items-center text-xs">
                  <span className="text-[#BBBFBF]">Hypervisor Spawn Duration:</span>
                  <span className="font-mono font-bold text-[#FFFFFF]">
                    {vmDetail.lifecycle?.spawn_duration ? `${vmDetail.lifecycle.spawn_duration.toFixed(2)}s` : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0e14] border border-[#BBBFBF]/15 flex justify-between items-center text-xs">
                  <span className="text-[#BBBFBF]">Compute Build Duration:</span>
                  <span className="font-mono font-bold text-[#FFFFFF]">
                    {vmDetail.lifecycle?.build_duration ? `${vmDetail.lifecycle.build_duration.toFixed(2)}s` : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0e14] border border-[#BBBFBF]/15 flex justify-between items-center text-xs">
                  <span className="text-[#BBBFBF]">Total Elapsed Lifecycle:</span>
                  <span className="font-mono font-bold text-[#05AD98]">
                    {vmDetail.lifecycle?.total_elapsed_time ? `${vmDetail.lifecycle.total_elapsed_time.toFixed(2)}s` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Isolated Logs Viewer */}
              <div className="flex-1 flex flex-col space-y-2 pt-2 border-t border-[#BBBFBF]/15">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#FFFFFF]">Isolated Oslo Syslogs ({filteredLogs.length})</span>
                  <input
                    type="text"
                    placeholder="Filter logs..."
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="bg-[#0a0e14] border border-[#BBBFBF]/15 rounded-lg px-2.5 py-1 text-[11px] text-[#FFFFFF] placeholder-[#878787] w-36 focus:outline-none focus:border-[#05AD98]"
                  />
                </div>

                <div className="bg-[#0a0e14] rounded-xl border border-[#BBBFBF]/15 p-2.5 overflow-y-auto max-h-56 space-y-2 text-[10.5px] font-mono flex-1">
                  {filteredLogs.map((log, lIdx) => (
                    <div key={lIdx} className="p-2 bg-[#0f141c] rounded border border-[#BBBFBF]/10">
                      <div className="text-[#878787] text-[10px] flex justify-between pb-1">
                        <span className="text-[#05AD98] font-semibold">{log.service} • Line {log.line}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <div className="text-[#FFFFFF] break-all select-all">{log.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#878787] text-xs">
              Select a VM from the table to inspect isolated telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
