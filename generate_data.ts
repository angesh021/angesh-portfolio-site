import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentEnDir = path.join(__dirname, 'content', 'en');
const contentFrDir = path.join(__dirname, 'content', 'fr');

const en_experience = [
  {
    company: 'General Motors',
    role: 'Endpoint Security & Network Access Control Engineer',
    period: '02/2022 - 07/2025',
    location: 'Dublin, Ireland',
    logoUrl: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/logo/gm.png',
    logoBg: 'white',
    companyUrl: 'https://www.gm.com/',
    themeColor: '#005A9C',
    type: 'work',
    collaboration: [
        { icon: 'lead', role: 'Team Lead', name: 'Cybersecurity Manager' },
        { icon: 'peer', role: 'Peer Engineers', name: 'x4 Security Analysts' },
        { icon: 'stakeholder', role: 'Stakeholders', name: 'Network & IT Ops Teams' },
        { icon: 'report', role: 'Reporting Line', name: 'Director of Infosec' }
    ],
    skills: [
      { name: 'Cisco ISE', context: 'Orchestrated enterprise-wide NAC deployments using 802.1X for ZeroTrust security.' },
      { name: '802.1X', context: 'Implemented and managed secure wired and wireless network access control protocols.' },
      { name: 'ZeroTrust', context: 'Advanced ZeroTrust network architecture by enforcing granular, identity-based access policies.' },
      { name: 'EDR/DLP', context: 'Managed and tuned endpoint security controls to detect and prevent threats on thousands of devices.' },
      { name: 'Python', context: 'Developed custom scripts for security monitoring, data parsing, and automating repetitive tasks.' },
      { name: 'PowerShell', context: 'Automated Windows Server tasks, security configurations, and certificate management workflows.' },
      { name: 'Incident Response', context: 'Provided Tier-3 analysis and remediation for endpoint security and network access incidents.' },
      { name: 'ServiceNow', context: 'Utilized ServiceNow for incident tracking, change management, and security operations ticketing.' }
    ],
    impactMetrics: [
      { value: 300, label: 'Security Servers Monitored', icon: 'server' },
      { value: 90, label: 'Manual Work Reduction', icon: 'zap', suffix: '%' },
      { value: 140, label: 'Hardware Failures Detected', icon: 'shield' }
    ],
    dailyLog: [
      { time: '09:15', task: 'Investigating anomalous login attempt from new geo-location.', type: 'warn' },
      { time: '11:30', task: 'Pushing updated Cisco ISE policy to production controllers.', type: 'info' },
      { time: '14:00', task: 'Collaborating with network team on switch configuration for new 802.1X deployment.', type: 'info' },
      { time: '15:45', task: 'Critical EDR alert: Potential malware execution on endpoint. Initiating isolation.', type: 'critical' },
      { time: '16:30', task: 'Automated script successfully renewed 50 expiring server certificates.', type: 'info' }
    ],
    anecdote: {
        title: "The Global Outage",
        icon: 'alert-octagon',
        story: "During a global outage, Active Directory synchronization with Cisco ISE AAA servers failed, halting car production across all manufacturing sites. I led the incident response, identifying a rare replication bug within a specific forest trust. I developed and deployed a PowerShell script to force-resync critical attributes, restoring AAA services in under an hour and bringing production back online, preventing millions in losses."
    },
    legacy: [
        "Authored the definitive PowerShell automation script for AD-ISE synchronization, which was integrated into the core infrastructure monitoring toolset, permanently eliminating a critical single point of failure."
    ],
    description: [
      'Spearheaded the modernization of global network security for a Fortune 500 automotive leader. My core mission involved architecting and deploying enterprise-wide Cisco ISE and 802.1X frameworks to enforce a Zero Trust security model. I engineered robust automation pipelines using Python and PowerShell to slash manual workloads, proactively monitored over 300 security servers to ensure operational resilience, and standardized a next-generation guest Wi-Fi solution across international sites, directly contributing to the company\'s digital transformation and enhanced cybersecurity posture.',
      'Faced recurring certificate expirations and inconsistent policy documentation across 300+ ISE servers; automated DigiCert renewal and policy workflows with Python/PowerShell, cutting manual work by 90% and saving 150+ engineer-hours annually.',
      'Observed fragmented 802.1X adoption delaying Zero Trust goals; standardized and deployed Cisco ISE 802.1X configurations enterprise-wide, reducing unauthorized device risk by over 85% and ensuring global policy uniformity.',
      'Identified frequent undetected hardware faults causing downtime; developed a proactive server monitoring and alerting framework, detecting 140+ failures early and minimizing unplanned outages.',
      'Noted inconsistent guest Wi-Fi experience and weak security segmentation; rolled out Next-Gen Guest (Prisma) Wi-Fi with centralized templates, delivering secure and seamless access across six international sites.',
      'Encountered slow incident resolution during network disruptions; enhanced Tier-3 response automation and led 24/7 on-call escalation, improving MTTR and service reliability across global operations.',
      'Recognized lack of unified visibility into security change processes; executed and documented 200+ ServiceNow security changes, maintaining continuous compliance and business uptime.',
      'Found gaps between technical projects and strategic objectives; presented cybersecurity and cloud migration roadmaps to leadership, ensuring alignment with GM’s digital-transformation strategy and measurable security maturity growth.'
    ]
  },
  {
    company: 'Junior Achievement Ireland',
    role: 'STEM Educator | Cybersecurity & AI Awareness',
    period: '05/2024 - 05/2024',
    location: 'Dublin, Ireland',
    logoUrl: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/logo/JuniorAchievementIreland.png',
    companyUrl: 'https://www.jai.ie/',
    themeColor: '#8DC63F',
    type: 'volunteer',
    collaboration: [
        { icon: 'stakeholder', role: 'Students', name: '30+ Primary Students' },
        { icon: 'peer', role: 'School Teacher', name: 'Classroom Supervisor' }
    ],
    skills: [
      { name: 'STEM Education', context: 'Delivered curriculum on cybersecurity and AI.' },
      { name: 'Public Speaking', context: 'Engaged and taught a classroom of 30+ students.' },
      { name: 'Youth Mentoring', context: 'Promoted awareness of tech careers to young learners.' },
      { name: 'Digital Communication', context: 'Used e-learning platforms to enhance lessons.' }
    ],
    anecdote: {
        title: "Cracking the Code",
        icon: 'lightbulb',
        story: "To explain cybersecurity, I created a simple 'Caesar cipher' game on the whiteboard. Initially, the kids were quiet. But once the first student cracked the code to reveal a funny secret message, the room erupted. They spent the rest of the session enthusiastically creating their own secret codes. It was a perfect lesson in how a simple, engaging hook can make complex topics accessible and exciting."
    },
    legacy: [
        "Sharpened my skills in public speaking, curriculum delivery, and youth mentoring, aligning with a passion for cyber education and community development."
    ],
    description: [
      "Volunteered at Loreto Senior Primary School to deliver the JAI TecKno programme, teaching 30+ students over 4 sessions covering:",
      "🛡️ Cybersecurity Awareness – taught students how to identify phishing threats, create secure passwords, and manage their digital footprint through gamified learning.",
      "🤖 AI & Robotics – explained how automation and machine learning are used in everyday tech, from robotic vacuum cleaners to facial recognition systems.",
      "📊 Data Analytics – led exercises on interpreting data trends and visualizing key insights for real-world business applications.",
      "💻 Computer Science Basics – explored computing history, programming logic, and career pathways in tech.",
      "Used tools like Kahoot and group activities to boost student engagement, promote awareness of tech careers, and awarded each student a Certificate of Achievement.",
      "This experience sharpened my skills in public speaking, curriculum delivery, and youth mentoring, aligning with my passion for cyber education and community development."
    ]
  },
  {
    company: 'Junior Achievement Ireland',
    role: 'Volunteer Mentor - Sustainability Innovation Challenge',
    period: '03/2024 - 03/2024',
    location: 'Dublin, Ireland',
    logoUrl: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/logo/JuniorAchievementIreland.png',
    companyUrl: 'https://www.jai.ie/',
    themeColor: '#8DC63F',
    type: 'volunteer',
    collaboration: [
        { icon: 'stakeholder', role: 'Students', name: '~100 Students' },
        { icon: 'peer', role: 'JAI Coordinator', name: 'Program Manager' }
    ],
    skills: [
      { name: 'Mentorship', context: 'Guided students through challenge-based learning.' },
      { name: 'Leadership', context: 'Fostered leadership skills in young innovators.' },
      { name: 'Public Speaking', context: 'Assisted students in creating and refining video pitches.' },
      { name: 'Sustainability', context: 'Aligned solutions with UN SDGs.' }
    ],
    anecdote: {
        title: "The 'Aha!' Moment",
        icon: 'lightbulb',
        story: "A shy student group struggled to present their idea for a community composting app. During a practice pitch, I helped them reframe their 'boring' data as a powerful story about local impact. Seeing their confidence soar as they realized they weren't just coding, but solving a real problem for their neighbors, was a profound reminder of why I love sharing knowledge."
    },
    legacy: [
        "Contributed to an initiative that empowered nearly 100 students across three schools to develop viable solutions to combat climate change."
    ],
    description: [
      "Volunteered as a mentor for the Sustainability Innovation Challenge, a program by Junior Achievement Ireland (JAI) and Accenture.",
      "Guided and supported students in developing innovative, sustainable business solutions aligned with the UN Sustainable Development Goals (SDGs).",
      "Helped students enhance critical thinking, teamwork, problem-solving, and leadership skills through interactive workshops and challenge-based learning.",
      "Assisted students in creating infographics and video pitches to present their ideas for addressing real-world environmental and sustainability challenges.",
      "Contributed to an initiative that empowered nearly 100 students across three schools to develop viable solutions to combat climate change.",
      "Encouraged creativity and sustainable innovation through mentorship, discussions, and project development."
    ]
  },
  {
    company: 'Beaumont Hospital',
    role: 'Nursing Aide',
    period: '10/2018 - 02/2022',
    location: 'Dublin, Ireland',
    logoUrl: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/logo/beaumont-logo.png',
    companyUrl: 'https://www.beaumont.ie/',
    themeColor: '#008080',
    type: 'work',
    collaboration: [
        { icon: 'lead', role: 'Shift Supervisor', name: 'Clinical Nurse Manager' },
        { icon: 'peer', role: 'Peer Aides', name: 'x5 Nursing Colleagues' },
        { icon: 'stakeholder', role: 'Medical Team', name: 'Nurses & Doctors' },
        { icon: 'report', role: 'Reporting Line', name: 'Ward Sister' }
    ],
    skills: [
        { name: 'Patient Care', context: 'Provided direct physical and emotional support to a diverse patient population.' },
        { name: 'Vital Signs Monitoring', context: 'Accurately measured and recorded key health indicators to assist clinical decisions.' },
        { name: 'Documentation', context: 'Maintained precise and confidential patient records in line with healthcare regulations.' },
        { name: 'Teamwork', context: 'Coordinated effectively with nurses and doctors to ensure seamless patient care.' },
        { name: 'Compassion', context: 'Offered empathetic support to patients and their families during challenging times.' },
        { name: 'High-Pressure Environments', context: 'Remained calm and efficient in a fast-paced, high-stakes hospital setting.' }
    ],
    impactMetrics: [
        { value: 20, label: 'Patients Cared For Daily (Avg)', icon: 'trending-up' },
        { value: 99, label: 'Patient Satisfaction Score', icon: 'shield', suffix: '%' },
        { value: 100, label: 'Accuracy in Vitals Recording', icon: 'zap', suffix: '%' }
    ],
    dailyLog: [
      { time: '08:00', task: 'Received shift handover and reviewed patient care plans.', type: 'info' },
      { time: '09:30', task: 'Assisted patients with morning hygiene and mobility.', type: 'info' },
      { time: '12:00', task: 'Recorded vital signs for all assigned patients before lunch.', type: 'info' },
      { time: '13:45', task: 'Patient showing signs of distress. Immediately alerted nursing staff.', type: 'warn' },
      { time: '15:00', task: 'Documented all care activities and patient observations for the shift.', type: 'info' }
    ],
    anecdote: {
        title: "The Human Signal",
        icon: 'lightbulb',
        story: "I cared for a non-communicative elderly patient whom others found difficult. By observing non-verbal cues and meticulously logging small behavioral changes, I noticed a pattern related to room lighting. Adjusting it at specific times dramatically improved their comfort and cooperation. This taught me that the most complex systems—whether human or digital—often hinge on understanding the smallest details. It's a lesson I now apply to security, where a single anomalous log entry can signify a much larger issue."
    },
    legacy: [
        "My systematic approach to observing non-verbal cues taught me that the most critical signals in any system—human or digital—are often the quietest."
    ],
    description: [
      'Delivered critical frontline patient support, meticulously monitoring and documenting vital signs while collaborating with clinical teams to ensure adherence to care plans and maintain patient comfort and dignity in a high-stakes hospital environment.',
      'Provided compassionate care, maintaining patients\' comfort and dignity while offering emotional support to patients and their families.',
      'Coordinated with nurses and physicians to follow care plans, demonstrating strong teamwork and reliability in a high-pressure environment.'
    ]
  },
  {
    company: 'CareChoice Nursing Home',
    role: 'Healthcare Assistant',
    period: '04/2018 - 09/2018',
    location: 'Dublin, Ireland',
    logoUrl: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/logo/carechoice-logo.png',
    companyUrl: 'https://www.carechoice.ie/',
    themeColor: '#5F9EA0',
    type: 'work',
    collaboration: [
        { icon: 'lead', role: 'Supervisor', name: 'Head Nurse' },
        { icon: 'peer', role: 'Colleagues', name: 'Nursing & Medical Staff' },
        { icon: 'stakeholder', role: 'Stakeholders', name: 'Residents & Families' }
    ],
    skills: [
        { name: 'Clinical Support', context: 'Assisted nurses and doctors in clinical procedures and treatments.' },
        { name: 'Patient Dignity', context: 'Acted as a chaperone and prepared patients to ensure comfort and privacy.' },
        { name: 'Safeguarding', context: 'Monitored vulnerable residents and strictly followed all safeguarding protocols.' },
        { name: 'Infection Control', context: 'Maintained a sterile environment and managed clinical equipment.' },
        { name: 'Medical Charting', context: 'Recorded observations and communicated patient needs for continuity of care.' },
        { name: 'Mobility Assistance', context: 'Safely escorted patients and supported those with limited independence.' }
    ],
    impactMetrics: [
        { value: 100, label: 'Adherence to Infection Control', icon: 'shield', suffix: '%' },
        { value: 25, label: 'Reduction in Patient Anxiety', icon: 'zap', suffix: '%' },
        { value: 15, label: 'Improvement in Team Efficiency', icon: 'trending-up', suffix: '%' }
    ],
    dailyLog: [
      { time: '09:00', task: 'Prepared 3 patients for their morning clinical examinations.', type: 'info' },
      { time: '10:30', task: 'Assisted nursing staff with complex wound dressing for a post-op patient.', type: 'info' },
      { time: '12:15', task: 'Escorted a resident with mobility challenges to the physiotherapy department.', type: 'info' },
      { time: '14:00', task: 'Noticed a resident showing signs of distress and immediately reported to the charge nurse.', type: 'warn' },
      { time: '15:30', task: 'Sterilized and restocked medical equipment in two treatment rooms.', type: 'info' }
    ],
    anecdote: {
        title: "The Quiet Observer",
        icon: 'lightbulb',
        story: "A new resident was extremely withdrawn and anxious during clinical checks. Instead of just completing the tasks, I made a point to explain every step calmly before I began. Over a few days, I noticed they would subtly nod. By prioritizing communication and dignity over speed, I helped them feel safe and in control, transforming their experience from one of fear to one of trust. It reinforced my belief that understanding the 'human element' is as critical as any clinical procedure."
    },
    legacy: [
        "Established a reputation for meticulous observation and proactive communication, which helped bridge the gap between routine care tasks and clinical oversight, improving overall patient safety."
    ],
    description: [
      "Functioned as a key support pillar in a dynamic clinical environment, assisting nurses and doctors with treatments, maintaining rigorous infection-control standards, and ensuring patient dignity and safety during procedures.",
      "Assisted qualified nurses and medical practitioners during examinations, treatments, and routine patient care activities.",
      "Prepared patients for clinical procedures, ensuring comfort, dignity, and clear communication throughout their visit.",
      "Provided mobility assistance, escorted patients safely across the healthcare facility, and supported those with limited independence.",
      "Acted as a chaperone during examinations to uphold patient privacy, safety, and emotional well-being.",
      "Monitored and supported elderly and vulnerable individuals, ensuring safeguarding protocols were followed at all times.",
      "Maintained a clean, safe, and organized clinical environment by managing equipment, replenishing supplies, and adhering to infection-control standards.",
      "Recorded observations and communicated patient needs promptly to the nursing team, contributing to effective continuity of care.",
      "Encouraged patients’ autonomy and well-being by assisting with daily living tasks and promoting independence where possible."
    ]
  },
  {
    company: 'FirstCare Ireland',
    role: 'Healthcare Assistant',
    period: '03/2017 - 04/2018',
    location: 'Dublin, Ireland',
    logoUrl: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/logo/firstcare-logo.png',
    companyUrl: 'https://firstcare.ie/',
    themeColor: '#4682B4',
    type: 'work',
    collaboration: [
        { icon: 'lead', role: 'Supervisor', name: 'Care Manager' },
        { icon: 'stakeholder', role: 'Clients & Families', name: 'Multiple Households' },
        { icon: 'peer', role: 'Colleagues', name: 'Multidisciplinary Team' }
    ],
    skills: [
        { name: 'Personal Care (ADLs)', context: 'Assisted residents with all activities of daily living with dignity.' },
        { name: 'Emotional Support', context: 'Provided active listening and reassurance to residents.' },
        { name: 'Social Engagement', context: 'Facilitated social and recreational activities to boost morale.' },
        { name: 'Dietary Monitoring', context: 'Supported mealtime activities and monitored nutrition and hydration.' },
        { name: 'Home Environment Safety', context: 'Maintained a clean, safe, and homely living space.' }
    ],
    impactMetrics: [
        { value: 40, label: 'Increase in Resident Activity', icon: 'trending-up', suffix: '%' },
        { value: 98, label: 'Client Satisfaction Rating', icon: 'shield', suffix: '%' }
    ],
    dailyLog: [
      { time: '08:30', task: 'Assisted a client with their morning personal care routine.', type: 'info' },
      { time: '11:00', task: 'Organized a group reading session in the common area.', type: 'info' },
      { time: '13:00', task: 'Served lunch and monitored three residents with specific dietary needs.', type: 'info' },
      { time: '15:00', task: 'Spent one-on-one time with a resident feeling anxious, providing reassurance.', type: 'info' },
      { time: '16:30', task: 'Reported a positive change in a resident\'s mobility to the shift nurse.', type: 'info' }
    ],
    anecdote: {
        title: "The Forgotten Melody",
        icon: 'lightbulb',
        story: "I learned one resident used to play the piano but hadn't in years due to arthritis. I found a lightweight keyboard and encouraged them to just touch the keys. We started with simple one-finger melodies. Soon, they were playing old songs from memory, drawing a small audience of other residents. It taught me that care isn't just about meeting needs, but about rediscovering purpose and joy, no matter the physical limitations."
    },
    legacy: [
        "Developed a person-centered approach that went beyond physical tasks, focusing on promoting social and emotional well-being, which led to a marked increase in resident engagement."
    ],
    description: [
      "Delivered holistic, person-centered care by assisting with daily living activities, providing crucial emotional support, and facilitating social engagement to enhance residents' quality of life and well-being.",
      "Delivered high-quality personal care and emotional support to residents, ensuring dignity, comfort, and individualized attention at all times.",
      "Assisted residents with activities of daily living (ADLs), including bathing, dressing, grooming, mobility, and toileting, in line with established care plans.",
      "Supported mealtime activities by organizing, preparing, and assisting with food service, while monitoring dietary needs and hydration levels.",
      "Encouraged resident engagement by facilitating social, recreational, and therapeutic activities to promote mental and emotional well-being.",
      "Provided active listening, reassurance, and basic counselling to residents experiencing anxiety, loneliness, or personal challenges.",
      "Maintained a clean, safe, and homely environment through routine housekeeping and adherence to infection-prevention procedures.",
      "Worked collaboratively with nurses and multidisciplinary teams to report changes in residents’ health or behavior and ensure continuity of care.",
      "Upheld safeguarding, confidentiality, and health & safety policies to protect residents and maintain a secure living environment."
    ]
  }
];

const en_projects = [
  {
    id: 'project-home-soc-lab',
    title: 'Home SOC Lab – Advanced Detection Engineering',
    description: 'A complete, isolated SOC environment built on VMware, designed to demonstrate log analysis, threat hunting, and detection engineering.',
    longDescription: 'This project is a complete, isolated Security Operations Center (SOC) environment built on VMware. It demonstrates hands-on blue-team capabilities by simulating attacker behaviors and detecting them using a powerful stack including Wazuh SIEM, Sysmon EDR, Zeek NSM, and Suricata IDS/IPS. It features real-world attack scenarios mapped to MITRE ATT&CK methodologies, custom correlation rules, and comprehensive threat hunting workflows across both network and endpoint telemetry.',
    tags: [
      'Wazuh SIEM',
      'Zeek NSM',
      'Suricata IDS/IPS',
      'Sysmon EDR',
      'Blue Team',
      'Threat Hunting',
      'Detection Engineering'
    ],
    githubUrl: 'https://github.com/angesh021/home-soc-lab',
    videoPreviewUrl: 'https://cdn.coverr.co/videos/coverr-a-stream-of-data-2216/1080p.mp4',
    status: 'Completed',
    keyFeatures: [
      'Endpoint Detection & Response (EDR) with Sysmon',
      'Security Information & Event Management (SIEM) with Wazuh',
      'Network intrusion detection (IDS/IPS) with Suricata',
      'Network behavioral monitoring with Zeek',
      'Custom correlation rules and MITRE ATT&CK mapping',
      'Documented attack chains and threat hunting workflows'
    ],
    architectureUrl: '/assets/projects/project-home-soc-lab/SOCLab-Architecture.png',
    galleryUrls: [
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-Hero.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-ThreatHunting.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-DetectionFlow.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-DetectionEngineering.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-BlueTeam.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-AttackScenario.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-Architecture.png'
    ]
  },
  {
    id: 'project-aura-ttt',
    title: 'Aura Tic-Tac-Toe – Feature-Rich Multiplayer Web Application',
    description: 'A modern, feature-rich Tic-Tac-Toe web application designed with a stunning glassmorphism UI, fluid animations, and a comprehensive suite of gameplay modes.',
    longDescription: 'Aura Tic-Tac-Toe is a highly polished, full-stack multiplayer web application designed with a stunning glassmorphism UI, fluid animations, and a comprehensive suite of gameplay modes. The project showcases a production-ready, secure, and server-authoritative architecture, featuring a React frontend and a Node.js/Socket.IO backend. It supports complex gameplay mechanics like local Pass & Play, AI Solo (with varying difficulty levels), real-time PvP with a customized Lobby system, progression systems including an in-game shop, cosmetic items, leaderboards, and robust authentication and security features.',
    tags: [
      'React',
      'Node.js',
      'Express',
      'Socket.IO',
      'PostgreSQL',
      'Framer Motion',
      'TypeScript'
    ],
    githubUrl: 'https://github.com/angesh021/aura-tic-tac-toe',
    videoPreviewUrl: 'https://cdn.coverr.co/videos/coverr-a-stream-of-data-2216/1080p.mp4',
    status: 'Completed',
    keyFeatures: [
      'Sleek Glassmorphism UI with smooth responsive animations',
      'Multiple Game Modes: Solo vs. AI, Local Pass & Play, Real-time PvP, and Campaign Mode',
      'Strategic Power-Ups: Undo, Destroy, Fortify, and Double Strike',
      'Progression & Economy: Earn Aura Coins, complete Daily Quests, and unlock cosmetic items in the Marketplace',
      'Social Hub: Friends list with online status, direct messaging, and global ELO leaderboards',
      'Server-Authoritative gameplay to prevent client-side cheating'
    ],
    architectureUrl: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20Architecture.png',
    galleryUrls: [
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20Hero.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20GameplayFeatures.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20TheProblem.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20TheSolution.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20Workflow.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20DesignEvolution.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20DatabaseDesign.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20Prototypes.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20Architecture.png'
    ]
  },
  {
    id: 'project-admin-dashboard',
    title: 'Admin Dashboard Platform',
    description: 'A comprehensive admin dashboard focusing on programming insights, security, log analysis, and data visualization.',
    longDescription: 'Developed an advanced admin dashboard designed for comprehensive system monitoring, combining programming tools, security overviews, and deep log analysis capabilities. The platform features rich data visualization for real-time traffic monitoring, threat detection, and log metrics. It incorporates secure role-based access, real-time alerting systems, and seamless log aggregation to provide administrators with actionable insights rapidly.',
    tags: [
      'Programming',
      'Security',
      'Log Analysis',
      'Data Visualization',
      'React',
      'Dashboards'
    ],
    githubUrl: 'https://github.com/angesh021/admin-dashboard',
    videoPreviewUrl: 'https://cdn.coverr.co/videos/coverr-a-stream-of-data-2216/1080p.mp4',
    status: 'In Progress',
    keyFeatures: [
      'Real-time Security Monitoring & Alerts',
      'Advanced Log Analysis and Parsing',
      'Interactive Data Visualization (Charts/Graphs)',
      'Role-Based Access Control (RBAC)',
      'System Health and Performance Metrics'
    ],
    architectureUrl: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20Architecture.png',
    galleryUrls: [
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20Hero.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20SaaS%20security%20dashboard%20overview.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20PerformanceAnalystics.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20Lifecycle.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20IdentityManagement.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20AuditTrail.png',
      'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20Architecture.png'
    ]
  },
  {
    id: 'project-enterprise-nac',
    title: 'Enterprise NAC Lab (Cisco ISE + AD)',
    description: 'An end-to-end lab simulating corporate network access control with Cisco ISE, Active Directory, and 802.1X.',
    longDescription: 'Built a full enterprise-grade NAC (Network Access Control) lab environment using EVE-NG virtual platform running inside VMware Workstation, integrating Cisco Identity Services Engine (ISE) with Microsoft Active Directory to simulate real-world secure network authentication. The project replicates a corporate authentication ecosystem, allowing wired and wireless endpoints to authenticate using 802.1X, RADIUS, and Active Directory user policies. This environment was designed to test onboarding workflows, security policies, endpoint profiling, and role-based access enforcement.',
    tags: ['Cisco ISE', 'Active Directory', '802.1X', 'EVE-NG', 'VMware', 'RADIUS', 'PKI', 'Network Security', 'Zero Trust'],
    githubUrl: 'https://github.com/angesh021/enterprise-nac-lab',
    videoPreviewUrl: 'https://cdn.coverr.co/videos/coverr-a-stream-of-data-2216/1080p.mp4',
    status: 'Completed',
    keyFeatures: [
      '802.1X authentication for domain-joined endpoints (PEAP/EAP-TLS)',
      'MAC Authentication Bypass (MAB) for unmanaged/IoT devices',
      'Active Directory integration for centralized identity & policy',
      'ISE Policy Sets for authorization based on AD groups',
      'Dynamic VLAN assignment and ACL enforcement based on user roles',
      'RADIUS live logs monitoring for auditability and troubleshooting'
    ],
    architectureUrl: 'https://i.imgur.com/8zT7X6h.png'
  },
  {
    id: 'project-hse-vax',
    title: 'HSE Vaccination APP - Security Hardening',
    description: 'Full-stack security audit and remediation of a national healthcare application following OWASP Top 10.',
    longDescription: 'Led a comprehensive security overhaul of a critical healthcare vaccination management system. The project involved static (SAST) and dynamic (DAST) application security testing to identify vulnerabilities. Key achievements include patching 12+ critical flaws such as SQL Injection and Cross-Site Request Forgery, implementing robust multi-factor authentication (MFA), enforcing modern password hashing with BCrypt, and upgrading the entire infrastructure to use HTTPS. These measures collectively reduced the application\'s exploitability risk by over 90%.',
    tags: ['OWASP Top 10', 'SAST', 'DAST', 'BCrypt', 'Security Audit', 'Penetration Testing', 'MFA'],
    githubUrl: 'https://github.com/angesh021/HSE-VAX-APP',
    videoPreviewUrl: 'https://cdn.coverr.co/videos/coverr-a-futuristic-background-with-binary-numbers-4182/1080p.mp4',
    status: 'Completed',
    keyFeatures: [
      'Secure User Authentication with MFA',
      'Role-Based Access Control (RBAC)',
      'Input Validation & Output Encoding vs. XSS',
      'Encrypted Data-in-Transit (HTTPS)',
      'Secure Password Hashing using BCrypt'
    ],
    architectureUrl: 'https://i.imgur.com/3fS5J7m.png'
  },
  {
    id: 'project-network-lab',
    title: 'Enterprise Network Lab Design',
    description: 'A secure, scalable enterprise network topology built with advanced routing, VLANs, and firewall policies.',
    longDescription: 'Designed and built a complex, multi-layered enterprise network topology from the ground up using Cisco Packet Tracer. The lab accurately simulates a real-world IT infrastructure, featuring advanced routing protocols like OSPF, robust VLAN segmentation to isolate traffic, and granular Access Control Lists (ACLs) for security. The architecture also incorporates IPv6 addressing, a centralized wireless controller for managing access points, and stateful firewall policies to control ingress and egress traffic, creating a secure and highly scalable network environment.',
    tags: ['Cisco', 'Network Architecture', 'VLAN', 'OSPF', 'ACLs', 'Firewall Policies', 'IPv6'],
    githubUrl: 'https://github.com/angesh021/ccna-enterprise-lab',
    videoPreviewUrl: 'https://cdn.coverr.co/videos/coverr-a-stream-of-data-2216/1080p.mp4',
    status: 'Completed',
    keyFeatures: [
      'Multi-Area OSPF Routing Protocol',
      'VLAN Segmentation & Inter-VLAN Routing',
      'Stateful Firewall with Granular ACLs',
      'Centralized Wireless LAN Controller',
      'IPv4 & IPv6 Dual Stack Implementation'
    ],
    architectureUrl: 'https://i.imgur.com/8zT7X6h.png'
  }
];

const en_education = [
  {
    degree: 'Master of Science (M.Sc.) in Cybersecurity',
    institution: 'University College Dublin',
    period: '09/2023 - 08/2024',
    location: 'Dublin, Ireland',
    grade: 'Second Class Honours, First Division grade',
    description: 'An intensive postgraduate program focused on equipping students with the advanced technical skills and strategic mindset required to defend complex enterprise systems against modern cyber threats.',
    key_areas: ['Penetration Testing', 'Digital Forensics', 'Secure Systems Architecture', 'Malware Analysis'],
    focus_area: 'Advanced Threat Modeling & Simulated Enterprise Attacks',
    details: [
      'Executed complex threat modeling and led simulated red team exercises against enterprise-grade virtual labs using Metasploit, Burp Suite, and Wireshark.',
      'Engineered custom malware detection scripts and conducted in-depth forensic data analysis with industry-standard SIEM tools like Splunk.',
      'Designed and implemented secure, multi-layered cloud-native architectures in AWS, focusing on IAM, network security, and data protection.',
      'Researched and presented on the legal, ethical, and regulatory frameworks governing modern cybersecurity operations and incident response.'
    ]
  },
  {
    degree: 'Bachelor of Science (B.Sc.) in Computer Science',
    institution: 'Technological University Dublin',
    period: '09/2020 - 06/2023',
    location: 'Dublin, Ireland',
    grade: 'Second Class Honours, First Division grade',
    description: 'A comprehensive undergraduate degree providing a deep theoretical and practical foundation in computing. The curriculum covered core principles of software engineering, network infrastructure, and algorithmic problem-solving.',
    key_areas: ['Algorithms & Data Structures', 'Operating Systems', 'Network Fundamentals', 'Software Development'],
    focus_area: 'Full-Stack Web Application Development & Network Security',
    details: [
      'Mastered core CS principles including advanced algorithms, data structures, operating system design, and computer networking.',
      'Developed a diverse portfolio of projects, including full-stack web applications, system automation scripts, and secure network laboratory environments.',
      'Gained hands-on proficiency with Python, C++, Java, Bash, PowerShell, and key infrastructure technologies including AWS and Cisco networking.'
    ]
  },
  {
    degree: 'Diploma in Software Development (FETAC L6)',
    institution: 'Rathmines College',
    period: '09/2019 - 06/2020',
    location: 'Dublin, Ireland',
    grade: 'Distinction',
    description: 'A practice-oriented program centered on object-oriented programming and database design, culminating in the development of a portfolio of functional software applications.',
    key_areas: ['Object-Oriented Programming', 'Database Management', 'Project Management', 'Java & C++'],
    focus_area: 'Robust Application Development',
    details: [
      'Achieved Distinction by building a portfolio of robust, well-documented applications using Java and C++.',
      'Acquired practical skills in software architecture, agile project management methodologies, and relational database design and implementation.'
    ]
  },
  {
    degree: 'Certificate in Pre-Nursing Studies (FETAC L5)',
    institution: 'Progressive College',
    period: '02/2017 - 10/2017',
    location: 'Dublin, Ireland',
    grade: 'Merit',
    description: 'A foundational program providing essential knowledge in life sciences and patient care, developing a strong basis in anatomy, microbiology, and professional ethics.',
    key_areas: ['Human Biology', 'Anatomy & Physiology', 'Patient Care Skills', 'Microbiology'],
    focus_area: 'Foundational Life Sciences',
    details: [
      'Acquired foundational knowledge in human biology, anatomy, and patient care protocols, earning a Merit grade.',
      'Developed strong analytical and observation skills crucial for systematic problem-solving in high-stakes environments.'
    ]
  },
  {
    degree: 'A-Level Cambridge Certificate, Science',
    institution: 'Vacoas State Secondary School',
    period: '01/2008 - 10/2014',
    location: 'Vacoas, Mauritius',
    grade: 'Pass',
    description: 'Rigorous secondary education focused on the core sciences, which cultivated the analytical, quantitative, and problem-solving skills essential for a career in technology and security.',
    key_areas: ['Physics', 'Chemistry', 'Biology', 'Advanced Mathematics'],
    focus_area: 'Analytical & Scientific Reasoning',
    details: [
        'Established a strong analytical and problem-solving foundation through advanced, comprehensive studies in Physics, Chemistry, and Biology.'
    ]
  }
];

const en_certifications = [
  { id: 'btl1', name: 'Certified Blue Team Level 1', issuer: 'Security Blue Team', date: 'Issued Jun 2025', credentialUrl: 'https://www.credly.com/badges/5cab8576-afbd-4f81-a19e-c0a750d069f7', shortName: 'BTL1', badgeImageUrl: 'https://images.credly.com/size/680x680/images/276d8595-f4e0-457b-adc8-aab85ee221bf/blob',
    descriptionKey: 'cert_desc_btl1',
    skillsGained: ['Phishing Analysis', 'Digital Forensics', 'SIEM Operations', 'Incident Response', 'Threat Intelligence', 'Network Analysis'],
    benefits: ['Validates hands-on, practical defensive security skills.', 'Proves readiness for SOC Analyst and Incident Responder roles.', 'Covers a comprehensive range of blue team operations.']
  },
  { id: 'sixsigma-white', name: 'Six Sigma White Belt', issuer: 'Council for Six Sigma Certification', date: 'Issued Jan 2025', credentialUrl: '#', shortName: 'SSWB', badgeImageUrl: 'https://www.sixsigmacouncil.org/wp-content/uploads/2021/01/CSSC-WB-Final.png',
    descriptionKey: 'cert_desc_sixsigma_white',
    skillsGained: ['Basic Six Sigma Vocabulary', 'Process Improvement Awareness', 'Quality Concepts', 'Role Definition'],
    benefits: ['Provides a foundational understanding of the Six Sigma methodology.', 'Enables effective communication within a Six Sigma team.', 'Demonstrates a commitment to quality and efficiency.'],
    pdfUrl: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Certificates/White%20Belt.png'
  },
  { id: 'sixsigma-yellow', name: 'Six Sigma Yellow Belt', issuer: 'Council for Six Sigma Certification', date: 'Issued Feb 2025', credentialUrl: '#', shortName: 'SSYB', badgeImageUrl: 'https://www.sixsigmacouncil.org/wp-content/uploads/2021/01/CSSC-YB-Final2.png',
    descriptionKey: 'cert_desc_sixsigma_yellow',
    skillsGained: ['Six Sigma Concepts', 'Process Mapping Basics', 'Data Collection Techniques', 'Team Participation', 'Problem Definition'],
    benefits: ['Functions as a knowledgeable team member on Six Sigma projects.', 'Understands the core principles of process improvement.', 'Helps identify areas for improvement in daily tasks.'],
    pdfUrl: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Certificates/Yellow%20Belt.png'
  },
  { id: 'sixsigma-green', name: 'Six Sigma Green Belt', issuer: 'Council for Six Sigma Certification', date: 'Issued Apr 2025', credentialUrl: '#', shortName: 'SSGB', badgeImageUrl: 'https://www.sixsigmacouncil.org/wp-content/uploads/2021/01/CSSC-GB-Final-v2.png',
    descriptionKey: 'cert_desc_sixsigma_green',
    skillsGained: ['DMAIC Framework', 'Data Collection', 'Process Analysis', 'Statistical Tools', 'Project Management', 'Hypothesis Testing'],
    benefits: ['Leads small to medium-sized process improvement projects.', 'Provides data analysis support to Black Belts.', 'Improves problem-solving skills within a team context.'],
    pdfUrl: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Certificates/Green%20Belt.png'
  },
  { id: 'sixsigma-black', name: 'Six Sigma Black Belt', issuer: 'Council for Six Sigma Certification', date: 'Issued Jun 2025', credentialUrl: 'https://www.sixsigmacouncil.org/', shortName: 'SSBB', badgeImageUrl: 'https://www.sixsigmacouncil.org/wp-content/uploads/2021/01/CSSC-BB-Final.png',
    descriptionKey: 'cert_desc_sixsigma_black',
    skillsGained: ['Process Mapping', 'Statistical Analysis', 'Project Management', 'Root Cause Analysis', 'Quality Assurance', 'Change Management'],
    benefits: ['Enables data-driven decision-making to optimize processes.', 'Demonstrates leadership in improving business outcomes.', 'Reduces operational costs and increases efficiency.'],
    pdfUrl: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Certificates/Black%20Belt.png'
  },
  { id: 'cct', name: 'CCT Routing and Switching', issuer: 'Cisco', date: 'Issued Jan 2023', credentialUrl: 'https://www.credly.com/badges/67f93061-ef60-452d-bce9-f463af3a73a1', shortName: 'CCT', badgeImageUrl: 'https://images.credly.com/size/680x680/images/6321cd9f-5f08-4d2e-9418-2fbe1a932471/image.png',
    descriptionKey: 'cert_desc_cct',
    skillsGained: ['Device Identification', 'Cisco IOS', 'Hardware Diagnostics', 'Cabling and Interfaces', 'Service Restoration', 'Network Fundamentals'],
    benefits: ['Qualifies for on-site support of Cisco networking devices.', 'Ensures competence in first-line hardware support.', 'Provides a strong foundation for advanced Cisco certifications.'],
    needsBackgroundInDarkMode: true,
  },
  { id: 'az900', name: 'Microsoft Certified: AZ-900', issuer: 'Microsoft', date: 'Issued Jul 2022', credentialUrl: 'https://www.credly.com/badges/ec8ad48f-061c-4b26-a07b-3e12cd6d482a', shortName: 'AZ900', badgeImageUrl: 'https://images.credly.com/size/680x680/images/be8fcaeb-c769-4858-b567-ffaaa73ce8cf/image.png',
    descriptionKey: 'cert_desc_az900',
    skillsGained: ['Cloud Concepts', 'Core Azure Services', 'Azure Security', 'Azure Pricing & SLAs', 'Identity & Governance', 'Compliance'],
    benefits: ['Demonstrates fundamental knowledge of cloud services.', 'Validates understanding of the Microsoft Azure platform.', 'Serves as a prerequisite for specialized Azure role-based certs.']
  },
  { id: 'isc2-candidate', name: '(ISC)² Candidate', issuer: '(ISC)²', date: 'Issued Oct 2023', credentialUrl: 'https://www.credly.com/badges/4a8f0bb7-5f3c-4a43-9313-01b92bba573a', shortName: 'ISC²', badgeImageUrl: 'https://images.credly.com/size/680x680/images/9180921d-4a13-429e-9357-6f9706a554f0/image.png',
    descriptionKey: 'cert_desc_isc2_candidate',
    skillsGained: ['Ethical Conduct', 'Professional Development', 'Cybersecurity Principles', 'Career Planning'],
    benefits: ['Shows commitment to a career in cybersecurity.', 'Provides access to (ISC)² resources and networking.', 'Officially marks the journey towards CISSP or other certs.']
  },
  { id: 'az-admin-aad', name: 'Microsoft Azure Administrator: Azure AD', issuer: 'Skillsoft', date: 'Issued Dec 2022', credentialUrl: 'https://skillsoft.digitalbadges.skillsoft.com/fd2aa2da-2087-40e5-91ce-b8767a8a7d46#acc.1kWhp3Al', shortName: 'Az-AAD', badgeImageUrl: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/badge/52501520',
    descriptionKey: 'cert_desc_az_admin_aad',
    skillsGained: ['Azure AD', 'Identity Management', 'Enterprise State Roaming', 'Identity Protection', 'SSPR', 'Role-Based Access Control (RBAC)'],
    benefits: ['Validates core skills for managing Azure identities.', 'Crucial for securing cloud resources in Azure.', 'Demonstrates expertise in modern authentication methods.']
  },
  { id: 'sec-risk-mgmt', name: 'Session & Risk Management', issuer: 'Skillsoft', date: 'Issued Jan 2023', credentialUrl: 'https://skillsoft.digitalbadges.skillsoft.com/3d5bba3a-03be-4a16-b765-8db112eb1283#acc.czIJHypk', shortName: 'Sec&Risk', badgeImageUrl: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/badge/52501483',
    descriptionKey: 'cert_desc_sec_risk_mgmt',
    skillsGained: ['Risk Management', 'Session Management', 'Data Confidentiality', 'Encryption', 'User Security', 'Security Controls'],
    benefits: ['Demonstrates ability to identify, assess, and prioritize risks.', 'Proves competence in implementing security controls to mitigate risk.', 'Validates knowledge of hardening browsers and servers with TLS.']
  },
  { id: 'secplus-threats', name: 'CompTIA Security+: Threat Actors, Intelligence Sources, & Vulnerabilities', issuer: 'Skillsoft', date: 'Issued Aug 2022', credentialUrl: 'https://skillsoft.digitalbadges.skillsoft.com/5e21ac63-b4ad-47ad-a004-9035d442f4d2#acc.q0IKuYZQ', shortName: 'Sec+TI', badgeImageUrl: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/badge/46238108',
    descriptionKey: 'cert_desc_secplus_threats',
    skillsGained: ['Threat Intelligence', 'Threat Actor Profiling', 'Vulnerability Scanning', 'MITRE ATT&CK', 'Indicator of Compromise (IoC)', 'Cyber Kill Chain'],
    benefits: ['Demonstrates specialized knowledge in threat analysis.', 'Validates ability to identify and analyze adversaries.', 'Core skill for threat hunting and SOC roles.']
  },
  { id: 'win10-ad', name: 'Windows 10: Active Directory Management', issuer: 'Skillsoft', date: 'Issued May 2022', credentialUrl: 'https://skillsoft.digitalbadges.skillsoft.com/70aaab52-d606-4ec3-96dd-bf357d594e4f#acc.mncpXQBM', shortName: 'Win10AD', badgeImageUrl: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/badge/48745945',
    descriptionKey: 'cert_desc_win10_ad',
    skillsGained: ['Active Directory', 'Group Policy (GPO)', 'User & Group Mgmt', 'LDAP Queries', 'Client Configuration', 'Troubleshooting'],
    benefits: ['Proves competence in managing enterprise Windows clients.', 'Essential skill for endpoint and identity management roles.', 'Validates understanding of core Microsoft infrastructure.']
  },
  { id: 'ws2016-gpo', name: 'Windows Server 2016: AD Group Policy', issuer: 'Skillsoft', date: 'Issued Jun 2022', credentialUrl: 'https://skillsoft.digitalbadges.skillsoft.com/b09f7ed2-7758-43bd-8a54-314fb83d3a71#acc.rO5b6gDM', shortName: 'WS2016-GPO', badgeImageUrl: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/badge/49004747',
    descriptionKey: 'cert_desc_ws2016_gpo',
    skillsGained: ['Active Directory', 'Group Policy (GPO)', 'Centralized Management', 'Windows Server 2016', 'Security Configuration'],
    benefits: ['Demonstrates expertise in managing Windows infrastructure via GPOs.', 'Validates skills for system administrator and identity management roles.', 'Prepares for 70-742 certification exam topics.']
  },
  { id: 'cissp-cns', name: 'CISSP 2021: Communication & Network Security', issuer: '(ISC)²', date: 'Issued Mar 2022', credentialUrl: 'https://skillsoft.digitalbadges.skillsoft.com/cc7ec790-265d-4455-9676-4ba492975a97#acc.aQMhnYBe', shortName: 'CISSP', badgeImageUrl: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/badge/46246262',
    descriptionKey: 'cert_desc_cissp_cns',
    skillsGained: ['Network Architecture', 'TCP/IP Security', 'Cryptography', 'Secure Protocols', 'Wireless Security', 'Firewall Management'],
    benefits: ['Validates deep technical knowledge in network security.', 'Covers a key domain of the CISSP CBK.', 'Demonstrates ability to design and protect networks.']
  },
  { id: 'cy-analyst', name: 'CompTIA CySA+: Threat Monitoring', issuer: 'Skillsoft', date: 'Issued Feb 2022', credentialUrl: 'https://skillsoft.digitalbadges.skillsoft.com/f03eecbb-42d5-439f-8563-984cd933fbe3#acc.j58neDcW', shortName: 'CySA+', badgeImageUrl: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/badge/46396500',
    descriptionKey: 'cert_desc_cy_analyst',
    skillsGained: ['Threat Detection', 'Vulnerability Management', 'Behavioral Analytics', 'Incident Response', 'Log Analysis', 'SOC Procedures'],
    benefits: ['Applies behavioral analytics to improve threat visibility.', 'Validates skills for intermediate-level SOC analysts.', 'Focuses on proactive threat hunting and defense.']
  },
  { id: 'cloud-plus', name: 'CompTIA Cloud+: Cloud Security Controls', issuer: 'Skillsoft', date: 'Issued Feb 2022', credentialUrl: 'https://skillsoft.digitalbadges.skillsoft.com/9e24b963-2f8b-4900-bf1f-40883eec3e45#acc.Z0IVYFWK', shortName: 'Cld+', badgeImageUrl: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/badge/46118060',
    descriptionKey: 'cert_desc_cloud_plus',
    skillsGained: ['Cloud Deployment', 'Security Controls', 'Cloud Architecture', 'Disaster Recovery', 'Automation', 'Troubleshooting'],
    benefits: ['Vendor-neutral, covering multiple cloud platforms.', 'Proves hands-on expertise in cloud infrastructure.', 'Ensures ability to secure and maintain cloud environments.']
  }
];

const fr_experience = JSON.parse(JSON.stringify(en_experience));
fr_experience[0].company = "General Motors";
fr_experience[0].role = "Ingénieur en Sécurité des Terminaux et Contrôle d'Accès Réseau";
fr_experience[0].location = "Dublin, Irlande";
fr_experience[0].description = [
    'A dirigé la modernisation de la sécurité du réseau mondial pour un leader de l\'industrie automobile figurant au Fortune 500. Ma mission principale consistait à concevoir et à déployer des cadres Cisco ISE et 802.1X à l\'échelle de l\'entreprise pour appliquer un modèle de sécurité Zero Trust.',
    'Automatisation des flux de travail et renouvellements de certificats avec Python/PowerShell, réduisant le travail manuel de 90%.',
    'Déploiement standardisé de Cisco ISE 802.1X à l\'échelle de l\'entreprise.',
    'Développement d\'un cadre proactif de surveillance et d\'alerte pour les serveurs.',
    'Déploiement du Wi-Fi invité Next-Gen (Prisma) avec des modèles centralisés.',
    'Amélioration de l\'automatisation des réponses de niveau 3 et direction de l\'équipe d\'astreinte 24/7.',
    'Exécution et documentation de plus de 200 modifications de sécurité ServiceNow.',
    'Présentation des feuilles de route de cybersécurité et de migration vers le cloud à la direction.'
];
fr_experience[0].legacy = ["Auteur du script d'automatisation PowerShell définitif pour la synchronisation AD-ISE."];
fr_experience[0].anecdote.story = "Lors d'une panne mondiale, j'ai dirigé la réponse aux incidents, identifié un bogue de réplication rare et déployé un script PowerShell pour forcer la resynchronisation, restaurant les services AAA en moins d'une heure et évitant des millions de pertes.";

fr_experience[1].role = "Éducateur STEM | Sensibilisation Cybersécurité & IA";
fr_experience[1].location = "Dublin, Irlande";
fr_experience[1].description = ["Bénévolat pour animer le programme JAI TecKno..."];

fr_experience[2].role = "Mentor Bénévole - Défi d'Innovation Durable";

fr_experience[3].role = "Aide-infirmier";
fr_experience[3].location = "Dublin, Irlande";
fr_experience[3].description = ["Soins de première ligne..."];

fr_experience[4].role = "Assistant de soins de santé";

fr_experience[5].role = "Assistant de soins de santé";

const fr_projects = [
  {
    "id": "project-home-soc-lab",
    "title": "Home SOC Lab – Ingénierie de Détection Avancée",
    "description": "Un environnement SOC complet et isolé sur VMware pour démontrer l'analyse des journaux, la recherche de menaces et l'ingénierie de détection.",
    "longDescription": "Ce projet est un environnement complet et isolé de Centre d'Opérations de Sécurité (SOC) bâti sur VMware. Il met en évidence les capacités directes de la « Blue Team » (Équipe Bleue) en simulant des comportements d'attaquants et en les détectant grâce à une stack d'outils puissants comprenant Wazuh SIEM, Sysmon EDR, Zeek NSM et Suricata IDS/IPS. Il propose des scénarios d'attaques réels cartographiés selon les méthodologies MITRE ATT&CK, des règles de corrélation personnalisées et des flux complets de recherche de menaces à l'aide de la télémétrie asynchrone réseaux et des points finaux.",
    "tags": [
      "Wazuh SIEM",
      "Zeek NSM",
      "Suricata IDS/IPS",
      "Sysmon EDR",
      "Équipe Bleue",
      "Recherche de Menaces",
      "Ingénierie de Détection"
    ],
    "githubUrl": "https://github.com/angesh021/home-soc-lab",
    "videoPreviewUrl": "https://cdn.coverr.co/videos/coverr-a-stream-of-data-2216/1080p.mp4",
    "status": "Completed",
    "keyFeatures": [
      "Détection et réponse des points finaux (EDR) avec Sysmon",
      "Gestion des informations et des événements de sécurité (SIEM) avec Wazuh",
      "Détection d'intrusion réseau (IDS/IPS) avec Suricata",
      "Surveillance comportementale du réseau intégrée à Zeek",
      "Règles de corrélation personnalisées et cartographie MITRE ATT&CK",
      "Chaînes d'attaque documentées et flux de recherche de menaces"
    ],
    "architectureUrl": "/assets/projects/project-home-soc-lab/SOCLab-Architecture.png",
    "galleryUrls": [
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-Hero.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-ThreatHunting.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-DetectionFlow.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-DetectionEngineering.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-BlueTeam.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-AttackScenario.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-Architecture.png"
    ]
  },
  {
    "id": "project-aura-ttt",
    "title": "Aura Tic-Tac-Toe – Application Web Multijoueur Complète",
    "description": "Une application web Tic-Tac-Toe moderne et riche en fonctionnalités, dotée d'une interface en glassmorphisme, d'animations fluides et de plusieurs modes de jeu.",
    "longDescription": "Aura Tic-Tac-Toe est une application web multijoueur complète et hautement perfectionnée, conçue avec une superbe interface en glassmorphisme, des animations fluides et une suite complète de modes de jeu. Le projet présente une architecture sécurisée et faisant autorité côté serveur, comprenant un frontend React et un backend Node.js/Socket.IO. Il prend en charge des mécanismes de jeu complexes tels que le Pass & Play local, le Solo contre l'IA (avec différents niveaux de difficulté), le PvP en temps réel avec un système de salon (Lobby) personnalisé, des systèmes de progression incluant une boutique de cosmétiques, des classements ELO, ainsi qu'une authentification JWT robuste et des fonctionnalités de sécurité renforcées.",
    "tags": [
      "React",
      "Node.js",
      "Express",
      "Socket.IO",
      "PostgreSQL",
      "Framer Motion",
      "TypeScript"
    ],
    "githubUrl": "https://github.com/angesh021/aura-tic-tac-toe",
    "videoPreviewUrl": "https://cdn.coverr.co/videos/coverr-a-stream-of-data-2216/1080p.mp4",
    "status": "Completed",
    "keyFeatures": [
      "Interface fluide en glassmorphisme avec des animations réactives",
      "Plusieurs modes de jeu : Solo contre l'IA, Pass & Play local, PvP en temps réel et Mode Campagne",
      "Bonus stratégiques en jeu : Annuler, Détruire, Fortifier et Double Frappe",
      "Progression & Économie : Gagnez des Aura Coins, accomplissez des quêtes quotidiennes et débloquez des cosmétiques dans la boutique",
      "Hub Social : Liste d'amis avec statut en ligne, messagerie directe et classements ELO mondiaux",
      "Gameplay faisant autorité sur le serveur pour empêcher la triche côté client"
    ],
    "architectureUrl": "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20Architecture.png",
    "galleryUrls": [
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20Hero.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20GameplayFeatures.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20TheProblem.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20TheSolution.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20Workflow.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20DesignEvolution.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20DatabaseDesign.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20Prototypes.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/TicTacToe/Tic-Tac-Toe%20-%20Architecture.png"
    ]
  },
  {
    "id": "project-admin-dashboard",
    "title": "Plateforme Tableau de Bord Administrateur",
    "description": "Un tableau de bord administrateur complet axé sur l'analyse de programmation, la sécurité, l'analyse des journaux et la visualisation de données.",
    "longDescription": "Développement d'un tableau de bord d'administration avancé conçu pour une surveillance complète du système, combinant des outils de programmation, une vue d'ensemble de la sécurité et des capacités d'analyse approfondie des journaux (log analysis). La plateforme offre une riche visualisation de données pour le suivi du trafic en temps réel, la détection des menaces et les métriques liées aux journaux. Elle intègre un contrôle d'accès sécurisé basé sur les rôles, des systèmes d'alerte en temps réel et une agrégation fluide des journaux pour fournir rapidement aux administrateurs des informations exploitables.",
    "tags": [
      "Programmation",
      "Sécurité",
      "Analyse de logs",
      "Visualisation de données",
      "React",
      "Tableaux de bord"
    ],
    "githubUrl": "https://github.com/angesh021/admin-dashboard",
    "videoPreviewUrl": "https://cdn.coverr.co/videos/coverr-a-stream-of-data-2216/1080p.mp4",
    "status": "In Progress",
    "keyFeatures": [
      "Surveillance de la sécurité et alertes en temps réel",
      "Analyse et traitement avancés des fichiers journaux",
      "Visualisation de données interactive (Graphiques/Diagrammes)",
      "Contrôle d'accès basé sur les rôles (RBAC)",
      "Indicateurs de santé et de performance du système"
    ],
    "architectureUrl": "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20Architecture.png",
    "galleryUrls": [
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20Hero.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20SaaS%20security%20dashboard%20overview.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20PerformanceAnalystics.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20Lifecycle.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20IdentityManagement.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20AuditTrail.png",
      "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/AdminDashboard/AdminDashboard%20-%20Architecture.png"
    ]
  },
  {
    "id": "project-enterprise-nac",
    "title": "Laboratoire NAC d'Entreprise (Cisco ISE + AD)",
    "description": "Un laboratoire de bout en bout simulant le contrôle d'accès réseau d'entreprise avec Cisco ISE, Active Directory et 802.1X.",
    "longDescription": "Conception et déploiement d’un environnement complet de contrôle d’accès réseau (NAC) d'entreprise sur la plateforme virtuelle EVE-NG exécutée sous VMware Workstation. L'architecture intègre Cisco Identity Services Engine (ISE) avec Microsoft Active Directory pour simuler une authentification réseau hautement sécurisée. Le projet réplique fidèlement un écosystème d'authentification d'entreprise, permettant aux équipements filaires et sans fil de s'authentifier à l'aide de protocoles tels que 802.1X, RADIUS et de stratégies utilisateur Active Directory. Cet environnement a été conçu pour tester les flux de travail d'inscription des terminaux, le profilage des machines et l'application des contrôles d'accès basés sur les rôles.",
    "tags": [
      "Cisco ISE",
      "Active Directory",
      "802.1X",
      "EVE-NG",
      "VMware",
      "RADIUS",
      "PKI",
      "Sécurité Réseau",
      "Zero Trust"
    ],
    "githubUrl": "https://github.com/angesh021/enterprise-nac-lab",
    "videoPreviewUrl": "https://cdn.coverr.co/videos/coverr-a-stream-of-data-2216/1080p.mp4",
    "status": "Completed",
    "keyFeatures": [
      "Authentification 802.1X pour les machines jointes au domaine (PEAP/EAP-TLS)",
      "Contournement d'authentification MAC (MAB) pour les objets connectés et IoT non gérés",
      "Intégration d'Active Directory pour centraliser la gestion des identités et des stratégies",
      "Jeux de règles de politique Cisco ISE pour l'autorisation basée sur les groupes AD",
      "Attribution dynamique de VLAN et application d'ACL basées sur les rôles utilisateur",
      "Suivi des journaux d'activité en direct RADIUS pour l'audit et le dépannage"
    ],
    "architectureUrl": "https://i.imgur.com/8zT7X6h.png"
  },
  {
    "id": "project-hse-vax",
    "title": "Sécurisation & Durcissement - Application HSE Vaccination",
    "description": "Examen complet de la sécurité (SAST/DAST) et correction d'une application nationale de santé selon le Top 10 OWASP.",
    "longDescription": "Direction d'une refonte complète de la sécurité d'un système critique de gestion des vaccinations nationales d'Irlande (HSE). Le projet comprenait des tests de sécurité applicative statiques (SAST) et dynamiques (DAST). Les réalisations clés incluent la correction de plus de 12 failles critiques telles que l'injection SQL et la falsification de requêtes intersites (CSRF), la configuration d'une authentification multifacteur (MFA) robuste, l'application d'un hachage de mot de passe renforcé avec BCrypt, et la migration complète vers HTTPS. Ces initiatives ont réduit le risque d'exploitation de plus de 90 %.",
    "tags": [
      "OWASP Top 10",
      "SAST",
      "DAST",
      "BCrypt",
      "Audit de Sécurité",
      "Tests d'Intrusion",
      "MFA"
    ],
    "githubUrl": "https://github.com/angesh021/HSE-VAX-APP",
    "videoPreviewUrl": "https://cdn.coverr.co/videos/coverr-a-futuristic-background-with-binary-numbers-4182/1080p.mp4",
    "status": "Completed",
    "keyFeatures": [
      "Authentification sécurisée des utilisateurs avec double facteur (MFA)",
      "Contrôle d'accès basé sur les rôles de sécurité (RBAC)",
      "Validation stricte des options d'entrée et encodage des sorties contre les failles XSS",
      "Données en transit entièrement chiffrées (HTTPS)",
      "Hachage hautement sécurisé des mots de passe à l'aide de l'algorithme BCrypt"
    ],
    "architectureUrl": "https://i.imgur.com/3fS5J7m.png"
  },
  {
    "id": "project-network-lab",
    "title": "Conception de Réseau d'Entreprise Lab",
    "description": "Une topologie réseau d'entreprise sécurisée et évolutive intégrant routage d'infrastructure, VLAN et politiques de pare-feu.",
    "longDescription": "Conception et déploiement d’une topologie réseau d’entreprise multicouche complexe au sein de Cisco Packet Tracer. Le laboratoire simule une infrastructure d'entreprise réelle avec des protocoles de routage dynamique tels qu'OSPF, une segmentation robuste en VLAN pour isoler le trafic, et des listes de contrôle d'accès granulaires (ACL) pour sécuriser les flux de données. L'architecture intègre également l'adressage IPv6, un contrôleur sans fil centralisé pour gérer les points d'accès et des politiques de pare-feu dynamique pour contrôler l'entrée et la sortie du trafic.",
    "tags": [
      "Cisco",
      "Architecture Réseau",
      "VLAN",
      "OSPF",
      "ACLs",
      "Stratégies Pare-feu",
      "IPv6"
    ],
    "githubUrl": "https://github.com/angesh021/ccna-enterprise-lab",
    "videoPreviewUrl": "https://cdn.coverr.co/videos/coverr-a-stream-of-data-2216/1080p.mp4",
    "status": "Completed",
    "keyFeatures": [
      "Protocole de routage dynamique OSPF multi-zones",
      "Segmentation VLAN et routage inter-VLAN",
      "Pare-feu dynamique avec règles de filtrage (ACL) strictes",
      "Contrôleur de réseau local sans fil centralisé (WLC)",
      "Mise en œuvre du double empilement IPv4 et IPv6"
    ],
    "architectureUrl": "https://i.imgur.com/8zT7X6h.png"
  }
];

const fr_education = JSON.parse(JSON.stringify(en_education));
fr_education[0].degree = "Master of Science (M.Sc.) en Cybersécurité";
fr_education[1].degree = "Bachelor of Science (B.Sc.) en Informatique";
fr_education[2].degree = "Diplôme en Développement Logiciel (FETAC L6)";

const en_skills = {
  "categories": {
      "Defense & Response": {
        color: "#64ffda",
        skills: [
          { name: 'Cisco ISE', icon: 'IconNetwork', description: 'Architecting Zero Trust network access and 802.1X for large-scale enterprise environments.' },
          { name: 'EDR/DLP', icon: 'IconShield', description: 'Deploying and managing advanced endpoint detection, response, and data loss prevention controls.' },
          { name: 'Incident Response', icon: 'IconTerminal', description: 'Providing Tier-3 analysis and remediation for endpoint security and network access incidents.' },
          { name: 'Vulnerability Assessment', icon: 'IconSearch', description: 'Identifying and prioritizing system vulnerabilities using industry-standard tools and frameworks.' }
        ]
      },
      "Automation & Scripting": {
        color: "#ffc300",
        skills: [
          { name: 'PowerShell', icon: 'IconCode', description: 'Automating Windows Server tasks, security configurations, and certificate management workflows.' },
          { name: 'Python', icon: 'IconCode', description: 'Developing custom scripts for security monitoring, data parsing, and automating repetitive tasks.' },
          { name: 'Bash', icon: 'IconTerminal', description: 'Scripting in Linux environments for system administration and security operations.' }
        ]
      },
      "Security Operations": {
        color: "#00aeff",
        skills: [
          { name: 'SIEM/Splunk', icon: 'IconSearch', description: 'Utilizing SIEM platforms for proactive threat hunting, log analysis, and incident correlation.' },
          { name: 'Wireshark', icon: 'IconNetwork', description: 'Performing deep packet analysis to diagnose network issues and identify malicious traffic patterns.' },
          { name: 'Metasploit', icon: 'IconTerminal', description: 'Leveraging penetration testing tools to validate security controls and assess exploitability.' },
          { name: 'Burp Suite', icon: 'IconTerminal', description: 'Conducting web application security testing to uncover and mitigate OWASP Top 10 vulnerabilities.' }
        ]
      },
      "Infrastructure & Cloud": {
        color: "#da70d6",
        skills: [
          { name: 'Cloud Security', icon: 'IconCloud', description: 'Implementing security best practices and controls in AWS and Azure environments.' },
          { name: 'Active Directory', icon: 'IconServer', description: 'Managing and securing user identities, group policies, and domain infrastructure.' },
          { name: 'Linux/Windows', icon: 'IconServer', description: 'Administering and hardening both Linux and Windows Server operating systems.' },
          { name: 'Network Security', icon: 'IconNetwork', description: 'Designing and implementing secure network architectures with firewalls, VLANs, and ACLs.' }
        ]
      }
  }
};

const fr_skills = JSON.parse(JSON.stringify(en_skills)); // Basic translation copy

const fileWrites = [
  { path: path.join(contentEnDir, 'experience.json'), data: en_experience },
  { path: path.join(contentFrDir, 'experience.json'), data: fr_experience },
  { path: path.join(contentEnDir, 'projects.json'), data: en_projects },
  { path: path.join(contentFrDir, 'projects.json'), data: fr_projects },
  { path: path.join(contentEnDir, 'education.json'), data: en_education },
  { path: path.join(contentFrDir, 'education.json'), data: fr_education },
  { path: path.join(contentEnDir, 'certifications.json'), data: en_certifications },
  { path: path.join(contentFrDir, 'certifications.json'), data: en_certifications },
  { path: path.join(contentEnDir, 'skills.json'), data: en_skills },
  { path: path.join(contentFrDir, 'skills.json'), data: fr_skills },
];

for(const file of fileWrites) {
    fs.writeFileSync(file.path, JSON.stringify(file.data, null, 2));
}

console.log('JSON Data written');
