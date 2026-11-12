import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, CheckCircle2, AlertCircle, Lightbulb, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function TriggerComments({ episodeId, triggerIndex }) {
  const [commentText, setCommentText] = useState("");
  const [commentType, setCommentType] = useState("general");

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["triggerComments", episodeId, triggerIndex],
    queryFn: () => base44.entities.TriggerComment.filter({
      episode_id: episodeId,
      trigger_index: triggerIndex
    }),
    enabled: !!episodeId && triggerIndex !== undefined,
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.TriggerComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["triggerComments", episodeId, triggerIndex] });
      setCommentText("");
    },
  });

  const resolveCommentMutation = useMutation({
    mutationFn: ({ id, resolved }) => base44.entities.TriggerComment.update(id, { resolved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["triggerComments", episodeId, triggerIndex] });
    },
  });

  const handleAddComment = () => {
    if (!commentText.trim()) return;

    addCommentMutation.mutate({
      episode_id: episodeId,
      trigger_index: triggerIndex,
      author_email: user.email,
      author_name: user.full_name,
      comment_text: commentText,
      comment_type: commentType,
      resolved: false
    });
  };

  const typeIcons = {
    general: MessageSquare,
    suggestion: Lightbulb,
    issue: AlertCircle,
    approval: CheckCircle2
  };

  const typeColors = {
    general: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    suggestion: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    issue: "bg-red-500/20 text-red-300 border-red-500/30",
    approval: "bg-green-500/20 text-green-300 border-green-500/30"
  };

  const sortedComments = [...comments].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  const unresolvedCount = comments.filter(c => !c.resolved).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-white/40" />
          <span className="text-xs font-medium text-white/60">
            Comments ({comments.length})
          </span>
          {unresolvedCount > 0 && (
            <Badge className="bg-amber-500/20 text-amber-300 text-xs">
              {unresolvedCount} unresolved
            </Badge>
          )}
        </div>
      </div>

      {/* Add Comment */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Select value={commentType} onValueChange={setCommentType}>
            <SelectTrigger className="w-32 h-8 bg-white/[0.04] border-white/[0.08] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="suggestion">Suggestion</SelectItem>
              <SelectItem value="issue">Issue</SelectItem>
              <SelectItem value="approval">Approval</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="bg-white/[0.04] border-white/[0.08] text-white text-sm min-h-[60px] flex-1"
          />
          <Button
            onClick={handleAddComment}
            disabled={!commentText.trim() || addCommentMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 h-auto"
          >
            {addCommentMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {sortedComments.map((comment) => {
          const Icon = typeIcons[comment.comment_type];
          return (
            <div
              key={comment.id}
              className={`p-3 rounded-lg border ${
                comment.resolved
                  ? 'bg-white/[0.02] border-white/[0.04] opacity-60'
                  : 'bg-white/[0.04] border-white/[0.08]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white/70">
                    {comment.author_name}
                  </span>
                  <Badge className={typeColors[comment.comment_type]}>
                    <Icon className="w-3 h-3 mr-1" />
                    {comment.comment_type}
                  </Badge>
                  {comment.resolved && (
                    <Badge className="bg-green-500/20 text-green-300 text-xs">
                      Resolved
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-white/30">
                  {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-white/80 mb-2">{comment.comment_text}</p>
              {!comment.resolved && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => resolveCommentMutation.mutate({ id: comment.id, resolved: true })}
                  className="text-xs text-green-400 hover:text-green-300 h-6 px-2"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Mark Resolved
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}