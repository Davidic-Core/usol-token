"use strict";

// Phase 1: Phantom wallet connection for UnitedSolana (USOL).
//
// Detection prefers Phantom's official provider (window.phantom.solana) and
// falls back to the legacy injected window.solana object. Only the public key
// is read: no transactions, no signatures, no key material.

const CONNECT_TIMEOUT_MS = 20000;
const DISCONNECT_TIMEOUT_MS = 10000;

const statusEl = document.getElementById("wallet-status");
const diagnosticsEl = document.getElementById("diagnostics");
const connectButton = document.getElementById("connect-button");
const accountEl = document.getElementById("account");
const addressEl = document.getElementById("account-address");
const disconnectButton = document.getElementById("disconnect-button");
const messageEl = document.getElementById("message");
const installHint = document.getElementById("install-hint");

const boundProviders = new WeakSet();

let provider = null;
let providerPath = null;
let address = null;
let busy = false;
let activity = null;

function setMessage(text, tone) {
  if (!text) {
    messageEl.hidden = true;
    messageEl.textContent = "";
    return;
  }

  messageEl.hidden = false;
  messageEl.dataset.tone = tone || "info";
  messageEl.textContent = text;
}

// Phantom returns web3.js PublicKey objects; use toBase58() for the address.
function toBase58(publicKey) {
  if (!publicKey) return null;

  if (typeof publicKey.toBase58 === "function") {
    try {
      const value = publicKey.toBase58();
      if (typeof value === "string" && value) return value;
    } catch (error) {
      // Fall through to the string check below.
    }
  }

  return typeof publicKey === "string" && publicKey ? publicKey : null;
}

function currentPublicKey() {
  try {
    return toBase58(provider?.publicKey);
  } catch (error) {
    return null;
  }
}

function isProviderConnected() {
  try {
    return provider?.isConnected === true || Boolean(currentPublicKey());
  } catch (error) {
    return false;
  }
}

function diagnosticsText() {
  if (!provider) {
    return "No provider found. Checked window.phantom?.solana and window.solana.";
  }

  const parts = [`Provider: ${providerPath}`, `isConnected: ${isProviderConnected()}`];
  if (activity) parts.push(activity);
  return parts.join(" · ");
}

function render() {
  const connected = Boolean(address);

  statusEl.textContent = connected
    ? "Phantom connected."
    : provider
      ? "Phantom detected — ready to connect."
      : "No Phantom provider detected.";
  statusEl.dataset.state = connected ? "connected" : provider ? "ready" : "missing";

  diagnosticsEl.textContent = diagnosticsText();
  addressEl.textContent = address || "";
  accountEl.hidden = !connected;

  connectButton.hidden = connected;
  connectButton.disabled = busy;
  connectButton.textContent = busy ? "Connecting…" : "Connect Phantom Wallet";

  disconnectButton.disabled = busy;
  disconnectButton.textContent = busy ? "Disconnecting…" : "Disconnect Wallet";

  installHint.hidden = Boolean(provider) || connected;
}

function bindProvider(wallet) {
  if (boundProviders.has(wallet)) return;
  boundProviders.add(wallet);

  if (typeof wallet.on !== "function") return;

  wallet.on("connect", (publicKey) => {
    const key = toBase58(publicKey);
    if (!key) return;

    address = key;
    activity = "connect event";
    setMessage("Wallet connected.", "success");
    render();
  });

  wallet.on("disconnect", () => {
    address = null;
    activity = "disconnect event";
    setMessage("Wallet disconnected.", "info");
    render();
  });

  wallet.on("accountChanged", (publicKey) => {
    const key = toBase58(publicKey);

    address = key;
    activity = key ? "accountChanged event" : "accountChanged event (no account)";
    setMessage(key ? "Wallet account changed." : "Wallet disconnected.", "info");
    render();
  });
}

function detectProvider() {
  const official = window.phantom?.solana;
  const legacy = window.solana;

  let next = null;
  let nextPath = null;

  if (official?.isPhantom) {
    next = official;
    nextPath = "window.phantom.solana";
  } else if (legacy?.isPhantom) {
    next = legacy;
    nextPath = "window.solana (legacy)";
  }

  if (next !== provider) {
    provider = next;
    providerPath = nextPath;
    activity = null;
    if (provider) bindProvider(provider);
  }

  // Phantom's in-app browser opens the page already connected. Reuse that
  // session instead of asking the provider to connect a second time.
  if (provider && !address) {
    const existing = currentPublicKey();
    if (existing) {
      address = existing;
      activity = "existing session";
    }
  }

  render();
  return provider;
}

function withTimeout(promise, ms, failureMessage) {
  let timer;

  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      const error = new Error(failureMessage);
      error.code = "USOL_TIMEOUT";
      reject(error);
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function connectionError(error) {
  if (error?.code === 4001 || /reject|denied|cancel/i.test(error?.message || "")) {
    return "Connection request was rejected in Phantom.";
  }

  if (error?.code === -32002) {
    return "A connection request is already pending in Phantom.";
  }

  const detail = typeof error?.message === "string" ? error.message.trim() : "";
  return detail ? `Could not connect: ${detail}` : "Could not connect to Phantom.";
}

async function connectWallet() {
  if (busy) return;

  // Re-check on every click: mobile in-app browsers can inject the provider
  // after the initial page load.
  detectProvider();

  if (!provider) {
    activity = "connect aborted: no provider";
    setMessage(
      "No Phantom provider found. On mobile, open this page in Phantom's in-app browser; on desktop, install or unlock the Phantom extension.",
      "error"
    );
    render();
    return;
  }

  if (isProviderConnected() && currentPublicKey()) {
    address = currentPublicKey();
    activity = "reused existing session";
    setMessage("Wallet connected.", "success");
    render();
    return;
  }

  busy = true;
  activity = "connect() pending";
  setMessage("Approve the connection request in Phantom.", "info");
  render();

  try {
    const response = await withTimeout(
      Promise.resolve(provider.connect()),
      CONNECT_TIMEOUT_MS,
      "Phantom did not respond."
    );

    const key = toBase58(response?.publicKey) || currentPublicKey();
    if (!key) throw new Error("Phantom did not return a public key.");

    address = key;
    activity = "connect() resolved";
    setMessage("Wallet connected.", "success");
  } catch (error) {
    const lateKey = currentPublicKey();

    if (lateKey) {
      // The wallet connected even though the promise errored or timed out.
      address = lateKey;
      activity = "connected after connect() error";
      setMessage("Wallet connected.", "success");
    } else if (error?.code === "USOL_TIMEOUT") {
      activity = `connect() timed out after ${CONNECT_TIMEOUT_MS / 1000}s`;
      setMessage(
        `Phantom did not answer within ${CONNECT_TIMEOUT_MS / 1000} seconds. Unlock Phantom and try again, or reopen this page in Phantom's in-app browser.`,
        "error"
      );
    } else {
      activity = "connect() failed";
      setMessage(connectionError(error), "error");
    }
  } finally {
    busy = false;
    render();
  }
}

async function disconnectWallet() {
  if (busy || !provider) return;

  busy = true;
  activity = "disconnect() pending";
  setMessage("Disconnecting…", "info");
  render();

  try {
    await withTimeout(
      Promise.resolve(provider.disconnect()),
      DISCONNECT_TIMEOUT_MS,
      "Phantom did not confirm the disconnect."
    );

    address = null;
    activity = "disconnect() resolved";
    setMessage("Wallet disconnected.", "info");
  } catch (error) {
    if (error?.code === "USOL_TIMEOUT") {
      address = null;
      activity = `disconnect() timed out after ${DISCONNECT_TIMEOUT_MS / 1000}s`;
      setMessage(
        "Phantom did not confirm the disconnect, so this page is signed out locally. Check Phantom's connected apps if it still lists UnitedSolana.",
        "error"
      );
    } else {
      activity = "disconnect() failed";
      setMessage("Could not disconnect. Try again from Phantom.", "error");
    }
  } finally {
    busy = false;
    render();
  }
}

connectButton.addEventListener("click", connectWallet);
disconnectButton.addEventListener("click", disconnectWallet);

detectProvider();
window.addEventListener("load", detectProvider);
window.addEventListener("phantom#initialized", detectProvider);
