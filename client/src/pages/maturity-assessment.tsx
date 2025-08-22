import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, BarChart3, Target, TrendingUp, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { assessmentQuestions, maturityLevels } from "@/data/maturityAssessmentData";

// Maturity levels configuration - imported from data file

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

export default function MaturityAssessment() {
  // PDF download handler - structured report
  const handleDownloadPDF = () => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    let y = 40;
    const left = 40;
    const lineHeight = 24;

    // Organization name and date
    pdf.setFontSize(16);
    pdf.text(`Organization: ${selectedOrganization?.name || "N/A"}`, left, y);
    y += lineHeight;
    pdf.setFontSize(12);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, left, y);
    y += lineHeight * 2;

    // Dashboard metrics
    pdf.setFontSize(14);
    pdf.text("Dashboard Metrics", left, y);
    y += lineHeight;
    pdf.setFontSize(12);
    pdf.text(`Current Maturity Score: ${calculateMaturityScore('current')}`, left, y);
    y += lineHeight;
    pdf.text(`Target Maturity Score: ${calculateMaturityScore('target')}`, left, y);
    y += lineHeight;
    pdf.text(`Gap to Target: ${(parseFloat(calculateMaturityScore('target')) - parseFloat(calculateMaturityScore('current'))).toFixed(2)}`, left, y);
    y += lineHeight * 2;

    // Controls under target score
    pdf.setFontSize(14);
    pdf.text("Controls Under Target Score", left, y);
    y += lineHeight;

    // Table with autoTable
    const underTarget = assessmentData.filter(a => (a.currentMaturityScore || 0) < (a.targetMaturityScore || 0));
    const getColor = (level: string): [number, number, number] => {
      const found = maturityLevels.find(l => l.value === level);
      // Always return a 3-element array
      if (!found) return [255,255,255];
      switch (found.color) {
        case "bg-red-100 text-red-800": return [255, 204, 203];
        case "bg-orange-100 text-orange-800": return [255, 229, 180];
        case "bg-yellow-100 text-yellow-800": return [255, 255, 199];
        case "bg-blue-100 text-blue-800": return [199, 224, 255];
        case "bg-green-100 text-green-800": return [199, 255, 220];
        case "bg-purple-100 text-purple-800": return [229, 199, 255];
        case "bg-gray-100 text-gray-800": return [240, 240, 240];
        default: return [255,255,255];
      }
    };

    const tableData = underTarget.map(a => [
      a.category || '',
      a.section || '',
      a.standardRef || '',
      a.question || '',
      maturityLevels.find(l => l.value === a.currentMaturityLevel)?.label || a.currentMaturityLevel || '',
      maturityLevels.find(l => l.value === a.targetMaturityLevel)?.label || a.targetMaturityLevel || '',
      a.currentComments || ''
    ]);
    autoTable(pdf, {
      head: [["Category", "Section", "Standard Ref", "Question", "Current Maturity Level", "Target Maturity Level", "Comments"]],
      body: tableData,
      startY: y,
      styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 70 },
        2: { cellWidth: 60 },
        3: { cellWidth: 160 },
        4: { cellWidth: 70 },
        5: { cellWidth: 70 },
        6: { cellWidth: 70 }
      },
      headStyles: { fillColor: [230, 230, 230] },
      didParseCell: function (data) {
        // Color current maturity level cell
        if (data.section === 'body' && data.column.index === 4) {
          const row = underTarget[data.row.index];
          data.cell.styles.fillColor = getColor(row.currentMaturityLevel);
        }
        // Color target maturity level cell
        if (data.section === 'body' && data.column.index === 5) {
          const row = underTarget[data.row.index];
          data.cell.styles.fillColor = getColor(row.targetMaturityLevel);
        }
      }
    });

    pdf.save("ISO27001-GAP-Assessment.pdf");
  };
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedOrganizationId, selectedOrganization } = useOrganizations();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const allQuestions = [...assessmentQuestions];
  const [assessmentData, setAssessmentData] = useState(allQuestions);

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
    // If API returns a complete set, use it. Otherwise, fallback to allQuestions
    if (apiAssessments && Array.isArray(apiAssessments) && apiAssessments.length >= allQuestions.length) {
      setAssessmentData(apiAssessments);
    } else {
      setAssessmentData(allQuestions);
    }
  }, [apiAssessments, selectedOrganizationId]);

  // Calculate overall maturity score
  const calculateMaturityScore = (type: 'current' | 'target') => {
    const scoreKey = type === 'current' ? 'currentMaturityScore' : 'targetMaturityScore';
    const totalScore = assessmentData.reduce((sum, item) => {
      return sum + (item[scoreKey] || 0);
    }, 0);
    return assessmentData.length > 0 ? (totalScore / assessmentData.length).toFixed(2) : "0.00";
  };

  // Calculate category scores
  const calculateCategoryScore = (categoryName: string, type: 'current' | 'target') => {
    const scoreKey = type === 'current' ? 'currentMaturityScore' : 'targetMaturityScore';
    const categoryItems = assessmentData.filter(item => item.category === categoryName);
    const totalScore = categoryItems.reduce((sum, item) => sum + (item[scoreKey] || 0), 0);
    return categoryItems.length > 0 ? (totalScore / categoryItems.length).toFixed(2) : "0.00";
  };

  // Save assessment data
  const saveAssessmentMutation = useMutation({
    mutationFn: async (assessments: typeof assessmentData) => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }
      
      const response = await apiRequest(
        "POST",
        `/api/organizations/${selectedOrganizationId}/maturity-assessments`,
        assessments.map(({ id, ...rest }) => rest) // Remove id field for API
      );
      
      if (!response.ok) {
        throw new Error('Failed to save maturity assessments');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Maturity assessment saved successfully",
      });
      refetch(); // Refetch the data
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save assessment",
        variant: "destructive",
      });
    },
  });

  const saveAssessment = () => {
    saveAssessmentMutation.mutate(assessmentData);
  };

  // Update assessment item
  const updateAssessmentItem = (id: number, field: string, value: any) => {
    setAssessmentData(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Auto-update score when maturity level changes
        if (field === 'currentMaturityLevel') {
          const level = maturityLevels.find(l => l.value === value);
          updated.currentMaturityScore = level ? level.score : 0;
        } else if (field === 'targetMaturityLevel') {
          const level = maturityLevels.find(l => l.value === value);
          updated.targetMaturityScore = level ? level.score : 0;
        }
        
        return updated;
      }
      return item;
    }));
  };

  // Filter assessments by category
  const filteredAssessments = selectedCategory === "all" 
    ? assessmentData 
    : assessmentData.filter(item => {
        if (selectedCategory === "mandatory") return item.category === "Mandatory Clauses";
        if (selectedCategory === "annexa") return item.category === "Annex A Controls";
        return true;
      });

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
          <div className="mb-4 flex justify-end">
            <Button variant="default" onClick={handleDownloadPDF}>
              Download PDF Report
            </Button>
          </div>
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">ISO27001 GAP Assessment</h1>
                  <p className="text-gray-600 mt-2">ISO 27001 Information Security Management System Maturity Assessment</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
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
                      <TableRow>
                        <TableHead className="w-32">Category</TableHead>
                        <TableHead className="w-40">Section</TableHead>
                        <TableHead className="w-24">Standard Ref</TableHead>
                        <TableHead className="w-80">Assessment Question</TableHead>
                        <TableHead className="w-48">Current Maturity Level</TableHead>
                        <TableHead className="w-60">Current Comments</TableHead>
                        <TableHead className="w-48">Target Maturity Level</TableHead>
                        <TableHead className="w-60">Target Comments</TableHead>
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

            {/* Save Button */}
            {canEditAssessments && (
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={saveAssessment} 
                  className="flex items-center space-x-2"
                  disabled={saveAssessmentMutation.isPending}
                >
                  <Save className="w-4 h-4" />
                  <span>{saveAssessmentMutation.isPending ? "Saving..." : "Save Assessment"}</span>
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
