import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RefreshCw,
  Check,
  Copy,
  Download,
  ExternalLink,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Cpu,
  Server,
  Laptop,
  Activity,
  Lock,
  AlertTriangle,
  Code,
  FileText,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Flame,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";

// =========================================================================
// 1. INLINE CISCO ISE 802.1X & RADIUS LIVE INTERACTIVE SIMULATOR ARTIFACT
// =========================================================================

interface AuthScenario {
  id: string;
  nameEn: string;
  nameFr: string;
  protocol: string;
  deviceType: "laptop" | "phone" | "printer" | "rogue";
  user: string;
  mac: string;
  vlan: string;
  dacl: string;
  result: "accept" | "reject" | "quarantine";
  posture: "compliant" | "non-compliant" | "bypassed" | "blocked";
}

const AUTH_SCENARIOS: AuthScenario[] = [
  {
    id: "corp_pc",
    nameEn: "Domain PC (PEAP-MSCHAPv2)",
    nameFr: "PC de Domaine (PEAP-MSCHAPv2)",
    protocol: "802.1X / PEAP",
    deviceType: "laptop",
    user: "CORP\\achanderdip",
    mac: "00:50:56:A1:B2:C3",
    vlan: "VLAN 10 (Corporate)",
    dacl: "PERMIT-ALL-CORP-DACL",
    result: "accept",
    posture: "compliant",
  },
  {
    id: "dev_cert",
    nameEn: "Developer Lab (EAP-TLS PKI)",
    nameFr: "Lab Développeur (Certificat EAP-TLS)",
    protocol: "802.1X / EAP-TLS",
    deviceType: "laptop",
    user: "dev-station-04.corp.local",
    mac: "3C:D9:2B:44:E1:90",
    vlan: "VLAN 99 (Quarantine / Remediation)",
    dacl: "REMEDIATION-ONLY-DACL",
    result: "quarantine",
    posture: "non-compliant",
  },
  {
    id: "printer_mab",
    nameEn: "IoT Printer (MAB Bypass)",
    nameFr: "Imprimante IoT (Contournement MAB)",
    protocol: "MAB / Profiling",
    deviceType: "printer",
    user: "hp-laserjet-fl3",
    mac: "00:1E:0B:88:99:AA",
    vlan: "VLAN 40 (IoT Restricted)",
    dacl: "PRINTER-PRINT-JOBS-DACL",
    result: "accept",
    posture: "bypassed",
  },
  {
    id: "rogue_device",
    nameEn: "Rogue Attacker (Spoofed MAC)",
    nameFr: "Intrus Réseau (MAC usurpée)",
    protocol: "Unauthorized EAPOL",
    deviceType: "rogue",
    user: "UNKNOWN_SUPPLICANT",
    mac: "DE:AD:BE:EF:00:01",
    vlan: "ACCESS-REJECT (Shutdown)",
    dacl: "DENY-ALL-SECURITY-VIOLATION",
    result: "reject",
    posture: "blocked",
  },
];

export const InlineCiscoIseSimulatorCard: React.FC<{
  isFr?: boolean;
  onLaunchFullModal?: () => void;
}> = ({ isFr = false, onLaunchFullModal }) => {
  const [selectedScenario, setSelectedScenario] = useState<AuthScenario>(AUTH_SCENARIOS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [showAttributes, setShowAttributes] = useState(false);

  const stepsList = isFr
    ? [
        "1. Supplicant émet trame EAPOL-Start au Switch",
        "2. Switch encapsule RADIUS Access-Request (Port 1812)",
        "3. Cisco ISE interroge AD & Posture Engine",
        "4. Résultat politique & dACL poussés sur le Port",
      ]
    : [
        "1. Supplicant sends EAPOL-Start to Switch",
        "2. Switch encapsulates RADIUS Access-Request (Port 1812)",
        "3. Cisco ISE queries AD & evaluates Posture policy",
        "4. Policy result & dACL enforced on Switch Port",
      ];

  const runSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setStep(1);
    setLogs([
      `[${new Date().toLocaleTimeString()}] EAPOL-Start received from MAC ${selectedScenario.mac}`,
    ]);

    setTimeout(() => {
      setStep(2);
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] RADIUS Access-Request -> Cisco ISE (Port 1812) NAS-IP: 10.10.20.1`,
      ]);
    }, 900);

    setTimeout(() => {
      setStep(3);
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ISE Policy Engine: Evaluating Identity '${selectedScenario.user}' against AD/PKI... Posture: ${selectedScenario.posture.toUpperCase()}`,
      ]);
    }, 1800);

    setTimeout(() => {
      setStep(4);
      const outcome =
        selectedScenario.result === "accept"
          ? `RADIUS Access-Accept | Assigned ${selectedScenario.vlan} | dACL: ${selectedScenario.dacl}`
          : selectedScenario.result === "quarantine"
          ? `RADIUS Access-Accept (Restricted) | Redirect to Remediation Portal | ${selectedScenario.vlan}`
          : `RADIUS Access-Reject | Port Security Violation Action: Err-Disable`;
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${outcome}`]);
      setIsRunning(false);
    }, 2800);
  };

  useEffect(() => {
    // Reset when changing scenario
    setStep(0);
    setLogs([]);
  }, [selectedScenario]);

  return (
    <div className="w-full my-3.5 rounded-2xl bg-[#090C16] border border-purple-500/25 shadow-[0_12px_36px_rgba(0,0,0,0.65)] overflow-hidden text-left font-sans">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-transparent border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-sm">
            <Shield size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                {isFr ? "Simulateur Interactif Cisco ISE 802.1X" : "Cisco ISE 802.1X Live Simulator"}
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                Live Demo
              </span>
            </div>
            <p className="text-[10.5px] text-gray-400">
              {isFr
                ? "AAA Identity Policy, 802.1X EAP Handshake & Dynamic VLAN Enforcement"
                : "AAA Identity Policy, 802.1X EAP Handshake & Dynamic VLAN Enforcement"}
            </p>
          </div>
        </div>

        {onLaunchFullModal && (
          <button
            onClick={onLaunchFullModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 text-purple-200 hover:text-white border border-purple-500/30 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
            title={isFr ? "Ouvrir le simulateur complet" : "Open full studio simulator"}
          >
            <span>{isFr ? "Plein Écran" : "Full View"}</span>
            <ExternalLink size={11} />
          </button>
        )}
      </div>

      {/* Interactive Scenario Selector */}
      <div className="p-3.5 space-y-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300/80 font-semibold mb-1.5 block">
            {isFr ? "1. Sélectionner un profil d'authentification :" : "1. Select an authentication profile:"}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {AUTH_SCENARIOS.map((sc) => {
              const isSelected = selectedScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-purple-600/25 border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.25)] text-white"
                      : "bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {sc.deviceType === "laptop" && <Laptop size={12} className="text-purple-400" />}
                    {sc.deviceType === "printer" && <Cpu size={12} className="text-amber-400" />}
                    {sc.deviceType === "rogue" && <AlertTriangle size={12} className="text-red-400" />}
                    <span className="text-[10px] font-bold truncate">
                      {isFr ? sc.nameFr.split(" ")[0] : sc.nameEn.split(" ")[0]}
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-gray-400 truncate">
                    {sc.protocol}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Topology Flow Visualizer */}
        <div className="p-3 rounded-xl bg-[#05070C] border border-white/[0.06] relative">
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-2">
            <span className="text-purple-300 font-semibold">
              {isFr ? "2. Schéma de flux en temps réel" : "2. Real-Time Packet Protocol Flow"}
            </span>
            <span className="text-xs">
              {step === 0 && (isFr ? "Prêt à tester" : "Ready to test")}
              {step === 1 && (isFr ? "Émission EAPOL..." : "Sending EAPOL...")}
              {step === 2 && (isFr ? "RADIUS 1812..." : "RADIUS 1812...")}
              {step === 3 && (isFr ? "Évaluation Posture..." : "Evaluating Posture...")}
              {step === 4 && (isFr ? "Application Terminée" : "Enforcement Complete")}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 items-center text-center py-2 relative">
            {/* Step Node 1: Supplicant */}
            <div
              className={`p-2 rounded-lg border transition-all ${
                step >= 1
                  ? "bg-purple-600/20 border-purple-400 text-white"
                  : "bg-white/[0.02] border-white/[0.06] text-gray-400"
              }`}
            >
              <div className="flex justify-center mb-1">
                {selectedScenario.deviceType === "rogue" ? (
                  <AlertTriangle size={16} className="text-red-400" />
                ) : (
                  <Laptop size={16} className="text-purple-400" />
                )}
              </div>
              <p className="text-[9.5px] font-bold">Client</p>
              <p className="text-[7.5px] font-mono text-gray-500 truncate">{selectedScenario.mac}</p>
            </div>

            {/* Step Node 2: Switch */}
            <div
              className={`p-2 rounded-lg border transition-all ${
                step >= 2
                  ? "bg-indigo-600/20 border-indigo-400 text-white"
                  : "bg-white/[0.02] border-white/[0.06] text-gray-400"
              }`}
            >
              <div className="flex justify-center mb-1">
                <Server size={16} className="text-indigo-400" />
              </div>
              <p className="text-[9.5px] font-bold">Switch / NAS</p>
              <p className="text-[7.5px] font-mono text-gray-500">Gi1/0/12</p>
            </div>

            {/* Step Node 3: Cisco ISE */}
            <div
              className={`p-2 rounded-lg border transition-all ${
                step >= 3
                  ? "bg-purple-600/20 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  : "bg-white/[0.02] border-white/[0.06] text-gray-400"
              }`}
            >
              <div className="flex justify-center mb-1">
                <Shield size={16} className="text-purple-400" />
              </div>
              <p className="text-[9.5px] font-bold">Cisco ISE</p>
              <p className="text-[7.5px] font-mono text-gray-500">AAA Engine</p>
            </div>

            {/* Step Node 4: Directory / Enforcement */}
            <div
              className={`p-2 rounded-lg border transition-all ${
                step >= 4
                  ? selectedScenario.result === "accept"
                    ? "bg-emerald-600/20 border-emerald-400 text-emerald-200"
                    : selectedScenario.result === "quarantine"
                    ? "bg-amber-600/20 border-amber-400 text-amber-200"
                    : "bg-red-600/20 border-red-400 text-red-200"
                  : "bg-white/[0.02] border-white/[0.06] text-gray-400"
              }`}
            >
              <div className="flex justify-center mb-1">
                {selectedScenario.result === "accept" && <CheckCircle2 size={16} className="text-emerald-400" />}
                {selectedScenario.result === "quarantine" && <Lock size={16} className="text-amber-400" />}
                {selectedScenario.result === "reject" && <ShieldAlert size={16} className="text-red-400" />}
              </div>
              <p className="text-[9.5px] font-bold">Enforcement</p>
              <p className="text-[7.5px] font-mono truncate">
                {step >= 4
                  ? selectedScenario.result === "accept"
                    ? "VLAN 10"
                    : selectedScenario.result === "quarantine"
                    ? "VLAN 99"
                    : "Err-Disable"
                  : "Pending"}
              </p>
            </div>
          </div>

          {/* Animated Connecting Indicator */}
          {isRunning && (
            <div className="w-full bg-white/[0.05] h-1 rounded-full overflow-hidden mt-2">
              <motion.div
                className="bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 h-full"
                initial={{ width: "0%" }}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          )}
        </div>

        {/* Live Step Tracker & Console Output */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05] font-mono text-[10px]">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
              <Terminal size={11} />
              <span>RADIUS / Syslog Audit Stream</span>
            </span>
            <span className="text-[9px] text-gray-500">Port 1812 / 1813</span>
          </div>

          <div className="space-y-1 min-h-[46px] max-h-24 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic">
                {isFr
                  ? "Appuyez sur 'Tester l'Authentification' pour déclencher la simulation."
                  : "Click 'Run Authentication Test' to trigger packet exchange simulation."}
              </p>
            ) : (
              logs.map((lg, idx) => (
                <p
                  key={idx}
                  className={`leading-relaxed ${
                    lg.includes("Accept")
                      ? "text-emerald-400 font-semibold"
                      : lg.includes("Quarantine")
                      ? "text-amber-400 font-semibold"
                      : lg.includes("Reject")
                      ? "text-red-400 font-semibold"
                      : "text-gray-300"
                  }`}
                >
                  {lg}
                </p>
              ))
            )}
          </div>
        </div>

        {/* Action Controls & Result Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {isRunning ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              <span>
                {isRunning
                  ? (isFr ? "Test en cours..." : "Evaluating AAA...")
                  : (isFr ? "Tester l'Authentification" : "Run Authentication Test")}
              </span>
            </button>

            <button
              onClick={() => setShowAttributes(!showAttributes)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.08] text-[11px] font-medium transition-all cursor-pointer"
            >
              <Layers size={11} />
              <span>{isFr ? "Attributs RADIUS" : "RADIUS Attributes"}</span>
              <ChevronDown
                size={11}
                className={`transition-transform duration-200 ${showAttributes ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5">
            <span>Result:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                step === 4
                  ? selectedScenario.result === "accept"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : selectedScenario.result === "quarantine"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-red-500/20 text-red-300"
                  : "bg-white/5 text-gray-400"
              }`}
            >
              {step === 4 ? selectedScenario.result.toUpperCase() : "IDLE"}
            </span>
          </div>
        </div>

        {/* Collapsible RADIUS AV-Pairs Details */}
        <AnimatePresence>
          {showAttributes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-2.5 rounded-xl bg-black/60 border border-purple-500/20 font-mono text-[9.5px] space-y-1 text-gray-300">
                <div className="text-purple-300 font-bold mb-1">
                  RADIUS AV-Pair Payload (IETF RFC 2865):
                </div>
                <div>User-Name = &quot;{selectedScenario.user}&quot;</div>
                <div>Calling-Station-Id = &quot;{selectedScenario.mac}&quot;</div>
                <div>NAS-Port-Id = &quot;GigabitEthernet1/0/12&quot;</div>
                <div>Service-Type = Framed-User (2)</div>
                <div>Tunnel-Type = VLAN (13)</div>
                <div>Tunnel-Private-Group-Id = &quot;{selectedScenario.vlan}&quot;</div>
                <div>cisco-av-pair = &quot;dacl={selectedScenario.dacl}&quot;</div>
                <div>cisco-av-pair = &quot;posture-status={selectedScenario.posture}&quot;</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// =========================================================================
// 2. INLINE WAZUH SIEM & ACTIVE RESPONSE INCIDENT DEMO ARTIFACT
// =========================================================================

interface ThreatAlert {
  id: string;
  rule: string;
  level: number;
  mitre: string;
  agent: string;
  descriptionEn: string;
  descriptionFr: string;
  payload: string;
  mitigated: boolean;
}

const INITIAL_ALERTS: ThreatAlert[] = [
  {
    id: "alert_01",
    rule: "100201 (Ransomware Canary Triggered)",
    level: 14,
    mitre: "T1486 (Data Encrypted for Impact)",
    agent: "srv-app-prod-01 (10.0.4.15)",
    descriptionEn: "High-entropy rapid file modifications detected on confidential share.",
    descriptionFr: "Modifications de fichiers à haute entropie détectées sur le partage.",
    payload: `{"threat":"ransomware.crypter","files_encrypted":12,"entropy":7.98,"action_required":"host_isolate"}`,
    mitigated: false,
  },
  {
    id: "alert_02",
    rule: "5710 (SSH Password Spraying)",
    level: 10,
    mitre: "T1110.003 (Password Spraying)",
    agent: "dc-primary-01 (10.0.1.10)",
    descriptionEn: "Over 85 failed Kerberos pre-authentication attempts across 24 accounts.",
    descriptionFr: "Plus de 85 échecs de pré-authentification Kerberos sur 24 comptes.",
    payload: `{"source_ip":"185.220.101.5","attempts":85,"protocol":"kerberos","action_required":"ip_drop"}`,
    mitigated: false,
  },
  {
    id: "alert_03",
    rule: "80710 (Unauthorized Internal Port Sweep)",
    level: 7,
    mitre: "T1046 (Network Service Discovery)",
    agent: "workstation-hr-09 (10.0.3.44)",
    descriptionEn: "SYN scan across subnets targeting TCP/445, TCP/3389, and TCP/88.",
    descriptionFr: "Balayage SYN ciblant les ports TCP/445, TCP/3389 et TCP/88.",
    payload: `{"scan_type":"syn_stealth","targeted_ports":[445,3389,88],"action_required":"port_quarantine"}`,
    mitigated: false,
  },
];

export const InlineWazuhSiemDemoCard: React.FC<{
  isFr?: boolean;
  onLaunchFullModal?: () => void;
}> = ({ isFr = false, onLaunchFullModal }) => {
  const [alerts, setAlerts] = useState<ThreatAlert[]>(INITIAL_ALERTS);
  const [activeAlertId, setActiveAlertId] = useState<string>("alert_01");
  const [isMitigating, setIsMitigating] = useState(false);
  const [mitigationLogs, setMitigationLogs] = useState<string[]>([]);
  const [securityScore, setSecurityScore] = useState(84);

  const activeAlert = alerts.find((a) => a.id === activeAlertId) || alerts[0];

  const handleMitigate = () => {
    if (isMitigating) return;
    setIsMitigating(true);
    setMitigationLogs([
      `[${new Date().toLocaleTimeString()}] Executing Wazuh Active Response on agent '${activeAlert.agent}'...`,
    ]);

    setTimeout(() => {
      setMitigationLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Triggered command 'host-deny.sh' -> Injected iptables DROP rule for offending vectors.`,
      ]);
    }, 800);

    setTimeout(() => {
      setMitigationLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Cisco ISE CoA (Change of Authorization) pushed: Port moved to Remediation Quarantine VLAN.`,
      ]);
      setAlerts((prev) =>
        prev.map((a) => (a.id === activeAlert.id ? { ...a, mitigated: true } : a))
      );
      setSecurityScore((prev) => Math.min(100, prev + 5));
      setIsMitigating(false);
    }, 1800);
  };

  const handleReset = () => {
    setAlerts(INITIAL_ALERTS);
    setMitigationLogs([]);
    setSecurityScore(84);
  };

  return (
    <div className="w-full my-3.5 rounded-2xl bg-[#090C16] border border-cyan-500/25 shadow-[0_12px_36px_rgba(0,0,0,0.65)] overflow-hidden text-left font-sans">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-transparent border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-sm">
            <Activity size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                {isFr ? "Console Wazuh SIEM & Réponse aux Incidents" : "Wazuh SIEM & Active Response Console"}
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                Live SOC Lab
              </span>
            </div>
            <p className="text-[10.5px] text-gray-400">
              {isFr
                ? "Détection d'intrusion en temps réel, corrélation MITRE & isolement automatique"
                : "Real-time threat detection, MITRE ATT&CK mapping & automated host containment"}
            </p>
          </div>
        </div>

        {onLaunchFullModal && (
          <button
            onClick={onLaunchFullModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-200 hover:text-white border border-cyan-500/30 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
            title={isFr ? "Ouvrir le dashboard SOC complet" : "Open full SOC dashboard"}
          >
            <span>{isFr ? "Dashboard SOC" : "Full SOC"}</span>
            <ExternalLink size={11} />
          </button>
        )}
      </div>

      <div className="p-3.5 space-y-3">
        {/* SOC Posture Score & Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div>
              <p className="text-[9.5px] font-mono text-gray-400">Security Posture</p>
              <p className="text-base font-bold font-mono text-emerald-400">{securityScore}%</p>
            </div>
            <ShieldCheck size={20} className="text-emerald-400/80" />
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div>
              <p className="text-[9.5px] font-mono text-gray-400">Active Threats</p>
              <p className="text-base font-bold font-mono text-red-400">
                {alerts.filter((a) => !a.mitigated).length}
              </p>
            </div>
            <Flame size={20} className="text-red-400/80" />
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div>
              <p className="text-[9.5px] font-mono text-gray-400">Mitigated</p>
              <p className="text-base font-bold font-mono text-cyan-400">
                {alerts.filter((a) => a.mitigated).length}
              </p>
            </div>
            <CheckCircle2 size={20} className="text-cyan-400/80" />
          </div>
        </div>

        {/* Live Alert Feeds List */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300/80 font-semibold mb-1.5 block">
            {isFr ? "Incidents de Sécurité Détectés :" : "Detected Security Incidents:"}
          </span>
          <div className="space-y-1.5">
            {alerts.map((al) => {
              const isSelected = al.id === activeAlertId;
              return (
                <div
                  key={al.id}
                  onClick={() => setActiveAlertId(al.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-cyan-950/30 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                      : "bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.06]"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          al.level >= 12
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : al.level >= 9
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        LVL {al.level}
                      </span>
                      <span className="text-[11px] font-bold text-white truncate">
                        {al.rule}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">
                      {isFr ? al.descriptionFr : al.descriptionEn}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-mono text-cyan-300/80 hidden sm:inline">
                      {al.mitre.split(" ")[0]}
                    </span>
                    {al.mitigated ? (
                      <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {isFr ? "CONTENU" : "CONTAINED"}
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
                        {isFr ? "ACTIF" : "ACTIVE"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Incident Detail & Active Response Console */}
        <div className="p-3 rounded-xl bg-black/50 border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="font-mono text-cyan-300 font-bold flex items-center gap-1.5">
              <Terminal size={12} />
              <span>Active Response Playbook Console</span>
            </span>
            <span className="text-[9.5px] font-mono text-gray-500">
              Agent: {activeAlert.agent}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-black/60 border border-white/[0.05] font-mono text-[9.5px] text-gray-300">
            <span className="text-gray-500">Event JSON: </span>
            <span className="text-cyan-200">{activeAlert.payload}</span>
          </div>

          {/* Mitigation Logs */}
          {mitigationLogs.length > 0 && (
            <div className="p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/20 font-mono text-[9.5px] text-cyan-200 space-y-0.5">
              {mitigationLogs.map((log, lIdx) => (
                <p key={lIdx}>{log}</p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleMitigate}
              disabled={isMitigating || activeAlert.mitigated}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer ${
                activeAlert.mitigated
                  ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default"
                  : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white"
              }`}
            >
              {isMitigating ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : activeAlert.mitigated ? (
                <Check size={12} />
              ) : (
                <Zap size={12} />
              )}
              <span>
                {isMitigating
                  ? (isFr ? "Isolement en cours..." : "Containing Host...")
                  : activeAlert.mitigated
                  ? (isFr ? "Menace Neutralisée" : "Threat Mitigated")
                  : (isFr ? "Lancer l'Isolement Automatique" : "Execute Active Response Containment")}
              </span>
            </button>

            <button
              onClick={handleReset}
              className="text-[10px] font-mono text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshCw size={10} />
              <span>{isFr ? "Réinitialiser" : "Reset"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 3. INLINE CODE ARTIFACT & AUTOMATION SNIPPET VIEWER
// =========================================================================

interface CodeSnippetItem {
  id: string;
  title: string;
  language: string;
  filename: string;
  code: string;
  simulatedOutput: string[];
}

const SECURITY_CODE_SNIPPETS: CodeSnippetItem[] = [
  {
    id: "ise_rest_api",
    title: "Cisco ISE CoA Quarantine (Python)",
    language: "python",
    filename: "cisco_ise_coa_quarantine.py",
    code: `import requests
from requests.auth import HTTPBasicAuth

ISE_PAN_IP = "10.10.20.10"
REST_USER = "ise_admin"
REST_PASS = "SecOps#Vault2026!"

def trigger_change_of_authorization(mac_address: str, action: str = "BOUNCE"):
    """
    Sends a Change of Authorization (CoA) to Cisco ISE MnT Node
    to instantly quarantine or re-evaluate an endpoint session.
    """
    endpoint_url = f"https://{ISE_PAN_IP}:9060/ers/config/endpoint/coa"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    payload = {
        "coaType": action,
        "macAddress": mac_address,
        "nasIp": "10.10.20.1"
    }
    
    response = requests.post(
        endpoint_url,
        json=payload,
        auth=HTTPBasicAuth(REST_USER, REST_PASS),
        headers=headers,
        verify=False
    )
    return response.status_code, response.json()

# Example execution: Quarantine rogue MAC
status, result = trigger_change_of_authorization("00:50:56:A1:B2:C3", "REAUTH")
print(f"[+] CoA Trigger Status: {status} | Result: {result}")`,
    simulatedOutput: [
      "[INFO] Connecting to Cisco ISE MnT REST API (10.10.20.10:9060)...",
      "[INFO] Authentication successful with admin credentials.",
      "[POST] /ers/config/endpoint/coa (MAC: 00:50:56:A1:B2:C3, Action: REAUTH)",
      "[SUCCESS] Status 200 OK | Session bounced to Quarantine VLAN 99.",
    ],
  },
  {
    id: "cisco_switch_8021x",
    title: "Cisco Catalyst 802.1X Port Config",
    language: "ios",
    filename: "switch_port_security_8021x.ios",
    code: `! Cisco IOS-XE Enterprise Access Port Security Configuration
interface GigabitEthernet1/0/12
 description CORP_WORKSTATION_ACCESS
 switchport mode access
 switchport access vlan 10
 authentication host-mode multi-auth
 authentication order dot1x mab
 authentication priority dot1x mab
 authentication port-control auto
 authentication periodic
 authentication timer reauthenticate server
 mab
 dot1x pae authenticator
 dot1x timeout tx-period 5
 dot1x timeout supp-timeout 10
 spanning-tree portfast
 spanning-tree bpduguard enable
! Security Violation action: Err-Disable
 switchport port-security maximum 2
 switchport port-security violation restrict
! End Configuration`,
    simulatedOutput: [
      "Configuring interface GigabitEthernet1/0/12...",
      "Enabling 802.1X PAE Authenticator mode...",
      "Binding MAB fallback priority and dynamic VLAN assignment...",
      "BPDU Guard enabled. Portfast activated on access edge.",
    ],
  },
  {
    id: "wazuh_containment",
    title: "Wazuh Active Response Script (Bash)",
    language: "bash",
    filename: "host_containment_active_response.sh",
    code: `#!/bin/bash
# Wazuh Active Response - Automated Network & Process Quarantine
# Arguments: ACTION USER IP RULE_ID

ACTION=$1
USER=$2
IP=$3
RULE_ID=$4

LOG_FILE="/var/ossec/logs/active-responses.log"

echo "$(date) - Executing containment for IP: \${IP} (Triggered by Rule \${RULE_ID})" >> \${LOG_FILE}

if [ "\${ACTION}" == "add" ]; then
    # Quarantine attacker IP via Linux iptables
    iptables -I INPUT -s \${IP} -j DROP
    iptables -I FORWARD -s \${IP} -j DROP
    echo "$(date) - Injected iptables DROP rules for \${IP}" >> \${LOG_FILE}
elif [ "\${ACTION}" == "delete" ]; then
    iptables -D INPUT -s \${IP} -j DROP
    iptables -D FORWARD -s \${IP} -j DROP
fi

exit 0`,
    simulatedOutput: [
      "[EXEC] /var/ossec/active-response/bin/host_containment.sh add - 185.220.101.5 5710",
      "[LOG] Writing audit entry to /var/ossec/logs/active-responses.log",
      "[IPTABLES] Successfully injected DROP rules for subnet/IP 185.220.101.5",
      "[EXIT 0] Containment policy fully enacted.",
    ],
  },
];

export const InlineCodeArtifactCard: React.FC<{
  isFr?: boolean;
}> = ({ isFr = false }) => {
  const [activeTab, setActiveTab] = useState<string>("ise_rest_api");
  const [copied, setCopied] = useState(false);
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);

  const currentSnippet =
    SECURITY_CODE_SNIPPETS.find((s) => s.id === activeTab) || SECURITY_CODE_SNIPPETS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentSnippet.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = currentSnippet.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRunSim = () => {
    setIsRunningSim(true);
    setConsoleOutput(["[INIT] Spawning Python virtualenv & loading security credentials..."]);
    currentSnippet.simulatedOutput.forEach((line, index) => {
      setTimeout(() => {
        setConsoleOutput((prev) => [...prev, line]);
        if (index === currentSnippet.simulatedOutput.length - 1) {
          setIsRunningSim(false);
        }
      }, (index + 1) * 600);
    });
  };

  return (
    <div className="w-full my-3.5 rounded-2xl bg-[#080B14] border border-purple-500/20 shadow-[0_12px_36px_rgba(0,0,0,0.65)] overflow-hidden text-left font-sans">
      {/* Tab Switcher Header */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-purple-950/30 to-black/40 border-b border-white/[0.08] flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <Code size={14} className="text-purple-400" />
          <span className="text-xs font-bold text-white">
            {isFr ? "Artéfacts de Code & Automatisation" : "Security Code & Automation Artifact"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {SECURITY_CODE_SNIPPETS.map((snip) => (
            <button
              key={snip.id}
              onClick={() => {
                setActiveTab(snip.id);
                setConsoleOutput([]);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono transition-all cursor-pointer whitespace-nowrap ${
                activeTab === snip.id
                  ? "bg-purple-600/30 text-purple-200 border border-purple-500/40 font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {snip.filename}
            </button>
          ))}
        </div>
      </div>

      {/* Code Display Area */}
      <div className="relative p-3.5 bg-[#05070D]">
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-2">
          <span className="text-purple-300 font-medium">{currentSnippet.title}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copied ? (isFr ? "Copié !" : "Copied!") : (isFr ? "Copier" : "Copy")}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              <Download size={11} />
              <span>{isFr ? "Télécharger" : "Download"}</span>
            </button>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto rounded-xl bg-black/60 border border-white/[0.05] p-3 font-mono text-[10.5px] leading-relaxed text-gray-300 select-text">
          <pre className="whitespace-pre overflow-x-auto">{currentSnippet.code}</pre>
        </div>

        {/* Live Execution Runner */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleRunSim}
              disabled={isRunningSim}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/90 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {isRunningSim ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              <span>
                {isRunningSim
                  ? (isFr ? "Exécution en cours..." : "Running Script...")
                  : (isFr ? "Simuler l'Exécution" : "Simulate Script Execution")}
              </span>
            </button>

            {consoleOutput.length > 0 && (
              <button
                onClick={() => setConsoleOutput([])}
                className="text-[10px] font-mono text-gray-400 hover:text-white cursor-pointer"
              >
                {isFr ? "Effacer Console" : "Clear Output"}
              </button>
            )}
          </div>

          {consoleOutput.length > 0 && (
            <div className="p-2.5 rounded-xl bg-black/80 border border-purple-500/25 font-mono text-[10px] text-purple-300 space-y-1">
              {consoleOutput.map((out, oIdx) => (
                <p key={oIdx} className="leading-tight">
                  {out}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
