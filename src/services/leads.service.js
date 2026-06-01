// cache services?
const getCacheKey = () => {
  const userId = localStorage.getItem("userId") || "guest";
  return `leads_count_cache_${userId}`;
};
const CACHE_TTL = 1000 * 60 * 10; // 10 min
const leadsCountCache = new Map();
// 🔥 helpers
const getLocalCache = () => {
  try {
    return JSON.parse(localStorage.getItem(getCacheKey())) || {};
  } catch {
    return {};
  }
};

const setLocalCache = (key, value) => {
  const cache = getLocalCache();
  cache[key] = {
    value,
    timestamp: Date.now(),
  };
  localStorage.setItem(getCacheKey(), JSON.stringify(cache));
};

//industry chart
export const fetchLeadsCount = async (filters = []) => {
  // 🔥 Stable cache key (prevents order issues)
  const cacheKey = JSON.stringify(
    filters.map((f) => ({
      ...f,
      value: Array.isArray(f.value) ? [...f.value].sort() : f.value,
    }))
  );

  // ✅ 1. MEMORY CACHE
  const cached = leadsCountCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  // ✅ 2. LOCAL STORAGE CACHE
  const localCache = getLocalCache();
  const localItem = localCache[cacheKey];

  if (localItem && Date.now() - localItem.timestamp < CACHE_TTL) {
    leadsCountCache.set(cacheKey, localItem);
    return localItem.value;
  }

  // 🔥 3. API CALL
  const token = localStorage.getItem("auth_token");

  const DATE_TYPES = [
    "today",
    "yesterday",
    "currentMonth",
    "lastMonth",
    "lastSevenDays", // ✅ FIXED
    "between",
    "before",
    "after",
  ];

  const query = filters
    .map((f, i) => {
      let q = `whereGroup[${i}][type]=${f.type}&whereGroup[${i}][attribute]=${f.attribute}`;

      // ✅ value handling
      if (Array.isArray(f.value)) {
        f.value.forEach((v) => {
          q += `&whereGroup[${i}][value][]=${encodeURIComponent(v)}`;
        });
      } else if (f.value != null && f.value !== "") {
        q += `&whereGroup[${i}][value]=${encodeURIComponent(f.value)}`;
      }

      // ✅ dateTime flag (based on backend support)
      if (DATE_TYPES.includes(f.type)) {
        q += `&whereGroup[${i}][dateTime]=true`;
      }

      return q;
    })
    .join("&");

  const url = `https://gateway.aajneetiadvertising.com/Lead?${query}&maxSize=1`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ API Error:", res.status, errorText);

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }

    throw new Error("Failed to fetch leads count");
  }

  const data = await res.json();
  const total = data.total || 0;

  // ✅ SAVE CACHE
  const cacheEntry = {
    value: total,
    timestamp: Date.now(),
  };

  leadsCountCache.set(cacheKey, cacheEntry);
  setLocalCache(cacheKey, total);

  return total;
};

export const fetchLeads = async ({ limit = 100, page = 1 }) => {
  const token = localStorage.getItem("auth_token");

  const offset = (page - 1) * limit; // ✅ FIX

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Lead?maxSize=${limit}&offset=${offset}&orderBy=createdAt&order=desc`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token,
      },
    }
  );

  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch leads");
  }

  return await res.json();
};
export const fetchNewLeads = async ({ limit, page, filters = {} }) => {
  const token = localStorage.getItem("auth_token");
  const offset = (page - 1) * limit;

  let where = [];


  // ✅ DATE FILTER
  if (filters.dateType) {
    const type = filters.dateType;

    switch (type) {
      // ✅ simple types
      case "today":
      case "lastSevenDays":
      case "currentMonth":
      case "lastMonth":
      case "nextMonth":
      case "currentQuarter":
      case "lastQuarter":
      case "currentYear":
      case "lastYear":
      case "past":
      case "future":
      case "ever":
      case "isEmpty":
        where.push({
          type,
          attribute: "createdAt",
          dateTime: true,
        });
        break;

      case "on":
      case "before":
      case "after":
        if (filters.closeDateFrom) {
          where.push({
            type,
            attribute: "createdAt",
            value: filters.closeDateFrom,
            dateTime: true,
          });
        }
        break;

      case "between":
        if (filters.closeDateFrom && filters.closeDateTo) {
          where.push({
            type,
            attribute: "createdAt",
            value: [filters.closeDateFrom, filters.closeDateTo],
            dateTime: true,
          });
        }
        break;

      case "lastXDays":
      case "afterXDays":
        if (filters.xDays) {
          where.push({
            type,
            value: filters.xDays,
          });
        }
        break;
    }
  }

  // ✅ OTHER FILTERS
  if (filters.search) {
    where.push({
      type: "like",
      attribute: "name",
      value: `%${filters.search}%`,
    });
  }
  if (filters.cProject) {
    where.push({
      type: "like",
      attribute: "cProject",
      value: `%${filters.cProject}%`,
    });
  }

  if (filters.status) {
    where.push({
      type: "equals",
      attribute: "status",
      value: filters.status,
    });
  }

  if (filters.source) {
    where.push({
      // `like` (case-insensitive contains) instead of `equals` — reps fill
      // cSubSource freely, so an exact match misses values like "website" /
      // "Website Form" when the option is "Website". The dropdown label stays
      // "Source" but it queries the cSubSource column.
      type: "like",
      attribute: "cSubSource",
      value: `%${filters.source}%`,
    });
  }
  if (filters.sector) {
    where.push({
      type: "equals",
      attribute: "cSector",
      value: filters.sector,
    });
  }

  if (filters.assignUser) {
    where.push({
      type: "equals",
      attribute: "assignedUserId",
      value: filters.assignUser,
    });
  }

  // ✅ TEAM FILTER — `_teamUserIds` is the internal, derived field set by the
  // deals page from the selected team's members. Translates to `assignedUserId
  // IN [...]`. An empty array means the team has no users → match nothing.
  if (Array.isArray(filters._teamUserIds)) {
    if (filters._teamUserIds.length === 0) {
      where.push({
        type: "equals",
        attribute: "id",
        value: "__no_team_users__",
      });
    } else {
      where.push({
        type: "in",
        attribute: "assignedUserId",
        value: filters._teamUserIds,
      });
    }
  }

  // ✅ QUERY BUILDER (FIXED)
  const query = where
    .map((f, i) => {
      let q = `whereGroup[${i}][type]=${f.type}`;

      // 🔥 ALWAYS ensure attribute for safety (backend crash fix)
      const attribute = f.attribute || "createdAt";
      q += `&whereGroup[${i}][attribute]=${attribute}`;

      // value
      if (Array.isArray(f.value)) {
        f.value.forEach((v) => {
          q += `&whereGroup[${i}][value][]=${encodeURIComponent(v)}`;
        });
      } else if (f.value !== undefined && f.value !== "") {
        q += `&whereGroup[${i}][value]=${encodeURIComponent(f.value)}`;
      }

      // 🔥 ensure datetime for date filters
      if (
        f.dateTime ||
        [
          "today",
          "lastSevenDays",
          "currentMonth",
          "lastMonth",
          "between",
          "before",
          "after",
        ].includes(f.type)
      ) {
        q += `&whereGroup[${i}][dateTime]=true`;
      }

      return q;
    })
    .join("&");

  const baseUrl = `https://gateway.aajneetiadvertising.com/Lead?maxSize=${limit}&offset=${offset}&orderBy=createdAt&order=desc`;

  const url = query ? `${baseUrl}&${query}` : baseUrl;


  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      token,
    },
  });

  if (!res.ok) {
    console.error("API FAILED:", res.status);
    throw new Error("Failed to fetch leads");
  }

  return await res.json();
};
export const fetchLeadsById = async (id) => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(`https://gateway.aajneetiadvertising.com/Lead/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token: token, // ✅ backend expects this
    },
  });
  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch accounts by id");
  }
  return await res.json();
};

export const createLead = async (payload) => {

  const token = localStorage.getItem("auth_token");
  const res = await fetch("https://gateway.aajneetiadvertising.com/Lead", {
    method: "POST",
    headers: { "Content-Type": "application/json", token: token },

    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("API ERROR:", text);
    throw new Error("Lead is not created", text);
  }
  // EspoCRM returns array
  return await res.json();
};

export const updateLead = async (id, payload) => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Lead/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
      body: JSON.stringify(payload),
    }
  );


  console.log("response from contact.service.js", res);
  if (!res.ok) {
    throw new Error(text || "Lead update failed");
  }

  return await res.json();
};

export const deleteLead = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Lead/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token: token },
    }
  );
  if (!res.ok) {
    throw new Error("Failed to delete contact");
  }
  return res.json();
};
export const bulkDeleteleads = async (ids = []) => {
  return Promise.all(ids.map((id) => deleteLead(id)));
};

// --------------Stream-----------
//fetch by Streams
export const leadStreamById = async (id) => {

  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Lead/${id}/stream`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
    }
  );

  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch User's stream");
  }
  return await res.json();
};
export const updateStream = async (id, payload) => {

  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Lead/${id}/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
    }
  );


  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch User's stream");
  }
  return await res.json();
};

//delete activity with notes api
export const deleteActivity = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Note/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token: token },
    }
  );
  if (!res.ok) {
    throw new Error("Failed to delete Activity");
  }
  return res.json();
};

//create strean
export const createLeadActivity = async (payload) => {

  const token = localStorage.getItem("auth_token");
  const res = await fetch("https://gateway.aajneetiadvertising.com/Note", {
    method: "POST",
    headers: { "Content-Type": "application/json", token: token },

    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("API ERROR:", text);
    throw new Error("Activity is not created", text);
  }
  // EspoCRM returns array
  return await res.json();
};

// Meet call related Activities

export const leadActivitesById = async (id) => {

  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Activities/Lead/${id}/activities`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
    }
  );

  console.log(res);
  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch User's Activties");
  }
  return await res.json();
};


// fetch task by lead id
export const fetchLeadTask = async (id) => {

  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Lead/${id}/tasks`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
    }
  );


  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch task for this lead");
  }
  return await res.json();
};
export const createLeadTask = async (id) => {

  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Lead/${id}/tasks`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
    }
  );


  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch task for this lead");
  }
  return await res.json();
};