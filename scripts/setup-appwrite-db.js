require("dotenv").config();
const http = require("http");
const https = require("https");
const querystring = require("querystring");

const config = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: "vbcl",
};

if (!config.endpoint || !config.projectId || !config.apiKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const collections = [
  {
    id: "employees",
    name: "Employees",
    attributes: [
      { key: "id", type: "string", size: 50, required: true },
      { key: "name", type: "string", size: 100, required: true },
      { key: "email", type: "email", required: false },
      { key: "phone", type: "string", size: 20, required: false },
      { key: "position", type: "string", size: 100, required: false },
      { key: "department", type: "string", size: 100, required: false },
      { key: "joiningDate", type: "datetime", required: false },
      { key: "isActive", type: "boolean", required: false },
    ],
  },
  {
    id: "records",
    name: "Records",
    attributes: [
      { key: "employeeId", type: "string", size: 50, required: true },
      { key: "date", type: "datetime", required: true },
      { key: "title", type: "string", size: 255, required: true },
      { key: "description", type: "string", size: 1000, required: false },
      { key: "status", type: "string", size: 50, required: false },
      { key: "createdAt", type: "datetime", required: false },
    ],
  },
  {
    id: "attendance",
    name: "Attendance",
    attributes: [
      { key: "employeeId", type: "string", size: 50, required: true },
      { key: "date", type: "datetime", required: true },
      { key: "inTime", type: "datetime", required: false },
      { key: "outTime", type: "datetime", required: false },
      { key: "status", type: "string", size: 50, required: false },
    ],
  },
];

function parseUrl(urlString) {
  const url = new URL(urlString);
  return {
    protocol: url.protocol === "https:" ? "https" : "http",
    host: url.hostname,
    port: url.port || (url.protocol === "https:" ? 443 : 80),
    path: url.pathname.slice(1),
  };
}

function makeRequest(method, endpoint, path, body = null) {
  return new Promise((resolve, reject) => {
    const urlInfo = parseUrl(endpoint);
    const fullPath = "/" + urlInfo.path + path;

    const options = {
      hostname: urlInfo.host,
      port: urlInfo.port,
      path: fullPath,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Key": config.apiKey,
        "X-Appwrite-Project": config.projectId,
      },
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers["Content-Length"] = Buffer.byteLength(bodyStr);
    }

    const protocol = urlInfo.protocol === "https" ? https : http;
    const req = protocol.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function setupDatabase() {
  try {
    console.log("\n🚀 Starting Appwrite Database Setup...\n");

    // Create database
    try {
      await makeRequest("GET", config.endpoint, `/databases/${config.databaseId}`);
      console.log(`✅ Database '${config.databaseId}' already exists\n`);
    } catch {
      console.log(`📦 Creating database '${config.databaseId}'...`);
      await makeRequest("POST", config.endpoint, `/databases`, {
        databaseId: config.databaseId,
        name: "Alwar Database",
      });
      console.log(`✅ Database created successfully\n`);
    }

    // Create collections and attributes
    for (const collection of collections) {
      try {
        await makeRequest("GET", config.endpoint, `/databases/${config.databaseId}/collections/${collection.id}`);
        console.log(`✅ Collection '${collection.name}' already exists`);
      } catch {
        console.log(`📝 Creating collection '${collection.name}'...`);
        await makeRequest("POST", config.endpoint, `/databases/${config.databaseId}/collections`, {
          collectionId: collection.id,
          name: collection.name,
        });
        console.log(`   ✅ Collection '${collection.name}' created`);
      }

      console.log(`   📌 Adding attributes to '${collection.name}'...`);
      for (const attr of collection.attributes) {
        try {
          await makeRequest(
            "POST",
            config.endpoint,
            `/databases/${config.databaseId}/collections/${collection.id}/attributes/${attr.type}`,
            {
              key: attr.key,
              ...(attr.type === "string" && { size: attr.size }),
              required: attr.required,
            }
          );
          console.log(`      ✅ Added attribute '${attr.key}'`);
        } catch (error) {
          console.log(`      ⚠️  Attribute '${attr.key}' (may exist)`);
        }
      }
      console.log("");
    }

    console.log("✨ Database setup completed successfully!\n");
    console.log("📊 Collections created:");
    collections.forEach((col) => {
      console.log(`   - ${col.name} (ID: ${col.id})`);
    });
    console.log("");

  } catch (error) {
    console.error("❌ Error setting up database:", error.message);
    process.exit(1);
  }
}

setupDatabase();
