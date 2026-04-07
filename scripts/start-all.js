const { spawn } = require("child_process");

const run = (command, args, options = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { shell: true, stdio: "inherit", ...options });
    child.on("close", (code) => resolve(code));
    child.on("error", () => resolve(1));
  });

const start = async () => {
  console.log("Checking MongoDB service...");

  // Windows-friendly: starts MongoDB only if installed as a service.
  const netStartCode = await run("net", ["start", "MongoDB"]);

  if (netStartCode === 0) {
    console.log("MongoDB service started.");
  } else {
    console.log("MongoDB service may already be running or not installed as a service.");
    console.log("If needed, start it manually with: mongod");
  }

  console.log("Starting Parking Management app...");
  const app = spawn("node", ["src/server.js"], { shell: true, stdio: "inherit" });
  app.on("exit", (code) => process.exit(code ?? 0));
};

start();
