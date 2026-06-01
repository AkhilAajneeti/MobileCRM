// import axios from "axios";

// export default async function handler(req, res) {
//   const auth = Buffer.from(
//     `${process.env.ESPO_USER}:${process.env.ESPO_PASS}`
//   ).toString("base64");

//   const response = await axios.get(
//     "https://crm.theintelligentrealtors.com/api/v1/Account",
//     {
//       headers: {
//         Authorization: `Basic ${auth}`,
//       },
//     }
//   );

//   res.json(response.data);
// }
