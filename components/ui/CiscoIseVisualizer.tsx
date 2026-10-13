import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  motion, AnimatePresence 
} from 'framer-motion';
import { 
  Shield, ShieldAlert, ShieldCheck, Terminal, Cpu, Server, User, Globe, 
  RefreshCw, Play, Pause, ChevronRight, Info, Layers, Settings, Code, 
  FileText, Check, AlertCircle, Laptop, Network, Key, ArrowRight, ArrowLeft, 
  List, AlertTriangle, Eye, HelpCircle, Database
} from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

// Local Translation Dictionary
const TRANSLATIONS = {
  en: {
    title: "CISCO ISE NAC & 802.1X VISUALIZER",
    subtitle: "Enterprise AAA Identity & Trust Engine Simulation",
    scenario_selector: "Select Authentication Profile",
    scenario_corp_laptop: "Domain PC (PEAP-MSCHAPv2)",
    scenario_dev_cert: "Developer Lab (EAP-TLS Cert)",
    scenario_printer_mab: "IoT Printer (MAB Bypass)",
    scenario_rogue: "Rogue Attacker (Access-Reject)",
    controls_title: "Execution Engine Flow Control",
    prev_step: "Previous Step",
    next_step: "Next Step",
    play_flow: "Auto Play",
    pause_flow: "Pause",
    reset_flow: "Reset Flow",
    topology_title: "802.1X Authentication Topology Map",
    packet_attributes: "RADIUS & Identity Attributes",
    step_description: "Active Protocol Step Analysis",
    live_logs_title: "Cisco ISE Operations Live RADIUS Session Audit Logs",
    logs_disclaimer: "Simulating live EAP/RADIUS syslog daemon streams.",
    btn_view_report: "Details",
    table_time: "Timestamp",
    table_username: "Username/MAC",
    table_status: "Access Status",
    table_nas: "Switch / NAS",
    table_port: "Port ID",
    table_vlan: "VLAN",
    table_policy: "Matched Policy Set",
    details_report_title: "Cisco ISE Authentication Details Report",
    details_summary: "RADIUS Attribute Summary",
    details_steps: "AAA Evaluation Steps Resolved",
    details_dacl: "Downloadable ACL (dACL) Payload",
    device_status: "Device State",
    port_status: "Switch Port State",
    ise_status: "AAA Server Status",
    ad_status: "Domain Directory Status",
    port_unauthorized: "UNAUTHORIZED (BLOCKED)",
    port_authorizing: "AUTHENTICATING...",
    port_authorized: "AUTHORIZED (OPEN)"
  },
  fr: {
    title: "VISUALISATEUR NAC CISCO ISE & 802.1X",
    subtitle: "Simulation du Moteur d'Identité AAA & de Zero Trust",
    scenario_selector: "Sélectionner un Profil d'Authentification",
    scenario_corp_laptop: "PC de Domaine (PEAP-MSCHAPv2)",
    scenario_dev_cert: "Lab Développeur (Certificat EAP-TLS)",
    scenario_printer_mab: "Imprimante IoT (Contournement MAB)",
    scenario_rogue: "Intrus Réseau (Accès Refusé)",
    controls_title: "Contrôle du Flux du Moteur",
    prev_step: "Étape Précédente",
    next_step: "Étape Suivante",
    play_flow: "Lecture Auto",
    pause_flow: "Pause",
    reset_flow: "Réinitialiser",
    topology_title: "Topologie Réseau & Flux 802.1X",
    packet_attributes: "Attributs d'Identité & RADIUS",
    step_description: "Analyse de l'Étape de Protocole Active",
    live_logs_title: "Journaux d'Audit de Sessions RADIUS Cisco ISE",
    logs_disclaimer: "Flux de syslog EAP/RADIUS en direct simulé.",
    btn_view_report: "Rapport",
    table_time: "Horodatage",
    table_username: "Utilisateur/MAC",
    table_status: "Statut d'Accès",
    table_nas: "Commutateur / NAS",
    table_port: "ID Port",
    table_vlan: "VLAN",
    table_policy: "Règle Correspondante",
    details_report_title: "Rapport Détaillé d'Authentification Cisco ISE",
    details_summary: "Résumé des Attributs RADIUS",
    details_steps: "Étapes de l'Évaluation AAA Résolues",
    details_dacl: "Contenu de la dACL Téléchargeable",
    device_status: "État du Périphérique",
    port_status: "État du Port Commutateur",
    ise_status: "État du Serveur AAA",
    ad_status: "État de l'Active Directory",
    port_unauthorized: "NON AUTORISÉ (BLOQUÉ)",
    port_authorizing: "AUTHENTIFICATION EN COURS...",
    port_authorized: "AUTORISÉ (OUVERT)"
  }
};

interface FlowStep {
  titleEn: string;
  titleFr: string;
  descEn: string;
  descFr: string;
  sender: 'supplicant' | 'authenticator' | 'ise' | 'ad' | null;
  receiver: 'supplicant' | 'authenticator' | 'ise' | 'ad' | null;
  packetType: string;
  attributes: Record<string, string>;
  details: {
    en: string[];
    fr: string[];
  };
}

interface Scenario {
  id: string;
  nameKey: keyof typeof TRANSLATIONS.en;
  username: string;
  mac: string;
  vlan: string;
  dacl: string;
  policy: string;
  authMethod: string;
  endpointType: string;
  steps: FlowStep[];
}

// Full comprehensive scenario datasets
const SCENARIOS: Scenario[] = [
  {
    id: "corp-laptop",
    nameKey: "scenario_corp_laptop",
    username: "corp\\jdoe",
    mac: "00:1A:2B:3C:4D:5E",
    vlan: "10 (CORP_WIRED)",
    dacl: "CORP_ACCESS_DACL",
    policy: "Wired_802.1X >> Corporate_Laptops",
    authMethod: "PEAP-MSCHAPv2",
    endpointType: "Windows 11 Corporate Workstation",
    steps: [
      {
        titleEn: "Link Initialization & EAPOL-Start",
        titleFr: "Initialisation de Liaison & EAPOL-Start",
        descEn: "The corporate laptop connects to switch port Gig1/0/12. Detecting link up, the supplicant transmits an EAPOL-Start packet to trigger the port authentication sequence.",
        descFr: "Le portable d'entreprise se connecte au port Gig1/0/12 du commutateur. Dès la liaison établie, le supplicant transmet un paquet EAPOL-Start pour lancer l'authentification.",
        sender: 'supplicant',
        receiver: 'authenticator',
        packetType: "EAPOL-Start",
        attributes: {
          "Source MAC": "00:1A:2B:3C:4D:5E",
          "Destination MAC": "01:80:C2:00:00:03 (802.1X Multicast)",
          "Switch Port": "GigabitEthernet 1/0/12"
        },
        details: {
          en: [
            "Link Up state negotiated on switch interface Gig1/0/12.",
            "Port state initially set to STRICTLY UNAUTHORIZED. Traffic blocked except for EAPOL packets.",
            "Supplicant daemon broadcasts EAPOL-Start to advertise authentication intent."
          ],
          fr: [
            "Négociation de l'état physique 'Link Up' sur le port Gig1/0/12.",
            "L'état initial du port est STRICTEMENT NON AUTORISÉ. Le trafic est bloqué à l'exception de l'EAPOL.",
            "Le daemon du supplicant émet en multicast un paquet EAPOL-Start."
          ]
        }
      },
      {
        titleEn: "EAP-Request Identity",
        titleFr: "Requête d'Identité EAP",
        descEn: "The switch replies with an EAP-Request Identity, asking the client device to specify its credential identity.",
        descFr: "Le commutateur répond avec une requête EAP-Request Identity, demandant au périphérique de déclarer son identité.",
        sender: 'authenticator',
        receiver: 'supplicant',
        packetType: "EAP-Request [Identity]",
        attributes: {
          "EAP-Code": "1 (Request)",
          "EAP-Type": "1 (Identity)",
          "EAP-Id": "0x01"
        },
        details: {
          en: [
            "Switch processes EAPOL frame and instantiates local auth session handle.",
            "Sends EAP-Request/Identity back to the endpoint to collect username details."
          ],
          fr: [
            "Le commutateur traite la trame EAPOL et instancie une session locale.",
            "Renvoie un EAP-Request/Identity à l'hôte final pour obtenir l'identifiant."
          ]
        }
      },
      {
        titleEn: "EAP-Response Identity",
        titleFr: "Réponse d'Identité EAP",
        descEn: "The corporate workstation responds with the unauthenticated username identity 'corp\\jdoe'.",
        descFr: "La station d'entreprise répond avec son identifiant utilisateur 'corp\\jdoe'.",
        sender: 'supplicant',
        receiver: 'authenticator',
        packetType: "EAP-Response [Identity]",
        attributes: {
          "EAP-Code": "2 (Response)",
          "Identity": "corp\\jdoe",
          "EAP-Id": "0x01"
        },
        details: {
          en: [
            "Workstation client daemon reads local active domain profile.",
            "Constructs response containing the identity string 'corp\\jdoe'."
          ],
          fr: [
            "Le client lit le profil de domaine actif de la session Windows.",
            "Formate la réponse contenant la chaîne d'identité 'corp\\jdoe'."
          ]
        }
      },
      {
        titleEn: "RADIUS Access-Request Outbound",
        titleFr: "Requête RADIUS Access-Request",
        descEn: "The switch encapsulates the EAP identity payload inside a RADIUS Access-Request packet and forwards it to Cisco ISE on UDP port 1812.",
        descFr: "Le commutateur encapsule la charge utile EAP dans un paquet RADIUS Access-Request et la transmet à Cisco ISE sur le port UDP 1812.",
        sender: 'authenticator',
        receiver: 'ise',
        packetType: "RADIUS Access-Request",
        attributes: {
          "RADIUS Code": "1 (Access-Request)",
          "User-Name": "corp\\jdoe",
          "Calling-Station-Id": "00-1A-2B-3C-4D-5E",
          "NAS-Identifier": "SW-ACCESS-01",
          "NAS-IP-Address": "10.0.5.1",
          "NAS-Port": "50112"
        },
        details: {
          en: [
            "RADIUS client on the switch translates standard IEEE 802.1X EAPOL into RADIUS attributes.",
            "Includes critical network parameters: switch IP, physical port ID, client MAC.",
            "Sends packet to primary Cisco ISE policy node secure cluster."
          ],
          fr: [
            "Le client RADIUS du commutateur convertit la trame EAPOL en attributs RADIUS.",
            "Incorpore les paramètres clés : IP du switch, port physique, adresse MAC client.",
            "Envoie le paquet vers le nœud d'administration et de politique Cisco ISE."
          ]
        }
      },
      {
        titleEn: "ISE Active Directory Verification",
        titleFr: "Vérification Active Directory par ISE",
        descEn: "Cisco ISE parses the user context and initiates a directory lookup against Microsoft Active Directory using Kerberos/LDAP to confirm user status.",
        descFr: "Cisco ISE analyse l'utilisateur et effectue une requête Kerberos/LDAP vers l'Active Directory pour confirmer l'existence de l'utilisateur.",
        sender: 'ise',
        receiver: 'ad',
        packetType: "LDAP SearchRequest / Kerberos",
        attributes: {
          "DC Server": "WIN-SRV-DC01.corp.local",
          "Query-Filter": "sAMAccountName=jdoe",
          "Bind-DN": "CN=ise_service,OU=ServiceAccounts,DC=corp,DC=local"
        },
        details: {
          en: [
            "ISE matches rule against active Wired Policy Set.",
            "Performs real-time LDAP directory query to locate the account of 'jdoe'.",
            "Checks account state (Active vs Suspended) and password expiration policies."
          ],
          fr: [
            "ISE compare la requête aux règles du jeu de politiques filaires.",
            "Exécute une requête LDAP en temps réel pour localiser le compte 'jdoe'.",
            "Vérifie le statut du compte (Actif ou Suspendu) et l'expiration du mot de passe."
          ]
        }
      },
      {
        titleEn: "Active Directory Identity Response",
        titleFr: "Réponse d'Identité Active Directory",
        descEn: "Active Directory confirms user 'jdoe' is active and returns security group memberships: 'Domain-Computers' and 'Domain-Users'.",
        descFr: "Active Directory confirme que le compte est actif et renvoie les groupes de sécurité : 'Domain-Computers' et 'Domain-Users'.",
        sender: 'ad',
        receiver: 'ise',
        packetType: "LDAP SearchResultEntry",
        attributes: {
          "Account Status": "Enabled (0x200)",
          "MemberOf": "CN=Domain-Computers,OU=Assets;CN=Domain-Users,OU=Staff"
        },
        details: {
          en: [
            "Active Directory validates credentials and groups.",
            "Confirms jdoe belongs to authorized security groups for corporate network access."
          ],
          fr: [
            "L'Active Directory valide les accréditations et groupes.",
            "Confirme que jdoe fait partie des groupes de sécurité autorisés."
          ]
        }
      },
      {
        titleEn: "RADIUS Access-Challenge / PEAP Tunneling",
        titleFr: "Access-Challenge RADIUS / Tunnel PEAP",
        descEn: "ISE requests credential challenge. An encrypted inner TLS tunnel is established (PEAP) to safely exchange MSCHAPv2 challenge responses.",
        descFr: "ISE renvoie un Access-Challenge. Un tunnel TLS chiffré (PEAP) est établi pour échanger le défi MSCHAPv2 en toute sécurité.",
        sender: 'ise',
        receiver: 'authenticator',
        packetType: "RADIUS Access-Challenge (EAP-PEAP)",
        attributes: {
          "RADIUS Code": "11 (Access-Challenge)",
          "EAP-Type": "25 (PEAP)",
          "Session-State": "Matched_Auth_Rules_In_Progress"
        },
        details: {
          en: [
            "ISE initiates secure PEAP EAP handshake to prevent credential harvesting.",
            "Forces TLS negotiation wrapper. Client validates the ISE Server SSL certificate.",
            "Once secure TLS tunnel is negotiated, inner MSCHAPv2 challenge verifies user password hash."
          ],
          fr: [
            "ISE initie la négociation du protocole PEAP pour empêcher la capture des informations.",
            "Force le chiffrement TLS. Le client valide le certificat SSL du serveur ISE.",
            "Dans le tunnel TLS, l'échange MSCHAPv2 valide le condensé du mot de passe."
          ]
        }
      },
      {
        titleEn: "ISE Policy Evaluation Engine Match",
        titleFr: "Évaluation de la Politique Cisco ISE",
        descEn: "Inner credential evaluation completes successfully. ISE runs authorization rules matching: Wired_802.1X Set -> Authorize 'Corporate_Laptops'.",
        descFr: "La validation interne réussit. ISE applique les politiques d'autorisation : Règle 'Corporate_Laptops' validée.",
        sender: 'ise',
        receiver: null,
        packetType: "ISE Policy Matrix Decision",
        attributes: {
          "Auth-Policy": "Active_Directory_Auth",
          "Authz-Policy": "Wired_Corporate_Access",
          "Authorization Profile": "Employee_Profile_VLAN_10"
        },
        details: {
          en: [
            "Authentication Policy checks completed with absolute trust.",
            "Authorization policy evaluated: matches group 'Domain-Computers'.",
            "Result: Assign VLAN 10 and attach Downloadable Access Control List 'CORP_ACCESS_DACL'."
          ],
          fr: [
            "Vérification de la stratégie d'authentification réussie.",
            "La politique d'autorisation correspond au groupe 'Domain-Computers'.",
            "Résultat : Affectation du VLAN 10 et dACL 'CORP_ACCESS_DACL'."
          ]
        }
      },
      {
        titleEn: "RADIUS Access-Accept Outbound",
        titleFr: "Envoi de RADIUS Access-Accept",
        descEn: "Cisco ISE sends RADIUS Access-Accept containing authorization parameters (VLAN 10 and dACL instructions) back to the switch.",
        descFr: "Cisco ISE envoie un RADIUS Access-Accept contenant les attributs d'autorisation (VLAN 10 et dACL) au commutateur.",
        sender: 'ise',
        receiver: 'authenticator',
        packetType: "RADIUS Access-Accept",
        attributes: {
          "RADIUS Code": "2 (Access-Accept)",
          "Tunnel-Type": "13 (VLAN)",
          "Tunnel-Medium-Type": "6 (802)",
          "Tunnel-Private-Group-ID": "10 (VLAN 10)",
          "cisco-av-pair": "ip:inacl#1=permit ip any any"
        },
        details: {
          en: [
            "RADIUS packet signed with server shared secret.",
            "Attaches authorization attributes: forces switch to dynamically assign physical port to VLAN 10.",
            "Injects a layer 3 downloadable ACL to control active traffic permissions."
          ],
          fr: [
            "Paquet RADIUS signé cryptographiquement avec le secret partagé.",
            "Attache les attributs : force le commutateur à basculer le port physique sur le VLAN 10.",
            "Injecte une ACL téléchargeable pour restreindre ou autoriser le trafic réseau."
          ]
        }
      },
      {
        titleEn: "Port Authorized & EAP-Success",
        titleFr: "Port Autorisé & EAP-Success",
        descEn: "The switch opens Port Gig1/0/12 to general network traffic, maps the interface to VLAN 10, downloads the dACL, and relays EAP-Success to the laptop client.",
        descFr: "Le commutateur ouvre le port Gig1/0/12, le mappe sur le VLAN 10, applique l'ACL, et envoie un EAP-Success au client.",
        sender: 'authenticator',
        receiver: 'supplicant',
        packetType: "EAP-Success",
        attributes: {
          "Port State": "Authorized",
          "VLAN Assigned": "VLAN 10 (CORP_WIRED)",
          "Applied dACL": "CORP_ACCESS_DACL"
        },
        details: {
          en: [
            "Switch processes Access-Accept packet and applies 'ip:inacl#1=permit ip any any'.",
            "Changes Port LED from amber (unauthorized) to solid green (authorized).",
            "Supplicant workstation triggers DHCP client to fetch IP from the VLAN 10 corporate pool."
          ],
          fr: [
            "Le commutateur applique la règle de filtrage dACL 'permit ip any any'.",
            "Bascule la LED du port d'orange (bloqué) à vert fixe (autorisé).",
            "La station cliente lance une requête DHCP pour acquérir une IP sur la plage du VLAN 10."
          ]
        }
      }
    ]
  },
  {
    id: "dev-cert",
    nameKey: "scenario_dev_cert",
    username: "dev-engineer-09@corp.local",
    mac: "00:50:56:8C:9D:AA",
    vlan: "20 (DEV_ISOLATED)",
    dacl: "DEV_ACCESS_DACL",
    policy: "Wired_802.1X >> Engineering_Devs",
    authMethod: "EAP-TLS (Certificates)",
    endpointType: "Developer Workstation Linux Server",
    steps: [
      {
        titleEn: "802.1X Negotiation & EAP-TLS Cert Request",
        titleFr: "Négociation 802.1X & Requête de Certificat EAP-TLS",
        descEn: "A developer workstation connects to port Gig1/0/15. EAP identity is requested, and the workstation selects Certificate authentication (EAP-TLS) to bypass password exposure.",
        descFr: "Une station de développement se connecte au port Gig1/0/15. L'identité EAP est demandée; la station sélectionne le protocole par certificat (EAP-TLS).",
        sender: 'supplicant',
        receiver: 'authenticator',
        packetType: "EAPOL-Start & Identity Response",
        attributes: {
          "Source MAC": "00:50:56:8C:9D:AA",
          "Identity": "dev-engineer-09@corp.local",
          "Preferred-Auth": "EAP-TLS"
        },
        details: {
          en: [
            "System boot triggers local network supplicant.",
            "Requests certificate-based login using cryptographic smart-cards or a TPM protected store.",
            "Initial username declared as dev-engineer-09@corp.local."
          ],
          fr: [
            "Le démarrage système déclenche le service supplicant réseau.",
            "Recherche une clé ou certificat dans le magasin sécurisé TPM.",
            "Nom d'identité initialement transmis : dev-engineer-09@corp.local."
          ]
        }
      },
      {
        titleEn: "RADIUS Wrapping & Server Certificate Challenge",
        titleFr: "Encapsulation RADIUS & Défi de Certificat Serveur",
        descEn: "The switch wraps the identity into a RADIUS Access-Request. Cisco ISE replies with an Access-Challenge containing its server SSL certificate to prove its identity.",
        descFr: "Le switch envoie la requête RADIUS. Cisco ISE répond avec un Access-Challenge incluant son certificat serveur SSL pour s'authentifier.",
        sender: 'authenticator',
        receiver: 'ise',
        packetType: "RADIUS Access-Request",
        attributes: {
          "RADIUS Code": "1 (Access-Request)",
          "Calling-Station-Id": "00-50-56-8C-9D-AA",
          "NAS-Identifier": "SW-ACCESS-01"
        },
        details: {
          en: [
            "Access-Request forwarded to ISE over UDP 1812.",
            "ISE matches rule set 'Wired_802.1X' and starts cryptographic EAP-TLS handshake."
          ],
          fr: [
            "L'Access-Request est transmise à ISE sur le port UDP 1812.",
            "ISE fait correspondre le jeu de règles 'Wired_802.1X' et initie l'échange cryptographique."
          ]
        }
      },
      {
        titleEn: "Mutual TLS Handshake & Cert Exchange",
        titleFr: "Négociation TLS Mutuelle & Échange de Certificats",
        descEn: "The client workstation validates the ISE certificate, then transmits its own client certificate. ISE validates the trust chain against the Enterprise root CA.",
        descFr: "La station valide le certificat d'ISE, puis transmet son propre certificat client. ISE valide la chaîne d'autorité de certification d'entreprise.",
        sender: 'supplicant',
        receiver: 'ise',
        packetType: "TLS Client Certificate Handshake",
        attributes: {
          "Client Certificate": "dev-engineer-09@corp.local",
          "Issuer Authority": "Corp-Enterprise-CA-01",
          "Certificate Validity": "VALID (Expires 2027-12-31)"
        },
        details: {
          en: [
            "Mutual Certificate Authentication executes inside standard TLS tunnel.",
            "ISE verifies that the client certificate is signed by an approved enterprise authority.",
            "Performs real-time CRL/OCSP check to verify certificate is NOT revoked."
          ],
          fr: [
            "L'authentification mutuelle de certificats s'effectue dans le tunnel TLS.",
            "ISE vérifie que le certificat client est signé par l'autorité de certification approuvée.",
            "Exécute une vérification CRL/OCSP pour s'assurer que le certificat n'est pas révoqué."
          ]
        }
      },
      {
        titleEn: "Active Directory Account State Verification",
        titleFr: "Vérification du Compte sur Active Directory",
        descEn: "Even though the certificate is valid, ISE queries Active Directory to ensure the user's host/user object is active and gathers their directory groups.",
        descFr: "Bien que le certificat soit valide, ISE interroge l'AD pour s'assurer que le compte est actif et récupère ses groupes.",
        sender: 'ise',
        receiver: 'ad',
        packetType: "LDAP Group Verification",
        attributes: {
          "Lookup Account": "dev-engineer-09",
          "Domain Controller": "WIN-SRV-DC01.corp.local"
        },
        details: {
          en: [
            "ISE performs verification of the identity extracted from the certificate Common Name.",
            "Confirms account has active directory status. Fetches group membership: 'Engineering-Devs'."
          ],
          fr: [
            "ISE effectue la validation de l'identité extraite du Common Name (CN) du certificat.",
            "Confirme que le statut est actif. Extrait l'appartenance au groupe : 'Engineering-Devs'."
          ]
        }
      },
      {
        titleEn: "ISE Policy Match & VLAN Assignment",
        titleFr: "Correspondance de Règle ISE & Assignation du VLAN",
        descEn: "Authentication succeeds. ISE matches Authorization rule 'Engineering_Developers'. This maps the port to Development VLAN 20 and applies restricted dACL rules.",
        descFr: "L'authentification réussit. ISE applique la règle d'autorisation 'Engineering_Developers', assignant le port au VLAN 20 avec restriction dACL.",
        sender: 'ise',
        receiver: 'authenticator',
        packetType: "RADIUS Access-Accept with dACL",
        attributes: {
          "VLAN Granted": "VLAN 20 (DEV_ISOLATED)",
          "cisco-av-pair": "ip:inacl#1=permit tcp any 10.100.0.0 0.0.255.255, ip:inacl#2=deny ip any 10.0.0.0 255.0.0.0"
        },
        details: {
          en: [
            "RADIUS Access-Accept generated and signed.",
            "Assigns Development segment VLAN 20.",
            "Injects tight dACL restricting developer machines from accessing general internal corporate networks except for development repositories (10.100.0.0/16)."
          ],
          fr: [
            "Génération du RADIUS Access-Accept signé par le serveur.",
            "Affecte le segment isolé du VLAN de développement 20.",
            "Injecte une dACL stricte interdisant l'accès aux segments réseau d'entreprise, sauf vers les dépôts (10.100.0.0/16)."
          ]
        }
      },
      {
        titleEn: "Port Map Authorized & Traffic Allowed",
        titleFr: "Port Ouvert & Trafic Autorisé",
        descEn: "The switch opens Port Gig1/0/15, maps it to VLAN 20, applies the DEV dACL, and sends EAP-Success to the host. Port is fully authorized.",
        descFr: "Le commutateur ouvre le port Gig1/0/15, applique le VLAN 20 et la dACL de dev, puis envoie l'EAP-Success au client.",
        sender: 'authenticator',
        receiver: 'supplicant',
        packetType: "EAP-Success & Port Active",
        attributes: {
          "Applied VLAN": "VLAN 20 (DEV_ISOLATED)",
          "Switch Port Status": "Open/Active"
        },
        details: {
          en: [
            "Switch implements dACL blocks on local port hardware ASIC.",
            "Port transitions to Open (Green LED). Workstation is on VLAN 20 and can access resources."
          ],
          fr: [
            "Le commutateur applique les règles dACL au niveau matériel (ASIC).",
            "Le port s'active (LED Verte). La station est sur le VLAN 20 et peut accéder aux dépôts."
          ]
        }
      }
    ]
  },
  {
    id: "printer-mab",
    nameKey: "scenario_printer_mab",
    username: "001122334455",
    mac: "00:11:22:33:44:55",
    vlan: "30 (IOT_DEVICES)",
    dacl: "PRINTER_LIMIT_DACL",
    policy: "Wired_MAB >> Corporate_Printers",
    authMethod: "MAB (MAC Auth Bypass)",
    endpointType: "HP LaserJet Enterprise Printer",
    steps: [
      {
        titleEn: "Connection & 802.1X Timeout",
        titleFr: "Connexion & Timeout du 802.1X",
        descEn: "An HP LaserJet printer connects to port Gig1/0/8. The printer does not support 802.1X EAP protocols. The switch transmits EAP Identity queries but times out waiting for replies.",
        descFr: "Une imprimante HP se connecte au port Gig1/0/8. Elle ne gère pas le 802.1X. Le switch émet des requêtes EAP mais atteint le délai d'expiration sans réponse.",
        sender: 'supplicant',
        receiver: 'authenticator',
        packetType: "No Response / Network Timeout",
        attributes: {
          "Source MAC": "00:11:22:33:44:55",
          "Switch State": "EAP_WAIT_TIMEOUT",
          "Retry Count": "3 (Exhausted)"
        },
        details: {
          en: [
            "Dumb network devices (printers, cameras, IoT) have no local 802.1X client.",
            "The switch waits 30 seconds for EAPOL-Start, then falls back to MAB protocol flow."
          ],
          fr: [
            "Les périphériques simples (IoT, imprimantes) n'ont pas de client 802.1X.",
            "Le switch attend 30 secondes pour de l'EAPOL-Start, puis bascule en MAB."
          ]
        }
      },
      {
        titleEn: "MAB Trigger & RADIUS Request",
        titleFr: "Déclenchement MAB & Requête RADIUS",
        descEn: "The switch initiates MAC Authentication Bypass (MAB). It packages the device MAC address as BOTH the RADIUS username and password, then queries Cisco ISE.",
        descFr: "Le switch lance le contournement MAB. Il envoie l'adresse MAC comme identifiant et mot de passe RADIUS à Cisco ISE.",
        sender: 'authenticator',
        receiver: 'ise',
        packetType: "RADIUS Access-Request (MAB)",
        attributes: {
          "User-Name": "001122334455",
          "Password": "●●●●●●●●●●●● (001122334455)",
          "Service-Type": "15 (Call Check)",
          "cisco-av-pair": "service-type=Call Check"
        },
        details: {
          en: [
            "Switch queries ISE with MAC string as identity.",
            "Configures Call Check service type, signaling that this is a MAB request."
          ],
          fr: [
            "Le switch interroge ISE avec la chaîne MAC comme identifiant.",
            "Configure le type de service 'Call Check', indiquant une requête MAB."
          ]
        }
      },
      {
        titleEn: "ISE Endpoint Database Lookup",
        titleFr: "Recherche dans la Base de Périphériques ISE",
        descEn: "ISE receives the MAB query. Since Active Directory does not store MAC addresses, ISE queries its local Identity Groups database for allowed MAC identifiers.",
        descFr: "ISE reçoit la requête MAB. Puisque l'AD ne stocke pas les MACs, ISE interroge sa base d'identités locale pour valider l'adresse MAC.",
        sender: 'ise',
        receiver: null,
        packetType: "ISE Internal Database Query",
        attributes: {
          "Query Table": "InternalEndpoints",
          "MAC Identifier": "00:11:22:33:44:55",
          "Result": "Match Found"
        },
        details: {
          en: [
            "Database indicates MAC is registered and profile matched: 'Printers-IoT'.",
            "Identified as legitimate corporate device by static MAC registration."
          ],
          fr: [
            "La base indique que l'adresse MAC est enregistrée dans le groupe 'Printers-IoT'.",
            "Identifié comme appareil légitime via l'enregistrement MAC statique."
          ]
        }
      },
      {
        titleEn: "ISE Authorization Rules Validation",
        titleFr: "Validation de Politique MAB ISE",
        descEn: "The device is authorized. ISE matches Authorization rule 'Wired_Printers', mapping it to IoT VLAN 30 and applying a restricted dACL allowing printer communications only.",
        descFr: "L'appareil est approuvé. ISE valide la règle 'Wired_Printers', le mappant sur le VLAN 30 avec une dACL restreinte à l'impression.",
        sender: 'ise',
        receiver: 'authenticator',
        packetType: "RADIUS Access-Accept with Printer dACL",
        attributes: {
          "VLAN Granted": "VLAN 30 (IOT_DEVICES)",
          "cisco-av-pair": "ip:inacl#1=permit ip any host 10.0.5.20 (PrintServer), ip:inacl#2=deny ip any any"
        },
        details: {
          en: [
            "Access-Accept generated with severe port filtering controls.",
            "Assigned to IoT Isolation VLAN 30.",
            "Injected dACL permits printer to communicate ONLY with the centralized Print Server (10.0.5.20) on port 9100. Rest of network access is blocked."
          ],
          fr: [
            "Génération de l'Access-Accept avec filtrage de port renforcé.",
            "Mappé sur le VLAN d'isolation IoT 30.",
            "La dACL permet de communiquer UNIQUEMENT avec le serveur d'impression centralisé (10.0.5.20). Tout autre accès est interdit."
          ]
        }
      },
      {
        titleEn: "Switch Port Authorized & Configured",
        titleFr: "Port Switch Configuré & Activé",
        descEn: "The switch opens Port Gig1/0/8. The interface is mapped to VLAN 30, and the restricted printer dACL is installed in hardware.",
        descFr: "Le commutateur ouvre le port Gig1/0/8, le mappe sur le VLAN 30, et installe l'ACL d'impression restrictive.",
        sender: 'authenticator',
        receiver: 'supplicant',
        packetType: "Interface Active (MAB Bypass Open)",
        attributes: {
          "Port State": "Authorized (MAB)",
          "VLAN Applied": "VLAN 30",
          "Active ACL": "PRINTER_LIMIT_DACL"
        },
        details: {
          en: [
            "Switch applies port ACL rules restricting device access.",
            "Port opens. HP LaserJet obtains IP on VLAN 30. Ready to print securely."
          ],
          fr: [
            "Le commutateur installe l'ACL limitant les flux de l'appareil.",
            "Le port s'ouvre. L'imprimante obtient une IP sur le VLAN 30. Fonctionnement sécurisé."
          ]
        }
      }
    ]
  },
  {
    id: "rogue-rogue",
    nameKey: "scenario_rogue",
    username: "anonymous_attacker",
    mac: "AA:BB:CC:DD:EE:FF",
    vlan: "99 (QUARANTINE_VLAN)",
    dacl: "BLOCK_ALL_DACL",
    policy: "Default Wired >> Deny_Access",
    authMethod: "PEAP-MSCHAPv2 (Failed)",
    endpointType: "Unauthorized Kali Linux Hackbox",
    steps: [
      {
        titleEn: "Intruder Access Attempt",
        titleFr: "Tentative d'Accès Suspecte",
        descEn: "An unauthorized rogue laptop (Kali Linux) connects to corporate desk port Gig1/0/24. It initiates credentials request using an anonymous username.",
        descFr: "Un ordinateur intrus (Kali Linux) se branche au port Gig1/0/24. Il lance une tentative d'authentification avec un compte anonyme.",
        sender: 'supplicant',
        receiver: 'authenticator',
        packetType: "EAPOL-Start & Client Identity",
        attributes: {
          "Source MAC": "AA:BB:CC:DD:EE:FF",
          "Declared Identity": "anonymous_attacker"
        },
        details: {
          en: [
            "Unauthorized port-jack activity detected.",
            "Supplicant tries credential spoofing using default identities."
          ],
          fr: [
            "Activité suspecte détectée sur la prise réseau physique.",
            "Le supplicant tente de s'identifier en usurpant des comptes génériques."
          ]
        }
      },
      {
        titleEn: "RADIUS Request Sent to ISE Server",
        titleFr: "Envoi de la Requête RADIUS à ISE",
        descEn: "The switch forwards the Access-Request to Cisco ISE, passing along the unknown user context and the unauthorized host MAC.",
        descFr: "Le switch transfère la requête Access-Request à Cisco ISE, passant l'identifiant inconnu et la MAC correspondante.",
        sender: 'authenticator',
        receiver: 'ise',
        packetType: "RADIUS Access-Request",
        attributes: {
          "User-Name": "anonymous_attacker",
          "Calling-Station-Id": "AA-BB-CC-DD-EE-FF"
        },
        details: {
          en: [
            "RADIUS Access-Request received by ISE Policy Node.",
            "Identified as hostile due to unfamiliar credentials profile."
          ],
          fr: [
            "Access-Request reçue par le nœud de décision Cisco ISE.",
            "Identifié comme suspect en raison du profil utilisateur inconnu."
          ]
        }
      },
      {
        titleEn: "Directory Services Verification Fail",
        titleFr: "Échec de Vérification de l'Annuaire AD",
        descEn: "ISE queries Active Directory. Active Directory scans user accounts but reports that no account matching 'anonymous_attacker' exists. Credentials verify failed.",
        descFr: "ISE interroge l'Active Directory. L'AD scanne la base d'utilisateurs et renvoie : Compte inexistant ou invalide.",
        sender: 'ise',
        receiver: 'ad',
        packetType: "LDAP Search Failed",
        attributes: {
          "Lookup User": "anonymous_attacker",
          "Result": "ERROR_NO_SUCH_USER (0x525)"
        },
        details: {
          en: [
            "LDAP query returns Null. Identity does not exist in domain repository.",
            "Primary credentials authentication fails immediately."
          ],
          fr: [
            "La requête LDAP renvoie un résultat nul. Le compte n'existe pas.",
            "L'authentification primaire échoue instantanément."
          ]
        }
      },
      {
        titleEn: "ISE Security Posturing: Access-Reject",
        titleFr: "Règle de Sécurité ISE : Rejet d'Accès",
        descEn: "ISE processes default Wired Catch-All rule due to authentication failure. Evaluates rule: REJECT connection and quarantine client.",
        descFr: "ISE traite la règle de sécurité par défaut suite à l'échec. Décision : Rejeter l'accès et placer le client en quarantaine.",
        sender: 'ise',
        receiver: 'authenticator',
        packetType: "RADIUS Access-Reject",
        attributes: {
          "RADIUS Code": "3 (Access-Reject)",
          "ISE Policy Node": "wazuh-master-cluster-01",
          "Action-Code": "DenyAccess"
        },
        details: {
          en: [
            "Cryptographic signature check completed.",
            "Access-Reject generated. Security posture triggers network isolation.",
            "Commanded switch to block all layer 3 network access from the MAC handle."
          ],
          fr: [
            "Génération du paquet de rejet d'accès (RADIUS Access-Reject).",
            "La politique de sécurité déclenche l'isolement du port réseau.",
            "Ordonne au switch de restreindre l'ensemble du trafic de cet hôte."
          ]
        }
      },
      {
        titleEn: "Switch Port Blocked & Quarantine Active",
        titleFr: "Port Switch Bloqué & Quarantaine",
        descEn: "The switch receives RADIUS Access-Reject. It blocks general traffic on Port Gig1/0/24, assigns it to Quarantine VLAN 99, and triggers threat alerts on SOC SIEM logs.",
        descFr: "Le commutateur reçoit le rejet d'accès. Il bloque le trafic sur le port Gig1/0/24, le bascule sur le VLAN de quarantaine 99 et lève une alerte SOC.",
        sender: 'authenticator',
        receiver: 'supplicant',
        packetType: "EAP-Failure & Port Quarantined",
        attributes: {
          "Port State": "Blocked",
          "VLAN Forced": "VLAN 99 (GUEST_QUARANTINE)",
          "dACL Applied": "BLOCK_ALL_TRAFFIC"
        },
        details: {
          en: [
            "Switch disables IP communication on interface Gig1/0/24.",
            "Redirects local interface to Guest Quarantine segment (VLAN 99) with captive portal warning.",
            "Sends EAP-Failure. Host is completely locked out of internal enterprise resources."
          ],
          fr: [
            "Le commutateur désactive la communication IP sur le port Gig1/0/24.",
            "Redirige l'interface vers le VLAN de quarantaine 99 avec portail captif d'avertissement.",
            "Envoie un paquet EAP-Failure. L'hôte est exclu du réseau d'entreprise."
          ]
        }
      }
    ]
  }
];

export const CiscoIseVisualizer: React.FC = () => {
  const { language } = useI18n();
  const currentLang = language === 'fr' ? 'fr' : 'en';
  const text = TRANSLATIONS[currentLang];

  // Active state hooks
  const [activeScenarioId, setActiveScenarioId] = useState<string>("corp-laptop");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  // Computed scenario data
  const activeScenario = useMemo(() => {
    return SCENARIOS.find(s => s.id === activeScenarioId) || SCENARIOS[0];
  }, [activeScenarioId]);

  const activeStep = useMemo(() => {
    return activeScenario.steps[currentStepIndex] || activeScenario.steps[0];
  }, [activeScenario, currentStepIndex]);

  // Simulated Audit Log List that updates when we reach the end of a flow
  const [auditLogs, setAuditLogs] = useState<any[]>([
    {
      id: "rad-101",
      timestamp: new Date(Date.now() - 360000).toISOString().replace(/\.\d+Z$/, 'Z'),
      username: "corp\\asmith",
      mac: "00:E0:4C:68:11:22",
      status: "Accept",
      nas: "SW-ACCESS-01",
      port: "Gig1/0/4",
      vlan: "10",
      policy: "Wired_802.1X >> Corporate_Laptops",
      authMethod: "PEAP-MSCHAPv2"
    },
    {
      id: "rad-102",
      timestamp: new Date(Date.now() - 120000).toISOString().replace(/\.\d+Z$/, 'Z'),
      username: "005056bc9dbb",
      mac: "00:50:56:BC:9D:BB",
      status: "Accept",
      nas: "SW-ACCESS-01",
      port: "Gig1/0/18",
      vlan: "30",
      policy: "Wired_MAB >> Corporate_Printers",
      authMethod: "MAB Bypass"
    }
  ]);

  // Handle auto playing
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < activeScenario.steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            // Complete trigger: Add a brand new log record in the audit log!
            const isExist = auditLogs.some(log => log.scenarioId === activeScenario.id);
            if (!isExist) {
              const newLog = {
                id: `rad-sim-${Math.floor(Math.random() * 900) + 100}`,
                timestamp: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
                username: activeScenario.username,
                mac: activeScenario.mac,
                status: activeScenario.id === 'rogue-rogue' ? 'Reject' : 'Accept',
                nas: "SW-ACCESS-01",
                port: activeScenario.id === 'corp-laptop' ? 'Gig1/0/12' : activeScenario.id === 'dev-cert' ? 'Gig1/0/15' : activeScenario.id === 'printer-mab' ? 'Gig1/0/8' : 'Gig1/0/24',
                vlan: activeScenario.id === 'rogue-rogue' ? '99' : activeScenario.id === 'corp-laptop' ? '10' : activeScenario.id === 'dev-cert' ? '20' : '30',
                policy: activeScenario.policy,
                authMethod: activeScenario.authMethod,
                scenarioId: activeScenario.id,
                dacl: activeScenario.dacl
              };
              setAuditLogs(prevLogs => [newLog, ...prevLogs]);
            }
            return prev;
          }
        });
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeScenario, auditLogs]);

  // Reset current scenario index upon change
  const handleScenarioChange = (id: string) => {
    setActiveScenarioId(id);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (currentStepIndex < activeScenario.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Trigger completion log manual
      const isExist = auditLogs.some(log => log.scenarioId === activeScenario.id);
      if (!isExist) {
        const newLog = {
          id: `rad-sim-${Math.floor(Math.random() * 900) + 100}`,
          timestamp: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
          username: activeScenario.username,
          mac: activeScenario.mac,
          status: activeScenario.id === 'rogue-rogue' ? 'Reject' : 'Accept',
          nas: "SW-ACCESS-01",
          port: activeScenario.id === 'corp-laptop' ? 'Gig1/0/12' : activeScenario.id === 'dev-cert' ? 'Gig1/0/15' : activeScenario.id === 'printer-mab' ? 'Gig1/0/8' : 'Gig1/0/24',
          vlan: activeScenario.id === 'rogue-rogue' ? '99' : activeScenario.id === 'corp-laptop' ? '10' : activeScenario.id === 'dev-cert' ? '20' : '30',
          policy: activeScenario.policy,
          authMethod: activeScenario.authMethod,
          scenarioId: activeScenario.id,
          dacl: activeScenario.dacl
        };
        setAuditLogs(prevLogs => [newLog, ...prevLogs]);
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Node placement mapping for layout animations
  // Supplicant (left), Authenticator (mid-left), ISE (mid-right), AD (right)
  const getPulseNode = (node: 'supplicant' | 'authenticator' | 'ise' | 'ad') => {
    if (activeStep.sender === node) return "border-[#26F0C4] shadow-[0_0_15px_rgba(38,240,196,0.3)] bg-slate-900";
    if (activeStep.receiver === node) return "border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.3)] bg-slate-900";
    return "border-white/5 bg-slate-950/40";
  };

  const isLastStep = currentStepIndex === activeScenario.steps.length - 1;

  // Render network nodes
  const nodes = [
    { id: 'supplicant', label: 'Supplicant', icon: Laptop, statusKey: 'device_status', detail: activeScenario.endpointType },
    { id: 'authenticator', label: 'NAS / Switch', icon: Network, statusKey: 'port_status', detail: `SW-ACCESS-01 • Gig1/0/${activeScenario.id === 'corp-laptop' ? '12' : activeScenario.id === 'dev-cert' ? '15' : activeScenario.id === 'printer-mab' ? '8' : '24'}` },
    { id: 'ise', label: 'Cisco ISE Server', icon: Server, statusKey: 'ise_status', detail: 'ISE-Node-01 (10.0.5.10)' },
    { id: 'ad', label: 'Active Directory', icon: Database, statusKey: 'ad_status', detail: 'WIN-SRV-DC01.corp.local' }
  ];

  return (
    <div id="cisco-ise-visualizer" className="flex flex-col h-full bg-[#03060c] text-white overflow-y-auto [&::-webkit-scrollbar]:hidden font-sans select-none">
      
      {/* Visualizer Header */}
      <div className="shrink-0 bg-slate-950/90 border-b border-white/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-950/50 border border-indigo-500/20 text-[#26F0C4]">
            <Shield size={18} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-slate-100 font-mono uppercase">{text.title}</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide font-mono mt-0.5">{text.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#080d15] px-2.5 py-1 rounded border border-white/5 select-none text-[10px] font-mono text-indigo-400">
          <Cpu size={12} className="animate-spin" />
          <span>802.1X SEC ENGINE ACTIVE</span>
        </div>
      </div>

      {/* Main Grid Content Area */}
      <div className="flex-1 p-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Left Control & Configuration Panel (col-span-4) */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          
          {/* Scenario Selector */}
          <div className="border border-white/5 bg-[#080d16] rounded-xl p-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-indigo-400 uppercase border-b border-white/5 pb-2 mb-3 flex items-center gap-1.5">
              <Layers size={12} />
              <span>{text.scenario_selector}</span>
            </h2>

            <div className="space-y-2">
              {SCENARIOS.map(sc => (
                <button
                  key={sc.id}
                  onClick={() => handleScenarioChange(sc.id)}
                  className={`w-full flex items-center justify-between border rounded-lg p-2.5 text-xs font-mono transition-all cursor-pointer text-left ${
                    activeScenarioId === sc.id
                      ? "bg-indigo-950/20 border-[#26F0C4] text-[#26F0C4] shadow-[0_2px_12px_rgba(38,240,196,0.05)]"
                      : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {sc.id === 'rogue-rogue' ? (
                      <ShieldAlert size={14} className={activeScenarioId === sc.id ? "text-[#26F0C4]" : "text-red-400"} />
                    ) : (
                      <ShieldCheck size={14} className={activeScenarioId === sc.id ? "text-[#26F0C4]" : "text-emerald-400"} />
                    )}
                    <div>
                      <div className="font-black text-[11px] text-white">{text[sc.nameKey] as string}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{sc.authMethod} • VLAN {sc.vlan.split(' ')[0]}</div>
                    </div>
                  </div>
                  <ChevronRight size={12} className="opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Engine Controls */}
          <div className="border border-white/5 bg-[#080d16] rounded-xl p-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-indigo-400 uppercase border-b border-white/5 pb-2 mb-3 flex items-center gap-1.5">
              <Settings size={12} />
              <span>{text.controls_title}</span>
            </h2>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-slate-950/40 hover:bg-slate-900/40 text-[10px] font-black font-mono uppercase text-slate-300 py-2 cursor-pointer transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ArrowLeft size={12} />
                  <span>{text.prev_step}</span>
                </button>

                <button
                  onClick={handleNext}
                  disabled={isLastStep}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-slate-950/40 hover:bg-slate-900/40 text-[10px] font-black font-mono uppercase text-[#26F0C4] py-2 cursor-pointer transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>{text.next_step}</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg text-[10px] font-black font-mono uppercase py-2.5 transition-all cursor-pointer ${
                    isPlaying 
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-[0_4px_12px_-4px_rgba(245,158,11,0.4)]" 
                      : "bg-[#26F0C4] hover:bg-[#20d4ad] text-slate-950 font-extrabold shadow-[0_4px_12px_-4px_rgba(38,240,196,0.3)]"
                  }`}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                  <span>{isPlaying ? text.pause_flow : text.play_flow}</span>
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 hover:bg-slate-800 text-[10px] font-black font-mono uppercase text-slate-300 py-2.5 cursor-pointer transition-all"
                >
                  <RefreshCw size={12} />
                  <span>{text.reset_flow}</span>
                </button>
              </div>

              {/* Step indicator bar */}
              <div className="mt-2 bg-slate-950/50 rounded-lg p-2.5 border border-white/5 font-mono text-[9px] text-slate-500">
                <div className="flex justify-between items-center mb-1.5">
                  <span>AAA ENGINE TICK</span>
                  <span className="text-white font-bold">{currentStepIndex + 1} / {activeScenario.steps.length}</span>
                </div>
                <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#26F0C4] h-full transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / activeScenario.steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Packet Attributes Live State */}
          <div className="border border-white/5 bg-[#080d16] rounded-xl p-4 flex-1 min-h-0 flex flex-col">
            <h2 className="text-xs font-bold font-mono tracking-wider text-indigo-400 uppercase border-b border-white/5 pb-2 mb-3 flex items-center gap-1.5 shrink-0">
              <Code size={12} />
              <span>{text.packet_attributes}</span>
            </h2>

            <div className="flex-1 overflow-y-auto space-y-2 select-text font-mono text-[10px] leading-relaxed pr-1">
              <div className="bg-slate-950/40 border border-white/5 p-2.5 rounded-lg">
                <div className="text-indigo-400 font-bold mb-1 border-b border-white/5 pb-1">PACKET TYPE: {activeStep.packetType}</div>
                {Object.entries(activeStep.attributes).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2 py-0.5 border-b border-white/5 last:border-0">
                    <span className="text-slate-500 shrink-0">{key}:</span>
                    <span className="text-slate-300 font-bold text-right truncate max-w-[180px]" title={value}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-950/40 border border-white/5 p-2.5 rounded-lg space-y-1.5 text-slate-400">
                <div className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">ACTIVE AUTHORIZATION PROFILE</div>
                <div className="flex justify-between text-[9px]">
                  <span>VLAN Segment:</span>
                  <span className="text-[#26F0C4] font-bold">{isLastStep ? activeScenario.vlan : "PRE-AUTH (NONE)"}</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span>Applied dACL:</span>
                  <span className="text-red-400 font-bold">{isLastStep ? activeScenario.dacl : "PRE-AUTH (NONE)"}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Active Network Topology & Live Console (col-span-8) */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          
          {/* Active Network Topology */}
          <div className="border border-white/5 bg-[#080d16] rounded-xl p-4 relative min-h-[220px] flex flex-col">
            <h2 className="text-xs font-bold font-mono tracking-wider text-indigo-400 uppercase border-b border-white/5 pb-2 mb-4 flex items-center gap-1.5">
              <Network size={12} />
              <span>{text.topology_title}</span>
            </h2>

            {/* Topology Map */}
            <div className="flex-1 grid grid-cols-4 gap-2 relative items-center py-4">
              
              {/* SVG connection lines for animations */}
              <div className="absolute inset-0 pointer-events-none select-none">
                <svg className="w-full h-full" viewBox="0 0 800 120" preserveAspectRatio="none">
                  {/* Line 1 (Supplicant - Switch) */}
                  <line x1="100" y1="50" x2="300" y2="50" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  {/* Line 2 (Switch - ISE) */}
                  <line x1="300" y1="50" x2="500" y2="50" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  {/* Line 3 (ISE - AD) */}
                  <line x1="500" y1="50" x2="700" y2="50" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />

                  {/* Active Packet Animation */}
                  {activeStep.sender && activeStep.receiver && (
                    <motion.circle
                      r="4"
                      fill={activeScenario.id === 'rogue-rogue' ? "#ef4444" : "#26F0C4"}
                      shadow-lg
                      initial={{ 
                        cx: activeStep.sender === 'supplicant' ? 100 : activeStep.sender === 'authenticator' ? 300 : activeStep.sender === 'ise' ? 500 : 700,
                        cy: 50
                      }}
                      animate={{ 
                        cx: activeStep.receiver === 'supplicant' ? 100 : activeStep.receiver === 'authenticator' ? 300 : activeStep.receiver === 'ise' ? 500 : 700,
                        cy: 50
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </svg>
              </div>

              {/* Topology Nodes */}
              {nodes.map(node => {
                const NodeIcon = node.icon;
                const pulseClass = getPulseNode(node.id as any);
                
                // Switch Port Port Status determination based on scenario status
                let portStatusNode = "bg-amber-500";
                if (node.id === 'authenticator') {
                  if (isLastStep) {
                    portStatusNode = activeScenario.id === 'rogue-rogue' ? "bg-red-500" : "bg-emerald-500";
                  } else if (currentStepIndex > 0) {
                    portStatusNode = "bg-blue-500 animate-pulse";
                  }
                }

                return (
                  <div key={node.id} className="flex flex-col items-center justify-center text-center z-10 select-none">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 relative ${pulseClass}`}>
                      <NodeIcon size={20} className={activeStep.sender === node.id || activeStep.receiver === node.id ? "text-[#26F0C4]" : "text-slate-400"} />
                      
                      {/* Port indicator on Switch */}
                      {node.id === 'authenticator' && (
                        <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border border-slate-950 flex items-center justify-center ${portStatusNode}`} title={text.port_status}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                        </span>
                      )}
                    </div>
                    
                    <span className="text-[10px] font-bold font-mono text-slate-200 mt-2 block">{node.label}</span>
                    <span className="text-[8px] font-mono text-slate-500 block truncate w-full mt-0.5" title={node.detail}>{node.detail}</span>
                  </div>
                );
              })}

            </div>

            {/* Switch Port State Panel */}
            <div className="mt-2 bg-[#020408] border border-white/5 rounded-lg p-2.5 flex flex-wrap items-center justify-between text-[10px] font-mono gap-2">
              <span className="text-slate-500 uppercase font-black">{text.port_status}:</span>
              {isLastStep ? (
                activeScenario.id === 'rogue-rogue' ? (
                  <span className="text-red-400 flex items-center gap-1 font-black">
                    <AlertTriangle size={12} />
                    <span>{text.port_unauthorized} (VLAN 99 QUARANTINE)</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-black">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    <span>{text.port_authorized} (VLAN {activeScenario.vlan.split(' ')[0]})</span>
                  </span>
                )
              ) : currentStepIndex > 0 ? (
                <span className="text-blue-400 animate-pulse flex items-center gap-1 font-black">
                  <RefreshCw size={10} className="animate-spin" />
                  <span>{text.port_authorizing}</span>
                </span>
              ) : (
                <span className="text-amber-500 flex items-center gap-1 font-black">
                  <AlertCircle size={12} />
                  <span>{text.port_unauthorized}</span>
                </span>
              )}
            </div>
          </div>

          {/* Active Step Detailed Explanation */}
          <div className="border border-white/5 bg-[#080d16] rounded-xl p-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-indigo-400 uppercase border-b border-white/5 pb-2.5 mb-3 flex items-center gap-1.5">
              <FileText size={12} />
              <span>{text.step_description}</span>
            </h2>

            <div className="space-y-3 font-sans">
              <div className="bg-indigo-950/10 border border-indigo-500/10 p-3.5 rounded-lg">
                <h3 className="text-xs font-black text-slate-200 font-mono mb-1.5 uppercase flex items-center gap-1.5">
                  <span className="text-[#26F0C4] shrink-0 font-bold">•</span>
                  <span>{currentLang === 'fr' ? activeStep.titleFr : activeStep.titleEn}</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {currentLang === 'fr' ? activeStep.descFr : activeStep.descEn}
                </p>
              </div>

              {/* Step checklist */}
              <div className="space-y-1.5 bg-slate-950/30 p-3 rounded-lg border border-white/5">
                {(currentLang === 'fr' ? activeStep.details.fr : activeStep.details.en).map((detail, dIdx) => (
                  <div key={dIdx} className="flex gap-2 text-[10px] font-mono text-slate-400 leading-relaxed">
                    <Check size={11} className="text-[#26F0C4] shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live RADIUS Session Audit Logs */}
          <div className="border border-white/5 bg-[#080d16] rounded-xl p-4 flex-1 min-h-[180px] flex flex-col">
            <h2 className="text-xs font-bold font-mono tracking-wider text-indigo-400 uppercase border-b border-white/5 pb-2.5 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Terminal size={12} />
                <span>{text.live_logs_title}</span>
              </span>
              <span className="text-[9px] text-slate-500 font-mono select-none hidden sm:inline">
                {text.logs_disclaimer}
              </span>
            </h2>

            <div className="flex-1 overflow-x-auto min-h-0">
              <table className="w-full text-left font-mono text-[10px] border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500">
                    <th className="py-2 px-2 font-black uppercase tracking-wider">{text.table_time}</th>
                    <th className="py-2 px-2 font-black uppercase tracking-wider">{text.table_username}</th>
                    <th className="py-2 px-2 font-black uppercase tracking-wider">{text.table_status}</th>
                    <th className="py-2 px-2 font-black uppercase tracking-wider">{text.table_nas}</th>
                    <th className="py-2 px-2 font-black uppercase tracking-wider">{text.table_port}</th>
                    <th className="py-2 px-2 font-black uppercase tracking-wider">{text.table_vlan}</th>
                    <th className="py-2 px-2 font-black uppercase tracking-wider">{text.table_policy}</th>
                    <th className="py-2 px-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedAuditLog(log)}
                      className="hover:bg-slate-900/40 cursor-pointer text-slate-300 group"
                    >
                      <td className="py-2 px-2 text-slate-500">{log.timestamp.slice(11, 19)}</td>
                      <td className="py-2 px-2 font-bold text-white max-w-[120px] truncate" title={log.username}>{log.username}</td>
                      <td className="py-2 px-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black ${
                          log.status === 'Accept' 
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" 
                            : "bg-red-950/40 text-red-400 border border-red-500/20"
                        }`}>
                          {log.status === 'Accept' ? 'ACCESS_ACCEPT' : 'ACCESS_REJECT'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-400">{log.nas}</td>
                      <td className="py-2 px-2 text-slate-400">{log.port}</td>
                      <td className="py-2 px-2 font-bold text-[#26F0C4]">{log.vlan}</td>
                      <td className="py-2 px-2 text-slate-500 max-w-[150px] truncate" title={log.policy}>{log.policy}</td>
                      <td className="py-2 px-2 text-right">
                        <button className="text-[9px] text-indigo-400 hover:text-[#26F0C4] font-black uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded transition-all">
                          {text.btn_view_report}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Cisco ISE Details Report Dialog */}
      <AnimatePresence>
        {selectedAuditLog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
            onClick={() => setSelectedAuditLog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#05070e] text-xs font-sans shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Titlebar */}
              <div className="flex items-center justify-between bg-slate-950 px-5 py-3.5 border-b border-white/5 select-none shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#26F0C4]" />
                  <span className="text-xs font-black text-slate-200 tracking-wide font-mono uppercase">
                    {text.details_report_title} (ID: {selectedAuditLog.id})
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedAuditLog(null)}
                  className="p-1 text-slate-500 hover:text-white transition-colors rounded hover:bg-white/5 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Dialog dual pane */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                
                {/* Left pane: Attribute summary */}
                <div className="p-5 flex flex-col space-y-4 bg-slate-950/30">
                  <h3 className="text-[10px] font-black font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5 shrink-0">
                    <Layers size={11} className="text-[#26F0C4]" />
                    <span>{text.details_summary}</span>
                  </h3>

                  <div className="bg-[#020408] border border-white/5 rounded-lg p-4 font-mono text-[10px] space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-slate-500">RADIUS Attribute:</span>
                      <span className="text-slate-400">Value Received</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span>User-Name:</span>
                      <span className="text-white font-bold">{selectedAuditLog.username}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span>Calling-Station-Id:</span>
                      <span className="text-white font-bold">{selectedAuditLog.mac}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span>NAS-Port-Id:</span>
                      <span className="text-white font-bold">{selectedAuditLog.port}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span>NAS-IP-Address:</span>
                      <span className="text-slate-400">{selectedAuditLog.nas} (10.0.5.1)</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span>EAP-Authentication-Type:</span>
                      <span className="text-[#26F0C4] font-bold">{selectedAuditLog.authMethod}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span>RADIUS Session State:</span>
                      <span className={selectedAuditLog.status === 'Accept' ? "text-emerald-400" : "text-red-400"}>
                        {selectedAuditLog.status === 'Accept' ? "AUTHENTICATION_SUCCESS" : "AUTHENTICATION_FAILED"}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>ISE Policy Server:</span>
                      <span className="text-slate-400">ise-master-node-01</span>
                    </div>
                  </div>

                  {/* dACL payload */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5 shrink-0">
                      <Code size={11} className="text-indigo-400" />
                      <span>{text.details_dacl}</span>
                    </h3>
                    <div className="bg-[#020408] border border-white/5 rounded-lg p-3 font-mono text-[9px] text-[#26F0C4] whitespace-pre-wrap leading-relaxed select-text">
                      {selectedAuditLog.status === 'Accept' ? (
                        selectedAuditLog.scenarioId === 'dev-cert' ? (
                          `ip access-list extended DEV_ACCESS_DACL\n  permit tcp any 10.100.0.0 0.0.255.255 eq 443\n  permit tcp any 10.100.0.0 0.0.255.255 eq 22\n  deny ip any 10.0.0.0 255.0.0.0\n  permit ip any any (DNS / Internet only)`
                        ) : selectedAuditLog.scenarioId === 'printer-mab' ? (
                          `ip access-list extended PRINTER_LIMIT_DACL\n  permit ip any host 10.0.5.20\n  permit udp any host 10.0.5.10 eq 53\n  deny ip any any`
                        ) : (
                          `ip access-list extended CORP_ACCESS_DACL\n  permit ip any any`
                        )
                      ) : (
                        `ip access-list extended BLOCK_ALL_DACL\n  deny ip any any`
                      )}
                    </div>
                  </div>
                </div>

                {/* Right pane: resolved steps */}
                <div className="p-5 flex flex-col justify-between bg-[#080d16]">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5 shrink-0">
                      <FileText size={11} className="text-[#26F0C4]" />
                      <span>{text.details_steps}</span>
                    </h3>

                    <div className="space-y-3 font-mono text-[10px] text-slate-400">
                      <div className="flex items-start gap-2 border-l border-emerald-500/30 pl-3 py-1">
                        <span className="text-emerald-400 font-bold">[10101]</span>
                        <div>
                          <span className="text-white font-bold block">RADIUS Access-Request received</span>
                          <span className="text-[9px] mt-0.5 block text-slate-500">Validating physical interface authenticator parameters.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 border-l border-emerald-500/30 pl-3 py-1">
                        <span className="text-emerald-400 font-bold">[15004]</span>
                        <div>
                          <span className="text-white font-bold block">Verify identity against AD store</span>
                          <span className="text-[9px] mt-0.5 block text-slate-500">Querying win-srv-dc01.corp.local using service bind-dn.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 border-l border-emerald-500/30 pl-3 py-1">
                        <span className="text-emerald-400 font-bold">[15048]</span>
                        <div>
                          <span className="text-white font-bold block">Crypto Handshake Complete</span>
                          <span className="text-[9px] mt-0.5 block text-[#26F0C4]">{selectedAuditLog.authMethod} negotiation resolved with full confidence trust.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 border-l border-[#26F0C4]/30 pl-3 py-1">
                        <span className="text-[#26F0C4] font-bold">[11507]</span>
                        <div>
                          <span className="text-white font-bold block">Authorization Policy Resolved</span>
                          <span className="text-[9px] mt-0.5 block text-indigo-400">Policy: {selectedAuditLog.policy}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 border-l border-emerald-500/30 pl-3 py-1">
                        <span className="text-emerald-400 font-bold">[11002]</span>
                        <div>
                          <span className="text-white font-bold block">RADIUS Access-Accept Delivered</span>
                          <span className="text-[9px] mt-0.5 block text-slate-500">Mapped VLAN: {selectedAuditLog.vlan} | Applied ACL table success.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-500">Verification Posture:</span>
                    <span className={`font-black ${selectedAuditLog.status === 'Accept' ? "text-emerald-400" : "text-red-400"}`}>
                      {selectedAuditLog.status === 'Accept' ? "POSTURED_COMPLIANT" : "POSTURED_REJECTED"}
                    </span>
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

// Simple Close Icon Helper since it was not explicitly in the imports
const X: React.FC<any> = ({ size, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 16} 
    height={size || 16} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default CiscoIseVisualizer;
