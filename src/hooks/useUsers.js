// hooks/useUsers.js
import { useQuery } from "@tanstack/react-query";
import { fetchUser } from "services/user.service";

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
};