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
import { 
  pciDssRequirements, 
  statusOptions, 
  getRequirementGroups, 
  calculateCompletionStats,
  type PCIDSSAssessment 
} from "@/data/pciDssAssessmentData";
import { CalendarDays, FileText, Users, CheckCircle, Clock, AlertCircle, Save, Download } from "lucide-react";

export default function PCIDSSGapAssessment() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedOrganizationId, selectedOrganization } = useOrganizations();
  const [selectedRequirement, setSelectedRequirement] = useState("all");
  const [assessmentData, setAssessmentData] = useState<PCIDSSAssessment[]>(pciDssRequirements);

  // Permission checks
  const userRole = selectedOrganization?.role;
  const canEditAssessments = userRole !== 'read-only';

  // Fetch PCI DSS assessments from API (when implemented)
  const { data: apiAssessments, isLoading: isLoadingAssessments, refetch } = useQuery({
    queryKey: ["/api/organizations", selectedOrganizationId, "pci-dss-assessments"],
    queryFn: async () => {
      if (!selectedOrganizationId) return [];
      const response = await apiRequest("GET", `/api/organizations/${selectedOrganizationId}/pci-dss-assessments`);
      if (!response.ok) {
        if (response.status === 404) {
          // If endpoint doesn't exist yet, return empty array
          return [];
        }
        throw new Error("Failed to fetch PCI DSS assessments");
      }
      return response.json();
    },
    enabled: !!selectedOrganizationId,
  });

  // Use API data if available, otherwise use default data
  useEffect(() => {
    if (apiAssessments && Array.isArray(apiAssessments) && apiAssessments.length >= pciDssRequirements.length) {
      setAssessmentData(apiAssessments);
    } else {
      setAssessmentData(pciDssRequirements);
    }
  }, [apiAssessments, selectedOrganizationId]);

  // Save assessment mutation
  const saveAssessmentMutation = useMutation({
    mutationFn: async (data: PCIDSSAssessment[]) => {
      const response = await apiRequest("POST", `/api/organizations/${selectedOrganizationId}/pci-dss-assessments`, {
        assessments: data
      });
      if (!response.ok) {
        throw new Error("Failed to save PCI DSS assessment");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "PCI DSS assessment saved successfully!" });
      refetch();
    },
    onError: (error) => {
      toast({ 
        title: "Error saving assessment", 
        description: String(error), 
        variant: "destructive" 
      });
    },
  });

  // Calculate statistics
  const stats = calculateCompletionStats(assessmentData);
  const requirementGroups = getRequirementGroups();

  // Filter assessments by selected requirement
  const filteredAssessments = selectedRequirement === 'all'
    ? assessmentData
    : assessmentData.filter(a => a.requirement.startsWith(selectedRequirement));

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

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Requirement', 'Description', 'Status', 'Owner', 'Task', 'Completion Date', 'Comments'];
    // Only export non-header items
    const nonHeaderItems = assessmentData.filter(item => !item.isHeader);
    const csvContent = [
      headers.join(','),
      ...nonHeaderItems.map(item => [
        `"${item.requirement}"`,
        `"${item.description.replace(/"/g, '""')}"`,
        `"${item.status}"`,
        `"${item.owner || ''}"`,
        `"${item.task || ''}"`,
        `"${item.completionDate || ''}"`,
        `"${item.comments || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pci-dss-gap-assessment-${selectedOrganization?.name || 'organization'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
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
                    <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
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
                      <TableRow key={assessment.id} className={assessment.isHeader ? 'bg-blue-50 border-b-2 border-blue-200' : ''}>
                        <TableCell>
                          <Badge 
                            variant={assessment.isHeader ? "default" : "outline"}
                            className="font-mono"
                          >
                            {assessment.requirement}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-96">
                          <div className={`text-sm leading-relaxed break-words ${assessment.isHeader ? 'font-semibold text-blue-900' : ''}`}>
                            {assessment.description}
                          </div>
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
        </main>
      </div>
    </div>
  );
}
