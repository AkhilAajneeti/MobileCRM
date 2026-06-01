import { useQuery } from "@tanstack/react-query";
import { fetchAllCall } from "../services/call.services";

export const useAllCalls = ({ limit, page, filters }) => {
  return useQuery({
    queryKey: ["calls", limit, page, filters],
    queryFn: () => fetchAllCall({ limit, page, filters }),
    placeholderData: (prev) => prev,
  });
};

