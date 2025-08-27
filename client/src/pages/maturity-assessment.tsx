import React, { useState, useEffect } from "react";
import { MaturityAssessmentReportEditor, generateMaturityAssessmentPDF } from "@/components/MaturityAssessmentPDF.tsx";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assessmentQuestions, maturityLevels } from "@/data/maturityAssessmentData";

const categories = [
  { id: "mandatory", name: "Mandatory Clauses", sections: [
    "4 - Context of the organization",
    "5 - Leadership", 
    "6 - Planning",
    "7 - Support",
    "8 - Operation",
    "9 - Performance evaluation",
    "10 - Improvement"
  ]},
  { id: "annexa", name: "Annex A Controls", sections: [
    "A.5 - Organizational controls",
    "A.6 - People controls", 
    "A.7 - Physical controls",
    "A.8 - Technological controls"
  ]}
];

// Icon components (replace with actual imports or use placeholder SVGs)
const BarChart3 = (props: any) => <span {...props}>📊</span>;
const Target = (props: any) => <span {...props}>🎯</span>;
const TrendingUp = (props: any) => <span {...props}>📈</span>;
const Save = (props: any) => <span {...props}>💾</span>;

export default function MaturityAssessment() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedOrganizationId, selectedOrganization } = useOrganizations();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const allQuestions = [...assessmentQuestions];
  const [assessmentData, setAssessmentData] = useState(allQuestions);
  const [gapAssessmentTemplate, setGapAssessmentTemplate] = useState("");

  // Load template from localStorage on mount/organization change
  useEffect(() => {
    if (selectedOrganizationId) {
      const saved = localStorage.getItem(`gapAssessmentTemplate_${selectedOrganizationId}`);
      if (saved) setGapAssessmentTemplate(saved);
    }
  }, [selectedOrganizationId]);

  // Permission checks
  const userRole = selectedOrganization?.role;
  const canEditAssessments = userRole !== 'read-only';

  // Fetch maturity assessments from API
  const { data: apiAssessments, isLoading: isLoadingAssessments, refetch } = useQuery({
    queryKey: ["/api/organizations", selectedOrganizationId, "maturity-assessments"],
    queryFn: async () => {
      if (!selectedOrganizationId) return [];
      const response = await apiRequest("GET", `/api/organizations/${selectedOrganizationId}/maturity-assessments`);
      if (!response.ok) {
        throw new Error("Failed to fetch maturity assessments");
      }
      return response.json();
    },
    enabled: !!selectedOrganizationId,
  });

  // Use API data if available, otherwise use default data
  useEffect(() => {
    if (apiAssessments && Array.isArray(apiAssessments) && apiAssessments.length >= allQuestions.length) {
      setAssessmentData(apiAssessments);
    } else {
      setAssessmentData(allQuestions);
    }
  }, [apiAssessments, selectedOrganizationId]);

  // PDF download handler using the new generator
  const handleDownloadPDF = async () => {
    await generateMaturityAssessmentPDF({
      maturityLevels,
      gapTableData: assessmentData.map(a => [
        a.category || '',
        a.section || '',
        a.standardRef || '',
        a.question || '',
        maturityLevels.find(l => l.value === a.currentMaturityLevel)?.label || a.currentMaturityLevel || '',
        maturityLevels.find(l => l.value === a.targetMaturityLevel)?.label || a.targetMaturityLevel || '',
        a.currentComments || ''
      ]),
      gapAssessmentTemplate,
    });
        await generateMaturityAssessmentPDF({
          maturityLevels,
          gapTableData: assessmentData.map(a => [
            a.category || '',
            a.section || '',
            a.standardRef || '',
            a.question || '',
            maturityLevels.find(l => l.value === a.currentMaturityLevel)?.label || a.currentMaturityLevel || '',
            maturityLevels.find(l => l.value === a.targetMaturityLevel)?.label || a.targetMaturityLevel || '',
            a.currentComments || ''
          ]),
          gapAssessmentTemplate,
        });
  };

  // Utility: Calculate average maturity score
  function calculateMaturityScore(type: 'current' | 'target') {
    if (!assessmentData.length) return '0.00';
    const scores = assessmentData.map(a => {
      const level = maturityLevels.find(l => l.value === a[type + 'MaturityLevel']);
      return level ? level.score : 0;
    });
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return avg.toFixed(2);
  }

  // Utility: Calculate average score for a category
  function calculateCategoryScore(category: string, type: 'current' | 'target') {
    const filtered = assessmentData.filter(a => a.category === category);
    if (!filtered.length) return '0.00';
    const scores = filtered.map(a => {
      const level = maturityLevels.find(l => l.value === a[type + 'MaturityLevel']);
      return level ? level.score : 0;
    });
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return avg.toFixed(2);
  }

  // Utility: Filter assessments by selected category
  const filteredAssessments = selectedCategory === 'all'
    ? assessmentData
    : assessmentData.filter(a => a.category === (selectedCategory === 'mandatory' ? 'Mandatory Clauses' : 'Annex A Controls'));

  // Utility: Update assessment item
  function updateAssessmentItem(id: number, field: string, value: any) {
    setAssessmentData(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  }

  // Save assessment mutation (mock)
  const saveAssessmentMutation = {
    isPending: false,
    mutateAsync: async () => Promise.resolve(),
  };

  // Save assessment handler
  async function saveAssessment() {
    saveAssessmentMutation.isPending = true;
    try {
      // TODO: Replace with actual API call
      await saveAssessmentMutation.mutateAsync();
      toast({ title: "Assessment saved successfully!" });
    } catch (err) {
      toast({ title: "Error saving assessment", description: String(err), variant: "destructive" });
    } finally {
      saveAssessmentMutation.isPending = false;
    }
  }

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
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <MaturityAssessmentReportEditor 
                organizationId={selectedOrganizationId}
                initialTemplate={gapAssessmentTemplate}
                onSave={setGapAssessmentTemplate}
              />
            </div>
            <Button variant="default" onClick={handleDownloadPDF}>
              Download PDF Report
            </Button>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Maturity Score</p>
                    <p className="text-3xl font-bold text-blue-600">{calculateMaturityScore('current')}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <Progress value={parseFloat(calculateMaturityScore('current')) * 20} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Target Maturity Score</p>
                    <p className="text-3xl font-bold text-green-600">{calculateMaturityScore('target')}</p>
                  </div>
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <Progress value={parseFloat(calculateMaturityScore('target')) * 20} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gap to Target</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {(parseFloat(calculateMaturityScore('target')) - parseFloat(calculateMaturityScore('current'))).toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList>
                <TabsTrigger value="all">All Categories</TabsTrigger>
                <TabsTrigger value="mandatory">Mandatory Clauses</TabsTrigger>
                <TabsTrigger value="annexa">Annex A Controls</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Category Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {categories.map(category => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Current: {calculateCategoryScore(category.name, 'current')}</p>
                      <p className="text-sm text-gray-600">Target: {calculateCategoryScore(category.name, 'target')}</p>
                    </div>
                    <Badge variant="outline">
                      {assessmentData.filter(item => item.category === category.name).length} items
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Assessment Table */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
              <CardDescription>
                Review and update maturity levels for each assessment criterion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-200">
                      <TableHead className="w-32 text-gray-800 font-bold">Category</TableHead>
                      <TableHead className="w-40 text-gray-800 font-bold">Section</TableHead>
                      <TableHead className="w-24 text-gray-800 font-bold">Standard Ref</TableHead>
                      <TableHead className="w-80 text-gray-800 font-bold">Assessment Question</TableHead>
                      <TableHead className="w-48 text-gray-800 font-bold">Current Maturity Level</TableHead>
                      <TableHead className="w-60 text-gray-800 font-bold">Current Comments</TableHead>
                      <TableHead className="w-48 text-gray-800 font-bold">Target Maturity Level</TableHead>
                      <TableHead className="w-60 text-gray-800 font-bold">Target Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {assessment.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{assessment.section}</TableCell>
                        <TableCell>{assessment.standardRef}</TableCell>
                        <TableCell className="max-w-80">
                          <div className="text-sm leading-relaxed break-words">{assessment.question}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${maturityLevels.find(l => l.value === assessment.currentMaturityLevel)?.color || 'bg-gray-100 text-gray-800'}`}> 
                            <Select
                              value={assessment.currentMaturityLevel}
                              onValueChange={(value) => updateAssessmentItem(assessment.id, 'currentMaturityLevel', value)}
                              disabled={!canEditAssessments}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {maturityLevels.map((level) => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={assessment.currentComments}
                            onChange={(e) => updateAssessmentItem(assessment.id, 'currentComments', e.target.value)}
                            placeholder="Current comments..."
                            className="min-h-[70px] w-full max-w-60"
                            disabled={!canEditAssessments}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge className={`${maturityLevels.find(l => l.value === assessment.targetMaturityLevel)?.color || 'bg-gray-100 text-gray-800'}`}> 
                            <Select
                              value={assessment.targetMaturityLevel}
                              onValueChange={(value) => updateAssessmentItem(assessment.id, 'targetMaturityLevel', value)}
                              disabled={!canEditAssessments}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {maturityLevels.map((level) => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={assessment.targetComments}
                            onChange={(e) => updateAssessmentItem(assessment.id, 'targetComments', e.target.value)}
                            placeholder="Target comments..."
                            className="min-h-[70px] w-full max-w-60"
                            disabled={!canEditAssessments}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Save Button & Edit Report Template Button */}
          {canEditAssessments && (
            <div className="mt-6 flex justify-end space-x-4">
              <Button 
                onClick={saveAssessment} 
                className="flex items-center space-x-2"
                disabled={saveAssessmentMutation.isPending}
              >
                <Save className="w-4 h-4" />
                <span>{saveAssessmentMutation.isPending ? "Saving..." : "Save Assessment"}</span>
              </Button>
              <MaturityAssessmentReportEditor 
                organizationId={selectedOrganizationId}
                initialTemplate={gapAssessmentTemplate}
                onSave={setGapAssessmentTemplate}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
