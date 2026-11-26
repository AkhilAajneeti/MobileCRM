import { API_BASE } from "services/gateway";
export const fetchRoles=async()=>{
    const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(API_BASE + "/role", {
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
      window.location.hash = "#/login";
    }
    throw new Error("Failed to fetch Roles");
  }
  return await res.json();
}

export const createUser = async (payload) => {
  console.log(payload);
  const token = localStorage.getItem("auth_token");
  const res = await fetch(API_BASE + "/User", {
    method: "POST",
    headers: { "Content-Type": "application/json", token: token },

    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("API ERROR:", text);
    throw new Error("User is not created", text);
  }
  // EspoCRM returns array
  return text ? JSON.parse(text) : null;
};