// PCI DSS v4.0.1 Gap Assessment Data
export interface PCIDSSAssessment {
  id: number;
  requirement: string;
  subRequirement?: string;
  description: string;
  isHeader?: boolean; // Indicates if this is a section header (main requirement title)
  status: 'completed' | 'in-progress' | 'not-applied';
  owner?: string;
  task?: string;
  completionDate?: string;
  comments?: string;
}

export const pciDssRequirements: PCIDSSAssessment[] = [
  // Requirement 1: Install and Maintain Network Security Controls
  {
    id: 1,
    requirement: "1",
    subRequirement: "",
    description: "Install and Maintain Network Security Controls",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 2,
    requirement: "1.1",
    subRequirement: "",
    description: "Processes and mechanisms for installing and maintaining network security controls are defined and understood.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 3,
    requirement: "1.1.1",
    subRequirement: "",
    description: "All security policies and operational procedures that are identified in Requirement 1 are: Documented, Kept up to date, In use, Known to all affected parties.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 4,
    requirement: "1.1.2",
    subRequirement: "",
    description: "Roles and responsibilities for performing activities in Requirement 1 are documented, assigned, and understood.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 5,
    requirement: "1.2",
    subRequirement: "",
    description: "Network security controls (NSCs) are configured and maintained.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 6,
    requirement: "1.2.1",
    subRequirement: "",
    description: "Configuration standards for NSC rulesets are: Defined, Implemented, Maintained.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 7,
    requirement: "1.2.2",
    subRequirement: "",
    description: "All changes to network connections and to configurations of NSCs are approved and managed in accordance with the change control process defined at Requirement 6.5.1.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 8,
    requirement: "1.2.3",
    subRequirement: "",
    description: "An accurate network diagram(s) is maintained that shows all connections between the CDE and other networks, including any wireless networks.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 9,
    requirement: "1.2.4",
    subRequirement: "",
    description: "An accurate data-flow diagram(s) is maintained that shows all account data flows across systems and networks, and is updated as needed upon changes to the environment.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 10,
    requirement: "1.2.5",
    subRequirement: "",
    description: "All services, protocols and ports allowed are identified, approved, and have a defined business need.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 11,
    requirement: "1.2.6",
    subRequirement: "",
    description: "Security features are defined and implemented for all services, protocols, and ports that are in use and considered to be insecure, such that the risk is mitigated.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 12,
    requirement: "1.2.7",
    subRequirement: "",
    description: "Configurations of NSCs are reviewed at least once every six months to confirm they are relevant and effective.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 13,
    requirement: "1.2.8",
    subRequirement: "",
    description: "Configuration files for NSCs are: Secured from unauthorized access, Kept consistent with active network configurations.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 14,
    requirement: "1.3",
    subRequirement: "",
    description: "Network access to and from the cardholder data environment is restricted.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 15,
    requirement: "1.3.1",
    subRequirement: "",
    description: "Inbound traffic to the CDE is restricted to only traffic that is necessary, with all other traffic specifically denied.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 16,
    requirement: "1.3.2",
    subRequirement: "",
    description: "Outbound traffic from the CDE is restricted to only traffic that is necessary, with all other traffic specifically denied.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 17,
    requirement: "1.3.3",
    subRequirement: "",
    description: "NSCs are installed between all wireless networks and the CDE, regardless of whether the wireless network is a CDE, such that all wireless traffic from wireless networks into the CDE is denied by default, and only wireless traffic with an authorized business purpose is allowed into the CDE.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 18,
    requirement: "1.4",
    subRequirement: "",
    description: "Network connections between trusted and untrusted networks are controlled.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 19,
    requirement: "1.4.1",
    subRequirement: "",
    description: "NSCs are implemented between trusted and untrusted networks.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 20,
    requirement: "1.4.2",
    subRequirement: "",
    description: "Inbound traffic from untrusted networks to trusted networks is restricted to communications with system components that are authorized to provide publicly accessible services, protocols, and ports, and stateful responses to communications initiated by system components in a trusted network, with all other traffic denied.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 21,
    requirement: "1.4.3",
    subRequirement: "",
    description: "Anti-spoofing measures are implemented to detect and block forged source IP addresses from entering the trusted network.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 22,
    requirement: "1.4.4",
    subRequirement: "",
    description: "System components that store cardholder data are not directly accessible from untrusted networks.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 23,
    requirement: "1.4.5",
    subRequirement: "",
    description: "The disclosure of internal IP addresses and routing information is limited to only authorized parties.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 24,
    requirement: "1.5",
    subRequirement: "",
    description: "Risks to the CDE from computing devices that are able to connect to both untrusted networks and the CDE are mitigated.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 25,
    requirement: "1.5.1",
    subRequirement: "",
    description: "Security controls are implemented on any computing devices, including company- and employee-owned devices, that connect to both untrusted networks (including the Internet) and the CDE with specific configuration settings defined to prevent threats being introduced into the entity's network, security controls actively running, and security controls not alterable by users unless specifically documented and authorized by management on a case-by-case basis for a limited period.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  // Requirement 2: Apply Secure Configurations to All System Components
  {
    id: 26,
    requirement: "2",
    subRequirement: "",
    description: "Apply Secure Configurations to All System Components",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 27,
    requirement: "2.1",
    subRequirement: "",
    description: "Processes and mechanisms for applying secure configurations to all system components are defined and understood.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 28,
    requirement: "2.1.1",
    subRequirement: "",
    description: "All security policies and operational procedures that are identified in Requirement 2 are: Documented, Kept up to date, In use, Known to all affected parties.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 29,
    requirement: "2.1.2",
    subRequirement: "",
    description: "Roles and responsibilities for performing activities in Requirement 2 are documented, assigned, and understood.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 30,
    requirement: "2.2",
    subRequirement: "",
    description: "System components are configured and managed securely.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 31,
    requirement: "2.2.1",
    subRequirement: "",
    description: "Configuration standards are developed, implemented, and maintained to: Cover all system components, Address all known security vulnerabilities, Be consistent with industry-accepted system hardening standards or vendor hardening recommendations, Be updated as new vulnerability issues are identified, Be applied when new systems are configured and verified as in place before or immediately after a system component is connected to a production environment.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 32,
    requirement: "2.2.2",
    subRequirement: "",
    description: "Vendor default accounts are managed as follows: If the vendor default account(s) will be used, the default password is changed per Requirement 8.3.6. If the vendor default account(s) will not be used, the account is removed or disabled. This applies to ALL vendor default accounts and passwords, including operating systems, security services, applications, POS terminals, payment applications, and SNMP defaults.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 33,
    requirement: "2.2.3",
    subRequirement: "",
    description: "Primary functions requiring different security levels are managed as follows: Only one primary function exists on a system component, OR Primary functions with differing security levels are isolated from each other, OR Primary functions with differing security levels are all secured to the level required by the function with the highest security need.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 34,
    requirement: "2.2.4",
    subRequirement: "",
    description: "Only necessary services, protocols, daemons, and functions are enabled, and all unnecessary functionality is removed or disabled.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 35,
    requirement: "2.2.5",
    subRequirement: "",
    description: "If any insecure services, protocols, or daemons are present: Business justification is documented, Additional security features are documented and implemented that reduce the risk of using insecure services, protocols, or daemons.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 36,
    requirement: "2.2.6",
    subRequirement: "",
    description: "System security parameters are configured to prevent misuse.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 37,
    requirement: "2.2.7",
    subRequirement: "",
    description: "All non-console administrative access is encrypted using strong cryptography. This includes administrative access via browser-based interfaces and application programming interfaces (APIs).",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 38,
    requirement: "2.3",
    subRequirement: "",
    description: "Wireless environments are configured and managed securely.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 39,
    requirement: "2.3.1",
    subRequirement: "",
    description: "For wireless environments connected to the CDE or transmitting account data, all wireless vendor defaults are changed at installation or are confirmed to be secure, including default wireless encryption keys, passwords on wireless access points, SNMP defaults, and any other security-related wireless vendor defaults.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 40,
    requirement: "2.3.2",
    subRequirement: "",
    description: "For wireless environments connected to the CDE or transmitting account data, wireless encryption keys are changed whenever personnel with knowledge of the key leave the company or the role, or whenever a key is suspected of or known to be compromised.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  // Requirement 3: Protect Stored Account Data
  {
    id: 41,
    requirement: "3",
    subRequirement: "",
    description: "Protect Stored Account Data",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 51,
    requirement: "3.1",
    subRequirement: "",
    description: "Processes and mechanisms for protecting stored account data are defined and understood.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 52,
    requirement: "3.1.1",
    subRequirement: "",
    description: "All security policies and operational procedures that are identified in Requirement 3 are: Documented, Kept up to date, In use, Known to all affected parties.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 53,
    requirement: "3.1.2",
    subRequirement: "",
    description: "Roles and responsibilities for performing activities in Requirement 3 are documented, assigned, and understood.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 54,
    requirement: "3.2",
    subRequirement: "",
    description: "Account data storage is kept to a minimum through implementation of data retention and disposal policies, procedures, and processes.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 55,
    requirement: "3.2.1",
    subRequirement: "",
    description: "Account data storage amount and retention time are limited to that which is required for legal or regulatory, and/or business requirements.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 56,
    requirement: "3.3",
    subRequirement: "",
    description: "Sensitive authentication data is not stored after authorization.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 57,
    requirement: "3.3.1",
    subRequirement: "",
    description: "Sensitive authentication data is not retained after authorization, even if encrypted. This includes the full contents of any track, the card verification code or value, and the PIN or PIN block.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 58,
    requirement: "3.3.2",
    subRequirement: "",
    description: "Sensitive authentication data found to be stored is securely deleted or rendered unrecoverable.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 59,
    requirement: "3.4",
    subRequirement: "",
    description: "Access to displays of full PAN and ability to copy cardholder data are restricted.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 60,
    requirement: "3.4.1",
    subRequirement: "",
    description: "PAN is masked when displayed, and only personnel with a legitimate business need can see more than the first six and last four digits of the PAN.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 61,
    requirement: "3.4.2",
    subRequirement: "",
    description: "When using remote-access technologies, PAN is not displayed via remote access unless it is necessary for personnel with a legitimate business need, and effective controls are in place.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 62,
    requirement: "3.5",
    subRequirement: "",
    description: "Primary Account Number (PAN) is protected wherever it is stored.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 63,
    requirement: "3.5.1",
    subRequirement: "",
    description: "PAN is rendered unreadable anywhere it is stored by using strong cryptography, truncation, or hashing.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 64,
    requirement: "3.6",
    subRequirement: "",
    description: "Cryptographic keys used to protect stored account data are protected.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 65,
    requirement: "3.6.1",
    subRequirement: "",
    description: "Procedures are defined and implemented to protect cryptographic keys used to protect stored account data against disclosure and misuse.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 66,
    requirement: "3.7",
    subRequirement: "",
    description: "Where cryptography is used to protect stored account data, key management processes and procedures covering all aspects of the key lifecycle are defined and implemented.",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 67,
    requirement: "3.7.1",
    subRequirement: "",
    description: "Key-management policies and procedures are implemented to include generation of strong keys for the cryptographic architecture.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 68,
    requirement: "3.7.2",
    subRequirement: "",
    description: "Key-management policies and procedures are implemented to include secure key distribution.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 69,
    requirement: "3.7.3",
    subRequirement: "",
    description: "Key-management policies and procedures are implemented to include secure key storage.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 70,
    requirement: "3.7.4",
    subRequirement: "",
    description: "Key changes for cryptographic keys that have reached the end of their cryptoperiod are implemented.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 71,
    requirement: "3.7.5",
    subRequirement: "",
    description: "Retirement, replacement, or destruction of keys is implemented when the integrity of the key has been weakened or keys are suspected of being compromised.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 72,
    requirement: "3.7.6",
    subRequirement: "",
    description: "Where manual cleartext cryptographic key-management operations are used, these operations are managed using split knowledge and dual control.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 73,
    requirement: "3.7.7",
    subRequirement: "",
    description: "Prevention of unauthorized substitution of cryptographic keys.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 74,
    requirement: "3.7.8",
    subRequirement: "",
    description: "Requirement for cryptographic key custodians to formally acknowledge that they understand and accept their key-custodian responsibilities.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  {
    id: 75,
    requirement: "3.7.9",
    subRequirement: "",
    description: "Hardware security modules (HSMs) or other forms of host card emulation (HCE) used for key management are implemented according to industry-accepted standards.",
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  // Requirement 4: Protect Account Data with Strong Cryptography During Transmission Over Open, Public Networks
  {
    id: 76,
    requirement: "4",
    subRequirement: "",
    description: "Protect Account Data with Strong Cryptography During Transmission Over Open, Public Networks",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  // Requirement 5: Protect All Systems and Networks from Malicious Software
  {
    id: 77,
    requirement: "5",
    subRequirement: "",
    description: "Protect All Systems and Networks from Malicious Software",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  // Requirement 6: Develop and Maintain Secure Systems and Software
  {
    id: 78,
    requirement: "6",
    subRequirement: "",
    description: "Develop and Maintain Secure Systems and Software",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  // Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know
  {
    id: 79,
    requirement: "7",
    subRequirement: "",
    description: "Restrict Access to System Components and Cardholder Data by Business Need to Know",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  // Requirement 8: Identify Users and Authenticate Access to System Components
  {
    id: 80,
    requirement: "8",
    subRequirement: "",
    description: "Identify Users and Authenticate Access to System Components",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  // Requirement 9: Restrict Physical Access to Cardholder Data
  {
    id: 81,
    requirement: "9",
    subRequirement: "",
    description: "Restrict Physical Access to Cardholder Data",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  // Requirement 10: Log and Monitor All Access to System Components and Cardholder Data
  {
    id: 82,
    requirement: "10",
    subRequirement: "",
    description: "Log and Monitor All Access to System Components and Cardholder Data",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  // Requirement 11: Test Security of Systems and Networks Regularly
  {
    id: 83,
    requirement: "11",
    subRequirement: "",
    description: "Test Security of Systems and Networks Regularly",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  },
  // Requirement 12: Support Information Security with Organizational Policies and Programs
  {
    id: 84,
    requirement: "12",
    subRequirement: "",
    description: "Support Information Security with Organizational Policies and Programs",
    isHeader: true,
    status: "not-applied",
    owner: "",
    task: "",
    completionDate: "",
    comments: ""
  }
];

export const statusOptions = [
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'not-applied', label: 'Not Applied', color: 'bg-red-100 text-red-800' }
];

// Helper function to get requirement groups
export const getRequirementGroups = () => {
  const groups: { [key: string]: PCIDSSAssessment[] } = {};
  
  pciDssRequirements.forEach(req => {
    const mainReq = req.requirement.split('.')[0];
    const groupName = `Requirement ${mainReq}`;
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(req);
  });
  
  return groups;
};

// Helper function to calculate completion statistics
export const calculateCompletionStats = (assessments: PCIDSSAssessment[]) => {
  // Exclude headers from statistics
  const nonHeaderAssessments = assessments.filter(a => !a.isHeader);
  const total = nonHeaderAssessments.length;
  const completed = nonHeaderAssessments.filter(a => a.status === 'completed').length;
  const inProgress = nonHeaderAssessments.filter(a => a.status === 'in-progress').length;
  const notApplied = nonHeaderAssessments.filter(a => a.status === 'not-applied').length;
  
  return {
    total,
    completed,
    inProgress,
    notApplied,
    completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    progressPercentage: total > 0 ? Math.round(((completed + inProgress) / total) * 100) : 0
  };
};
