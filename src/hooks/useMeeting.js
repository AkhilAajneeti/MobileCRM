import { useQuery } from "@tanstack/react-query";
import { fetchLeadMeeting, fetchMeetingById } from "services/meeting.service";

export const useMeeting = (id, enabled) => {
  return useQuery({
    queryKey: ["meetingId", id],
    queryFn: () => fetchMeetingById(id),
    enabled,
  });
};
export const useLeadMeeting = (leadId, isOpen) => {
  return useQuery({
    queryKey: ["lead-meeting", leadId],
    queryFn: () => fetchLeadMeeting(leadId),
    enabled: !!leadId && isOpen,
  });
};
