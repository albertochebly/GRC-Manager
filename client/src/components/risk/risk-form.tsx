import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const riskSchema = z.object({
  riskId: z.string().min(1, "Risk ID is required"),
  title: z.string().min(1, "Risk title is required"),
  description: z.string().min(1, "Risk description is required"),
  riskType: z.enum(["asset", "scenario"]),
  status: z.enum([
    "identified",
    "in_assessment",
    "pending_treatment",
    "in_progress",
    "remediated",
    "monitoring",
    "closed"
  ]).default("identified"),
  assetCategory: z.string().optional(),
  assetDescription: z.string().optional(),
  confidentialityImpact: z.number().min(1).max(5),
  integrityImpact: z.number().min(1).max(5),
  availabilityImpact: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  likelihood: z.number().min(1).max(5),
  mitigationPlan: z.string().min(1, "Mitigation plan is required"),
  // --- New fields ---
  statusComments: z.string().optional(),
  riskResponseStrategy: z.enum(["Accept", "Mitigate", "Transfer", "Avoid"]).optional(),
  newMeasuresAndControls: z.string().optional(),
  residualImpactLevel: z.enum(["Very Low", "Low", "Medium", "High", "Very High"]).optional(),
  residualLikelihoodLevel: z.enum(["Rare", "Unlikely", "Possible", "Likely", "Highly Likely"]).optional(),
  residualRiskLevel: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
    residualImpactRating: z.union([z.number().min(1).max(5), z.null(), z.undefined()]).optional(),
    residualLikelihoodRating: z.union([z.number().min(1).max(5), z.null(), z.undefined()]).optional(),
    residualRiskRating: z.union([z.number().min(1).max(10), z.null(), z.undefined()]).optional(),
  riskDueDate: z.string().optional(),
  riskCloseDate: z.string().optional(),
  overdue: z.string().optional(),
  nextReviewDate: z.string().optional(),
});

type RiskForm = z.infer<typeof riskSchema>;

interface RiskFormProps {
  onSubmit: (data: RiskForm) => void;
  isLoading?: boolean;
  initialData?: Partial<RiskForm>;
}

export default function RiskForm({ onSubmit, isLoading, initialData }: RiskFormProps) {
  // Watched variables

  // Error state for failed submit
  const [submitErrors, setSubmitErrors] = React.useState<any>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RiskForm>({
    resolver: zodResolver(riskSchema),
    mode: "onSubmit",
    defaultValues: {
      riskId: initialData?.riskId || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      riskType: (initialData as any)?.riskType || undefined,
      status: (initialData as any)?.status || "identified",
      statusComments: (initialData as any)?.statusComments || "",
      riskResponseStrategy: (initialData as any)?.riskResponseStrategy || undefined,
      newMeasuresAndControls: (initialData as any)?.newMeasuresAndControls || "",
      confidentialityImpact: typeof (initialData as any)?.confidentialityImpact === 'number' && !Number.isNaN((initialData as any)?.confidentialityImpact) ? (initialData as any)?.confidentialityImpact : 1,
      integrityImpact: typeof (initialData as any)?.integrityImpact === 'number' && !Number.isNaN((initialData as any)?.integrityImpact) ? (initialData as any)?.integrityImpact : 1,
      availabilityImpact: typeof (initialData as any)?.availabilityImpact === 'number' && !Number.isNaN((initialData as any)?.availabilityImpact) ? (initialData as any)?.availabilityImpact : 1,
      impact: typeof (initialData as any)?.impact === 'number' && !Number.isNaN((initialData as any)?.impact) ? (initialData as any)?.impact : 1,
      likelihood: typeof (initialData as any)?.likelihood === 'number' && !Number.isNaN((initialData as any)?.likelihood) ? (initialData as any)?.likelihood : 1,
      residualImpactLevel: (initialData as any)?.residualImpactLevel || undefined,
      residualImpactRating: typeof (initialData as any)?.residualImpactRating === 'number' && !Number.isNaN((initialData as any)?.residualImpactRating) ? (initialData as any)?.residualImpactRating : undefined,
      residualLikelihoodLevel: (initialData as any)?.residualLikelihoodLevel || undefined,
      residualLikelihoodRating: typeof (initialData as any)?.residualLikelihoodRating === 'number' && !Number.isNaN((initialData as any)?.residualLikelihoodRating) ? (initialData as any)?.residualLikelihoodRating : undefined,
      residualRiskLevel: (initialData as any)?.residualRiskLevel || undefined,
      residualRiskRating: typeof (initialData as any)?.residualRiskRating === 'number' && !Number.isNaN((initialData as any)?.residualRiskRating) ? (initialData as any)?.residualRiskRating : undefined,
      riskDueDate: (initialData as any)?.riskDueDate || "",
      riskCloseDate: (initialData as any)?.riskCloseDate || "",
      overdue: (initialData as any)?.overdue || "",
      nextReviewDate: (initialData as any)?.nextReviewDate || "",
    },
  });

  // Declare watched variables immediately after useForm
  const confidentialityImpact = watch("confidentialityImpact");
  const integrityImpact = watch("integrityImpact");
  const availabilityImpact = watch("availabilityImpact");
  const likelihood = watch("likelihood");
  const riskType = watch("riskType");
  const status = watch("status");
  const riskResponseStrategy = watch("riskResponseStrategy");
  const residualImpactLevel = watch("residualImpactLevel");
  const residualLikelihoodLevel = watch("residualLikelihoodLevel");
  const residualRiskLevel = watch("residualRiskLevel");
  const assetCategory = watch("assetCategory");
  const riskDueDate = watch("riskDueDate");
  const riskCloseDate = watch("riskCloseDate");

  // Reset form when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData) {
      reset({
        riskId: initialData?.riskId || "",
        title: initialData?.title || "",
        description: initialData?.description || "",
        riskType: (initialData as any)?.riskType || undefined,
        status: (initialData as any)?.status || "identified",
        statusComments: (initialData as any)?.statusComments || "",
        riskResponseStrategy: (initialData as any)?.riskResponseStrategy || undefined,
        newMeasuresAndControls: (initialData as any)?.newMeasuresAndControls || "",
        confidentialityImpact: typeof (initialData as any)?.confidentialityImpact === 'number' && !Number.isNaN((initialData as any)?.confidentialityImpact) ? (initialData as any)?.confidentialityImpact : 1,
        integrityImpact: typeof (initialData as any)?.integrityImpact === 'number' && !Number.isNaN((initialData as any)?.integrityImpact) ? (initialData as any)?.integrityImpact : 1,
        availabilityImpact: typeof (initialData as any)?.availabilityImpact === 'number' && !Number.isNaN((initialData as any)?.availabilityImpact) ? (initialData as any)?.availabilityImpact : 1,
        impact: typeof (initialData as any)?.impact === 'number' && !Number.isNaN((initialData as any)?.impact) ? (initialData as any)?.impact : 1,
        likelihood: typeof (initialData as any)?.likelihood === 'number' && !Number.isNaN((initialData as any)?.likelihood) ? (initialData as any)?.likelihood : 1,
        residualImpactLevel: (initialData as any)?.residualImpactLevel || undefined,
        residualImpactRating: typeof (initialData as any)?.residualImpactRating === 'number' && !Number.isNaN((initialData as any)?.residualImpactRating) ? (initialData as any)?.residualImpactRating : undefined,
        residualLikelihoodLevel: (initialData as any)?.residualLikelihoodLevel || undefined,
        residualLikelihoodRating: typeof (initialData as any)?.residualLikelihoodRating === 'number' && !Number.isNaN((initialData as any)?.residualLikelihoodRating) ? (initialData as any)?.residualLikelihoodRating : undefined,
        residualRiskLevel: (initialData as any)?.residualRiskLevel || undefined,
        residualRiskRating: typeof (initialData as any)?.residualRiskRating === 'number' && !Number.isNaN((initialData as any)?.residualRiskRating) ? (initialData as any)?.residualRiskRating : undefined,
        riskDueDate: (initialData as any)?.riskDueDate || "",
        riskCloseDate: (initialData as any)?.riskCloseDate || "",
        overdue: (initialData as any)?.overdue || "",
        nextReviewDate: (initialData as any)?.nextReviewDate || "",
      });
    }
  }, [initialData, reset]);


  // Declare watched variables once after useForm


  // Ensure required number fields are always set on mount
  React.useEffect(() => {
    if (typeof confidentialityImpact === 'undefined') setValue('confidentialityImpact', 1);
    if (typeof integrityImpact === 'undefined') setValue('integrityImpact', 1);
    if (typeof availabilityImpact === 'undefined') setValue('availabilityImpact', 1);
    if (typeof likelihood === 'undefined') setValue('likelihood', 1);
  }, [confidentialityImpact, integrityImpact, availabilityImpact, likelihood, setValue]);

  // Ensure all values are valid numbers
  const safeConfidentiality = typeof confidentialityImpact === 'number' && !isNaN(confidentialityImpact) ? confidentialityImpact : 1;
  const safeIntegrity = typeof integrityImpact === 'number' && !isNaN(integrityImpact) ? integrityImpact : 1;
  const safeAvailability = typeof availabilityImpact === 'number' && !isNaN(availabilityImpact) ? availabilityImpact : 1;
  const safeLikelihood = typeof likelihood === 'number' && !isNaN(likelihood) ? likelihood : 1;

  // Calculate average impact from CIA values
  const averageImpact = Math.round((safeConfidentiality + safeIntegrity + safeAvailability) / 3);
  const riskScore = averageImpact * safeLikelihood;
  
  // Update the impact field whenever CIA values change
  React.useEffect(() => {
    setValue("impact", averageImpact);
  }, [confidentialityImpact, integrityImpact, availabilityImpact, averageImpact, setValue]);

  const getRiskLevel = (score: number): { level: string; color: string } => {
    if (score >= 20) return { level: "Critical", color: "text-red-600 bg-red-50" };
    if (score >= 15) return { level: "High", color: "text-orange-600 bg-orange-50" };
    if (score >= 10) return { level: "Medium", color: "text-yellow-600 bg-yellow-50" };
    if (score >= 5) return { level: "Low", color: "text-green-600 bg-green-50" };
    return { level: "Very Low", color: "text-blue-600 bg-blue-50" };
  };

  const { level, color } = getRiskLevel(riskScore);

  // Calculate overdue status based on risk response strategy and dates
  React.useEffect(() => {
    const calculateOverdueStatus = () => {
      // If no risk response strategy is set, cannot determine overdue status
      if (!riskResponseStrategy) {
        setValue("overdue", "");
        return;
      }

      const today = new Date();
      const currentDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

      let overdueStatus = "";

      // Check different conditions based on risk response strategy
      switch (riskResponseStrategy) {
        case "Accept":
          // For Accept: risk is overdue if no close date is set
          if (!riskCloseDate || riskCloseDate.trim() === "") {
            overdueStatus = "Missing Risk Close Date";
          } else {
            // Check if close date has passed
            if (riskCloseDate < currentDateString) {
              overdueStatus = "Risk Close Date Passed";
            } else {
              overdueStatus = ""; // Not overdue
            }
          }
          break;

        case "Mitigate":
        case "Treat":
          // For Mitigate/Treat: risk is overdue if no due date is set or due date has passed
          if (!riskDueDate || riskDueDate.trim() === "") {
            overdueStatus = "Missing Risk Due Date";
          } else {
            // Check if due date has passed
            if (riskDueDate < currentDateString) {
              overdueStatus = "Overdue";
            } else {
              overdueStatus = ""; // Not overdue
            }
          }
          break;

        case "Transfer":
          // For Transfer: risk is overdue if no due date is set or due date has passed
          if (!riskDueDate || riskDueDate.trim() === "") {
            overdueStatus = "Missing Risk Due Date";
          } else {
            // Check if due date has passed
            if (riskDueDate < currentDateString) {
              overdueStatus = "Transfer Overdue";
            } else {
              overdueStatus = ""; // Not overdue
            }
          }
          break;

        case "Avoid":
          // For Avoid: risk is overdue if no close date is set
          if (!riskCloseDate || riskCloseDate.trim() === "") {
            overdueStatus = "Missing Risk Close Date";
          } else {
            // Check if close date has passed
            if (riskCloseDate < currentDateString) {
              overdueStatus = "Risk Avoidance Overdue";
            } else {
              overdueStatus = ""; // Not overdue
            }
          }
          break;

        default:
          overdueStatus = "";
      }

      setValue("overdue", overdueStatus);
    };

    calculateOverdueStatus();
  }, [riskResponseStrategy, riskDueDate, riskCloseDate, setValue]);

  // Scroll to error summary when errors appear
  React.useEffect(() => {
    if ((Object.keys(errors).length > 0 || submitErrors) && errorSummaryRef.current) {
      errorSummaryRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errors, submitErrors]);

  const sanitizeResidualRatings = (data: RiskForm) => ({
    ...data,
    residualImpactRating: (data.residualImpactRating === null || typeof data.residualImpactRating === 'undefined' || Number.isNaN(data.residualImpactRating)) ? undefined : data.residualImpactRating,
    residualLikelihoodRating: (data.residualLikelihoodRating === null || typeof data.residualLikelihoodRating === 'undefined' || Number.isNaN(data.residualLikelihoodRating)) ? undefined : data.residualLikelihoodRating,
    residualRiskRating: (data.residualRiskRating === null || typeof data.residualRiskRating === 'undefined' || Number.isNaN(data.residualRiskRating)) ? undefined : data.residualRiskRating,
  });

  const sanitizeFormData = (data: RiskForm) => ({
  ...data,
  confidentialityImpact: typeof data.confidentialityImpact === 'number' && !Number.isNaN(data.confidentialityImpact) ? data.confidentialityImpact : 1,
  integrityImpact: typeof data.integrityImpact === 'number' && !Number.isNaN(data.integrityImpact) ? data.integrityImpact : 1,
  availabilityImpact: typeof data.availabilityImpact === 'number' && !Number.isNaN(data.availabilityImpact) ? data.availabilityImpact : 1,
  impact: typeof data.impact === 'number' && !Number.isNaN(data.impact) ? data.impact : 1,
  likelihood: typeof data.likelihood === 'number' && !Number.isNaN(data.likelihood) ? data.likelihood : 1,
  mitigationPlan: typeof data.mitigationPlan === 'string' && data.mitigationPlan.trim().length > 0 ? data.mitigationPlan : '-',
  // Preserve residual risk fields exactly as they are (don't convert undefined to empty string)
  residualImpactLevel: data.residualImpactLevel || undefined,
  residualLikelihoodLevel: data.residualLikelihoodLevel || undefined,
  residualRiskLevel: data.residualRiskLevel || undefined,
  });

  return (
    <>
      {/* Error summary block above the form */}
      {(Object.keys(errors).length > 0 || submitErrors) && (
        <div ref={errorSummaryRef} className="mb-4 p-3 bg-red-50 border-2 border-red-400 rounded shadow-lg animate-pulse" data-testid="error-summary-block">
          <p className="text-red-700 font-bold mb-2 flex items-center"><span className="mr-2">⚠️</span> Please fix the following errors:</p>
          <ul className="list-disc pl-5 text-red-700 text-base">
            {Object.entries(errors).map(([key, error]) => (
              <li key={key}>{(error as { message?: string }).message}</li>
            ))}
            {submitErrors && Object.entries(submitErrors).map(([key, error]) => (
              <li key={key}>{(error as { message?: string }).message}</li>
            ))}
          </ul>
        </div>
      )}
      <form onSubmit={handleSubmit((data) => onSubmit(sanitizeFormData(data)), (errors) => { setSubmitErrors(errors); forceUpdate(); })} className="space-y-6" data-testid="risk-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {errors.riskId && <p className="text-sm text-red-600 mb-1">{errors.riskId.message}</p>}
          <Label htmlFor="riskId">Risk ID</Label>
          <Input id="riskId" {...register("riskId")} placeholder="RISK-2024-001" data-testid="input-risk-id" />
        </div>
        <div>
          {errors.title && <p className="text-sm text-red-600 mb-1">{errors.title.message}</p>}
          <Label htmlFor="title">Risk Title</Label>
          <Input id="title" {...register("title")} placeholder="Data Breach Risk" data-testid="input-risk-title" />
        </div>
      </div>

      <div>
  {errors.description && <p className="text-sm text-red-600 mb-1">{errors.description.message}</p>}
  <Label htmlFor="description">Risk Description</Label>
  <Textarea id="description" {...register("description")} placeholder="Detailed description of the risk..." rows={4} data-testid="textarea-risk-description" />
      </div>

      <div>
        {errors.riskType && <p className="text-sm text-red-600 mb-1">{errors.riskType.message}</p>}
        <Label htmlFor="riskType">Risk Type</Label>
        <Select onValueChange={(value) => setValue("riskType", value as "asset" | "scenario")} value={riskType}>
          <SelectTrigger data-testid="select-risk-type">
            <SelectValue placeholder="Select risk type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asset">Asset-Based Risk</SelectItem>
            <SelectItem value="scenario">Scenario-Based Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Asset-specific fields - only show for asset-based risks */}
      {riskType === "asset" && (
        <>
          <div>
            <Label htmlFor="assetCategory">Asset Category</Label>
            <Select 
              onValueChange={(value) => setValue("assetCategory", value)}
              value={assetCategory}
            >
              <SelectTrigger data-testid="select-asset-category">
                <SelectValue placeholder="Select asset category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Application systems">Application systems</SelectItem>
                <SelectItem value="Database">Database</SelectItem>
                <SelectItem value="Operating System">Operating System</SelectItem>
                <SelectItem value="Physical & Environmental Controls">Physical & Environmental Controls</SelectItem>
                <SelectItem value="Business Documents">Business Documents</SelectItem>
                <SelectItem value="Contractual Documents">Contractual Documents</SelectItem>
                <SelectItem value="Policies, Procedures & Plans Manuals">Policies, Procedures & Plans Manuals</SelectItem>
                <SelectItem value="Technical Documents / Manuals">Technical Documents / Manuals</SelectItem>
                <SelectItem value="Skilled / Dedicated Function Employees">Skilled / Dedicated Function Employees</SelectItem>
                <SelectItem value="Web Applications">Web Applications</SelectItem>
                <SelectItem value="Internal Communication Services">Internal Communication Services</SelectItem>
                <SelectItem value="Mobile devices">Mobile devices</SelectItem>
                <SelectItem value="Network Infrastructure">Network Infrastructure</SelectItem>
                <SelectItem value="Office Equipment">Office Equipment</SelectItem>
                <SelectItem value="Personal Devices">Personal Devices</SelectItem>
                <SelectItem value="Power Supply Equipment">Power Supply Equipment</SelectItem>
                <SelectItem value="Security Measure (Software/Hardware)">Security Measure (Software/Hardware)</SelectItem>
                <SelectItem value="Servers Function">Servers Function</SelectItem>
                <SelectItem value="External Auditors">External Auditors</SelectItem>
              </SelectContent>
            </Select>
            {errors.assetCategory && (
              <p className="text-sm text-red-600 mt-1">{errors.assetCategory.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="assetDescription">Asset Description</Label>
            <Textarea
              id="assetDescription"
              {...register("assetDescription")}
              placeholder="Describe the specific asset involved in this risk..."
              rows={3}
              data-testid="textarea-asset-description"
            />
            {errors.assetDescription && (
              <p className="text-sm text-red-600 mt-1">{errors.assetDescription.message}</p>
            )}
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {errors.status && <p className="text-sm text-red-600 mb-1">{errors.status.message}</p>}
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(value) => setValue("status", value as any)} value={status}>
            <SelectTrigger data-testid="select-risk-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="identified">Identified</SelectItem>
              <SelectItem value="in_assessment">In Assessment</SelectItem>
              <SelectItem value="pending_treatment">Pending Treatment</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="remediated">Remediated</SelectItem>
              <SelectItem value="monitoring">Monitoring</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="statusComments">Status comments</Label>
          <Textarea
            id="statusComments"
            {...register("statusComments")}
            placeholder="Add comments about status..."
            rows={2}
          />
        </div>
      </div>

      {/* CIA Impact Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Impact Assessment (CIA)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="confidentialityImpact">Confidentiality (1-5)</Label>
            <Select 
              onValueChange={(value) => setValue("confidentialityImpact", parseInt(value))}
              defaultValue={confidentialityImpact?.toString() || "1"}
            >
              <SelectTrigger data-testid="select-confidentiality-impact">
                <SelectValue placeholder="Select confidentiality impact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Low</SelectItem>
                <SelectItem value="2">2 - Low</SelectItem>
                <SelectItem value="3">3 - Medium</SelectItem>
                <SelectItem value="4">4 - High</SelectItem>
                <SelectItem value="5">5 - Very High</SelectItem>
              </SelectContent>
            </Select>
            {errors.confidentialityImpact && (
              <p className="text-sm text-red-600 mt-1">{errors.confidentialityImpact.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="integrityImpact">Integrity (1-5)</Label>
            <Select 
              onValueChange={(value) => setValue("integrityImpact", parseInt(value))}
              defaultValue={integrityImpact?.toString() || "1"}
            >
              <SelectTrigger data-testid="select-integrity-impact">
                <SelectValue placeholder="Select integrity impact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Low</SelectItem>
                <SelectItem value="2">2 - Low</SelectItem>
                <SelectItem value="3">3 - Medium</SelectItem>
                <SelectItem value="4">4 - High</SelectItem>
                <SelectItem value="5">5 - Very High</SelectItem>
              </SelectContent>
            </Select>
            {errors.integrityImpact && (
              <p className="text-sm text-red-600 mt-1">{errors.integrityImpact.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="availabilityImpact">Availability (1-5)</Label>
            <Select 
              onValueChange={(value) => setValue("availabilityImpact", parseInt(value))}
              defaultValue={availabilityImpact?.toString() || "1"}
            >
              <SelectTrigger data-testid="select-availability-impact">
                <SelectValue placeholder="Select availability impact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Low</SelectItem>
                <SelectItem value="2">2 - Low</SelectItem>
                <SelectItem value="3">3 - Medium</SelectItem>
                <SelectItem value="4">4 - High</SelectItem>
                <SelectItem value="5">5 - Very High</SelectItem>
              </SelectContent>
            </Select>
            {errors.availabilityImpact && (
              <p className="text-sm text-red-600 mt-1">{errors.availabilityImpact.message}</p>
            )}
          </div>
        </div>

        {/* Calculated Average Impact (read-only) */}
        <div className="bg-gray-50 p-3 rounded-md">
          <Label className="text-sm text-gray-600">Calculated Overall Impact</Label>
          <div className="text-lg font-semibold text-gray-800">
            {averageImpact} - {averageImpact === 1 ? "Very Low" : 
                              averageImpact === 2 ? "Low" : 
                              averageImpact === 3 ? "Medium" : 
                              averageImpact === 4 ? "High" : "Very High"}
          </div>
          <div className="text-xs text-gray-500">
            Average of C:{confidentialityImpact}, I:{integrityImpact}, A:{availabilityImpact}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="likelihood">Likelihood (1-5)</Label>
          <Select 
            onValueChange={(value) => setValue("likelihood", parseInt(value))}
            defaultValue={initialData?.likelihood?.toString() || "1"}
          >
            <SelectTrigger data-testid="select-risk-likelihood">
              <SelectValue placeholder="Select likelihood level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Very Unlikely</SelectItem>
              <SelectItem value="2">2 - Unlikely</SelectItem>
              <SelectItem value="3">3 - Possible</SelectItem>
              <SelectItem value="4">4 - Likely</SelectItem>
              <SelectItem value="5">5 - Very Likely</SelectItem>
            </SelectContent>
          </Select>
          {errors.likelihood && (
            <p className="text-sm text-red-600 mt-1">{errors.likelihood.message}</p>
          )}
        </div>
      </div>

      {/* Risk Score Display */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
          <CardDescription>Calculated risk score and level based on CIA impact average and likelihood</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Risk Score</p>
              <p className="text-3xl font-bold text-gray-900" data-testid="calculated-risk-score">
                {riskScore}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-md ${color}`}>
              <p className="font-semibold" data-testid="calculated-risk-level">
                {level}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
  {errors.mitigationPlan && <p className="text-sm text-red-600 mb-1">{errors.mitigationPlan.message}</p>}
  <Label htmlFor="mitigationPlan">Mitigation Plan <span className="text-red-600">*</span></Label>
  <Textarea id="mitigationPlan" {...register("mitigationPlan", { setValueAs: v => typeof v === 'string' && v.trim().length > 0 ? v : '-' })} placeholder="Mitigation plan is required. Please describe the plan to mitigate this risk..." rows={4} data-testid="textarea-mitigation-plan" />
      </div>

      {/* --- New Fields Section --- */}
      <div className="pt-8 border-t mt-8 space-y-6">
        <h3 className="text-lg font-semibold">Residual Risk & Tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="riskResponseStrategy">Risk Response Strategy</Label>
            <Select
              onValueChange={(value) => setValue("riskResponseStrategy", value as any)}
              value={riskResponseStrategy}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Accept">Accept</SelectItem>
                <SelectItem value="Mitigate">Mitigate</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
                <SelectItem value="Avoid">Avoid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="newMeasuresAndControls">New measures and controls</Label>
            <Textarea
              id="newMeasuresAndControls"
              {...register("newMeasuresAndControls")}
              placeholder="Describe new measures and controls..."
              rows={2}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="residualImpactLevel">Residual Impact Level</Label>
            <Select
              onValueChange={(value) => setValue("residualImpactLevel", value as any)}
              value={residualImpactLevel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select impact level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Very Low">Very Low</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Very High">Very High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="residualImpactRating">Residual Impact Rating</Label>
            <Input
              id="residualImpactRating"
              type="number"
              min={1}
              max={5}
              {...register("residualImpactRating", {
                setValueAs: v => {
                  if (v === "" || v === undefined || v === null) return undefined;
                  const num = Number(v);
                  return Number.isNaN(num) ? undefined : num;
                }
              })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="residualLikelihoodLevel">Residual Likelihood Level</Label>
            <Select
              onValueChange={(value) => setValue("residualLikelihoodLevel", value as any)}
              value={residualLikelihoodLevel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select likelihood level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rare">Rare</SelectItem>
                <SelectItem value="Unlikely">Unlikely</SelectItem>
                <SelectItem value="Possible">Possible</SelectItem>
                <SelectItem value="Likely">Likely</SelectItem>
                <SelectItem value="Highly Likely">Highly Likely</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="residualLikelihoodRating">Residual Likelihood Rating</Label>
            <Input
              id="residualLikelihoodRating"
              type="number"
              min={1}
              max={5}
              {...register("residualLikelihoodRating", {
                setValueAs: v => {
                  if (v === "" || v === undefined || v === null) return undefined;
                  const num = Number(v);
                  return Number.isNaN(num) ? undefined : num;
                }
              })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="residualRiskLevel">Residual Risk Level</Label>
            <Select
              onValueChange={(value) => setValue("residualRiskLevel", value as any)}
              value={residualRiskLevel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="residualRiskRating">Residual Risk Rating</Label>
            <Input
              id="residualRiskRating"
              type="number"
              min={1}
              max={10}
              {...register("residualRiskRating", {
                setValueAs: v => {
                  if (v === "" || v === undefined || v === null) return undefined;
                  const num = Number(v);
                  return Number.isNaN(num) ? undefined : num;
                }
              })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="riskDueDate">Risk Due Date</Label>
            <Input
              id="riskDueDate"
              type="date"
              {...register("riskDueDate")}
            />
          </div>
          <div>
            <Label htmlFor="riskCloseDate">Risk Close Date</Label>
            <Input
              id="riskCloseDate"
              type="date"
              {...register("riskCloseDate")}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="overdue">Overdue? <span className="text-sm text-gray-500">(Auto-calculated)</span></Label>
            <Input
              id="overdue"
              {...register("overdue")}
              placeholder="Automatically calculated based on response strategy and dates"
              readOnly
              disabled
              className="bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>
          <div>
            <Label htmlFor="nextReviewDate">Next Review Date</Label>
            <Input
              id="nextReviewDate"
              type="date"
              {...register("nextReviewDate")}
            />
          </div>
        </div>
      </div>
      {/* --- End New Fields Section --- */}

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button type="button" variant="outline">
          Save as Draft
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          data-testid="button-submit-risk"
        >
          {isLoading ? "Creating..." : "Create Risk Entry"}
        </Button>
      </div>
    </form>
    </>
  );
}
