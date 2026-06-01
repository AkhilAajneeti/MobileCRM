// hooks/useNotificationCount.js

import { useQuery } from "@tanstack/react-query";
import { fetchUnreadCount } from "services/notification.service";

export const useNotificationCount = (enabled) => {
  return useQuery({
    queryKey: ["notification-count"],
    queryFn: fetchUnreadCount,
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30000,
  });
};