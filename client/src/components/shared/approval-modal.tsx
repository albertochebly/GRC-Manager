import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  approval: {
    id: string;
    itemType: string;
    itemId: string;
    submittedByUser: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

export default function ApprovalModal({ isOpen, onClose, approval }: ApprovalModalProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState("");

  const updateApprovalMutation = useMutation({
    mutationFn: async ({ status, comments }: { status: string; comments: string }) => {
      const response = await apiRequest("PUT", `/api/approvals/${approval?.id}/status`, {
        status,
        comments,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Success",
        description: "Approval status updated successfully",
      });
      onClose();
      setComments("");
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
        description: "Failed to update approval status",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    updateApprovalMutation.mutate({ status: "approved", comments });
  };

  const handleReject = () => {
    if (!comments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide comments when rejecting an item",
        variant: "destructive",
      });
      return;
    }
    updateApprovalMutation.mutate({ status: "rejected", comments });
  };

  if (!approval) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="approval-modal">
        <DialogHeader>
          <DialogTitle>Review {approval.itemType === "document" ? "Document" : "Risk"}</DialogTitle>
          <DialogDescription>
            Review the submitted {approval.itemType} and provide your decision
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              {approval.itemType === "document" ? "Document ID" : "Risk ID"}
            </Label>
            <p className="text-sm text-gray-900">{approval.itemId}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Submitted By</Label>
            <p className="text-sm text-gray-900">
              {approval.submittedByUser.firstName} {approval.submittedByUser.lastName}
            </p>
          </div>
          
          <div>
            <Label htmlFor="comments" className="text-sm font-medium text-gray-700">
              Comments (Optional for approval, required for rejection)
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="Add review comments..."
              data-testid="textarea-approval-comments"
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={updateApprovalMutation.isPending}
            data-testid="button-cancel-approval"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={updateApprovalMutation.isPending}
            data-testid="button-reject-approval"
          >
            {updateApprovalMutation.isPending ? "Rejecting..." : "Reject"}
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={updateApprovalMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-approve-approval"
          >
            {updateApprovalMutation.isPending ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
