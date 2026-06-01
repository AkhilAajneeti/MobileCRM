

export const fetchAllMeeting = async ({ limit, page, filters }) => {
  const token = localStorage.getItem("auth_token");
  const offset = (page - 1) * limit;
  let where = [];

  // 🔥 FIX: convert local date → correct ISO for backend
  const toLocalISOString = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date - tzOffset).toISOString().slice(0, -1);
  };

  const today = new Date();

  // ✅ DATE FILTER
  if (filters.dateType) {
    switch (filters.dateType) {

      // 🔥 TODAY (FULL DAY)
      case "today": {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        where.push({
          type: "between",
          attribute: "createdAt",
          value: [toLocalISOString(start), toLocalISOString(end)],
        });
        break;
      }

      // 🔥 YESTERDAY (FULL DAY)
      case "yesterday": {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const start = new Date(yesterday);
        start.setHours(0, 0, 0, 0);

        const end = new Date(yesterday);
        end.setHours(23, 59, 59, 999);

        where.push({
          type: "between",
          attribute: "createdAt",
          value: [toLocalISOString(start), toLocalISOString(end)],
        });
        break;
      }

      // 🔥 LAST 7 DAYS (FULL RANGE)
      case "last7Days": {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        where.push({
          type: "between",
          attribute: "createdAt",
          value: [toLocalISOString(start), toLocalISOString(end)],
        });
        break;
      }

      // 🔥 BETWEEN (USER INPUT)
      case "between": {
        if (filters.closeDateFrom && filters.closeDateTo) {
          const start = new Date(filters.closeDateFrom);
          start.setHours(0, 0, 0, 0);

          const end = new Date(filters.closeDateTo);
          end.setHours(23, 59, 59, 999);

          where.push({
            type: "between",
            attribute: "createdAt",
            value: [toLocalISOString(start), toLocalISOString(end)],
          });
        }
        break;
      }

      // 🔥 BEFORE
      case "before": {
        if (filters.closeDateFrom) {
          const date = new Date(filters.closeDateFrom);
          date.setHours(0, 0, 0, 0);

          where.push({
            type: "lessThan",
            attribute: "createdAt",
            value: toLocalISOString(date),
          });
        }
        break;
      }

      // 🔥 AFTER
      case "after": {
        if (filters.closeDateFrom) {
          const date = new Date(filters.closeDateFrom);
          date.setHours(23, 59, 59, 999);

          where.push({
            type: "greaterThan",
            attribute: "createdAt",
            value: toLocalISOString(date),
          });
        }
        break;
      }
      case "currentMonth": {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        where.push({
          type: "between",
          attribute: "createdAt",
          value: [toLocalISOString(start), toLocalISOString(end)],
        });
        break;
      }
      case "lastMonth": {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);

        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        end.setHours(23, 59, 59, 999);

        where.push({
          type: "between",
          attribute: "createdAt",
          value: [toLocalISOString(start), toLocalISOString(end)],
        });
        break;
      }
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

  if (filters.status) {
    where.push({
      type: "equals",
      attribute: "status",
      value: filters.status,
    });
  }

  if (filters.source) {
    where.push({
      type: "equals",
      attribute: "source",
      value: filters.source,
    });
  }

  if (filters.assignUser) {
    where.push({
      type: "equals",
      attribute: "assignedUserId",
      value: filters.assignUser,
    });
  }
  const query = where
    .map((f, i) => {
      let q = `where[${i}][type]=${f.type}&where[${i}][attribute]=${f.attribute}`;

      if (Array.isArray(f.value)) {
        f.value.forEach((v) => {
          q += `&where[${i}][value][]=${encodeURIComponent(v)}`;
        });
      } else if (f.value !== undefined) {
        q += `&where[${i}][value]=${encodeURIComponent(f.value)}`;
      }

      return q;
    })
    .join("&");



  const baseUrl = `https://gateway.aajneetiadvertising.com/Meeting?maxSize=${limit}&offset=${offset}&orderBy=createdAt&order=desc`;

  const url = query ? `${baseUrl}&${query}` : baseUrl;

  // console.log("FINAL API:", url);
  const res = await fetch(url, {
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
    throw new Error("Failed to fetch accounts");
  }


  return res.json();
};

export const fetchMeeting = async () => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch("https://gateway.aajneetiadvertising.com/Meeting", {
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
    throw new Error("Failed to fetch accounts");
  }
  return await res.json();
};
export const fetchMeetingById = async (id) => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(`https://gateway.aajneetiadvertising.com/Meeting/${id}`, {
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
    throw new Error("Failed to fetch meeting by id");
  }
  return await res.json();
};

export const createMeeting = async (payload) => {

  const token = localStorage.getItem("auth_token");
  const res = await fetch("https://gateway.aajneetiadvertising.com/Meeting", {
    method: "POST",
    headers: { "Content-Type": "application/json", token: token },

    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("API ERROR:", text);
    throw new Error("Lead is not created", text);
  }
  // EspoCRM returns array
  return text ? JSON.parse(text) : null;
};

export const updateMeeting = async (id, payload) => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Meeting/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
      body: JSON.stringify(payload),
    },
  );

  const text = await res.text();
  console.log("response from meeting.service.js", res);
  if (!res.ok) {
    throw new Error(text || "Meeting update failed");
  }

  return text ? JSON.parse(text) : null;
};

export const deleteMeeting = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Meeting/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token: token },
    },
  );
  if (!res.ok) {
    throw new Error("Failed to delete Meeting");
  }
  return res.json();
};
export const bulkDeleteMeeting = async (ids = []) => {
  return Promise.all(ids.map((id) => deleteMeeting(id)));
};

// --------------Stream-----------
//fetch by Streams
export const meetingStreamById = async (id) => {

  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Meeting/${id}/stream`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
    },
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
    },
  );
  if (!res.ok) {
    throw new Error("Failed to delete Activity");
  }
  return res.json();
};

//create strean
export const createMeetingStream = async (payload) => {

  const token = localStorage.getItem("auth_token");
  const res = await fetch("https://gateway.aajneetiadvertising.com/Note", {
    method: "POST",
    headers: { "Content-Type": "application/json", token: token },

    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("API ERROR:", text);
    throw new Error("Activity is not created", text);
  }
  // EspoCRM returns array
  return text ? JSON.parse(text) : null;
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
    },
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
export const fetchLeadMeeting = async (leadId) => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Activities/Lead/${leadId}/activities/list/Meeting`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch lead meetings");
  }

  return await res.json();
};
export const createLeadMeeting = async (id, payload) => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Activities/Lead/${id}/activities/list/Meeting`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }

    throw new Error("Failed to create meeting");
  }

  return await res.json();
};
