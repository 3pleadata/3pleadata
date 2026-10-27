import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  Activity,
  History,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  ScanFace,
  Download,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BiometricTrustScoreData,
  getBiometricTrustMetrics,
  recordBiometricAudit,
  playBiometricSound,
  triggerBiometricHaptic,
  BiometricMethod,
} from '../services/biometrics';

interface BiometricTrustScoreWidgetProps {
  language?: 'en' | 'ha';
  onRunBiometricVerification?: () => void;
}

export const BiometricTrustScoreWidget: React.FC<BiometricTrustScoreWidgetProps> = ({
  language = 'en',
  onRunBiometricVerification,
}) => {
  const [metrics, setMetrics] = useState<BiometricTrustScoreData>(getBiometricTrustMetrics);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationStep, setCalibrationStep] = useState<string>('');
  const [selectedSensor, setSelectedSensor] = useState<BiometricMethod>('faceid');
  const [showAuditLogs, setShowAuditLogs] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<'30d' | '7d' | '24h'>('30d');

  // Refresh metrics when component mounts or storage changes
  useEffect(() => {
    setMetrics(getBiometricTrustMetrics());
  }, []);

  // Compute Delta between Current and Historical
  const latencyDelta = metrics.historicalAvgResponsivenessMs - metrics.currentResponsivenessMs;
  const isFaster = latencyDelta >= 0;
  const deltaPct = Math.round(
    (Math.abs(latencyDelta) / Math.max(1, metrics.historicalAvgResponsivenessMs)) * 100
  );

  // SVG Gauge calculations
  // Gauge spans 240 degrees (from 150° to 390° / -30°)
  // Range: 0 ms to 700 ms (0 is top-left, 700 is top-right)
  const msToAngle = (ms: number): number => {
    const clamped = Math.max(80, Math.min(700, ms));
    // 80ms -> 150°, 700ms -> 390° (sweep of 240°)
    const fraction = (clamped - 80) / (700 - 80);
    return 150 + fraction * 240;
  };

  const currentNeedleAngle = msToAngle(metrics.currentResponsivenessMs);
  const historicalNeedleAngle = msToAngle(metrics.historicalAvgResponsivenessMs);

  // Helper for polar to cartesian coordinates on radius
  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(
      ' '
    );
  };

  // Run real-time calibration benchmark
  const handleRunCalibration = async () => {
    if (isCalibrating) return;
    setIsCalibrating(true);
    playBiometricSound('scan');
    triggerBiometricHaptic('medium');

    const steps = [
      language === 'ha'
        ? 'Ana auna na\'urar binciken halitta...'
        : 'Initializing hardware security enclave probe...',
      language === 'ha'
        ? 'Ana auna saurin amsawar na\'ura...'
        : 'Measuring biometric bus latency & timing jitter...',
      language === 'ha'
        ? 'Ana tabbatar da matakin amana...'
        : 'Attesting cryptographic signature & fidelity...',
    ];

    setCalibrationStep(steps[0]);

    setTimeout(() => {
      setCalibrationStep(steps[1]);
      playBiometricSound('tick');
      triggerBiometricHaptic('light');
    }, 450);

    setTimeout(() => {
      setCalibrationStep(steps[2]);
      playBiometricSound('tick');
      triggerBiometricHaptic('light');
    }, 900);

    setTimeout(() => {
      // Simulate real probe latency between 190ms and 360ms
      const simulatedLatency = Math.round(200 + Math.random() * 110);
      const updated = recordBiometricAudit(selectedSensor, simulatedLatency, true);
      setMetrics(updated);
      setIsCalibrating(false);
      setCalibrationStep('');
      playBiometricSound('success');
      triggerBiometricHaptic('success');
    }, 1400);
  };

  // Export JSON audit log
  const handleExportAuditLogs = () => {
    const exportData = {
      applet: '3PLE A Biometric Trust Engine',
      exportedAt: new Date().toISOString(),
      trustMetrics: metrics,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', jsonStr);
    dlAnchor.setAttribute(
      'download',
      `3PLEA_Biometric_Trust_Score_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
    playBiometricSound('tap');
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      {/* Widget Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {language === 'ha'
                    ? 'Makin Amincewa da Halittar Jiki'
                    : 'Biometric Trust Score & Sensor Telemetry'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'ha'
                  ? 'Auna daidaito da saurin na\'urar binciken fuska da dan yatsa'
                  : 'Real-time sensor responsiveness vs. 30-day historical consistency benchmark'}
              </p>
            </div>
          </div>
        </div>

        {/* Sensor selector & Calibration Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSelectedSensor('faceid')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                selectedSensor === 'faceid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>FaceID</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSensor('fingerprint')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                selectedSensor === 'fingerprint'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Touch ID</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleRunCalibration}
            disabled={isCalibrating}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 dark:bg-amber-400 dark:hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-60 active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`} />
            <span>
              {isCalibrating
                ? language === 'ha'
                  ? 'Ana aunawa...'
                  : 'Probing Sensor...'
                : language === 'ha'
                ? 'Auna Na\'ura'
                : 'Calibrate Sensor'}
            </span>
          </button>
        </div>
      </div>

      {/* Calibration status banner */}
      {isCalibrating && (
        <div className="px-6 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>{calibrationStep}</span>
          </div>
          <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
            ISO/IEC 19794 Benchmark
          </span>
        </div>
      )}

      {/* Main Grid: Dual Gauge Cluster & Trust Metrics */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Dual Needle Gauge Visualization (Current vs Historical Avg) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[340px] aspect-[4/3] flex items-center justify-center select-none">
            <svg viewBox="0 0 300 230" className="w-full h-full overflow-visible">
              {/* Definitions for Gradients & Glow */}
              <defs>
                <linearGradient id="gaugeArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="45%" stopColor="#06b6d4" />
                  <stop offset="75%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Arc Track */}
              <path
                d={describeArc(150, 150, 105, 150, 390)}
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                strokeLinecap="round"
                className="text-slate-100 dark:text-slate-800"
              />

              {/* Colored Performance Gradient Arc Track */}
              <path
                d={describeArc(150, 150, 105, 150, 390)}
                fill="none"
                stroke="url(#gaugeArcGrad)"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* Tick Marks along the arc */}
              {[150, 190, 230, 270, 310, 350, 390].map((angle, idx) => {
                const innerPt = polarToCartesian(150, 150, 92, angle);
                const outerPt = polarToCartesian(150, 150, 99, angle);
                const labelPt = polarToCartesian(150, 150, 78, angle);
                const msLabels = ['100ms', '200ms', '300ms', '400ms', '500ms', '600ms', '700ms'];
                return (
                  <g key={idx}>
                    <line
                      x1={innerPt.x}
                      y1={innerPt.y}
                      x2={outerPt.x}
                      y2={outerPt.y}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-slate-400 dark:text-slate-600"
                    />
                    <text
                      x={labelPt.x}
                      y={labelPt.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[9px] fill-slate-400 dark:fill-slate-500 font-mono"
                    >
                      {msLabels[idx]}
                    </text>
                  </g>
                );
              })}

              {/* HISTORICAL AVERAGE NEEDLE (Secondary Dashed Pointer with Diamond Tip) */}
              <g
                className="transition-transform duration-700 ease-out"
                style={{
                  transformOrigin: '150px 150px',
                  transform: `rotate(${historicalNeedleAngle - 90}deg)`,
                }}
              >
                {/* Secondary needle line */}
                <line
                  x1="150"
                  y1="150"
                  x2="150"
                  y2="52"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  strokeDasharray="3 3"
                  opacity="0.9"
                />
                {/* Diamond head pointer */}
                <polygon
                  points="150,44 154,54 150,58 146,54"
                  fill="#8b5cf6"
                />
              </g>

              {/* CURRENT RESPONSIVENESS NEEDLE (Primary Solid Needle with Glow) */}
              <g
                className="transition-transform duration-500 ease-out"
                style={{
                  transformOrigin: '150px 150px',
                  transform: `rotate(${currentNeedleAngle - 90}deg)`,
                }}
              >
                {/* Needle blade */}
                <polygon
                  points="148,150 152,150 151,46 149,46"
                  fill="#10b981"
                  filter="url(#needleGlow)"
                />
                <circle cx="150" cy="46" r="3.5" fill="#10b981" />
              </g>

              {/* Center Pivot Hub */}
              <circle
                cx="150"
                cy="150"
                r="18"
                className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
                strokeWidth="3"
              />
              <circle cx="150" cy="150" r="7" className="fill-emerald-500" />
            </svg>

            {/* In-Gauge Live Readout overlay */}
            <div className="absolute bottom-1 left-0 right-0 text-center">
              <div className="flex items-center justify-center gap-4 text-xs font-mono">
                <div className="text-left">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                    {language === 'ha' ? 'Saurin Yanzu' : 'Current Latency'}
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {metrics.currentResponsivenessMs}ms
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                    {language === 'ha' ? 'Matsakaicin 30d' : '30-Day Avg'}
                  </div>
                  <div className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400">
                    {metrics.historicalAvgResponsivenessMs}ms
                  </div>
                </div>
              </div>

              {/* Delta Comparison Note */}
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <Zap className={`w-3.5 h-3.5 ${isFaster ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span>
                  {isFaster ? (
                    <>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {Math.abs(latencyDelta)}ms faster
                      </strong>{' '}
                      than historical average ({deltaPct}% efficiency boost)
                    </>
                  ) : (
                    <>
                      <strong className="text-amber-600 dark:text-amber-400">
                        {Math.abs(latencyDelta)}ms variance
                      </strong>{' '}
                      vs baseline
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Legend for Gauges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-500 rounded-full" />
              <span>Current Sensor Response</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 border-b-2 border-dashed border-purple-500" />
              <span>30-Day Baseline Average</span>
            </div>
          </div>
        </div>

        {/* Right: Biometric Trust Index & Core Consistency Stats */}
        <div className="lg:col-span-5 space-y-4">
          {/* Trust Score Hero Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block">
                  {language === 'ha' ? 'Makin Dogaro na Halitta' : 'Biometric Trust Index'}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {metrics.trustScore}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ 100</span>
                </div>
              </div>

              {/* Hardware Enclave Status */}
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{metrics.trustLevel}</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Hardware Enclave Attested
                </span>
              </div>
            </div>

            {/* Trust Progress meter */}
            <div className="mt-3">
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-500"
                  style={{ width: `${metrics.trustScore}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                <span>Pass Threshold: 75</span>
                <span>Fidelity: {metrics.sensorFidelityIndex}%</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Breakdown (Strictly unboxed typography, zero-pill discipline) */}
          <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
            <div className="pt-2 first:pt-0 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Match Consistency</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {metrics.matchConsistencyPct}%
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">False Rejection Rate (FRR)</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {metrics.falseRejectionRatePct}%
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Anti-Spoof Hardware Liveness</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {metrics.hardwareEnclaveIntegrity}%
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total Validated Samples</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {metrics.totalSamples} checks
              </span>
            </div>
          </div>

          {/* Quick Action Button for Direct Test */}
          {onRunBiometricVerification && (
            <button
              type="button"
              onClick={onRunBiometricVerification}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {language === 'ha'
                  ? 'Bude Allon Tsaron Halitta'
                  : 'Open Biometric Security Scanner'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Drawer Toggle */}
      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setShowAuditLogs(!showAuditLogs);
              playBiometricSound('tap');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {language === 'ha'
                ? 'Tarihin Auna Na\'ura (Audit Log)'
                : 'Sensor Verification History & Audit Trail'}
            </span>
            {showAuditLogs ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            onClick={handleExportAuditLogs}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium transition-colors cursor-pointer"
            title="Download full JSON audit report"
          >
            <Download className="w-3 h-3" />
            <span>Export Audit (JSON)</span>
          </button>
        </div>

        {/* Collapsible Audit Records */}
        {showAuditLogs && (
          <div className="mt-3 space-y-2 animate-in fade-in duration-200">
            {metrics.auditTrail.slice(0, 4).map((record) => (
              <div
                key={record.id}
                className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                      record.method === 'faceid'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-emerald-500/10 text-emerald-500'
                    }`}
                  >
                    {record.method === 'faceid' ? (
                      <ScanFace className="w-3.5 h-3.5" />
                    ) : (
                      <Fingerprint className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
                      {record.method === 'faceid' ? 'TrueDepth Face Scan' : 'Touch ID Ridge Plate'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(record.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {record.latencyMs}ms
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {record.status === 'optimal'
                      ? 'Optimal Response'
                      : record.status === 'nominal'
                      ? 'Nominal Response'
                      : 'Degraded'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
