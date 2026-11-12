import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function TriggerApprovalStatus({ episodeId, triggerIndex, canApprove }) {
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState("approved");
  const [feedback, setFeedback] = useState("");

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ["triggerApprovals", episodeId, triggerIndex],
    queryFn: () => base44.entities.TriggerApproval.filter({
      episode_id: episodeId,
      trigger_index: triggerIndex
    }),
    enabled: !!episodeId && triggerIndex !== undefined,
  });

  const approveMutation = useMutation({
    mutationFn: (data) => base44.entities.TriggerApproval.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["triggerApprovals", episodeId, triggerIndex] });
      setShowApprovalForm(false);
      setFeedback("");
    },
  });

  const handleApprove = () => {
    approveMutation.mutate({
      episode_id: episodeId,
      trigger_index: triggerIndex,
      approver_email: user.email,
      approver_name: user.full_name,
      status: approvalStatus,
      feedback: feedback
    });
  };

  const userApproval = approvals.find(a => a.approver_email === user.email);
  const approvedCount = approvals.filter(a => a.status === "approved").length;
  const rejectedCount = approvals.filter(a => a.status === "rejected").length;
  const needsChangesCount = approvals.filter(a => a.status === "needs_changes").length;

  const statusColors = {
    approved: "bg-green-500/20 text-green-300 border-green-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    needs_changes: "bg-amber-500/20 text-amber-300 border-amber-500/30"
  };

  const statusIcons = {
    approved: CheckCircle2,
    rejected: XCircle,
    needs_changes: AlertTriangle
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/60">Approval Status</span>
          {approvedCount > 0 && (
            <Badge className="bg-green-500/20 text-green-300 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {approvedCount}
            </Badge>
          )}
          {needsChangesCount > 0 && (
            <Badge className="bg-amber-500/20 text-amber-300 text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {needsChangesCount}
            </Badge>
          )}
          {rejectedCount > 0 && (
            <Badge className="bg-red-500/20 text-red-300 text-xs">
              <XCircle className="w-3 h-3 mr-1" />
              {rejectedCount}
            </Badge>
          )}
        </div>
      </div>

      {canApprove && !userApproval && (
        <div>
          {!showApprovalForm ? (
            <Button
              size="sm"
              onClick={() => setShowApprovalForm(true)}
              className="bg-violet-600 hover:bg-violet-700 h-8 text-xs"
            >
              Add Your Review
            </Button>
          ) : (
            <div className="space-y-2 p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setApprovalStatus("approved")}
                  className={`h-7 text-xs flex-1 ${
                    approvalStatus === "approved"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-white/[0.04] hover:bg-white/[0.08]"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  onClick={() => setApprovalStatus("needs_changes")}
                  className={`h-7 text-xs flex-1 ${
                    approvalStatus === "needs_changes"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-white/[0.04] hover:bg-white/[0.08]"
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Needs Changes
                </Button>
                <Button
                  size="sm"
                  onClick={() => setApprovalStatus("rejected")}
                  className={`h-7 text-xs flex-1 ${
                    approvalStatus === "rejected"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-white/[0.04] hover:bg-white/[0.08]"
                  }`}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </div>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add feedback (optional)..."
                className="bg-white/[0.04] border-white/[0.08] text-white text-sm min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="bg-violet-600 hover:bg-violet-700 h-7 text-xs flex-1"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Submit Review"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowApprovalForm(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {userApproval && (
        <div className={`p-3 rounded-lg border ${statusColors[userApproval.status]}`}>
          <div className="flex items-center gap-2 mb-1">
            {React.createElement(statusIcons[userApproval.status], { className: "w-4 h-4" })}
            <span className="text-sm font-medium">
              Your review: {userApproval.status.replace('_', ' ')}
            </span>
          </div>
          {userApproval.feedback && (
            <p className="text-xs opacity-80 mt-1">{userApproval.feedback}</p>
          )}
        </div>
      )}

      {approvals.length > 0 && (
        <div className="space-y-2">
          {approvals.filter(a => a.approver_email !== user.email).map((approval) => {
            const Icon = statusIcons[approval.status];
            return (
              <div
                key={approval.id}
                className={`p-2 rounded-lg border text-xs ${statusColors[approval.status]}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3 h-3" />
                  <span className="font-medium">{approval.approver_name}</span>
                  <span className="opacity-60">• {approval.status.replace('_', ' ')}</span>
                </div>
                {approval.feedback && (
                  <p className="opacity-80 mt-1 pl-5">{approval.feedback}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}