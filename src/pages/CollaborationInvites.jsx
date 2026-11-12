import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Mail, User } from "lucide-react";

export default function CollaborationInvites() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: invites = [] } = useQuery({
    queryKey: ["pendingInvites"],
    queryFn: () => base44.entities.EpisodeCollaborator.filter({
      collaborator_email: user?.email,
      status: "pending"
    }),
    enabled: !!user,
  });

  const { data: activeCollaborations = [] } = useQuery({
    queryKey: ["activeCollaborations"],
    queryFn: () => base44.entities.EpisodeCollaborator.filter({
      collaborator_email: user?.email,
      status: "accepted"
    }),
    enabled: !!user,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }) => 
      base44.entities.EpisodeCollaborator.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingInvites"] });
      queryClient.invalidateQueries({ queryKey: ["activeCollaborations"] });
    },
  });

  const roleColors = {
    editor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    reviewer: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    viewer: "bg-gray-500/20 text-gray-300 border-gray-500/30"
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Collaboration Invites</h1>
        <p className="text-sm text-white/40 mt-1">Manage your episode collaboration invitations</p>
      </div>

      <div className="space-y-6">
        {/* Pending Invites */}
        <Card className="bg-[#13131a] border-white/10">
          <CardHeader>
            <CardTitle className="text-base font-medium text-white/90 flex items-center gap-2">
              <Mail className="w-4 h-4 text-violet-400" />
              Pending Invitations ({invites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-sm">
                No pending invitations
              </div>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="p-4 bg-white/[0.04] border border-white/[0.08] rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-white/90">
                            Episode ID: {invite.episode_id}
                          </p>
                          <Badge className={roleColors[invite.role]}>
                            {invite.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-white/60 mb-1">
                          Invited by: {invite.invited_by}
                        </p>
                        {invite.invitation_message && (
                          <p className="text-xs text-white/50 italic mt-2 p-2 bg-white/[0.02] rounded border border-white/[0.04]">
                            "{invite.invitation_message}"
                          </p>
                        )}
                        {invite.permissions?.specific_trigger_indices?.length > 0 && (
                          <p className="text-xs text-white/40 mt-2">
                            Access to triggers: {invite.permissions.specific_trigger_indices.join(', ')}
                          </p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => respondMutation.mutate({ id: invite.id, status: "accepted" })}
                            className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => respondMutation.mutate({ id: invite.id, status: "declined" })}
                            className="border-red-500/30 text-red-300 hover:bg-red-500/10 h-7 text-xs"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Collaborations */}
        <Card className="bg-[#13131a] border-white/10">
          <CardHeader>
            <CardTitle className="text-base font-medium text-white/90 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Active Collaborations ({activeCollaborations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeCollaborations.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-sm">
                No active collaborations
              </div>
            ) : (
              <div className="space-y-2">
                {activeCollaborations.map((collab) => (
                  <div
                    key={collab.id}
                    className="p-3 bg-white/[0.04] border border-white/[0.08] rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white/90">
                          Episode ID: {collab.episode_id}
                        </p>
                        <Badge className={roleColors[collab.role]}>
                          {collab.role}
                        </Badge>
                      </div>
                      {collab.permissions?.specific_trigger_indices?.length > 0 && (
                        <p className="text-xs text-white/40 mt-1">
                          Triggers: {collab.permissions.specific_trigger_indices.join(', ')}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `/EpisodeEditor?id=${collab.episode_id}`}
                      className="h-7 text-xs border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                    >
                      Open Editor
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}