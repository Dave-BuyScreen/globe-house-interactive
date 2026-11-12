import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function NotificationBell() {
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }, "-created_date", 10),
    enabled: !!user?.email,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
          <Bell className="w-5 h-5 text-white/60" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-[#13131a] border-white/[0.08]" align="end">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-white/40 mt-1">{unreadCount} unread</p>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.02] transition-colors ${
                  !notif.read ? "bg-violet-500/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    !notif.read ? "bg-violet-500" : "bg-transparent"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90">{notif.title}</p>
                    <p className="text-xs text-white/50 mt-1">{notif.message}</p>
                    <p className="text-xs text-white/30 mt-2">
                      {new Date(notif.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-3 border-t border-white/[0.06]">
          <Link to={createPageUrl("UserProfile")}>
            <Button variant="ghost" className="w-full text-xs text-white/60 hover:text-white">
              View All in Profile
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}