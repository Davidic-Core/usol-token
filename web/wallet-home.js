"use strict";

(function () {
  const MINT = "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG";
  const RPC = "https://api.mainnet-beta.solana.com";
  const supportedNames = ["Phantom", "Solflare", "Backpack"];
  const mobileFlows = {
    Phantom: { browse: "https://phantom.com/ul/browse/", install: "https://phantom.app/download" },
    Solflare: { browse: "https://solflare.com/ul/v1/browse?url=", install: "https://solflare.com/download" },
    Backpack: { browse: "https://backpack.app/ul/v1/browse?url=", install: "https://backpack.app/download" }
  };
  const logos = { Phantom: "https://phantom.app/favicon.ico", Solflare: "https://solflare.com/favicon.ico", Backpack: "https://backpack.app/favicon.ico" };
  const selector = document.getElementById("wallet-selector");
  const options = selector.querySelector(".wallet-options");
  const connectButton = document.getElementById("homepage-connect");
  const closeButton = document.getElementById("wallet-selector-close");
  const account = document.getElementById("wallet-account");
  const address = document.getElementById("wallet-address");
  const solBalance = document.getElementById("sol-balance");
  const usolBalance = document.getElementById("usol-balance");
  const status = document.getElementById("wallet-status");
  const copyButton = document.getElementById("wallet-copy");
  const disconnectButton = document.getElementById("wallet-disconnect");
  const shorten = (value) => `${value.slice(0, 4)}…${value.slice(-4)}`;
  const setStatus = (message, tone = "info") => { status.textContent = message; status.dataset.tone = tone; };
  const keyText = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value.toBase58 === "function") return value.toBase58();
    if (typeof value.address === "string") return value.address;
    return null;
  };
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  function discover() {
    const found = [];
    const add = (name, wallet) => {
      if (wallet && typeof wallet.connect === "function" && !found.some((item) => item.wallet === wallet)) found.push({ name, wallet, installed: true });
    };
    add("Phantom", window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null));
    add("Solflare", window.solflare);
    add("Backpack", window.backpack?.solana || window.backpack);
    const standard = window.navigator?.wallets;
    if (standard && typeof standard.get === "function") {
      for (const wallet of standard.get()) {
        const name = supportedNames.find((candidate) => new RegExp(candidate, "i").test(wallet.name || wallet.identity?.name));
        if (name) add(name, wallet);
      }
    }
    return supportedNames.map((name) => found.find((item) => item.name === name) || { name, wallet: null, installed: false });
  }

  async function rpc(method, params) {
    const response = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }) });
    if (!response.ok) throw new Error("The Solana RPC service is unavailable.");
    const result = await response.json();
    if (result.error) throw new Error(result.error.message || "The Solana RPC service returned an error.");
    return result.result;
  }

  async function loadBalances(walletAddress, token) {
    solBalance.textContent = "Loading…"; usolBalance.textContent = "Loading…";
    try {
      const [lamports, tokens] = await Promise.all([
        rpc("getBalance", [walletAddress, { commitment: "confirmed" }]),
        rpc("getTokenAccountsByOwner", [walletAddress, { mint: MINT }, { encoding: "jsonParsed", commitment: "confirmed" }])
      ]);
      if (active?.token !== token) return;
      solBalance.textContent = `${(lamports.value / 1e9).toLocaleString(undefined, { maximumFractionDigits: 6 })} SOL`;
      const amount = tokens.value.reduce((total, item) => total + Number(item.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);
      usolBalance.textContent = `${amount.toLocaleString(undefined, { maximumFractionDigits: 9 })} USOL`;
      setStatus("Balances read from Solana Mainnet.", "success");
    } catch (error) {
      solBalance.textContent = "Unavailable"; usolBalance.textContent = "Unavailable";
      setStatus(error.message || "Balances could not be loaded. Try again.", "error");
    }
  }

  function mobileBrowse(entry) {
    const current = encodeURIComponent(window.location.href);
    const url = entry.name === "Phantom" ? `${mobileFlows[entry.name].browse}${current}?ref=${encodeURIComponent(window.location.origin)}` : `${mobileFlows[entry.name].browse}${current}`;
    window.location.href = url;
  }

  async function connect(entry) {
    const token = ++requestId;
    selector.close();
    if (!entry.wallet) {
      if (isMobile) { setStatus(`Opening ${entry.name}. Approve the connection in its in-app browser.`, "info"); mobileBrowse(entry); }
      else setStatus(`${entry.name} is not installed. Use its official installation link.`, "error");
      return;
    }
    setStatus(`Connecting to ${entry.name}…`);
    try {
      const result = await entry.wallet.connect();
      const walletAddress = keyText(result?.publicKey || entry.wallet.publicKey || result?.accounts?.[0] || entry.wallet.accounts?.[0]);
      if (!walletAddress || !window.USOLWalletCore?.isPublicAddress(walletAddress)) throw new Error("The wallet did not provide a valid public address.");
      active = { entry, address: walletAddress, token };
      address.textContent = shorten(walletAddress); address.title = walletAddress;
      account.hidden = false; connectButton.hidden = true;
      setStatus("Wallet connected. No transaction approval was requested.", "success");
      loadBalances(walletAddress, token);
      entry.wallet.on?.("accountChanged", (next) => { const changed = keyText(next); if (changed && window.USOLWalletCore.isPublicAddress(changed)) { active.address = changed; address.textContent = shorten(changed); loadBalances(changed, ++requestId); } else disconnect(); });
      entry.wallet.on?.("disconnect", disconnect);
    } catch (error) { setStatus(window.USOLWalletCore?.describeConnectionError(error) || error.message || "Wallet connection was not completed.", "error"); }
  }

  let active = null; let requestId = 0;
  function disconnect() {
    const wallet = active?.entry?.wallet; active = null; ++requestId; account.hidden = true; connectButton.hidden = false;
    solBalance.textContent = "—"; usolBalance.textContent = "—";
    try { wallet?.disconnect?.(); } catch (_) { /* local sign-out still completes */ }
    setStatus("Wallet disconnected.");
  }

  connectButton.addEventListener("click", () => {
    options.replaceChildren();
    discover().forEach((entry) => {
      const item = document.createElement("div"); item.className = "wallet-option-row";
      const button = document.createElement("button"); button.type = "button"; button.className = "wallet-option";
      button.innerHTML = `<img src="${logos[entry.name]}" alt="" width="28" height="28"><span>${entry.name}</span><small>${entry.installed ? "Available" : isMobile ? "Open in app" : "Not detected"}</small>`;
      button.addEventListener("click", () => connect(entry)); item.append(button);
      if (!entry.installed) { const install = document.createElement("a"); install.href = mobileFlows[entry.name].install; install.target = "_blank"; install.rel = "noopener noreferrer"; install.textContent = "Install"; item.append(install); }
      options.append(item);
    });
    selector.showModal();
  });
  closeButton.addEventListener("click", () => selector.close());
  disconnectButton.addEventListener("click", disconnect);
  copyButton.addEventListener("click", async () => { if (!active) return; try { await navigator.clipboard.writeText(active.address); copyButton.textContent = "Copied"; setTimeout(() => { copyButton.textContent = "Copy"; }, 1500); } catch (_) { setStatus("Copy is unavailable in this browser.", "error"); } });
})();
