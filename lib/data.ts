import { 
    Network, Shield, Activity, Lock, Users, Terminal
} from 'lucide-react';
import type { SkillCategory } from '../types.js';

// The only data remaining here is the skill dictionary which contains React components (Lucide icons).
// All other content has been ported to the i18n JSON files in /src/content/*/
export const skillCategories: { [key: string]: SkillCategory } = {
    'Network Security & Operations': {
      color: '#00aeff', // Tech Blue
      skills: [
        { name: 'Firewall Administration', icon: Shield, description: 'Configured and managed Palo Alto and Fortinet firewalls including policy creation, NAT, and VPN setup.' },
        { name: 'Intrusion Detection/Prevention', icon: Activity, description: 'Deployed and tuned Suricata/Snort signatures to identify and block malicious network traffic.' },
        { name: 'Network Protocol Analysis', icon: Network, description: 'Deep packet inspection using Wireshark and tcpdump to diagnose connectivity issues and identify anomalies.' },
        { name: 'Secure Architecture Design', icon: Lock, description: 'Designed segmented network topologies following zero-trust principles for enterprise environments.' },
      ]
    },
    'Threat Detection & Incident Response (DFIR)': {
      color: '#ff3366', // Alert Red
      skills: [
        { name: 'SIEM Operations', icon: Activity, description: 'Creating complex correlation rules, building dashboards, and triaging alerts in Splunk and ELK.' },
        { name: 'Endpoint Detection & Response (EDR)', icon: Shield, description: 'Utilizing CrowdStrike and Defender for Endpoint for threat hunting, isolation, and remediation.' },
        { name: 'Malware Analysis', icon: Terminal, description: 'Basic static and dynamic analysis of suspicious binaries using sandboxes and reverse engineering tools.' },
        { name: 'Digital Forensics', icon: Network, description: 'Acquiring and analyzing disk and memory images using Autopsy, Volatility, and FTK Imager.' },
      ]
    },
    'Governance, Risk, & Compliance (GRC)': {
        color: '#da70d6', // Orchid (Process/Admin)
        skills: [
          { name: 'Auditing & Assessment', icon: Shield, description: 'Conducting internal security audits against ISO 27001 and NIST frameworks.' },
          { name: 'Risk Management', icon: Activity, description: 'Identifying, assessing, and evaluating information security risks; developing mitigation strategies.' },
          { name: 'Policy Development', icon: Lock, description: 'Drafting and updating information security policies, standards, and procedures.' },
          { name: 'Security Awareness Training', icon: Users, description: 'Developing and delivering cybersecurity training programs for non-technical staff.' },
        ]
    },
    'Identity & Endpoint Security': {
      color: '#ffc300', // Warning Yellow
      skills: [
        { name: 'Identity & Access Management (IAM)', icon: Users, description: 'Managing Microsoft Azure AD, Active Directory, SSO (SAML/OIDC), and MFA implementation.' },
        { name: 'Privileged Access Management (PAM)', icon: Lock, description: 'Implementing and managing PAM solutions (e.g., CyberArk, LAPS) to secure sensitive accounts.' },
        { name: 'Endpoint Hardening', icon: Shield, description: 'Configuring secure baselines (CIS) using Group Policy Objects (GPO) and Intune.' },
        { name: 'Vulnerability Management', icon: Activity, description: 'Running scheduled scans (Tenable Nessus, Qualys), prioritizing CVEs, and coordinating patching.' },
      ]
    }
};
