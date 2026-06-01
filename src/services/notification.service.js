// `maxSize` defaults to 100 so the dropdown can paginate over the user's full
// notification history client-side. The backend returns `total: -1`, so we
// can't compute true totals from one request — fetching a generous batch up
// front is simpler than chaining server-side page calls.
export const fetchNotifications = async ({ maxSize = 100, offset = 0 } = {}) => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Notification?maxSize=${maxSize}&offset=${offset}&orderBy=number&order=desc`,
    {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token: token, // ✅ backend expects this
    },
    },
  );

  if (!res.ok) {
    console.log("STATUS:", res.status);

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }

    throw new Error("Failed to fetch notifications ");
  }

  return await res.json();
};


// 
export const fetchUnreadCount = async () => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    "https://gateway.aajneetiadvertising.com/Notification/action/notReadCount",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token: token,
      },
    }
  );
  console.log("STATUS:", res.status);
  if (!res.ok) {
    throw new Error("Failed to fetch notifications Count");
  }
  const data = await res.json(); // 🔥 FIX HERE
  console.log("COUNT DATA:", data);

  return data; // ✅ return actual data
};


// mark all notifications as read for the current user
export const markAllNotificationsRead = async () => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    "https://gateway.aajneetiadvertising.com/Notification/action/markAllRead",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: token,
      },
    }
  );

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to mark notifications as read");
  }

  return await res.json();
};