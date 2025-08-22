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
});

type RiskForm = z.infer<typeof riskSchema>;

interface RiskFormProps {
  onSubmit: (data: RiskForm) => void;
  isLoading?: boolean;
  initialData?: Partial<RiskForm>;
}

export default function RiskForm({ onSubmit, isLoading, initialData }: RiskFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RiskForm>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      riskId: initialData?.riskId || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
  riskType: (initialData as any)?.riskType || "asset",
  status: (initialData as any)?.status || "identified",
      assetCategory: (initialData as any)?.assetCategory || "",
      assetDescription: (initialData as any)?.assetDescription || "",
      confidentialityImpact: (initialData as any)?.confidentialityImpact || 1,
      integrityImpact: (initialData as any)?.integrityImpact || 1,
      availabilityImpact: (initialData as any)?.availabilityImpact || 1,
      impact: initialData?.impact || 1,
      likelihood: initialData?.likelihood || 1,
      mitigationPlan: initialData?.mitigationPlan || "",
    },
  });

  const confidentialityImpact = watch("confidentialityImpact");
  const integrityImpact = watch("integrityImpact");
  const availabilityImpact = watch("availabilityImpact");
  const likelihood = watch("likelihood");
  const riskType = watch("riskType");
  
  // Calculate average impact from CIA values
  const averageImpact = Math.round((confidentialityImpact + integrityImpact + availabilityImpact) / 3);
  const riskScore = averageImpact * likelihood;
  
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="risk-form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="riskId">Risk ID</Label>
          <Input
            id="riskId"
            {...register("riskId")}
            placeholder="RISK-2024-001"
            data-testid="input-risk-id"
          />
          {errors.riskId && (
            <p className="text-sm text-red-600 mt-1">{errors.riskId.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="title">Risk Title</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Data Breach Risk"
            data-testid="input-risk-title"
          />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Risk Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Detailed description of the risk..."
          rows={4}
          data-testid="textarea-risk-description"
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="riskType">Risk Type</Label>
        <Select 
          onValueChange={(value) => setValue("riskType", value as "asset" | "scenario")}
          defaultValue={(initialData as any)?.riskType || "asset"}
        >
          <SelectTrigger data-testid="select-risk-type">
            <SelectValue placeholder="Select risk type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asset">Asset-Based Risk</SelectItem>
            <SelectItem value="scenario">Scenario-Based Risk</SelectItem>
          </SelectContent>
        </Select>
        {errors.riskType && (
          <p className="text-sm text-red-600 mt-1">{errors.riskType.message}</p>
        )}
      </div>

      {/* Asset-specific fields - only show for asset-based risks */}
      {riskType === "asset" && (
        <>
          <div>
            <Label htmlFor="assetCategory">Asset Category</Label>
            <Select 
              onValueChange={(value) => setValue("assetCategory", value)}
              defaultValue={(initialData as any)?.assetCategory || ""}
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

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          onValueChange={(value) => setValue("status", value as any)}
          defaultValue={(initialData as any)?.status || "identified"}
        >
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
        {errors.status && (
          <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
        )}
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
        <Label htmlFor="mitigationPlan">Mitigation Plan</Label>
        <Textarea
          id="mitigationPlan"
          {...register("mitigationPlan")}
          placeholder="Describe the plan to mitigate this risk..."
          rows={4}
          data-testid="textarea-mitigation-plan"
        />
        {errors.mitigationPlan && (
          <p className="text-sm text-red-600 mt-1">{errors.mitigationPlan.message}</p>
        )}
      </div>

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
  );
}
