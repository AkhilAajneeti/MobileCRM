// fetch
export const fetchIntegrationAcc = async () => {
  const token = localStorage.getItem("auth_token");

  console.log("AUTH TOKEN:", token); // 🔍 debug

  const res = await fetch("https://gateway.aajneetiadvertising.com/LeadCapture", {
    method: "GET",
    headers: {
      "Content-Type": "text/plain",
      token: token, // ✅ backend expects this
    },
  });

  if (!res.ok) {
    console.log("STATUS:", res.status);

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }

    throw new Error("Failed to fetch integration accounts");
  }

  return await res.json();
};

// fetch by id
export const fetchIntegrationAccById = async (id) => {
  const token = localStorage.getItem("auth_token");

  console.log("AUTH TOKEN:", token); // 🔍 debug

  const res = await fetch(`https://gateway.aajneetiadvertising.com/LeadCapture/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "text/plain",
      token: token, // ✅ backend expects this
    },
  });

  if (!res.ok) {
    console.log("STATUS:", res.status);

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }

    throw new Error("Failed to fetch integration accounts");
  }

  return await res.json();
};

// post integrate
export const integrateAcc = async (payload) => {
  const token = localStorage.getItem("auth_token");

  console.log("AUTH TOKEN:", token); // 🔍 debug

  const res = await fetch("https://gateway.aajneetiadvertising.com/LeadCapture", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      token: token, // ✅ backend expects this
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.log("ERROR RESPONSE:", data);
    throw new Error(data?.message || "Failed to submit lead");
  }

  return data;
};

// update integrate
export const updateIntergrateAcc = async (id, payload) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/LeadCapture/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "text/plain",
        Accept: "application/json",
        token: token,
      },
      body: JSON.stringify(payload),
    },
  );

  const text = await res.text();
  console.log("response from integration.servicejs", res);
  if (!res.ok) {
    throw new Error(text || "Integrated Account updation failed");
  }

  return text ? JSON.parse(text) : null;
};


/* DELETE  integrataion*/
export const deleteIntegration = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/LeadCapture/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "text/plain", token: token },
    },
  );
  return res.json();
};
