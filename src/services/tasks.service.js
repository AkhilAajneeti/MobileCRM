// fetch all
const toLocalISOString = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date - tzOffset).toISOString().slice(0, -1);
};

const getDateRange = (type) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (type) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "yesterday":
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;

    case "last7Days":
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;

    case "currentMonth":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end.setHours(23, 59, 59, 999);
      break;

    case "lastMonth":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;

    default:
      return null;
  }

  return {
    start: toLocalISOString(start),
    end: toLocalISOString(end),
  };
};

export const fetchAllTasks = async ({ limit, page, filters = {} }) => {
  const token = localStorage.getItem("auth_token");
  const offset = (page - 1) * limit;

  const where = [];

  // 🔍 SEARCH
  if (filters.search?.trim()) {
    where.push({
      type: "like",
      attribute: "name",
      value: `%${filters.search.trim()}%`,
    });
  }

  // 👤 ASSIGNED USER
  if (filters.assignUser) {
    where.push({
      type: "equals",
      attribute: "assignedUserId",
      value: filters.assignUser,
    });
  }

  // 📌 STATUS
  if (filters.status) {
    where.push({
      type: "equals",
      attribute: "status",
      value: filters.status,
    });
  }

  // ⚡ PRIORITY
  if (filters.priority) {
    where.push({
      type: "equals",
      attribute: "priority",
      value: filters.priority,
    });
  }

  // 📅 DATE FILTER
  if (filters.dateType) {
    let condition = null;

    if (filters.dateType === "between") {
      if (filters.startDate && filters.endDate) {
        condition = {
          type: "between",
          attribute: "createdAt",
          value: [filters.startDate, filters.endDate],
        };
      }
    } else if (filters.dateType === "before") {
      if (filters.startDate) {
        condition = {
          type: "lessThan",
          attribute: "createdAt",
          value: filters.startDate,
        };
      }
    } else if (filters.dateType === "after") {
      if (filters.startDate) {
        condition = {
          type: "greaterThan",
          attribute: "createdAt",
          value: filters.startDate,
        };
      }
    } else {
      const range = getDateRange(filters.dateType);

      if (range) {
        condition = {
          type: "between",
          attribute: "createdAt",
          value: [range.start, range.end],
        };
      }
    }

    if (condition) where.push(condition);
  }

  // 🔥 BUILD QUERY (whereGroup)
  const query = where
    .map((f, i) => {
      let q = `whereGroup[${i}][type]=${f.type}&whereGroup[${i}][attribute]=${f.attribute}`;

      if (Array.isArray(f.value)) {
        f.value.forEach((v) => {
          q += `&whereGroup[${i}][value][]=${encodeURIComponent(v)}`;
        });
      } else {
        q += `&whereGroup[${i}][value]=${encodeURIComponent(f.value)}`;
      }

      return q;
    })
    .join("&");

  const url = `https://gateway.aajneetiadvertising.com/Task?maxSize=${limit}&offset=${offset}&orderBy=createdAt&order=desc${query ? `&${query}` : ""
    }`;

  console.log("🔥 TASK API:", url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token: token,
    },
  });

  if (!res.ok) {
    console.log("STATUS:", res.status);
    throw new Error("Failed to fetch tasks");
  }

  return res.json();
};


export const fetchTasks = async () => {
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch("https://gateway.aajneetiadvertising.com/Task", {
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
    throw new Error("Failed to fetch tasks");
  }
  return await res.json();
};
export const fetchTasksById = async (id) => {
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(`https://gateway.aajneetiadvertising.com/Task/${id}`, {
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
    throw new Error("Failed to fetch task by id");
  }
  return await res.json();
};

export const createTasks = async (payload) => {
  console.log(payload);
  const token = localStorage.getItem("auth_token");
  const res = await fetch("https://gateway.aajneetiadvertising.com/task", {
    method: "POST",
    headers: { "Content-Type": "application/json", token: token },

    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("API ERROR:", text);
    throw new Error("Task is not created", text);
  }
  // EspoCRM returns array
  return text ? JSON.parse(text) : null;
};

export const updateTasks = async (id, payload) => {
  const token = localStorage.getItem("auth_token");
  console.log(id, payload);
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/task/${id}`,
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

  const text = await res.text();
  console.log("response from tasks.service.js", res);
  if (!res.ok) {
    throw new Error(text || "task update failed");
  }

  return text ? JSON.parse(text) : null;
};

export const deleteTasks = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/task/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token: token },
    }
  );
  if (!res.ok) {
    throw new Error("Failed to delete task");
  }
  return res.json();
};
export const bulkDeleteTasks = async (ids = []) => {
  return Promise.all(ids.map((id) => deleteTasks(id)));
};

// --------------Activity-----------
//fetch by activity
export const taskStreamById = async (id) => {
  console.log(id);
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Task/${id}/stream`,
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

//create activity
export const createLeadActivity = async (payload) => {
  console.log(payload);
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

// create activity
export const TaskActivitesById = async (id) => {
  console.log(id);
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Activities/Task/${id}/activities`,
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