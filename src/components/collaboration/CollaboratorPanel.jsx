import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Check, X, Loader2, Users, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function CollaboratorPanel({ episodeId, episodeTitle, triggerCount }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("reviewer");
  const [inviteMessage, setInviteMessage] = useState("");
  const [specificTriggers, setSpecificTriggers] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: collaborators = [] } = useQuery({
    queryKey: ["collaborators", episodeId],
    queryFn: () => base44.entities.EpisodeCollaborator.filter({ episode_id: episodeId }),
    enabled: !!episodeId,
  });

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      const permissions = {
        can_edit_triggers: data.role === "editor",
        can_comment: true,
        can_approve: data.role === "reviewer" || data.role === "editor",
        specific_trigger_indices: data.specific_trigger_indices || []
      };

      return base44.entities.EpisodeCollaborator.create({
        episode_id: episodeId,
        collaborator_email: data.email,
        role: data.role,
        permissions: permissions,
        invited_by: user.email,
        invitation_message: data.message,
        status: "pending"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", episodeId] });
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteMessage("");
      setSpecificTriggers("");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.EpisodeCollaborator.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", episodeId] });
    },
  });

  const handleInvite = () => {
    if (!inviteEmail) return;

    const triggerIndices = specificTriggers
      .split(',')
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n) && n >= 0);

    inviteMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
      message: inviteMessage,
      specific_trigger_indices: triggerIndices.length > 0 ? triggerIndices : undefined
    });
  };

  const roleColors = {
    editor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    reviewer: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    viewer: "bg-gray-500/20 text-gray-300 border-gray-500/30"
  };

  const statusColors = {
    pending: "bg-amber-500/20 text-amber-300",
    accepted: "bg-green-500/20 text-green-300",
    declined: "bg-red-500/20 text-red-300"
  };

  return (
    <Card className="bg-[#13131a] border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/90 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            Team Collaboration
          </CardTitle>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 h-8">
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#13131a] border-white/10 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Invite Collaborator</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label className="text-xs text-white/40 mb-1.5">Email Address</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="collaborator@example.com"
                    className="h-9 bg-white/[0.04] border-white/[0.08] text-white"
                  />
                </div>

                <div>
                  <Label className="text-xs text-white/40 mb-1.5">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="h-9 bg-white/[0.04] border-white/[0.08] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor (can edit triggers)</SelectItem>
                      <SelectItem value="reviewer">Reviewer (can comment & approve)</SelectItem>
                      <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-white/40 mb-1.5">
                    Specific Triggers (optional)
                  </Label>
                  <Input
                    value={specificTriggers}
                    onChange={(e) => setSpecificTriggers(e.target.value)}
                    placeholder="e.g., 0,1,2 (comma-separated indices)"
                    className="h-9 bg-white/[0.04] border-white/[0.08] text-white"
                  />
                  <p className="text-xs text-white/30 mt-1">
                    Leave empty for access to all triggers
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-white/40 mb-1.5">Invitation Message</Label>
                  <Textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Hey! I'd love your feedback on these triggers..."
                    className="bg-white/[0.04] border-white/[0.08] text-white min-h-[80px]"
                  />
                </div>

                <Button
                  onClick={handleInvite}
                  disabled={inviteMutation.isPending || !inviteEmail}
                  className="w-full bg-violet-600 hover:bg-violet-700 h-9"
                >
                  {inviteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {collaborators.length === 0 ? (
          <div className="text-center py-6 text-white/40 text-sm">
            No collaborators yet. Invite team members to review and edit triggers.
          </div>
        ) : (
          <div className="space-y-2">
            {collaborators.map((collab) => (
              <div
                key={collab.id}
                className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white/90">
                      {collab.collaborator_email}
                    </p>
                    <Badge className={roleColors[collab.role]}>
                      {collab.role}
                    </Badge>
                    <Badge className={statusColors[collab.status]}>
                      {collab.status}
                    </Badge>
                  </div>
                  {collab.permissions?.specific_trigger_indices?.length > 0 && (
                    <p className="text-xs text-white/40 mt-1">
                      Access to triggers: {collab.permissions.specific_trigger_indices.join(', ')}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeMutation.mutate(collab.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}