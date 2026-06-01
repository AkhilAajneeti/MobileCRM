import { useQuery } from "@tanstack/react-query";
import { fetchRoles } from "services/setting.service";

export const useRoles = () =>
  useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
