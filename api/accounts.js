export const config = { runtime: "edge" };

export default async function handler(req) {
  const auth = btoa(`${process.env.ESPO_USER}:${process.env.ESPO_PASS}`);

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  const espoUrl = id
    ? `https://crm.theintelligentrealtors.com/api/v1/Account/${id}`
    : `https://crm.theintelligentrealtors.com/api/v1/Account`;

  const body =
    req.method === "POST" || req.method === "PUT" || req.method === "PATCH"
      ? await req.text()
      : undefined;

  const response = await fetch(espoUrl, {
    method: req.method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      // ...(versionNumber && {
      //   "X-Version-Number": versionNumber,
      // }),
    },
    body,
  });

  const data = await response.text();

  return new Response(data, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
