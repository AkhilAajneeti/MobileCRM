// hooks/useTeams.js
import { useQuery } from "@tanstack/react-query";
import { fetchTeam, fetchTeamUser } from "services/team.service";

export const useTeams = () => {
  return useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeam,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Users in a specific team. Used by the deals page Team filter to convert a
 * team selection into a list of user ids that the leads / analytics services
 * then apply as `assignedUserId IN [...]`.
 *
 * Only fires when a team id is provided, so the hook costs nothing until the
 * user picks a team. Long staleTime + gcTime — team membership rarely changes,
 * so repeated filter flips hit the cache, not the network.
 */
export const useTeamUsers = (teamId) =>
  useQuery({
    queryKey: ["team-users-by-team", teamId],
    queryFn: () => fetchTeamUser(teamId),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });