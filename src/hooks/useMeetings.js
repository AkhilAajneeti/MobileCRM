import { useQuery } from "@tanstack/react-query";
import { fetchAllMeeting, fetchMeeting } from "services/meeting.service";

export const useMeetings = () => {
  return useQuery({
    queryKey: ["meeting"],
    queryFn: fetchMeeting,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAllMeetings = ({ limit, page, filters }) => {
  return useQuery({
    queryKey: ["meetings", limit, page, filters],
    queryFn: () => fetchAllMeeting({ limit, page, filters }),
    placeholderData: (prev) => prev,
  });
};