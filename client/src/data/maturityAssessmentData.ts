// ISO 27001 Maturity Assessment Data
export const assessmentQuestions = [
  // Mandatory Clauses - Context of the organization
  {
    id: 1,
    category: "Mandatory Clauses",
    section: "4 - Context of the organization",
    standardRef: "Clause-4.1",
    question: "Has the organization identified relevant internal and external issues that has the potential to affect its ISMS achieving its intended outcomes?",
    currentMaturityLevel: "0",
    currentMaturityScore: 0,
    currentComments: "",
    targetMaturityLevel: "3",
    targetMaturityScore: 3,
    targetComments: ""
  },
  {
    id: 2,
    category: "Mandatory Clauses",
    section: "4 - Context of the organization",
    standardRef: "Clause-4.2",
    question: "Has the organization identified the interested parties relevant to the ISMS, their applicable requirements, and determined which of those requirements will be addressed by the system?",
    currentMaturityLevel: "2",
    currentMaturityScore: 2,
    currentComments: "",
    targetMaturityLevel: "3",
    targetMaturityScore: 3,
    targetComments: ""
  },
  {
    id: 3,
    category: "Mandatory Clauses",
    section: "4 - Context of the organization",
    standardRef: "Clause-4.3",
    question: "Has the organization defined the scope and applicability of its information security management system, taking into account internal and external issues, relevant requirements of interested parties, and interfaces or dependencies with external organizations and documented this scope?",
    currentMaturityLevel: "1",
    currentMaturityScore: 1,
    currentComments: "",
    targetMaturityLevel: "3",
    targetMaturityScore: 3,
    targetComments: ""
  },
  {
    id: 4,
    category: "Mandatory Clauses",
    section: "4 - Context of the organization",
    standardRef: "Clause-4.4",
    question: "Has the organization established, implemented, maintained, and continually improved an information security management system—along with the necessary processes and their interactions—in accordance with the applicable requirements?",
    currentMaturityLevel: "1",
    currentMaturityScore: 1,
    currentComments: "",
    targetMaturityLevel: "3",
    targetMaturityScore: 3,
    targetComments: ""
  },

  // Mandatory Clauses - Leadership
  {
    id: 5,
    category: "Mandatory Clauses",
    section: "5 - Leadership",
    standardRef: "Clause-5.1",
    question: "Has top management demonstrated leadership and commitment to the information security management system by ensuring alignment with strategic direction, integrating ISMS requirements into business processes, allocating necessary resources, promoting awareness and continual improvement, and supporting roles and responsibilities throughout the organization?",
    currentMaturityLevel: "3",
    currentMaturityScore: 3,
    currentComments: "",
    targetMaturityLevel: "4",
    targetMaturityScore: 4,
    targetComments: ""
  },
  {
    id: 6,
    category: "Mandatory Clauses",
    section: "5 - Leadership",
    standardRef: "Clause-5.2",
    question: "Has top management established an information security policy that is appropriate to the organization's purpose, supports the setting of information security objectives, includes commitments to applicable requirements and continual improvement—and is documented, communicated internally, and made available to relevant interested parties?",
    currentMaturityLevel: "3",
    currentMaturityScore: 3,
    currentComments: "",
    targetMaturityLevel: "4",
    targetMaturityScore: 4,
    targetComments: ""
  },
  {
    id: 7,
    category: "Mandatory Clauses",
    section: "5 - Leadership",
    standardRef: "Clause-5.3",
    question: "Has top management assigned and communicated responsibilities and authorities for roles relevant to information security, including ensuring ISMS conformance and reporting its performance?",
    currentMaturityLevel: "3",
    currentMaturityScore: 3,
    currentComments: "",
    targetMaturityLevel: "4",
    targetMaturityScore: 4,
    targetComments: ""
  },

  // Sample Annex A Controls - Organizational controls
  {
    id: 101,
    category: "Annex A Controls",
    section: "A.5 - Organizational controls",
    standardRef: "Control-5.1",
    question: "Are the information security policy and topic-specific policies defined, approved by management, published, communicated to and acknowledged by relevant personnel and interested parties, and reviewed at planned intervals or when significant changes occur?",
    currentMaturityLevel: "3",
    currentMaturityScore: 3,
    currentComments: "",
    targetMaturityLevel: "4",
    targetMaturityScore: 4,
    targetComments: ""
  },
  {
    id: 102,
    category: "Annex A Controls",
    section: "A.5 - Organizational controls",
    standardRef: "Control-5.12",
    question: "Has the organization classified information in accordance with its security needs, considering confidentiality, integrity, availability, and relevant interested party requirements?",
    currentMaturityLevel: "1",
    currentMaturityScore: 1,
    currentComments: "",
    targetMaturityLevel: "4",
    targetMaturityScore: 4,
    targetComments: ""
  },

  // Sample Technological controls
  {
    id: 201,
    category: "Annex A Controls",
    section: "A.8 - Technological controls",
    standardRef: "Control-8.1",
    question: "Has the organization implemented measures to protect information stored on, processed by, or accessible via user endpoint devices?",
    currentMaturityLevel: "3",
    currentMaturityScore: 3,
    currentComments: "",
    targetMaturityLevel: "3",
    targetMaturityScore: 3,
    targetComments: ""
  },
  {
    id: 202,
    category: "Annex A Controls",
    section: "A.8 - Technological controls",
    standardRef: "Control-8.3",
    question: "Has the organization implemented access restrictions to information and associated assets in accordance with its established access control policy?",
    currentMaturityLevel: "NA",
    currentMaturityScore: 0,
    currentComments: "",
    targetMaturityLevel: "NA",
    targetMaturityScore: 0,
    targetComments: ""
  },
  {
    id: 203,
    category: "Annex A Controls",
    section: "A.8 - Technological controls",
    standardRef: "Control-8.4",
    question: "Has the organization implemented appropriate controls to manage read and write access to source code, development tools, and software libraries?",
    currentMaturityLevel: "4",
    currentMaturityScore: 4,
    currentComments: "",
    targetMaturityLevel: "4",
    targetMaturityScore: 4,
    targetComments: ""
  }
];

export const maturityLevels = [
  { value: "0", label: "0 - No", score: 0, description: "Organization does not perform the security practice.", color: "bg-red-100 text-red-800" },
  { value: "1", label: "1 – Yes, but ad hoc", score: 1, description: "Policies, procedures, and strategies are not formalized; activities are performed in an ad-hoc, reactive manner.", color: "bg-orange-100 text-orange-800" },
  { value: "2", label: "2 – Yes, documented but inconsistent", score: 2, description: "Policies, procedures, and strategies are formalized and documented but not consistently implemented.", color: "bg-yellow-100 text-yellow-800" },
  { value: "3", label: "3 – Yes, Consistent but no metrics", score: 3, description: "Policies, procedures, and strategies are consistently implemented, but quantitative and qualitative effectiveness measures are lacking.", color: "bg-blue-100 text-blue-800" },
  { value: "4", label: "4 - Yes, measured & managed", score: 4, description: "Quantitative and qualitative measures on the effectiveness of policies, procedures, and strategies are collected across the organization and used to assess them and make necessary changes.", color: "bg-green-100 text-green-800" },
  { value: "5", label: "5- Yes, Optimizing & continually improved", score: 5, description: "Policies, procedures, and strategies are fully institutionalized, repeatable, self-generating, and regularly updated based on a changing threat and technology landscape and business/mission needs.", color: "bg-purple-100 text-purple-800" },
  { value: "NA", label: "NA - Not Applicable", score: 0, description: "The requirement is not applicable to the organization.", color: "bg-gray-100 text-gray-800" }
];
