// hooks/useProjects.js
import { useQuery } from "@tanstack/react-query";
import { fetchProjects, fetchProjectsById } from "services/projects.service";

export const useProjects = ({ limit = 10, page = 1, filters = {}, orderBy = "createdAt", order = "desc" }) => {
  return useQuery({
    queryKey: ["projects", limit, page, filters, orderBy, order],
    queryFn: () => fetchProjects({ limit, page, filters, orderBy, order }),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });
};

export const useProject = (id, enabled) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProjectsById(id),
    enabled,
  });
};