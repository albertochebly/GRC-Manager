import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, FileText, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface ActivityPanelProps {
  pendingApprovals: any[];
  isLoading: boolean;
}

export default function ActivityPanel({ pendingApprovals, isLoading }: ActivityPanelProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>Items requiring your review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getItemIcon = (itemType: string | undefined) => {
    switch (itemType) {
      case "document":
        return FileText;
      case "risk":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getItemTypeLabel = (itemType: string | undefined) => {
    if (!itemType) return "Unknown";
    return itemType.charAt(0).toUpperCase() + itemType.slice(1);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Approvals
        </CardTitle>
        <CardDescription>Items requiring your review</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingApprovals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No pending approvals</p>
            <p className="text-sm">All items are up to date!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.slice(0, 5).map((document: any) => {
              const Icon = getItemIcon("document"); // All items are documents
              return (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`approval-item-${document.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-sm">{document.title || document.name || "Untitled Document"}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Document
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(document.submittedAt || document.updatedAt || document.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    data-testid={`button-review-${document.id}`}
                    onClick={() => navigate(`/documents?edit=${document.id}`)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Review
                  </Button>
                </div>
              );
            })}
            {pendingApprovals.length > 5 && (
              <Button variant="ghost" className="w-full" data-testid="button-view-all-approvals">
                View All ({pendingApprovals.length - 5} more)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}