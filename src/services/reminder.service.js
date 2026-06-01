/**
 * reminder.service.js
 *
 * Fetches the leads whose next contact (`cNextContactAt`) falls on TODAY.
 * This is the single source the global follow-up reminder manager schedules
 * its in-app popups from - we deliberately scope to today only, so the
 * payload stays small and the timer logic never deals with future days.
 *
 * Backend filtering (ESPO `today` whereGroup) keeps it light; the manager
 * re-filters client-side against the local clock for timezone safety.
 */
const API_BASE = "https://gateway.aajneetiadvertising.com";

export const fetchTodayFollowups = async ({ signal } = {}) => {
  const token = localStorage.getItem("auth_token");

  // ESPO: leads whose cNextContactAt is today (datetime filter).
  const query =
    `whereGroup[0][type]=today` +
    `&whereGroup[0][attribute]=cNextContactAt` +
    `&whereGroup[0][dateTime]=true`;

  const url =
    `${API_BASE}/Lead?maxSize=200&orderBy=cNextContactAt&order=asc&${query}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", token },
    signal,
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch today's follow-ups");
  }

  return await res.json();
};
