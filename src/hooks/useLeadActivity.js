// hooks/useLeadActivity.js
import { useQuery } from "@tanstack/react-query";
import { fetchLeadTask, leadActivitesById } from "services/leads.service";

export const useLeadActivity = (leadId, isOpen) => {
    return useQuery({
        queryKey: ["lead-activity", leadId],
        queryFn: () => leadActivitesById(leadId),
        enabled: !!leadId && isOpen,
    });
};
export const useLeadTask = (leadId, isOpen) => {
    return useQuery({
        queryKey: ["lead-task", leadId],
        queryFn: () => fetchLeadTask(leadId),
        enabled: !!leadId && isOpen,
    });
};