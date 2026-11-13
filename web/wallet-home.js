"use strict";

// Homepage wallet panel: Solana Wallet Standard discovery, connection,
// disconnection, account switching and read-only SOL/USOL balances.
//
// Connection and public-address reads only. This file never requests a
// signature, a transaction, a seed phrase or a private key.

(function () {
  const core = window.USOLWalletCore;
  const discovery = window.USOLWalletDiscovery;
  const selector = document.getElementById("wallet-selector");
  if (!core || !discovery || !selector) return;

  // Balances are read through this site's own server-side proxy (/api/rpc).
  // The Solana Mainnet endpoint and its Helius API key stay in the server
  // environment, so no key is sent to the browser and the page never calls a
  // third-party RPC origin directly.
  const RPC_ENDPOINT = "/api/rpc";
  const RPC_TIMEOUT_MS = 20000;
  const MINT = core.USOL_MINT;
  const options = selector.querySelector(".wallet-options");
  const help = document.getElementById("wallet-selector-help");
  const connectButton = document.getElementById("homepage-connect");
  const closeButton = document.getElementById("wallet-selector-close");
  const account = document.getElementById("wallet-account");
  const address = document.getElementById("wallet-address");
  const solBalance = document.getElementById("sol-balance");
  const usolBalance = document.getElementById("usol-balance");
  const status = document.getElementById("wallet-status");
  const copyButton = document.getElementById("wallet-copy");
  const disconnectButton = document.getElementById("wallet-disconnect");
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  let active = null;
  let balanceRun = 0;
  let abortBalances = null;
  let unsubscribeWallet = null;

  const shorten = (value) => `${value.slice(0, 4)}…${value.slice(-4)}`;
  const setStatus = (message, tone = "info") => {
    status.textContent = message;
    status.dataset.tone = tone;
  };

  // Official Wallet Standard discovery. Wallets that loaded before this script
  // are asked to register now; wallets that load later register through the
  // standard's own event.
  const registry = discovery.createWalletRegistry(window);
  discovery.attachDeprecatedRegistry(window, registry.register);

  // Injected providers are only used when the standard registry has no wallet
  // of the same name, so nothing is listed twice.
  const legacyProviders = () => [
    {
      name: "Phantom",
      wallet: window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null)
    },
    { name: "Solflare", wallet: window.solflare || null }
  ];

  const detect = () => discovery.collectWallets(registry.get(), legacyProviders());

  let rpcId = 0;
  // One read-only request through the local proxy. An aborted run, an HTTP
  // error, a JSON-RPC error and a stalled request each surface as a clear
  // message instead of a blank balance.
  async function rpc(method, params, signal) {
    rpcId += 1;
    const controller = new AbortController();
    let timedOut = false;
    const forwardAbort = () => controller.abort();
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener("abort", forwardAbort, { once: true });
    }
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, RPC_TIMEOUT_MS);

    try {
      const response = await fetch(RPC_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: rpcId, method, params }),
        signal: controller.signal
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch (_) {
        payload = null;
      }

      const rpcMessage =
        payload && payload.error && typeof payload.error.message === "string"
          ? payload.error.message.trim()
          : "";

      if (!response.ok) {
        const error = new Error(
          rpcMessage || `The balance service returned HTTP ${response.status}.`
        );
        error.status = response.status;
        throw error;
      }
      if (!payload || typeof payload !== "object") {
        throw new Error("The balance service returned an unreadable response.");
      }
      if (payload.error) {
        throw new Error(rpcMessage || "Solana Mainnet RPC returned an error.");
      }
      return payload.result;
    } catch (error) {
      if (timedOut && !(signal && signal.aborted)) {
        throw new Error("The balance request timed out. Try again.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", forwardAbort);
    }
  }

  // Read-only balances for one address. The run counter plus the abort signal
  // keep a slow reply from overwriting the balances of another account.
  async function loadBalances(walletAddress, run) {
    if (abortBalances) abortBalances.abort();
    abortBalances = new AbortController();
    solBalance.textContent = "Loading…";
    usolBalance.textContent = "Loading…";
    setStatus("Reading balances from Solana Mainnet…");

    try {
      const [balance, tokens] = await Promise.all([
        rpc("getBalance", [walletAddress, { commitment: "confirmed" }], abortBalances.signal),
        rpc(
          "getTokenAccountsByOwner",
          [walletAddress, { mint: MINT }, { encoding: "jsonParsed", commitment: "confirmed" }],
          abortBalances.signal
        )
      ]);

      if (run !== balanceRun || !active || active.address !== walletAddress) return;

      solBalance.textContent = core.formatSolBalance(balance && balance.value);
      const tokenAccounts = tokens && Array.isArray(tokens.value) ? tokens.value : [];
      usolBalance.textContent = core.formatUsolBalance(core.sumTokenAccounts(tokenAccounts));
      setStatus(`Balances read from Solana Mainnet for ${active.name}.`, "success");
    } catch (error) {
      if (error && error.name === "AbortError") return;
      if (run !== balanceRun || !active || active.address !== walletAddress) return;
      solBalance.textContent = "Unavailable";
      usolBalance.textContent = "Unavailable";
      setStatus(core.describeBalanceError(error), "error");
    }
  }

  function renderAccount() {
    address.textContent = shorten(active.address);
    address.title = active.address;
    account.hidden = false;
    connectButton.hidden = true;
  }

  function watchWallet(wallet) {
    if (unsubscribeWallet) unsubscribeWallet();
    unsubscribeWallet = discovery.watchWallet(wallet, {
      onAccount(next) {
        if (!active || active.wallet !== wallet) return;
        if (!core.isPublicAddress(next) || next === active.address) return;
        active.address = next;
        renderAccount();
        setStatus("Wallet account changed. Reading balances…");
        loadBalances(next, ++balanceRun);
      },
      onDisconnect() {
        if (active && active.wallet === wallet) {
          disconnect({ reason: `${active.name} disconnected.`, remote: true });
        }
      }
    });
  }

  async function connect(entry) {
    selector.close();
    setStatus(`Connecting to ${entry.name}…`);

    try {
      const walletAddress = await discovery.connectWallet(entry.wallet);
      if (!core.isPublicAddress(walletAddress)) {
        const invalid = new Error("The wallet returned an unusable address.");
        invalid.code = "USOL_INVALID_ADDRESS";
        throw invalid;
      }

      active = { name: entry.name, wallet: entry.wallet, address: walletAddress };
      renderAccount();
      setStatus(`Connected to ${entry.name}. No transaction approval was requested.`, "success");
      watchWallet(entry.wallet);
      loadBalances(walletAddress, ++balanceRun);
    } catch (error) {
      setStatus(discovery.describeConnectionError(error, entry.name), "error");
    }
  }

  function disconnect({ reason, remote = false } = {}) {
    const previous = active;
    active = null;
    balanceRun += 1;
    if (abortBalances) {
      abortBalances.abort();
      abortBalances = null;
    }
    if (unsubscribeWallet) {
      unsubscribeWallet();
      unsubscribeWallet = null;
    }
    account.hidden = true;
    connectButton.hidden = false;
    solBalance.textContent = "—";
    usolBalance.textContent = "—";
    if (previous && !remote) discovery.disconnectWallet(previous.wallet);
    setStatus(reason || "Wallet disconnected.");
  }

  function walletIcon(entry) {
    if (entry.icon) {
      const image = document.createElement("img");
      image.src = entry.icon;
      image.alt = "";
      image.width = 28;
      image.height = 28;
      return image;
    }
    const mark = document.createElement("span");
    mark.className = "wallet-option__mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = (entry.name.trim()[0] || "?").toUpperCase();
    return mark;
  }

  function guidanceLink(text, href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    return link;
  }

  // Shown only when no compatible wallet was detected. Opening a wallet app is
  // never reported as a connection.
  function renderGuidance() {
    help.replaceChildren();
    help.hidden = false;

    const intro = document.createElement("p");
    help.append(intro);

    if (isMobile) {
      intro.textContent =
        "No Solana wallet was detected in this browser. Open this page inside your wallet's in-app browser to connect:";
      ["Phantom", "Solflare"].forEach((name) => {
        const url = discovery.mobileBrowseUrl(name, window.location.href, window.location.origin);
        if (!url) return;
        const link = guidanceLink(`Open in ${name}`, url);
        link.addEventListener("click", () => {
          setStatus(
            `Opening ${name}. Connection completes only after you approve it inside the app.`
          );
        });
        help.append(link);
      });
    } else {
      intro.textContent =
        "No Solana wallet extension was detected in this browser. Install a compatible wallet, then reload this page:";
      ["Phantom", "Solflare"].forEach((name) => {
        const url = discovery.installUrl(name);
        if (!url) return;
        const link = guidanceLink(`Install ${name}`, url);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        help.append(link);
      });
    }

    const note = document.createElement("p");
    note.className = "wallet-selector__note";
    note.textContent = isMobile
      ? "Opening a wallet app is not a connection. The wallet must approve the connection inside its own browser."
      : "Already installed? Reload this page so the wallet can register itself.";
    help.append(note);
  }

  function renderSelector() {
    const entries = detect();
    options.replaceChildren();
    help.replaceChildren();
    help.hidden = entries.length > 0;

    entries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "wallet-option-row";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "wallet-option";
      const label = document.createElement("span");
      label.textContent = entry.name;
      const hint = document.createElement("small");
      hint.textContent = entry.canConnect ? "Detected" : "Connect not supported";
      button.append(walletIcon(entry), label, hint);

      if (entry.canConnect) {
        button.addEventListener("click", () => connect(entry));
      } else {
        button.disabled = true;
      }

      row.append(button);
      options.append(row);
    });

    if (!entries.length) renderGuidance();
  }

  connectButton.addEventListener("click", () => {
    renderSelector();
    selector.showModal();
  });

  registry.onChange(() => {
    if (selector.open) renderSelector();
  });

  closeButton.addEventListener("click", () => selector.close());
  disconnectButton.addEventListener("click", () => disconnect());
  copyButton.addEventListener("click", async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.address);
      copyButton.textContent = "Copied";
      setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1500);
    } catch (_) {
      setStatus("Copy is unavailable in this browser.", "error");
    }
  });
})();
