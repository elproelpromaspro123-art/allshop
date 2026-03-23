async function main() {
  const net = await import("node:net");
  const { spawn } = await import("node:child_process");
  const { createRequire } = await import("node:module");

  const nodeRequire = createRequire(__filename);

  function pickAvailablePort() {
    return new Promise((resolve, reject) => {
      const server = net.createServer();

      server.unref();
      server.on("error", reject);
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();

        if (!address || typeof address === "string") {
          server.close(() =>
            reject(new Error("No se pudo resolver un puerto libre para Playwright.")),
          );
          return;
        }

        const { port } = address;
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(port);
        });
      });
    });
  }

  const port = await pickAvailablePort();
  const cliPath = nodeRequire.resolve("@playwright/test/cli");
  const child = spawn(process.execPath, [cliPath, "test", ...process.argv.slice(2)], {
    stdio: "inherit",
    env: {
      ...process.env,
      CI: process.env.CI || "1",
      PLAYWRIGHT_PORT: String(port),
      PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${port}`,
      PORT: String(port),
    },
  });

  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(code || 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
