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

    case "lastSevenDays":
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

/* GET */
export const fetchAccounts = async ({ limit, page, filters = {} }) => {
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
  if (filters.industry) {
    where.push({
      type: "equals",
      attribute: "industry",
      value: filters.industry,
    });
  }
  // 🔹 TYPE
  if (filters.type) {
    where.push({
      type: "in",
      attribute: "type",
      value: [filters.type],
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
    }
    else if (filters.dateType === "before") {
      if (filters.startDate) {
        condition = {
          type: "lessThan",
          attribute: "createdAt",
          value: filters.startDate,
        };
      }
    }
    else if (filters.dateType === "after") {
      if (filters.startDate) {
        condition = {
          type: "greaterThan",
          attribute: "createdAt",
          value: filters.startDate,
        };
      }
    }
    else {
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

  // 🔥 BUILD QUERY
  const query = where
    .map((f, i) => {
      let q = `whereGroup[${i}][type]=${f.type}&whereGroup[${i}][attribute]=${f.attribute}`;

      if (Array.isArray(f.value)) {
        f.value.forEach((v, j) => {
          q += `&whereGroup[${i}][value][${j}]=${encodeURIComponent(v)}`;
        });
      } else {
        q += `&whereGroup[${i}][value]=${encodeURIComponent(f.value)}`;
      }

      return q;
    })
    .join("&");

  const url = `https://gateway.aajneetiadvertising.com/Account?maxSize=${limit}&offset=${offset}&orderBy=createdAt&order=desc${query ? `&${query}` : ""}`;

  console.log("🔥 API URL:", url); // DEBUG

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      token: token,
    },
  });

  if (!res.ok) {
    console.error("API ERROR:", res.status);
    throw new Error("Failed to fetch accounts");
  }

  return await res.json();
};

/* CREATE */
export const createAccount = async (payload) => {
  const token = localStorage.getItem("auth_token");
  try {
    const res = await fetch("https://gateway.aajneetiadvertising.com/Account", {
      method: "POST",
      headers: { "Content-Type": "application/json", token: token },

      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Create Account API Error:", err?.response || err);
    throw err; // 🔥 ORIGINAL error rethrow
  }

  // const text = await res.text();
  // if (!res.ok) {
  //   throw new Error("account is not created");
  // }

  return await res.json();
};

/* UPDATE */
export const updateAccount = async (id, payload) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Account/${id}`,
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
  console.log("response front servicejs", res);
  if (!res.ok) {
    throw new Error(text || "Account update failed");
  }

  return await res.json();
};

/* DELETE */
export const deleteAccount = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Account/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token: token },
    },
  );
  return await res.json();
};

//
// --------------Stream-----------
//fetch by Streams
export const fetchAccStreamById = async (id) => {
  console.log(id);
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Account/${id}/stream`,
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

//delete stream with notes api
export const deleteAccStream = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Note/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token: token },
    },
  );
  if (!res.ok) {
    throw new Error("Failed to delete Stream");
  }
  return res.json();
};

//create stream
export const createAccStream = async (payload) => {
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

// Meet call related Activities

export const accActivitesById = async (id) => {
  console.log(id);
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Activities/Account/${id}/activities`,
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
    throw new Error("Failed to fetch Accounts Activties");
  }
  return await res.json();
};

// finding task related to accounts
export const fetchTaskByAccount = async (id) => {
  console.log(id);
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Task?accountId=${id}`,
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
    throw new Error("Failed to Task related to this account");
  }
  return await res.json();
};
// finding task related to accounts
export const fetchContactByAccount = async (id) => {
  console.log(id);
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Contact?accountId=${id}`,
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
    throw new Error("Failed to Contact related to this account");
  }
  return await res.json();
};

// unlink the contact
export const unlinkContactFromAccount = async (id) => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Contact/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
      body: JSON.stringify({
        accountId: null,
      }),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to unlink contact");
  }

  return res.json();
};
