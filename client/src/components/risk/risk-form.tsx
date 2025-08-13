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
      impact: initialData?.impact || 1,
      likelihood: initialData?.likelihood || 1,
      mitigationPlan: initialData?.mitigationPlan || "",
    },
  });

  const impact = watch("impact");
  const likelihood = watch("likelihood");
  const riskScore = impact * likelihood;

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="impact">Impact (1-5)</Label>
          <Select 
            onValueChange={(value) => setValue("impact", parseInt(value))}
            defaultValue={initialData?.impact?.toString() || "1"}
          >
            <SelectTrigger data-testid="select-risk-impact">
              <SelectValue placeholder="Select impact level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Very Low</SelectItem>
              <SelectItem value="2">2 - Low</SelectItem>
              <SelectItem value="3">3 - Medium</SelectItem>
              <SelectItem value="4">4 - High</SelectItem>
              <SelectItem value="5">5 - Very High</SelectItem>
            </SelectContent>
          </Select>
          {errors.impact && (
            <p className="text-sm text-red-600 mt-1">{errors.impact.message}</p>
          )}
        </div>

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
          <CardDescription>Calculated risk score and level based on impact and likelihood</CardDescription>
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
