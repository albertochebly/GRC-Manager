export const threatVulnMap: Record<string, { threats: string[]; vulnerabilities: Record<string, string[]> }> = {
  "Application Systems": {
    threats: ["Application Systems", "Unauthorized Access", "Accidental Damage: Application Failure", "Accidental Damage: Hackers Attack", "Fraud", "Denial of service", "Misuse of the Resource", "Segregation of Duties", "Lack of Expertise / Training", "Competition", "Virus"],
    vulnerabilities: {
      "Application Systems": ["Application Systems"],
      "Unauthorized Access": ["Lack of Controls on the Logical Access Level"],
      "Accidental Damage: Application Failure": ["No Formal Change Management Procedure", "Change Management Procedure not followed", "Application Bug"],
      "Accidental Damage: Hackers Attack": ["Lack of Security Controls"],
      "Fraud": ["Weak Segregation of Duties"],
      "Denial of service": ["Application Bug", "Security Parameters not Set in-line with Best Practices"],
      "Misuse of the Resource": ["Lack of Security Controls", "Lack of Human Resources", "Lack of Expertise"],
      "Segregation of Duties": ["Lack of Human Resources", "Lack of Awareness"],
      "Lack of Expertise / Training": ["Budget", "Lack of Awareness", "Lack of Expertise in the market"],
      "Competition": ["Budget", "Lack of Human Resources in the market"],
      "Virus": ["No Formal Patch Management Procedure", "Patch Management Procedure not followed", "Lack of Awareness", "Lack of Security Controls", "Oudated Antivirus"]
    }
  },
  "Database Resources": {
    threats: ["Database Resources", "Unauthorized Access", "Buffer Overflow", "Accidental Damage: Database Failure", "Accidental Damage: Hackers Attack", "Fraud", "Denial of service", "Data Corruption", "Lack of Human Resources", "Lack of Expertise / Training", "Virus", "Segregation of Duties", "Misuse of the Resource"],
    vulnerabilities: {
      "Database Resources": ["Database Resources"],
      "Unauthorized Access": ["Lack of Controls on the Logical Access Level"],
      "Buffer Overflow": ["Security Parameters not Set in-line with Best Practices"],
      "Accidental Damage: Database Failure": ["No Formal Change Management Procedure", "Change Management Procedure not followed", "Application Bug"],
      "Accidental Damage: Hackers Attack": ["Lack of Security Controls"],
      "Fraud": ["Weak Segregation of Duties"],
      "Denial of service": ["Application Bug", "Security Parameters not Set in-line with Best Practices"],
      "Data Corruption": ["No Formal Change Management Procedure", "Change Management Procedure not followed", "No Formal Data Conversion Procedure", "Data Conversion Procedure not followed", "Virus / Trojan Horse / Worms Infection"],
      "Lack of Human Resources": ["Budget", "Lack of Awareness"],
      "Lack of Expertise / Training": ["Budget", "Lack of Awareness", "Lack of Expertise in the market"],
      "Virus": ["No Formal Patch Management Procedure", "Patch Management Procedure not followed", "Lack of Awareness", "Lack of Security Controls", "Outdated Antivirus"],
      "Segregation of Duties": ["Lack of Human Resources", "Lack of Awareness"],
      "Misuse of the Resource": ["Lack of Security Controls", "Lack of Human Resources", "Lack of Expertise"]
    }
  }
  // Add all other categories here in the same format
};
