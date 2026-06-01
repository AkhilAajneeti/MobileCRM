export const fetchProjects = async ({
  limit = 10,
  page = 1,
  filters = {},
  orderBy = "createdAt",
  order = "desc",
}) => {
  const token = localStorage.getItem("auth_token");
  const offset = (page - 1) * limit;

  let where = [];

  // 🔍 SEARCH
  if (filters.search?.trim()) {
    where.push({
      type: "like",
      attribute: "name",
      value: `%${filters.search.trim()}%`,
    });
  }

  // 🔹 STATUS
  if (filters.status) {
    where.push({
      type: "equals",
      attribute: "status",
      value: filters.status,
    });
  }

  // 🔹 PRIORITY
  if (filters.priority) {
    where.push({
      type: "equals",
      attribute: "priority",
      value: filters.priority,
    });
  }

  // 🔹 ASSIGNED USER
  if (filters.assignUser) {
    where.push({
      type: "equals",
      attribute: "assignedUserId",
      value: filters.assignUser,
    });
  }

  // 📅 DATE FILTER (FULL SUPPORT)
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

      // ✅ single date
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

      // ✅ range
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

      // ✅ X days
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

  // 🔥 BUILD QUERY (same pattern as Leads)
  const query = where
    .map((f, i) => {
      let q = `whereGroup[${i}][type]=${f.type}`;

      const attribute = f.attribute || "createdAt";
      q += `&whereGroup[${i}][attribute]=${attribute}`;

      if (Array.isArray(f.value)) {
        f.value.forEach((v) => {
          q += `&whereGroup[${i}][value][]=${encodeURIComponent(v)}`;
        });
      } else if (f.value !== undefined && f.value !== "") {
        q += `&whereGroup[${i}][value]=${encodeURIComponent(f.value)}`;
      }

      // 🔥 IMPORTANT: dateTime flag
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

  const url = `https://gateway.aajneetiadvertising.com/CProjects?maxSize=${limit}&offset=${offset}&orderBy=${orderBy}&order=${order}${query ? `&${query}` : ""
    }`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token,
    },
  });

  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch projects");
  }

  return res.json();
};



export const fetchProjectsById = async (id) => {
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(`https://gateway.aajneetiadvertising.com/CProjects/${id}`, {
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
    throw new Error("Failed to fetch projects by id");
  }
  return await res.json();
};

export const createProject = async (payload) => {
  console.log(payload);
  const token = localStorage.getItem("auth_token");
  const res = await fetch("https://gateway.aajneetiadvertising.com/CProjects", {
    method: "POST",
    headers: { "Content-Type": "application/json", token: token },

    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("API ERROR:", text);
    throw new Error("Project is not created", text);
  }
  // EspoCRM returns array
  return text ? JSON.parse(text) : null;
};

export const updateProject = async (id, payload) => {
  const token = localStorage.getItem("auth_token");
  console.log(id, payload);
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/CProjects/${id}`,
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
  console.log("response from project.service.js", res);
  if (!res.ok) {
    throw new Error(text || "Project update failed");
  }

  return text ? JSON.parse(text) : null;
};

export const deleteProject = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/CProjects/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token: token },
    }
  );
  if (!res.ok) {
    throw new Error("Failed to delete Project");
  }
  return res.json();
};
export const bulkDeleteProject = async (ids = []) => {
  return Promise.all(ids.map((id) => deleteProject(id)));
};
