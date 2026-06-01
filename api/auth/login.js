export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  const myToken = Buffer.from(`${username}:${password}`).toString("base64");
  // myToken = btoa("prashant_test_admin:79pmYKy34C}");
  console.log(myToken);
  try {
    const response = await fetch(
      "https://gateway.aajneetiadvertising.com/auth",
      {
        method: "GET",
        headers: {
          
          Accept: "application/json",
          "create-token": myToken,
        },
      }
    );

    if (!response.ok) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const data = await response.json();

    return res.status(200).json({
      token: data.token, // ✅ REAL ESPO TOKEN
      user: data.user,
      acl: data.acl,
      preferences: data.preferences,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
