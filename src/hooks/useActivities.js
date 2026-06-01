import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchActivity } from "services/activity.service";

export const useActivities = ({ limit, page,filters }) => {
  return useQuery({
    queryKey: ["activities", limit, page,filters],
    queryFn: () => fetchActivity({ limit, page,filters }),
    placeholderData: keepPreviousData,
  });
};
