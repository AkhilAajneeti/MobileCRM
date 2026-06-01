import { useQuery } from "@tanstack/react-query";
import { fetchTasksById } from "services/tasks.service";

export const useTask = (id, enabled) => {
    return useQuery({
        queryKey: ["task", id],
        queryFn: () => fetchTasksById(id),
        enabled,
    });
};