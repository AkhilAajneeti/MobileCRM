// hooks/useLeadStream.js
import { useQuery } from "@tanstack/react-query";
import { leadStreamById } from "services/leads.service";

export const useLeadStream = (leadId, isOpen) => {
  return useQuery({
    queryKey: ["lead-stream", leadId],
    queryFn: () => leadStreamById(leadId),
    enabled: !!leadId && isOpen,
  });
};