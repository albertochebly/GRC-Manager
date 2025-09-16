import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  pciDssRequirements, 
  statusOptions, 
  calculateCompletionStats,
  type PCIDSSAssessment 
} from "@/data/pciDssAssessmentData";
import { CalendarDays, FileText, Users, CheckCircle, Clock, AlertCircle, Save, Download, Upload } from "lucide-react";
import * as XLSX from 'xlsx';

export default function PCIDSSGapAssessment() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedOrganizationId, selectedOrganization } = useOrganizations();
  const [selectedRequirement, setSelectedRequirement] = useState("all");
  const [assessmentData, setAssessmentData] = useState<PCIDSSAssessment[]>(pciDssRequirements);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);

  // Requirement 1 Security Policies and Procedures
  const requirement1Policies = [
    {
      category: "Policies",
      items: [
        { title: "Network Security Policy", description: "Defines the overarching principles and controls for securing the organization's networks." },
        { title: "Firewall Policy", description: "Specifies the rules and responsibilities related to firewall deployment and maintenance." },
        { title: "Inbound/Outbound Traffic Restrictions Policy", description: "Outlines allowed and restricted inbound and outbound network traffic." },
        { title: "Wireless Access Policy", description: "Defines how wireless access is controlled and secured." },
        { title: "Untrusted and Trusted Network Segregation Policy", description: "Explains how different trust zones are logically and physically separated." },
        { title: "Bring Your Own Device (BYOD) and Dual-Homed Device Policy", description: "Details security controls for personal and multi-homed devices." },
        { title: "Security Policies", description: "Comprehensive policies covering network, system, and data security." },
        { title: "Access Control Policy for Configuration Files", description: "Governs access permissions to sensitive configuration files." },
        { title: "Emergency Change Procedures", description: "Procedure for implementing urgent changes with proper documentation." },
        { title: "Risk Assessment Documentation", description: "Identifies risks to network security and the CDE." },
        { title: "Vendor Management Documentation", description: "Contains information on third-party firewall service providers and their security posture." },
        { title: "Service Level Agreements (SLAs)", description: "Agreements outlining service expectations from firewall vendors." }
      ]
    },
    {
      category: "Operational Procedures",
      items: [
        { title: "Firewall/NSC Configuration Procedure", description: "Procedure for secure setup of firewalls and network security controls." },
        { title: "Network Change Control Procedure", description: "Process for managing and approving changes to the network." },
        { title: "Access Control for Network Devices Procedure", description: "Defines how access to network devices is authorized and revoked." },
        { title: "Incident Response Procedure for Network Security Breaches", description: "Steps to handle and document network-related security incidents." },
        { title: "Procedure for Reviewing and Approving Ports, Protocols, and Services", description: "Formal process for evaluating and allowing network traffic types." },
        { title: "Procedure for Reviewing and Updating NSC Configurations", description: "Guideline for reviewing and updating firewall configurations." },
        { title: "Emergency Change Procedures for Firewall Configurations", description: "Processes to apply and document emergency firewall changes." },
        { title: "Firewall Configuration Documentation", description: "Detailed documentation of firewall rules and settings." },
        { title: "Testing and Validation Procedures for Firewall Rules and Configurations", description: "Steps to verify firewall configurations operate as intended." }
      ]
    },
    {
      category: "Configuration Standards",
      items: [
        { title: "Firewall/NSC Configuration Standards", description: "Defines standard configurations for firewalls and network security controls." },
        { title: "Rule Naming Conventions", description: "Standard format for naming firewall rules for clarity." },
        { title: "Logging Settings", description: "Specifies log types and retention configurations." },
        { title: "Inbound/Outbound Rules Definition", description: "Details rules that govern allowed traffic." },
        { title: "Default Deny Policies", description: "Policy that denies all traffic by default unless explicitly allowed." },
        { title: "Secure Protocol Standards", description: "List of approved secure communication protocols." },
        { title: "Definition and Mitigation Plans for Insecure Protocols", description: "Plans to replace or protect the use of weak protocols." },
        { title: "Device Hardening Standards", description: "Baseline security settings for network devices." },
        { title: "Router, Firewall, and Switch Baseline Configurations", description: "Standard configuration templates for network infrastructure." },
        { title: "Configuration Standards for Access and Change Management", description: "Standards for managing access and changes to configurations." }
      ]
    },
    {
      category: "Network Architecture Documentation",
      items: [
        { title: "Network Diagram", description: "Visual layout of network devices, firewalls, and CDE connections." },
        { title: "Data Flow Diagram", description: "Illustrates how cardholder data flows across the network." },
        { title: "Network Security Architecture Document", description: "High-level view of security zones and firewall placement." },
        { title: "Documentation of Network Segmentation Points", description: "Details the segmentation between trusted and untrusted zones." },
        { title: "Wireless Networks Mapping", description: "Shows where wireless access points are located." },
        { title: "Connections Between CDE and Other Networks", description: "Explains the connections from the cardholder data environment to other networks." }
      ]
    },
    {
      category: "Roles & Responsibilities",
      items: [
        { title: "RACI Matrix for Requirement 1 Activities", description: "Defines roles and responsibilities for Requirement 1 compliance." },
        { title: "Document Defining Roles & Responsibilities", description: "Outlines personnel responsibilities for network security." },
        { title: "Access Approval and Revocation Roles", description: "Defines who approves and revokes access to firewall management." }
      ]
    },
    {
      category: "Access Management",
      items: [
        { title: "Device Access Control List (ACLs)", description: "Lists which devices or IPs are allowed or denied access." },
        { title: "User Access Reviews", description: "Records of periodic reviews of firewall interface access." },
        { title: "List of Approved Network Devices", description: "Authorized inventory of network hardware." },
        { title: "Inventory of Allowed Ports, Protocols, and Services", description: "Comprehensive list of network traffic allowed with justifications." }
      ]
    },
    {
      category: "Change Management",
      items: [
        { title: "Change Management Procedures", description: "Defines how firewall and network changes are managed." },
        { title: "Network Configuration Change Logs", description: "Logs showing historical changes to network settings." },
        { title: "Change Approval Forms", description: "Documents showing formal approval of network changes." },
        { title: "Firewall Change Log", description: "Chronological list of all firewall rule changes." },
        { title: "Record of Firewall Rule Reviews", description: "Evidence of bi-annual rule review processes." },
        { title: "Review and Approval Records", description: "Documentation proving rule reviews and approvals." }
      ]
    },
    {
      category: "Logs & Monitoring",
      items: [
        { title: "Firewall Logs and Monitoring Reports", description: "Collected logs from firewall activity." },
        { title: "Security Control Logs", description: "Logs showing the activation of protective measures." },
        { title: "Device Security Settings for CDE-Accessing Systems", description: "Logs and configs showing enforced security settings." },
        { title: "Device Configuration Logs", description: "Backups and audit logs of firewall/router configurations." },
        { title: "Audit Trail Documentation", description: "Logs that support forensic tracing and accountability." },
        { title: "Logs Showing Active Security Controls", description: "Validation logs for operational security functions." },
        { title: "Firewall Performance Reports", description: "Reports showing firewall traffic and performance." },
        { title: "Incident Log", description: "Log of incidents involving the firewall or network breaches." }
      ]
    },
    {
      category: "Testing & Assessments",
      items: [
        { title: "Testing and Review Reports", description: "Evidence of periodic firewall configuration testing." },
        { title: "Penetration Testing Results", description: "Reports detailing effectiveness of firewall against attacks." },
        { title: "Vulnerability Assessment Reports", description: "Findings from regular vulnerability scans." },
        { title: "Compliance Assessment Reports", description: "Results from PCI DSS compliance reviews." }
      ]
    },
    {
      category: "Backups & Configuration File Protections",
      items: [
        { title: "Backup and Recovery Procedures", description: "Process to back up and restore firewall configurations." },
        { title: "List of Backups of NSC Configurations", description: "Inventory of saved configurations." },
        { title: "Hash/Signature Records for Configuration Files", description: "Used to verify integrity of backups and configs." }
      ]
    },
    {
      category: "Training & Awareness",
      items: [
        { title: "Training Records", description: "Proof of training for personnel managing firewalls." },
        { title: "Training and Awareness Programs", description: "Ongoing education efforts on network security." },
        { title: "Acknowledgement Forms", description: "Signed forms showing awareness of policies." },
        { title: "Training Material on Network Security and BYOD", description: "Distributed content for internal awareness." }
      ]
    }
  ];

  // Permission checks
  const userRole = selectedOrganization?.role;
  const canEditAssessments = userRole !== 'read-only';

  // Fetch PCI DSS assessments from API (when implemented)
  const { data: apiAssessments, isLoading: isLoadingAssessments, refetch } = useQuery({
    queryKey: ["/api/organizations", selectedOrganizationId, "pci-dss-assessments"],
    queryFn: async () => {
      if (!selectedOrganizationId) return [];
      try {
        const response = await apiRequest("GET", `/api/organizations/${selectedOrganizationId}/pci-dss-assessments`);
        if (!response.ok) {
          if (response.status === 404) {
            // If endpoint doesn't exist yet, return empty array
            console.log("PCI DSS assessments endpoint not found, using default data");
            return [];
          }
          throw new Error("Failed to fetch PCI DSS assessments");
        }
        const data = await response.json();
        console.log("Fetched PCI DSS assessments:", data);
        return data;
      } catch (error) {
        console.error("Error fetching PCI DSS assessments:", error);
        return []; // Return empty array on error to use default data
      }
    },
    enabled: !!selectedOrganizationId,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false, // Don't retry on failure
  });

  // Use API data if available, otherwise use default data
  useEffect(() => {
    if (apiAssessments && Array.isArray(apiAssessments) && apiAssessments.length > 0) {
      // Create a map of saved assessments by requirement
      const savedAssessmentMap = new Map();
      apiAssessments.forEach(saved => {
        savedAssessmentMap.set(saved.requirement, saved);
      });

      // Merge saved data with default structure
      const mergedAssessments = pciDssRequirements.map(defaultAssessment => {
        const saved = savedAssessmentMap.get(defaultAssessment.requirement);
        if (saved && !defaultAssessment.isHeader) {
          return {
            ...defaultAssessment,
            status: saved.status || defaultAssessment.status,
            owner: saved.owner || defaultAssessment.owner,
            task: saved.task || defaultAssessment.task,
            completionDate: saved.completionDate || defaultAssessment.completionDate,
            comments: saved.comments || defaultAssessment.comments,
          };
        }
        return defaultAssessment;
      });

      setAssessmentData(mergedAssessments);
    } else {
      setAssessmentData(pciDssRequirements);
    }
  }, [apiAssessments, selectedOrganizationId]);

  // Save assessment mutation
  const saveAssessmentMutation = useMutation({
    mutationFn: async (data: PCIDSSAssessment[]) => {
      console.log("Saving assessment data:", data.length, "items");
      const response = await apiRequest("POST", `/api/organizations/${selectedOrganizationId}/pci-dss-assessments`, {
        assessments: data
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save PCI DSS assessment");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Assessment Saved", 
        description: "PCI DSS assessment saved successfully!" 
      });
      refetch(); // Refetch the saved data
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast({ 
        title: "Error saving assessment", 
        description: error.message || "An unknown error occurred", 
        variant: "destructive" 
      });
    },
  });

  // Calculate statistics
  const stats = calculateCompletionStats(assessmentData);
  
  // Calculate requirement groups dynamically based on current assessmentData
  const requirementGroups = React.useMemo(() => {
    const groups: { [key: string]: PCIDSSAssessment[] } = {};
    
    assessmentData.forEach(req => {
      const mainReq = req.requirement.split('.')[0];
      const groupName = `Requirement ${mainReq}`;
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(req);
    });
    
    return groups;
  }, [assessmentData]);

  // Filter assessments by selected requirement
  const filteredAssessments = selectedRequirement === 'all'
    ? assessmentData
    : assessmentData.filter(a => {
        // Split requirement by '.' and check if first part matches exactly
        const mainReq = a.requirement.split('.')[0];
        return mainReq === selectedRequirement;
      });

  // Update assessment item
  function updateAssessmentItem(id: number, field: keyof PCIDSSAssessment, value: any) {
    setAssessmentData(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  }

  // Save assessment handler
  async function saveAssessment() {
    try {
      await saveAssessmentMutation.mutateAsync(assessmentData);
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  }

  // Export to Excel with editable format
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Define color schemes and styles
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
      fill: { fgColor: { rgb: "2563EB" } }, // Blue background
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    const mainTitleStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, size: 14 },
      fill: { fgColor: { rgb: "1E40AF" } }, // Darker blue
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
        left: { style: "medium", color: { rgb: "000000" } },
        right: { style: "medium", color: { rgb: "000000" } }
      }
    };

    const subHeaderStyle = {
      font: { bold: true, color: { rgb: "1F2937" }, size: 11 },
      fill: { fgColor: { rgb: "E5E7EB" } }, // Light gray
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "6B7280" } },
        bottom: { style: "thin", color: { rgb: "6B7280" } },
        left: { style: "thin", color: { rgb: "6B7280" } },
        right: { style: "thin", color: { rgb: "6B7280" } }
      }
    };

    const dataStyle = {
      font: { color: { rgb: "374151" }, size: 10 },
      fill: { fgColor: { rgb: "F9FAFB" } }, // Very light gray
      alignment: { horizontal: "left", vertical: "top", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "D1D5DB" } },
        bottom: { style: "thin", color: { rgb: "D1D5DB" } },
        left: { style: "thin", color: { rgb: "D1D5DB" } },
        right: { style: "thin", color: { rgb: "D1D5DB" } }
      }
    };

    const completedStyle = {
      font: { color: { rgb: "065F46" }, size: 10 },
      fill: { fgColor: { rgb: "D1FAE5" } }, // Light green
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "059669" } },
        bottom: { style: "thin", color: { rgb: "059669" } },
        left: { style: "thin", color: { rgb: "059669" } },
        right: { style: "thin", color: { rgb: "059669" } }
      }
    };

    const inProgressStyle = {
      font: { color: { rgb: "92400E" }, size: 10 },
      fill: { fgColor: { rgb: "FEF3C7" } }, // Light yellow
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "D97706" } },
        bottom: { style: "thin", color: { rgb: "D97706" } },
        left: { style: "thin", color: { rgb: "D97706" } },
        right: { style: "thin", color: { rgb: "D97706" } }
      }
    };

    const notAppliedStyle = {
      font: { color: { rgb: "991B1B" }, size: 10 },
      fill: { fgColor: { rgb: "FEE2E2" } }, // Light red
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "DC2626" } },
        bottom: { style: "thin", color: { rgb: "DC2626" } },
        left: { style: "thin", color: { rgb: "DC2626" } },
        right: { style: "thin", color: { rgb: "DC2626" } }
      }
    };

    const notApplicableStyle = {
      font: { color: { rgb: "6B7280" }, size: 10 },
      fill: { fgColor: { rgb: "F3F4F6" } }, // Light gray
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "9CA3AF" } },
        bottom: { style: "thin", color: { rgb: "9CA3AF" } },
        left: { style: "thin", color: { rgb: "9CA3AF" } },
        right: { style: "thin", color: { rgb: "9CA3AF" } }
      }
    };

    // Create dropdown options sheet first (will be referenced by all requirement sheets)
    const dropdownOptions = [
      ['Dropdown Options for Status Column'],
      [''],
      ['Valid Status Options (in order of priority):'],
      ['Not Applied'],
      ['Completed'],
      ['In Progress'],
      ['Not Applicable'],
      [''],
      ['Instructions:'],
      ['Copy one of the status options above and paste it into the Status column'],
      ['Or type the exact text as shown above (case-sensitive)'],
      ['Status must match exactly - "Not Applied" is the default for new items'],
      ['Use dropdown arrows in Excel if available, or copy/paste from this sheet']
    ];
    
    const optionsWs = XLSX.utils.aoa_to_sheet(dropdownOptions);
    optionsWs['!cols'] = [{ wch: 50 }];
    
    // Style the options sheet
    const optionsRange = XLSX.utils.decode_range(optionsWs['!ref'] || 'A1:A12');
    for (let row = 0; row <= optionsRange.e.r; row++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
      if (!optionsWs[cellRef]) continue;
      
      if (!optionsWs[cellRef].s) optionsWs[cellRef].s = {};
      
      if (row === 0) {
        // Title
        optionsWs[cellRef].s = { ...mainTitleStyle };
      } else if (row === 2) {
        // Section header
        optionsWs[cellRef].s = { ...headerStyle };
      } else if (row >= 3 && row <= 6) {
        // Status options
        const status = dropdownOptions[row][0];
        switch (status) {
          case 'Not Applied':
            optionsWs[cellRef].s = { ...notAppliedStyle };
            break;
          case 'Completed':
            optionsWs[cellRef].s = { ...completedStyle };
            break;
          case 'In Progress':
            optionsWs[cellRef].s = { ...inProgressStyle };
            break;
          case 'Not Applicable':
            optionsWs[cellRef].s = { ...notApplicableStyle };
            break;
        }
      } else if (row === 8) {
        // Instructions header
        optionsWs[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" }, size: 11 },
          fill: { fgColor: { rgb: "7C3AED" } },
          alignment: { horizontal: "left", vertical: "center" }
        };
      } else {
        // Regular text
        optionsWs[cellRef].s = {
          font: { color: { rgb: "4B5563" }, size: 10 },
          fill: { fgColor: { rgb: "F8FAFC" } },
          alignment: { horizontal: "left", vertical: "center" }
        };
      }
    }
    
    XLSX.utils.book_append_sheet(wb, optionsWs, 'Status Options');

    // Create individual sheets for each requirement
    Object.entries(requirementGroups).forEach(([groupName, requirements]) => {
      const reqNum = groupName.replace('Requirement ', '');
      const reqTitle = requirements.find(r => r.requirement === reqNum && r.isHeader)?.description || `Requirement ${reqNum}`;
      
      const reqData = [
        // Main title row
        [`PCI DSS v4.0.1 - ${groupName}: ${reqTitle.substring(0, 80)}${reqTitle.length > 80 ? '...' : ''}`],
        [`Organization: ${selectedOrganization?.name || 'Not Selected'} | Export Date: ${new Date().toLocaleDateString()}`],
        [''],
        // Instructions section
        ['INSTRUCTIONS FOR EDITING:'],
        ['• Use the Status dropdown to select: Not Applied, Completed, In Progress, or Not Applicable'],
        ['• Check the "Status Options" sheet for valid values to copy/paste'],
        ['• Fill in Owner, Task, Completion Date, and Comments for each requirement'],
        ['• Main requirement titles are for reference only - do not edit'],
        ['• Use mm/dd/yyyy format for dates (e.g., 12/31/2025)'],
        ['• Save this file and reimport to update the web application'],
        [''],
        // Column headers matching the web app exactly
        ['Requirement', 'Description', 'Status', 'Owner', 'Task', 'Completion Date', 'Comments']
      ];
      
      // Add requirements for this group
      requirements.forEach(item => {
        const row = [
          item.requirement || '',
          (item.description || '').replace(/"/g, '""'),
          item.isHeader ? 'MAIN TITLE' : (item.status === 'not-applied' ? 'Not Applied' : 
                                          item.status === 'completed' ? 'Completed' :
                                          item.status === 'in-progress' ? 'In Progress' :
                                          item.status === 'not-applicable' ? 'Not Applicable' : 'Not Applied'),
          item.isHeader ? '' : (item.owner || 'Owner name...'),
          item.isHeader ? '' : (item.task || 'Task description...'),
          item.isHeader ? '' : (item.completionDate || 'mm/dd/yyyy'),
          item.isHeader ? '' : (item.comments || 'Comments...')
        ];
        reqData.push(row);
      });

      const reqWs = XLSX.utils.aoa_to_sheet(reqData);
      
      // Set column widths for optimal display matching web app
      reqWs['!cols'] = [
        { wch: 12 }, // Requirement
        { wch: 65 }, // Description (wide for readability)
        { wch: 15 }, // Status
        { wch: 20 }, // Owner
        { wch: 35 }, // Task
        { wch: 18 }, // Completion Date
        { wch: 35 }  // Comments
      ];

      // Apply styling to all cells
      const range = XLSX.utils.decode_range(reqWs['!ref'] || 'A1:G1');
      for (let row = 0; row <= range.e.r; row++) {
        // Set variable row heights based on content
        if (!reqWs['!rows']) reqWs['!rows'] = [];
        
        for (let col = 0; col <= range.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!reqWs[cellRef]) continue;
          
          // Initialize cell style
          if (!reqWs[cellRef].s) reqWs[cellRef].s = {};
          
          // Apply styles based on row type and content
          if (row === 0) {
            // Main title
            reqWs[cellRef].s = { ...mainTitleStyle };
            reqWs['!rows'][row] = { hpt: 25 };
            if (col === 0) {
              reqWs['!merges'] = reqWs['!merges'] || [];
              reqWs['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 6 } });
            }
          } else if (row === 1) {
            // Organization and date info
            reqWs[cellRef].s = {
              font: { bold: true, color: { rgb: "4B5563" }, size: 10 },
              fill: { fgColor: { rgb: "F3F4F6" } },
              alignment: { horizontal: "left", vertical: "center" }
            };
            reqWs['!rows'][row] = { hpt: 18 };
            if (col === 0) {
              reqWs['!merges'] = reqWs['!merges'] || [];
              reqWs['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 6 } });
            }
          } else if (row === 3) {
            // Instructions header
            reqWs[cellRef].s = {
              font: { bold: true, color: { rgb: "FFFFFF" }, size: 11 },
              fill: { fgColor: { rgb: "7C3AED" } }, // Purple
              alignment: { horizontal: "left", vertical: "center" }
            };
            reqWs['!rows'][row] = { hpt: 20 };
            if (col === 0) {
              reqWs['!merges'] = reqWs['!merges'] || [];
              reqWs['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 6 } });
            }
          } else if (row >= 4 && row <= 7) {
            // Instructions
            reqWs[cellRef].s = {
              font: { color: { rgb: "4B5563" }, size: 9 },
              fill: { fgColor: { rgb: "F8FAFC" } },
              alignment: { horizontal: "left", vertical: "center" }
            };
            reqWs['!rows'][row] = { hpt: 16 };
            if (col === 0) {
              reqWs['!merges'] = reqWs['!merges'] || [];
              reqWs['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 6 } });
            }
          } else if (row === 9) {
            // Column headers
            reqWs[cellRef].s = { ...headerStyle };
            reqWs['!rows'][row] = { hpt: 22 };
          } else if (row >= 10) {
            // Data rows
            const dataRow = reqData[row];
            const isMainTitle = dataRow && dataRow[9] === 'Header';
            
            if (isMainTitle) {
              // Main requirement titles
              reqWs[cellRef].s = { ...mainTitleStyle };
              reqWs['!rows'][row] = { hpt: 35 };
            } else {
              // Regular requirement rows
              reqWs[cellRef].s = { ...dataStyle };
              reqWs['!rows'][row] = { hpt: 40 };
              
              // Apply status-specific styling to status column (col 4)
              if (col === 4 && dataRow) {
                const status = dataRow[4];
                switch (status?.toLowerCase()) {
                  case 'completed':
                    reqWs[cellRef].s = { ...completedStyle };
                    break;
                  case 'in-progress':
                  case 'in progress':
                    reqWs[cellRef].s = { ...inProgressStyle };
                    break;
                  case 'not-applied':
                  case 'not applied':
                    reqWs[cellRef].s = { ...notAppliedStyle };
                    break;
                  case 'not-applicable':
                  case 'not applicable':
                    reqWs[cellRef].s = { ...notApplicableStyle };
                    break;
                }
              }
            }
          }
        }
      }

      // Add comprehensive data validation with dropdown for Status column
      const statusOptions = ['Not Applied', 'Completed', 'In Progress', 'Not Applicable'];
      
      // Add sheet with requirement number
      const sheetName = `Req ${reqNum}`;
      
      // Create data validation that will work in Excel
      const statusCells = [];
      for (let row = 12; row < reqData.length; row++) {
        const dataRow = reqData[row];
        const isMainTitle = dataRow && dataRow.length > 0 && (dataRow[0].includes('Requirement') && dataRow[1] && dataRow[1].toLowerCase().includes('install'));
        
        if (!isMainTitle) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: 2 }); // Column C (Status)
          statusCells.push(cellRef);
        }
      }

      // Apply Excel-compatible data validation
      if (statusCells.length > 0) {
        // Create data validation list that Excel will recognize
        const validationList = statusOptions.join(',');
        
        // Set up data validation for each status cell
        reqWs['!dataValidation'] = statusCells.map(cellRef => ({
          type: 'list',
          allowBlank: false,
          showDropDown: true,
          showErrorMessage: true,
          showInputMessage: true,
          errorTitle: 'Invalid Status',
          error: 'Please select from: Completed, In Progress, Not Applied, Not Applicable',
          promptTitle: 'Status Selection',
          prompt: 'Select status or check "Status Options" sheet for valid values',
          source: `"${validationList}"`,
          sqref: cellRef
        }));
      }

      // Add freeze panes to keep headers visible
      reqWs['!freeze'] = { xSplit: 0, ySplit: 12, topLeftCell: 'A13' };

      // Add the main requirement sheet
      XLSX.utils.book_append_sheet(wb, reqWs, sheetName);
    });

    // Create main editable assessment sheet (all requirements combined)
    const editableData = [
      // Header with instructions
      ['PCI DSS v4.0.1 Gap Assessment - All Requirements Combined'],
      [`Organization: ${selectedOrganization?.name || 'Not Selected'} | Export Date: ${new Date().toLocaleDateString()}`],
      [''],
      ['INSTRUCTIONS FOR EDITING:'],
      ['• Use individual requirement sheets for focused editing, or this sheet for overview'],
      ['• Use the Status dropdown or check "Status Options" sheet for valid values'],
      ['• Valid options: Not Applied, Completed, In Progress, Not Applicable'],
      ['• Fill in Owner, Task, Completion Date, and Comments for each requirement'],
      ['• Main requirement titles are for reference only - do not edit'],
      ['• Use mm/dd/yyyy format for dates (e.g., 12/31/2025)'],
      ['• Save this file and reimport to update the web application'],
      [''],
      ['Requirement', 'Description', 'Status', 'Owner', 'Task', 'Completion Date', 'Comments']
    ];
    
    // Add all assessment items
    assessmentData.forEach(item => {
      const row = [
        item.requirement || '',
        (item.description || '').replace(/"/g, '""'),
        item.isHeader ? 'MAIN TITLE' : (item.status === 'not-applied' ? 'Not Applied' : 
                                        item.status === 'completed' ? 'Completed' :
                                        item.status === 'in-progress' ? 'In Progress' :
                                        item.status === 'not-applicable' ? 'Not Applicable' : 'Not Applied'),
        item.isHeader ? '' : (item.owner || 'Owner name...'),
        item.isHeader ? '' : (item.task || 'Task description...'),
        item.isHeader ? '' : (item.completionDate || 'mm/dd/yyyy'),
        item.isHeader ? '' : (item.comments || 'Comments...')
      ];
      editableData.push(row);
    });

    const mainWs = XLSX.utils.aoa_to_sheet(editableData);
    
    // Set column widths for better readability matching web app
    mainWs['!cols'] = [
      { wch: 12 }, // Requirement
      { wch: 65 }, // Description
      { wch: 15 }, // Status
      { wch: 20 }, // Owner
      { wch: 35 }, // Task
      { wch: 18 }, // Completion Date
      { wch: 35 }  // Comments
    ];

    // Apply the same colorful styling to the combined sheet
    const mainRange = XLSX.utils.decode_range(mainWs['!ref'] || 'A1:G1');
    for (let row = 0; row <= mainRange.e.r; row++) {
      if (!mainWs['!rows']) mainWs['!rows'] = [];
      
      for (let col = 0; col <= mainRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!mainWs[cellRef]) continue;
        
        if (!mainWs[cellRef].s) mainWs[cellRef].s = {};
        
        // Apply styles based on row type and content
        if (row === 0) {
          // Main title
          mainWs[cellRef].s = { ...mainTitleStyle };
          mainWs['!rows'][row] = { hpt: 25 };
          if (col === 0) {
            mainWs['!merges'] = mainWs['!merges'] || [];
            mainWs['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 6 } });
          }
        } else if (row === 1) {
          // Organization and date info
          mainWs[cellRef].s = {
            font: { bold: true, color: { rgb: "4B5563" }, size: 10 },
            fill: { fgColor: { rgb: "F3F4F6" } },
            alignment: { horizontal: "left", vertical: "center" }
          };
          mainWs['!rows'][row] = { hpt: 18 };
          if (col === 0) {
            mainWs['!merges'] = mainWs['!merges'] || [];
            mainWs['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 6 } });
          }
        } else if (row === 3) {
          // Instructions header
          mainWs[cellRef].s = {
            font: { bold: true, color: { rgb: "FFFFFF" }, size: 11 },
            fill: { fgColor: { rgb: "7C3AED" } }, // Purple
            alignment: { horizontal: "left", vertical: "center" }
          };
          mainWs['!rows'][row] = { hpt: 20 };
          if (col === 0) {
            mainWs['!merges'] = mainWs['!merges'] || [];
            mainWs['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 6 } });
          }
        } else if (row >= 4 && row <= 8) {
          // Instructions
          mainWs[cellRef].s = {
            font: { color: { rgb: "4B5563" }, size: 9 },
            fill: { fgColor: { rgb: "F8FAFC" } },
            alignment: { horizontal: "left", vertical: "center" }
          };
          mainWs['!rows'][row] = { hpt: 16 };
          if (col === 0) {
            mainWs['!merges'] = mainWs['!merges'] || [];
            mainWs['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 6 } });
          }
        } else if (row === 10) {
          // Column headers
          mainWs[cellRef].s = { ...headerStyle };
          mainWs['!rows'][row] = { hpt: 22 };
        } else if (row >= 11) {
          // Data rows
          const dataRow = editableData[row];
          const isMainTitle = dataRow && dataRow[9] === 'Header';
          
          if (isMainTitle) {
            // Main requirement titles
            mainWs[cellRef].s = { ...mainTitleStyle };
            mainWs['!rows'][row] = { hpt: 35 };
          } else {
            // Regular requirement rows
            mainWs[cellRef].s = { ...dataStyle };
            mainWs['!rows'][row] = { hpt: 40 };
            
            // Apply status-specific styling to status column (col 4)
            if (col === 4 && dataRow) {
              const status = dataRow[4];
              switch (status?.toLowerCase()) {
                case 'completed':
                  mainWs[cellRef].s = { ...completedStyle };
                  break;
                case 'in progress':
                case 'in-progress':
                  mainWs[cellRef].s = { ...inProgressStyle };
                  break;
                case 'not applied':
                case 'not-applied':
                  mainWs[cellRef].s = { ...notAppliedStyle };
                  break;
                case 'not applicable':
                case 'not-applicable':
                  mainWs[cellRef].s = { ...notApplicableStyle };
                  break;
              }
            }
          }
        }
      }
    }

    // Add comprehensive dropdown validation for Status column 
    const combinedStatusOptions = ['Not Applied', 'Completed', 'In Progress', 'Not Applicable'];
    
    // Collect all status cells for validation
    const combinedStatusCells = [];
    for (let row = 13; row < editableData.length; row++) {
      const dataRow = editableData[row];
      const isMainTitle = dataRow && dataRow.length > 0 && (dataRow[0].includes('Requirement') && dataRow[1] && dataRow[1].toLowerCase().includes('install'));
      
      if (!isMainTitle) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: 2 }); // Column C (Status)
        combinedStatusCells.push(cellRef);
      }
    }

    // Create data validation with Excel-compatible format
    if (combinedStatusCells.length > 0) {
      const validationList = combinedStatusOptions.join(',');
      
      // Set up data validation for each status cell
      mainWs['!dataValidation'] = combinedStatusCells.map(cellRef => ({
        type: 'list',
        allowBlank: false,
        showDropDown: true,
        showErrorMessage: true,
        showInputMessage: true,
        errorTitle: 'Invalid Status',
        error: 'Please select from: Completed, In Progress, Not Applied, Not Applicable',
        promptTitle: 'Status Selection',
        prompt: 'Select status or check "Status Options" sheet for valid values',
        source: `"${validationList}"`,
        sqref: cellRef
      }));
    }

    // Add freeze panes to keep headers visible
    mainWs['!freeze'] = { xSplit: 0, ySplit: 13, topLeftCell: 'A14' };

    XLSX.utils.book_append_sheet(wb, mainWs, 'All Requirements');

    // Create summary dashboard sheet
    const overallStats = calculateCompletionStats(assessmentData);
    const dashboardData = [
      ['PCI DSS v4.0.1 Gap Assessment Dashboard'],
      ['Organization:', selectedOrganization?.name || 'Not Selected'],
      ['Export Date:', new Date().toLocaleDateString()],
      [''],
      ['OVERALL STATISTICS:'],
      ['Total Requirements:', overallStats.total],
      ['Completed:', overallStats.completed],
      ['In Progress:', overallStats.inProgress],
      ['Not Applied:', overallStats.notApplied],
      ['Completion Percentage:', `${overallStats.completionPercentage}%`],
      ['Progress Percentage:', `${overallStats.progressPercentage}%`],
      [''],
      ['REQUIREMENT BREAKDOWN:'],
      ['Requirement', 'Title', 'Total Items', 'Completed', 'In Progress', 'Not Applied', '% Complete']
    ];
    
    // Add requirement group statistics
    Object.entries(requirementGroups).forEach(([groupName, requirements]) => {
      const groupStats = calculateCompletionStats(requirements);
      const reqNum = groupName.replace('Requirement ', '');
      const groupTitle = requirements.find(r => r.requirement === reqNum)?.description || groupName;
      dashboardData.push([
        reqNum,
        groupTitle.substring(0, 50) + (groupTitle.length > 50 ? '...' : ''),
        groupStats.total,
        groupStats.completed,
        groupStats.inProgress,
        groupStats.notApplied,
        `${groupStats.completionPercentage}%`
      ]);
    });

    const dashboardWs = XLSX.utils.aoa_to_sheet(dashboardData);
    dashboardWs['!cols'] = [
      { wch: 12 }, // Requirement
      { wch: 50 }, // Title
      { wch: 12 }, // Total Items
      { wch: 12 }, // Completed
      { wch: 12 }, // In Progress
      { wch: 12 }, // Not Applied
      { wch: 12 }  // % Complete
    ];
    
    XLSX.utils.book_append_sheet(wb, dashboardWs, 'Dashboard');

    // Create a reference sheet with status options and guidance
    const referenceData = [
      ['PCI DSS Gap Assessment Reference'],
      [''],
      ['STATUS OPTIONS:'],
      ['Status', 'Description'],
      ['completed', 'Requirement is fully implemented and compliant'],
      ['in-progress', 'Requirement is partially implemented or work is ongoing'],
      ['not-applied', 'Requirement has not been implemented yet'],
      ['not-applicable', 'Requirement does not apply to this organization'],
      ['HEADER', 'This is a section header (do not change)'],
      [''],
      ['COMPLETION GUIDELINES:'],
      ['• Owner: Person responsible for implementing this requirement'],
      ['• Task: Specific action items needed to complete the requirement'],
      ['• Completion Date: Target or actual completion date (YYYY-MM-DD format)'],
      ['• Comments: Additional notes, evidence, or implementation details'],
      [''],
      ['EDITING TIPS:'],
      ['• Use the "Editable Assessment" sheet for making changes'],
      ['• Do not modify ID, Requirement, Sub-Requirement, or Description columns'],
      ['• Headers are marked with "HEADER" status - leave these unchanged'],
      ['• Use consistent date format: YYYY-MM-DD (e.g., 2025-12-31)'],
      ['• Keep comments concise but informative']
    ];

    const referenceWs = XLSX.utils.aoa_to_sheet(referenceData);
    referenceWs['!cols'] = [{ wch: 15 }, { wch: 60 }];
    
    XLSX.utils.book_append_sheet(wb, referenceWs, 'Reference');

    // Save the file
    const orgName = selectedOrganization?.name ? `_${selectedOrganization.name.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const fileName = `PCI_DSS_Gap_Assessment_Editable${orgName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Excel Export Complete",
      description: `Assessment exported as ${fileName} - Ready for editing!`,
    });
  };

  // Import from Excel function
  const importFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let allImportedData: any[] = [];
        let successfulSheets = 0;
        
        // Process all sheets that might contain assessment data
        workbook.SheetNames.forEach(sheetName => {
          // Skip reference/dashboard sheets
          if (sheetName.toLowerCase().includes('reference') || 
              sheetName.toLowerCase().includes('dashboard')) {
            return;
          }
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Find the header row (should contain 'ID', 'Requirement', etc.)
          let headerRowIndex = -1;
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row && row.some(cell => cell === 'ID' || cell === 'Requirement')) {
              headerRowIndex = i;
              break;
            }
          }
          
          if (headerRowIndex === -1) {
            return; // Skip sheets without valid headers
          }
          
          const headers = jsonData[headerRowIndex] as string[];
          const dataRows = jsonData.slice(headerRowIndex + 1);
          
          // Map column indices
          const columnIndices = {
            id: headers.findIndex(h => h === 'ID'),
            requirement: headers.findIndex(h => h === 'Requirement'),
            status: headers.findIndex(h => h === 'Status'),
            owner: headers.findIndex(h => h === 'Owner'),
            task: headers.findIndex(h => h === 'Task'),
            completionDate: headers.findIndex(h => h === 'Completion Date'),
            comments: headers.findIndex(h => h === 'Comments'),
            type: headers.findIndex(h => h === 'Type')
          };
          
          // Validate required columns exist
          if (columnIndices.id === -1 || columnIndices.requirement === -1) {
            return; // Skip sheets without required columns
          }
          
          // Collect valid data rows from this sheet
          dataRows.forEach((row: any[]) => {
            if (row[columnIndices.id] && row[columnIndices.requirement]) {
              let status = row[columnIndices.status] || '';
              
              // Normalize status values from Excel to match web app format
              switch (status.toLowerCase()) {
                case 'completed':
                  status = 'completed';
                  break;
                case 'in progress':
                case 'in-progress':
                  status = 'in-progress';
                  break;
                case 'not applied':
                case 'not-applied':
                  status = 'not-applied';
                  break;
                case 'not applicable':
                case 'not-applicable':
                  status = 'not-applicable';
                  break;
                case 'main title':
                case 'header':
                  return; // Skip header rows
                default:
                  status = 'not-applied'; // Default fallback
              }
              
              allImportedData.push({
                id: parseInt(row[columnIndices.id].toString()) || 0,
                status: status,
                owner: row[columnIndices.owner] || '',
                task: row[columnIndices.task] || '',
                completionDate: row[columnIndices.completionDate] || '',
                comments: row[columnIndices.comments] || '',
              });
            }
          });
          
          successfulSheets++;
        });
        
        if (allImportedData.length === 0) {
          toast({
            title: "Import Error",
            description: "No valid assessment data found in Excel file. Please use the exported template.",
            variant: "destructive"
          });
          return;
        }
        
        // Create updated assessment data by matching IDs
        const updatedAssessments = assessmentData.map(originalItem => {
          // Find matching row in Excel data
          const excelData = allImportedData.find(importedItem => 
            importedItem.id === originalItem.id
          );
          
          if (excelData && !originalItem.isHeader) {
            // Update with Excel data, but keep original structure
            return {
              ...originalItem,
              status: excelData.status || originalItem.status,
              owner: excelData.owner || originalItem.owner,
              task: excelData.task || originalItem.task,
              completionDate: excelData.completionDate || originalItem.completionDate,
              comments: excelData.comments || originalItem.comments,
            };
          }
          
          return originalItem;
        });
        
        // Update state
        setAssessmentData(updatedAssessments);
        
        toast({
          title: "Import Successful",
          description: `Successfully imported assessment data from ${successfulSheets} sheet(s) with ${allImportedData.length} items.`,
        });
        
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Import Error",
          description: "Failed to import Excel file. Please check the file format.",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsArrayBuffer(file);
    
    // Reset the input
    event.target.value = '';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Please log in to continue.</div>;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-4">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PCI DSS v4.0.1 Gap Assessment</h1>
              <p className="text-gray-600 mt-2">Track compliance progress against PCI DSS requirements</p>
            </div>
            <div className="flex space-x-2">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={importFromExcel}
                style={{ display: 'none' }}
                id="excel-import"
                disabled={!canEditAssessments}
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('excel-import')?.click()}
                disabled={!canEditAssessments}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              {canEditAssessments && (
                <Button 
                  onClick={saveAssessment} 
                  disabled={saveAssessmentMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveAssessmentMutation.isPending ? "Saving..." : "Save Assessment"}
                </Button>
              )}
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requirements</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <Progress value={stats.completionPercentage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <Progress value={((stats.inProgress / stats.total) * 100)} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Not Applied</p>
                    <p className="text-3xl font-bold text-red-600">{stats.notApplied}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <Progress value={((stats.notApplied / stats.total) * 100)} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Overall Progress */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Overall Compliance Progress</CardTitle>
              <CardDescription>
                {stats.completionPercentage}% Complete • {stats.progressPercentage}% In Progress or Complete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completed ({stats.completed})</span>
                  <span>{stats.completionPercentage}%</span>
                </div>
                <Progress value={stats.completionPercentage} className="h-3" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Including In Progress ({stats.completed + stats.inProgress})</span>
                  <span>{stats.progressPercentage}%</span>
                </div>
                <Progress value={stats.progressPercentage} className="h-2 opacity-60" />
              </div>
            </CardContent>
          </Card>

          {/* Requirement Filter */}
          <div className="mb-6">
            <Tabs value={selectedRequirement} onValueChange={setSelectedRequirement}>
              <div className="overflow-x-auto">
                <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-full w-max">
                  <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap px-3 py-1.5">All</TabsTrigger>
                  {Array.from({length: 12}, (_, i) => (
                    <TabsTrigger key={i + 1} value={String(i + 1)} className="text-xs sm:text-sm whitespace-nowrap px-3 py-1.5">
                      Req {i + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>

          {/* Requirement Summary Cards */}
          {selectedRequirement === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {Object.entries(requirementGroups).map(([groupName, requirements]) => {
                const groupStats = calculateCompletionStats(requirements);
                return (
                  <Card key={groupName}>
                    <CardHeader>
                      <CardTitle className="text-lg">{groupName}</CardTitle>
                      <CardDescription>
                        {requirements[0]?.description.split(' ').slice(0, 8).join(' ')}...
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-gray-600">{groupStats.completionPercentage}%</span>
                      </div>
                      <Progress value={groupStats.completionPercentage} className="mb-3" />
                      <div className="flex justify-between text-xs text-gray-600">
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {groupStats.completed} Complete
                        </Badge>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                          {groupStats.inProgress} In Progress
                        </Badge>
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          {groupStats.notApplied} Not Applied
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Assessment Table */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
              <CardDescription>
                Review and update compliance status for each PCI DSS requirement
                {selectedRequirement !== 'all' && ` - Requirement ${selectedRequirement}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-200">
                      <TableHead className="w-24 text-gray-800 font-bold">Requirement</TableHead>
                      <TableHead className="w-96 text-gray-800 font-bold">Description</TableHead>
                      <TableHead className="w-32 text-gray-800 font-bold">Status</TableHead>
                      <TableHead className="w-40 text-gray-800 font-bold">Owner</TableHead>
                      <TableHead className="w-48 text-gray-800 font-bold">Task</TableHead>
                      <TableHead className="w-40 text-gray-800 font-bold">Completion Date</TableHead>
                      <TableHead className="w-60 text-gray-800 font-bold">Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map((assessment) => (
                      <TableRow key={assessment.id} className={assessment.isHeader ? 'bg-purple-50 border-b-2 border-purple-200' : ''}>
                        <TableCell>
                          <Badge 
                            variant={assessment.isHeader ? "default" : "outline"}
                            className="font-mono"
                          >
                            {assessment.requirement}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-96">
                          {assessment.requirement === "1.1.1" && !assessment.isHeader ? (
                            <div 
                              className="text-sm leading-relaxed break-words cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={() => setShowPoliciesModal(true)}
                              title="Click to view detailed policies and procedures"
                            >
                              {assessment.description}
                            </div>
                          ) : (
                            <div className={`text-sm leading-relaxed break-words ${assessment.isHeader ? 'font-semibold text-purple-900' : ''}`}>
                              {assessment.description}
                            </div>
                          )}
                        </TableCell>
                        {assessment.isHeader ? (
                          // For headers, show empty cells or section info
                          <>
                            <TableCell className="text-center text-gray-400 italic">-</TableCell>
                            <TableCell className="text-center text-gray-400 italic">-</TableCell>
                            <TableCell className="text-center text-gray-400 italic">-</TableCell>
                            <TableCell className="text-center text-gray-400 italic">-</TableCell>
                            <TableCell className="text-center text-gray-400 italic">-</TableCell>
                          </>
                        ) : (
                          // For regular requirements, show editable fields
                          <>
                            <TableCell>
                              <Select
                                value={assessment.status}
                                onValueChange={(value) => updateAssessmentItem(assessment.id, 'status', value)}
                                disabled={!canEditAssessments}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <Badge className={option.color}>
                                        {option.label}
                                      </Badge>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={assessment.owner || ''}
                                onChange={(e) => updateAssessmentItem(assessment.id, 'owner', e.target.value)}
                                placeholder="Owner name..."
                                className="w-full"
                                disabled={!canEditAssessments}
                              />
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={assessment.task || ''}
                                onChange={(e) => updateAssessmentItem(assessment.id, 'task', e.target.value)}
                                placeholder="Task description..."
                                className="min-h-[60px] w-full"
                                disabled={!canEditAssessments}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={assessment.completionDate || ''}
                                onChange={(e) => updateAssessmentItem(assessment.id, 'completionDate', e.target.value)}
                                className="w-full"
                                disabled={!canEditAssessments}
                              />
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={assessment.comments || ''}
                                onChange={(e) => updateAssessmentItem(assessment.id, 'comments', e.target.value)}
                                placeholder="Comments..."
                                className="min-h-[60px] w-full max-w-60"
                                disabled={!canEditAssessments}
                              />
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredAssessments.length} of {assessmentData.length} PCI DSS v4.0.1 requirements
            {selectedRequirement !== 'all' && ` for Requirement ${selectedRequirement}`}
          </div>

          {/* Policies and Procedures Modal */}
          <Dialog open={showPoliciesModal} onOpenChange={setShowPoliciesModal}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-purple-900">
                  Requirement 1: Security Policies and Procedures
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                  <p className="text-gray-700 font-medium mb-6">
                    The following security policies and operational procedures must be documented, 
                    kept up to date, in use, and known to all affected parties for PCI DSS Requirement 1:
                  </p>
                  {requirement1Policies.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="mb-6">
                      <h3 className="text-lg font-bold text-purple-900 mb-4 border-b border-purple-200 pb-2">
                        {category.category}
                      </h3>
                      <div className="grid gap-3">
                        {category.items.map((item, itemIndex) => (
                          <Card key={itemIndex} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <Badge variant="outline" className="text-purple-700 border-purple-300">
                                  {itemIndex + 1}
                                </Badge>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                                <p className="text-gray-700 text-sm leading-relaxed">{item.description}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <h4 className="font-semibold text-blue-900 mb-2">Important Note:</h4>
                    <p className="text-blue-800 text-sm">
                      These policies and procedures must be regularly reviewed and updated to ensure they remain 
                      current with your organization's security posture and compliance requirements. All personnel 
                      involved in network security controls should be familiar with these documents.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
