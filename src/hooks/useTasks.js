import { useQuery } from "@tanstack/react-query";
import { fetchAllTasks, fetchTasks } from "services/tasks.service";

export const useTasks = () => {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    staleTime: 1000 * 60 * 5,
  });
};
export const useTasksAll = ({ limit, page, filters }) => {
  return useQuery({
    queryKey: ["alltasks", limit, page, filters],
    queryFn: () => fetchAllTasks({ limit, page, filters }),
    placeholderData: (prev) => prev,
  });
};