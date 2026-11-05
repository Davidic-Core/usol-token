"use strict";

// A single on-disk lock per script. Two runs against the same deployment record
// would race each other into duplicate mints or duplicate metadata, so a second
// run is refused while a lock exists.
//
// The lock is created exclusively (`wx`) and removed when the run finishes,
// including on failure. If a process is killed, the lock file remains: the
// message names it so the owner can confirm no run is active before deleting it.

const fs = require("fs");
const path = require("path");

const { STATE_PATH } = require("../config/mainnet");

function lockPathFor(name) {
  return path.join(path.dirname(STATE_PATH), `.${name}.lock`);
}

async function withDeploymentLock(name, fn) {
  const lockPath = lockPathFor(name);
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });

  let handle;

  try {
    handle = fs.openSync(lockPath, "wx", 0o600);
  } catch (error) {
    if (error.code === "EEXIST") {
      let detail = "";
      try {
        const info = JSON.parse(fs.readFileSync(lockPath, "utf8"));
        detail = ` (started ${info.startedAt || "unknown"} by pid ${info.pid || "unknown"})`;
      } catch (readError) {
        detail = "";
      }

      throw new Error(
        `Another "${name}" run appears to be in progress${detail}. Lock file: ${lockPath}. If no run is active, delete that file and retry. Nothing was submitted.`
      );
    }

    throw error;
  }

  try {
    fs.writeFileSync(
      handle,
      JSON.stringify({
        pid: process.pid,
        startedAt: new Date().toISOString(),
        script: name
      })
    );

    return await fn();
  } finally {
    fs.closeSync(handle);

    try {
      fs.unlinkSync(lockPath);
    } catch (error) {
      // Already removed; nothing to clean up.
    }
  }
}

module.exports = { withDeploymentLock, lockPathFor };
