/**
 * Site visits are not a separate entity — they are Leads carrying one of the
 * two site-visit statuses. This module is a thin read/write layer over the
 * Lead endpoint so the Site Visits screen has one place to talk to.
 *
 * One request loads up to 200 records and every count, filter and tab is
 * computed on the client, so tab counts always describe the whole set rather
 * than a visible page. That is why there is no pagination on this screen.
 */
const BASE = "https://gateway.aajneetiadvertising.com";

export const SITE_VISIT_STATUSES = ["Site Visit Scheduled", "Site Visit Done"];

const authHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  token: localStorage.getItem("auth_token"),
});

const handleAuthFailure = (res) => {
  if (res.status === 401 || res.status === 403) {
    localStorage.clear();
    window.location.hash = "#/login";
  }
};

/** Up to 200 records; all filtering happens client-side. */
export const fetchSiteVisits = async () => {
  const params = new URLSearchParams({
    maxSize: "200",
    orderBy: "cSiteVisitAt",
    order: "asc",
    // The clause type and attribute are set once; only the values repeat.
    // Appending all three inside the loop produced a duplicated type and
    // attribute per status, which the backend rejects.
    "whereGroup[0][type]": "in",
    "whereGroup[0][attribute]": "status",
  });

  SITE_VISIT_STATUSES.forEach((status) => {
    params.append("whereGroup[0][value][]", status);
  });

  const res = await fetch(`${BASE}/Lead?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    handleAuthFailure(res);
    throw new Error("Failed to fetch site visits");
  }

  return res.json();
};

/** Mark a visit as done. */
export const markVisitDone = (id) =>
  updateVisit(id, { status: "Site Visit Done" });

/** Move a visit to a new datetime; it stays scheduled. */
export const rescheduleVisit = (id, espoDateTime) =>
  updateVisit(id, { cSiteVisitAt: espoDateTime, status: "Site Visit Scheduled" });

/**
 * Schedule a visit on an EXISTING lead. This screen never creates a lead,
 * so there is no create call here by design.
 */
export const scheduleVisit = (id, { cSiteVisitAt, assignedUserId }) => {
  const payload = { cSiteVisitAt, status: "Site Visit Scheduled" };
  if (assignedUserId) payload.assignedUserId = assignedUserId;
  return updateVisit(id, payload);
};

const updateVisit = async (id, payload) => {
  const res = await fetch(`${BASE}/Lead/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    handleAuthFailure(res);
    throw new Error("Site visit update failed");
  }

  return res.json();
};
