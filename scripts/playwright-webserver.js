async function main() {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { spawn, spawnSync } = await import("node:child_process");
  const { createRequire } = await import("node:module");

  const nodeRequire = createRequire(__filename);
  const port = process.env.PLAYWRIGHT_PORT || process.env.PORT || "3100";
  const nextBin = nodeRequire.resolve("next/dist/bin/next");
  const repoRoot = process.cwd();
  const tsconfigPath = path.join(repoRoot, "tsconfig.json");
  const originalTsconfig = fs.existsSync(tsconfigPath)
    ? fs.readFileSync(tsconfigPath, "utf8")
    : null;

  let distDir = process.env.NEXT_DIST_DIR || `.next-playwright-${process.pid}`;

  function cleanupPath(targetPath) {
    try {
      fs.rmSync(targetPath, {
        recursive: true,
        force: true,
      });
      return true;
    } catch (error) {
      if (error && (error.code === "EBUSY" || error.code === "EPERM")) {
        return false;
      }

      throw error;
    }
  }

  function restoreTsconfig() {
    if (originalTsconfig === null || !fs.existsSync(tsconfigPath)) {
      return;
    }

    const currentTsconfig = fs.readFileSync(tsconfigPath, "utf8");

    if (currentTsconfig !== originalTsconfig) {
      fs.writeFileSync(tsconfigPath, originalTsconfig);
    }
  }

  function finalize(exitCode) {
    restoreTsconfig();
    cleanupPath(path.join(repoRoot, distDir));
    process.exit(exitCode);
  }

  const initialDistPath = path.join(repoRoot, distDir);

  if (!cleanupPath(initialDistPath)) {
    distDir = `.next-playwright-${process.pid}-${Date.now()}`;
  }

  const runtimeEnv = {
    ...process.env,
    NEXT_DIST_DIR: distDir,
  };

  const build = spawnSync(process.execPath, [nextBin, "build"], {
    stdio: "inherit",
    env: runtimeEnv,
  });

  if (build.status !== 0) {
    finalize(build.status || 1);
    return;
  }

  restoreTsconfig();

  const server = spawn(process.execPath, [nextBin, "start", "--port", port], {
    stdio: "inherit",
    env: runtimeEnv,
  });

  const forwardSignal = (signal) => {
    if (!server.killed) {
      server.kill(signal);
    }
  };

  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));

  server.on("exit", (code) => {
    finalize(code || 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
