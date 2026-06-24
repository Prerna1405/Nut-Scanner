const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

// Load env variables manually from .env file
function loadEnv() {
  try {
    const envPath = path.join(__dirname, ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      content.split("\n").forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || "";
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value.trim();
        }
      });
      console.log("[Proxy Server] Loaded .env configuration.");
    } else {
      console.log("[Proxy Server] No .env file found at root.");
    }
  } catch (err) {
    console.error("[Proxy Server] Error loading .env:", err);
  }
}

loadEnv();

let cachedToken = null;
let tokenExpiry = 0; // timestamp in ms

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    if (cachedToken && tokenExpiry > now + 60000) {
      console.log("[Proxy Server] Using cached token.");
      return resolve(cachedToken);
    }

    const clientId = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID || "749ebc4ef24d46949b8614a2c7dc606d";
    const clientSecret = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET || "91bad842563c44bfbf6cc31af352b264";

    if (!clientId || !clientSecret) {
      return reject(new Error("FatSecret credentials missing. Please check .env file."));
    }

    console.log("[Proxy Server] Fetching fresh token from FatSecret...");
    console.log("[Proxy Server] Client ID loaded:", clientId ? "YES" : "NO");
    console.log("[Proxy Server] Client Secret loaded:", clientSecret ? "YES" : "NO");

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const postData = "grant_type=client_credentials&scope=basic";

    const req = https.request(
      {
        hostname: "oauth.fatsecret.com",
        path: "/connect/token",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${auth}`,
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          console.log("[Proxy Server] Auth Token response status:", res.statusCode);
          if (res.statusCode !== 200) {
            return reject(new Error(`Authentication failed with status ${res.statusCode}: ${body}`));
          }
          try {
            const data = JSON.parse(body);
            cachedToken = data.access_token;
            tokenExpiry = Date.now() + (data.expires_in || 86400) * 1000;
            console.log("[Proxy Server] New token obtained successfully.");
            resolve(cachedToken);
          } catch (e) {
            reject(new Error("Failed to parse access token response: " + e.message));
          }
        });
      }
    );

    req.on("error", (err) => {
      console.error("[Proxy Server] Token request network error:", err);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

function searchFoods(query) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getAccessToken();
      const pathUrl = `/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(
        query
      )}&format=json&max_results=5`;

      console.log(`[Proxy Server] Querying FatSecret foods.search for "${query}"...`);
      const req = https.request(
        {
          hostname: "platform.fatsecret.com",
          path: pathUrl,
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            console.log("[Proxy Server] Food search response status:", res.statusCode);
            if (res.statusCode !== 200) {
              return reject(new Error(`Food search failed with status ${res.statusCode}: ${body}`));
            }
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error("Failed to parse search response: " + e.message));
            }
          });
        }
      );

      req.on("error", (err) => {
        console.error("[Proxy Server] Search request network error:", err);
        reject(err);
      });

      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

const server = http.createServer(async (req, res) => {
  // Setup CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle Options preflight
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host}`);

  if (urlObj.pathname === "/api/foods/search") {
    const q = urlObj.searchParams.get("q");
    if (!q || q.length < 3) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Search query must be at least 3 characters long." }));
      return;
    }

    try {
      const data = await searchFoods(q);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error("[Proxy Server] API search error:", err.message);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err.message }));
    }
  } else if (urlObj.pathname === "/api/token") {
    try {
      const token = await getAccessToken();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ access_token: token, token_type: "Bearer", expires_in: Math.round((tokenExpiry - Date.now()) / 1000) }));
    } catch (err) {
      console.error("[Proxy Server] API token error:", err.message);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err.message }));
    }
  } else {
    res.statusCode = 404;
    res.end("Not Found");
  }
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`CORS Proxy Server running at http://localhost:${PORT}`);
  console.log(`Endpoints available:`);
  console.log(`- http://localhost:${PORT}/api/token`);
  console.log(`- http://localhost:${PORT}/api/foods/search?q=banana`);
  console.log(`======================================================\n`);
});
