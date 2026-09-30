const http = require("http");

const SERVER_PORT = 3001;
const WOKWI_URL = "http://127.0.0.1:9080/api/status";

const defaultHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...defaultHeaders,
  });

  res.end(JSON.stringify(data));
}

async function getWokwiData() {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 2000);

  try {
    const response = await fetch(WOKWI_URL, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Wokwi returned HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      connected: true,
      source: "WOKWI",
      receivedAt: new Date().toISOString(),
      ...data,
    };
  } finally {
    clearTimeout(timeout);
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  if (req.method === "OPTIONS") {
    res.writeHead(204, defaultHeaders);
    res.end();
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(res, 200, {
      server: "FuelGuard AI server",
      status: "online",
      port: SERVER_PORT,
      wokwiGateway: "http://127.0.0.1:9080",
      time: new Date().toISOString(),
    });

    return;
  }

  if (
    req.method === "GET" &&
    requestUrl.pathname === "/api/wokwi/status"
  ) {
    try {
      const data = await getWokwiData();

      sendJson(res, 200, data);
    } catch (error) {
      sendJson(res, 503, {
        connected: false,
        source: "WOKWI",
        error:
          error.name === "AbortError"
            ? "Wokwi gateway request timed out."
            : error.message,
        message:
          "Wokwi is not reachable. Make sure the Wokwi simulation and Private IoT Gateway are running.",
        gateway: "http://127.0.0.1:9080",
        receivedAt: new Date().toISOString(),
      });
    }

    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/") {
    sendJson(res, 200, {
      name: "FuelGuard AI Server",
      status: "online",
      endpoints: [
        "/api/health",
        "/api/wokwi/status",
      ],
    });

    return;
  }

  sendJson(res, 404, {
    error: "Not found",
  });
});

server.listen(SERVER_PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("      FuelGuard AI Local Server");
  console.log("========================================");
  console.log(`Server: http://localhost:${SERVER_PORT}`);
  console.log(`Health: http://localhost:${SERVER_PORT}/api/health`);
  console.log(
    `Wokwi:  http://localhost:${SERVER_PORT}/api/wokwi/status`
  );
  console.log("========================================");
  console.log("");
  console.log("Waiting for Wokwi ESP32 data...");
});