"use strict";

// Phase 1: Phantom wallet connection for UnitedSolana (USOL).
//
// How this page talks to Phantom: Phantom injects a provider object into the
// page (window.phantom.solana, also exposed as window.solana for legacy
// integrations). We call that provider's connect() method and read the account
// **public address** it returns. That is the only wallet data this page ever
// receives: no signatures, no transactions, and never a seed phrase or private
// key. Nothing is written to localStorage, sessionStorage or cookies, and the
// page makes no network request, so the address never leaves this tab.
//
// Wallet connectivity is deliberately independent of RPC configuration: this
// file contains no cluster or network settings, so the Phantom connection is
// unaffected by the Mainnet deployment scripts elsewhere in the project.

const CONNECT_TIMEOUT_MS = 20000;
const DISCONNECT_TIMEOUT_MS = 10000;

// Mobile in-app browsers can inject the provider slightly after the page loads.
const PROVIDER_WAIT_MS = 4000;
const PROVIDER_POLL_MS = 150;

// Phantom's documented deep link for opening a page in its in-app browser.
const PHANTOM_BROWSE_URL = "https://phantom.com/ul/browse/";

const statusEl = document.getElementById("wallet-status");
const diagnosticsEl = document.getElementById("diagnostics");
const connectButton = document.getElementById("connect-button");
const accountEl = document.getElementById("account");
const addressEl = document.getElementById("account-address");
const disconnectButton = document.getElementById("disconnect-button");
const messageEl = document.getElementById("message");
const installHint = document.getElementById("install-hint");
const frameNotice = document.getElementById("frame-notice");
const openTabLink = document.getElementById("open-tab");
const openInPhantomLink = document.getElementById("open-in-phantom");

// Phantom does not inject its provider into iframes, and only injects into
// https:// (or localhost) pages. Both facts decide what the page can offer.
const embedded = (() => {
  try {
    return window.self !== window.top;
  } catch (error) {
    return true;
  }
})();

const secureContextOk =
  window.location.protocol === "https:" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const mobileDevice = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);

const boundProviders = new WeakSet();
const eagerAttempted = new WeakSet();

let provider = null;
let providerPath = null;
let address = null;
let busy = false;
let awaitingProvider = false;
let activity = null;

// Phantom allows one outstanding connect request at a time, so every request
// this page makes goes through beginConnect(), which reuses the pending one.
let pendingConnect = null;

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

function phantomBrowseLink() {
  const target = encodeURIComponent(window.location.href);
  const ref = encodeURIComponent(window.location.origin);
  return `${PHANTOM_BROWSE_URL}${target}?ref=${ref}`;
}

function diagnosticsText() {
  const parts = [
    provider
      ? `provider: ${providerPath}`
      : "provider: none (checked window.phantom?.solana and window.solana)"
  ];

  if (provider) parts.push(`isConnected: ${isProviderConnected()}`);
  parts.push(`top-level: ${!embedded}`);
  parts.push(`https: ${secureContextOk}`);
  if (activity) parts.push(activity);

  return parts.join(" · ");
}

function render() {
  const connected = Boolean(address);

  let state = "missing";
  let label = "No Phantom provider detected.";

  if (connected) {
    state = "connected";
    label = "Phantom connected.";
  } else if (provider) {
    state = "ready";
    label = "Phantom detected — ready to connect.";
  } else if (awaitingProvider) {
    state = "detecting";
    label = "Looking for Phantom…";
  } else if (embedded) {
    label = "Phantom is not available inside an embedded frame.";
  }

  statusEl.textContent = label;
  statusEl.dataset.state = state;

  diagnosticsEl.textContent = diagnosticsText();
  addressEl.textContent = address || "";
  accountEl.hidden = !connected;

  connectButton.hidden = connected;
  connectButton.disabled = busy;
  connectButton.textContent = awaitingProvider
    ? "Looking for Phantom…"
    : busy
      ? "Connecting…"
      : "Connect Phantom Wallet";

  disconnectButton.disabled = busy;
  disconnectButton.textContent = busy ? "Disconnecting…" : "Disconnect Wallet";

  // Only useful for a desktop visitor without the extension.
  installHint.hidden = Boolean(provider) || connected || mobileDevice;

  // Neither an iframe nor a plain mobile browser receives a provider, and each
  // has its own way forward, so say which one applies instead of just failing.
  frameNotice.hidden = !(embedded && !provider && !connected);
  if (openTabLink) openTabLink.href = window.location.href;

  if (openInPhantomLink) {
    const showPhantomLink = mobileDevice && !provider && !connected;
    openInPhantomLink.hidden = !showPhantomLink;
    if (showPhantomLink) openInPhantomLink.href = phantomBrowseLink();
  }
}

function bindProvider(wallet) {
  if (boundProviders.has(wallet)) return;
  boundProviders.add(wallet);

  if (typeof wallet.on !== "function") return;

  wallet.on("connect", (publicKey) => {
    const key = toBase58(publicKey) || currentPublicKey();
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

    if (key) {
      address = key;
      activity = "accountChanged event";
      setMessage("Wallet account changed.", "info");
    } else {
      // Phantom withheld the new account: stop showing the old address rather
      // than prompt from an event handler.
      address = null;
      activity = "accountChanged event (no account)";
      setMessage("Phantom stopped sharing an account. Tap Connect and choose one.", "info");
    }

    render();
  });
}

function providerFromPage() {
  const official = window.phantom?.solana;
  if (official?.isPhantom) {
    return { wallet: official, path: "window.phantom.solana" };
  }

  const legacy = window.solana;
  if (legacy?.isPhantom) {
    return { wallet: legacy, path: "window.solana (legacy)" };
  }

  return { wallet: null, path: null };
}

function detectProvider() {
  const found = providerFromPage();

  if (found.wallet !== provider) {
    provider = found.wallet;
    providerPath = found.path;
    activity = null;

    if (provider) {
      bindProvider(provider);
      restoreSession(provider);
    }
  }

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

// Eager connection, as documented by Phantom: connect({ onlyIfTrusted: true })
// resolves silently when this site is already trusted and rejects with 4001 when
// it is not. It never shows a prompt, so it is safe on every page load — and it
// is what restores a session when the in-app browser reopens the page.
function restoreSession(wallet) {
  if (eagerAttempted.has(wallet) || typeof wallet.connect !== "function") return;
  eagerAttempted.add(wallet);

  beginConnect(wallet, true)
    .then((response) => {
      const key = toBase58(response?.publicKey) || currentPublicKey();
      if (!key) return;

      address = key;
      activity = "existing trusted session";
      setMessage("Wallet connected.", "success");
      render();
    })
    .catch(() => {
      // Not trusted yet: stay disconnected until the visitor presses Connect.
      if (!address) activity = "no trusted session yet";
      render();
    });
}

// Single funnel for connect requests. A request that is still pending is reused
// instead of issuing a second one, because Phantom rejects overlapping requests.
function beginConnect(wallet, onlyIfTrusted) {
  if (pendingConnect) return pendingConnect.promise;

  let promise;
  try {
    promise = Promise.resolve(
      onlyIfTrusted ? wallet.connect({ onlyIfTrusted: true }) : wallet.connect()
    );
  } catch (error) {
    return Promise.reject(error);
  }

  const entry = { promise, onlyIfTrusted };
  pendingConnect = entry;

  const settle = () => {
    if (pendingConnect === entry) pendingConnect = null;
  };
  promise.then(settle, settle);

  return promise;
}

async function waitForProvider() {
  const deadline = Date.now() + PROVIDER_WAIT_MS;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, PROVIDER_POLL_MS));
    if (detectProvider()) return provider;
  }

  return detectProvider();
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
  const code = error?.code;

  if (code === 4001 || /reject|denied|cancel/i.test(error?.message || "")) {
    return "Connection request was rejected in Phantom.";
  }

  if (code === -32002) {
    return "Phantom already has an approval window open. Finish it there, then try again.";
  }

  if (code === 4100) {
    return "Phantom has not authorized this site yet. Approve the connection request in Phantom.";
  }

  if (code === 4900) {
    return "Phantom lost its connection to the network. Check Phantom's connection and try again.";
  }

  const detail = typeof error?.message === "string" ? error.message.trim() : "";
  return detail ? `Could not connect: ${detail}` : "Could not connect to Phantom.";
}

function noProviderMessage() {
  if (embedded) {
    return "Phantom cannot connect from an embedded frame. Open this page in its own tab, then tap Connect.";
  }

  if (mobileDevice) {
    return "No Phantom provider found in this browser. Open this page in Phantom's in-app browser using the button above.";
  }

  if (!secureContextOk) {
    return "Phantom only injects its provider on https:// pages (or localhost). Open this page over https and try again.";
  }

  return "No Phantom provider found. Install or unlock the Phantom extension, then reload this page.";
}

async function connectWallet() {
  if (busy) return;

  // Re-check on every click: in-app browsers can inject the provider after the
  // first paint, so a tap must not fail just because nothing was there yet.
  if (!detectProvider()) {
    busy = true;
    awaitingProvider = true;
    activity = "waiting for provider injection";
    render();

    await waitForProvider();

    busy = false;
    awaitingProvider = false;

    if (!provider) {
      activity = "connect aborted: no provider";
      setMessage(noProviderMessage(), "error");
      render();
      return;
    }
  }

  // A session may already exist (Phantom restored it, or the user is coming back
  // to a trusted site): show that instead of opening another approval prompt.
  const existing = currentPublicKey();
  if (existing) {
    address = existing;
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
    // An eager attempt must settle before a real request: if it is still open,
    // wait for it rather than opening a second approval window.
    if (pendingConnect?.onlyIfTrusted) {
      await pendingConnect.promise.catch(() => {});
    }

    const response = await withTimeout(
      beginConnect(provider, false),
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
        `Phantom has not answered yet. Approve the request in Phantom; if no prompt appeared, reopen this page in Phantom's in-app browser.`,
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
      address = null;
      activity = "disconnect() failed";
      setMessage("Could not disconnect in Phantom, so this page is signed out locally.", "error");
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
