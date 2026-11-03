"use strict";

// Phase 1: minimal Phantom wallet connection for UnitedSolana (USOL).
//
// Uses Phantom's official browser provider (window.phantom.solana). Only the
// public key is read: no transactions, no signatures, no key material.

const statusEl = document.getElementById("wallet-status");
const connectButton = document.getElementById("connect-button");
const accountEl = document.getElementById("account");
const addressEl = document.getElementById("account-address");
const disconnectButton = document.getElementById("disconnect-button");
const messageEl = document.getElementById("message");
const installHint = document.getElementById("install-hint");

const boundProviders = new WeakSet();

let provider = null;
let address = null;
let busy = false;

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

function render() {
  const isConnected = Boolean(address);

  statusEl.textContent = isConnected
    ? "Phantom connected."
    : provider
      ? "Phantom detected — ready to connect."
      : "Phantom not detected.";
  statusEl.dataset.state = isConnected ? "connected" : provider ? "ready" : "missing";

  addressEl.textContent = address || "";
  accountEl.hidden = !isConnected;

  connectButton.hidden = isConnected;
  connectButton.disabled = busy;
  connectButton.textContent = busy ? "Connecting…" : "Connect Phantom Wallet";

  disconnectButton.disabled = busy;
  disconnectButton.textContent = busy ? "Disconnecting…" : "Disconnect Wallet";

  installHint.hidden = Boolean(provider) || isConnected;
}

function setAddress(nextAddress) {
  address = nextAddress;
  render();
}

function bindProvider(wallet) {
  if (boundProviders.has(wallet)) return;
  boundProviders.add(wallet);

  wallet.on?.("connect", (publicKey) => {
    if (publicKey) setAddress(publicKey.toString());
  });

  wallet.on?.("disconnect", () => {
    setAddress(null);
    setMessage("Wallet disconnected.", "info");
  });

  wallet.on?.("accountChanged", (publicKey) => {
    if (publicKey) {
      setAddress(publicKey.toString());
      setMessage("Wallet account changed.", "info");
    } else {
      setAddress(null);
      setMessage("Wallet disconnected.", "info");
    }
  });

  // Restore an already trusted session without prompting the user.
  wallet
    .connect({ onlyIfTrusted: true })
    .then(({ publicKey }) => {
      if (publicKey) setAddress(publicKey.toString());
    })
    .catch(() => {
      // No trusted session yet: stay disconnected.
    });
}

function detectProvider() {
  if (provider) return;

  if (window.phantom?.solana?.isPhantom) {
    provider = window.phantom.solana;
  } else if (window.solana?.isPhantom) {
    // Older Phantom versions only expose the legacy injected object.
    provider = window.solana;
  }

  if (provider) bindProvider(provider);
  render();
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

  if (!provider) {
    setMessage("Phantom is not installed on this browser.", "error");
    installHint.hidden = false;
    return;
  }

  busy = true;
  setMessage("Approve the connection request in Phantom.", "info");
  render();

  try {
    const { publicKey } = await provider.connect();
    if (!publicKey) throw new Error("Phantom did not return a public key.");

    setAddress(publicKey.toString());
    setMessage("Wallet connected.", "success");
  } catch (error) {
    setMessage(connectionError(error), "error");
  } finally {
    busy = false;
    render();
  }
}

async function disconnectWallet() {
  if (busy || !provider) return;

  busy = true;
  setMessage("Disconnecting…", "info");
  render();

  try {
    await provider.disconnect();
    setAddress(null);
    setMessage("Wallet disconnected.", "info");
  } catch (error) {
    setMessage("Could not disconnect. Try again from Phantom.", "error");
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
