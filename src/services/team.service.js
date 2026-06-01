export const fetchTeam = async () => {
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch("https://gateway.aajneetiadvertising.com/Team", {
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
    throw new Error("Failed to fetch User's");
  }
  return await res.json();
}

export const fetchTeamById = async (id) => {
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(`https://gateway.aajneetiadvertising.com/team/${id}`, {
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
    throw new Error("Failed to fetch team's by id");
  }
  return await res.json();
}
export const fetchTeamUser = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`https://gateway.aajneetiadvertising.com/team/${id}/users`, {
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
    throw new Error("Failed to fetch team's by id");
  }
  return await res.json();
}

export const createTeam = async (payload) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch("https://gateway.aajneetiadvertising.com/team", {
    method: "POST",
    headers: { "Content-Type": "application/json", token: token },

    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    
    throw new Error("Team is not created", text);
  }
  // EspoCRM returns array
  return await res.json();
};

export const updateTeam = async (id, payload) => {
  const token = localStorage.getItem("auth_token");
  
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/team/${id}`,
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


  if (!res.ok) {
    throw new Error(text || "User update failed");
  }

  return await res.json();
};


export const deleteTeam = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/team/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token: token },
    }
  );
  if (!res.ok) {
    throw new Error("Failed to delete team");
  }
  return res.json();
};