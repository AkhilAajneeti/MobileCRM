export const fetchActivity = async ({
  limit,
  page = 1,
  filters = {},
} = {}) => {
  const token = localStorage.getItem("auth_token");
  const offset = (page - 1) * limit;

  let where = [];

  // ✅ DATE FILTERS
  if (filters.dateType) {
    const type = filters.dateType;

    switch (type) {
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
            attribute: "createdAt",
            value: filters.xDays,
            dateTime: true,
          });
        }
        break;
    }
  }

  // ✅ SEARCH
  if (filters.search) {
    where.push({
      type: "like",
      attribute: "parentType",
      value: `%${filters.search}%`,
    });
  }

  // ✅ TYPE FILTER
  if (filters.type && filters.type !== "all") {
    where.push({
      type: "equals",
      attribute: "parentType",
      value: filters.type,
    });
  }

  // ✅ QUERY BUILDER
  const query = where
    .map((f, i) => {
      let q = `whereGroup[${i}][type]=${f.type}`;

      const attribute = f.attribute || "createdAt";

      q += `&whereGroup[${i}][attribute]=${attribute}`;

      // values
      if (Array.isArray(f.value)) {
        f.value.forEach((v) => {
          q += `&whereGroup[${i}][value][]=${encodeURIComponent(v)}`;
        });
      } else if (f.value !== undefined && f.value !== "") {
        q += `&whereGroup[${i}][value]=${encodeURIComponent(f.value)}`;
      }

      // datetime
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

  const baseUrl = `https://gateway.aajneetiadvertising.com/Note?maxSize=${limit}&offset=${offset}&orderBy=createdAt&order=desc`;

  const url = query ? `${baseUrl}&${query}` : baseUrl;

  console.log("FINAL ACTIVITY API:", url);

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

    throw new Error("Failed to fetch activities");
  }

  return await res.json();
};

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

export const createActivity = async (payload) => {
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

// above is for notes means stream
