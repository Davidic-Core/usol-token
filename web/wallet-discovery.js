"use strict";

// Pure helpers for Solana Wallet Standard discovery, connection, account-change
// notifications and official mobile entry points.
// https://github.com/wallet-standard/wallet-standard
//
// Nothing here touches the DOM, storage, keys or the network: the browser
// wiring lives in wallet-home.js, which passes the window-like event target in.
// Tests load this file directly with fake wallets.

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.USOLWalletDiscovery = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  // Wallet Standard registration events and required features.
  var APP_READY_EVENT = "wallet-standard:app-ready";
  var REGISTER_WALLET_EVENT = "wallet-standard:register-wallet";
  var STANDARD_CONNECT = "standard:connect";
  var STANDARD_DISCONNECT = "standard:disconnect";
  var STANDARD_EVENTS = "standard:events";
  var SOLANA_CHAIN_PREFIX = "solana:";

  var UNSUPPORTED_WALLET = "USOL_UNSUPPORTED_WALLET";

  // Official in-app browser (universal link) entry points. Opening one of these
  // hands the page to the wallet application; it is not a connection.
  var MOBILE_BROWSE = {
    phantom: function (pageUrl, referrer) {
      return (
        "https://phantom.app/ul/browse/" +
        encodeURIComponent(pageUrl) +
        referrerSuffix(referrer)
      );
    },
    solflare: function (pageUrl, referrer) {
      return (
        "https://solflare.com/ul/v1/browse/" +
        encodeURIComponent(pageUrl) +
        referrerSuffix(referrer)
      );
    }
  };

  // Official download pages for the wallets this site can point people to.
  var INSTALL_LINKS = {
    phantom: "https://phantom.app/download",
    solflare: "https://solflare.com/download"
  };

  function referrerSuffix(referrer) {
    return typeof referrer === "string" && referrer
      ? "?ref=" + encodeURIComponent(referrer)
      : "";
  }

  // Unknown names produce no link rather than a guessed one.
  function walletKey(name) {
    return typeof name === "string" ? name.trim().toLowerCase() : "";
  }

  function normaliseName(name) {
    return walletKey(name).replace(/\s+/g, " ");
  }

  function mobileBrowseUrl(name, pageUrl, referrer) {
    if (typeof pageUrl !== "string" || !pageUrl) return null;
    var build = MOBILE_BROWSE[walletKey(name)];
    return typeof build === "function" ? build(pageUrl, referrer) : null;
  }

  function installUrl(name) {
    return INSTALL_LINKS[walletKey(name)] || null;
  }

  function isSolanaChain(chain) {
    return typeof chain === "string" && chain.indexOf(SOLANA_CHAIN_PREFIX) === 0;
  }

  function walletName(wallet) {
    return wallet && typeof wallet.name === "string" ? wallet.name.trim() : "";
  }

  function standardFeature(wallet, name) {
    var features = wallet && wallet.features;
    if (!features || typeof features !== "object") return null;
    var feature = features[name];
    return feature && typeof feature === "object" ? feature : null;
  }

  function isSolanaWallet(wallet) {
    if (!wallet || typeof wallet !== "object" || !walletName(wallet)) return false;
    if (Array.isArray(wallet.chains) && wallet.chains.some(isSolanaChain)) return true;
    var accounts = Array.isArray(wallet.accounts) ? wallet.accounts : [];
    return accounts.some(function (account) {
      return Boolean(
        account && Array.isArray(account.chains) && account.chains.some(isSolanaChain)
      );
    });
  }

  // Wallet Standard accounts expose `address`; injected legacy providers expose
  // a public key object or string.
  function addressOf(value) {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value.address === "string") return value.address;
    if (typeof value.toBase58 === "function") {
      try {
        return value.toBase58();
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  function supportsConnect(wallet) {
    var feature = standardFeature(wallet, STANDARD_CONNECT);
    if (feature && typeof feature.connect === "function") return true;
    return Boolean(wallet && typeof wallet.connect === "function");
  }

  // Registered wallets first, then injected providers whose name is not already
  // present. Names are matched case-insensitively so one wallet is never listed
  // twice, and non-Solana wallets are ignored.
  function collectWallets(standardWallets, legacyProviders) {
    var entries = [];
    var seenWallets = [];
    var seenNames = {};

    function add(name, wallet, source) {
      if (!wallet || seenWallets.indexOf(wallet) !== -1) return;
      var key = normaliseName(name);
      if (!key || seenNames[key]) return;
      seenWallets.push(wallet);
      seenNames[key] = true;
      entries.push({
        name: walletName(wallet) || String(name).trim(),
        wallet: wallet,
        source: source,
        icon: typeof wallet.icon === "string" && wallet.icon ? wallet.icon : null,
        canConnect: supportsConnect(wallet)
      });
    }

    (Array.isArray(standardWallets) ? standardWallets : []).forEach(function (wallet) {
      if (!isSolanaWallet(wallet)) return;
      add(walletName(wallet), wallet, "standard");
    });

    (Array.isArray(legacyProviders) ? legacyProviders : []).forEach(function (provider) {
      if (!provider) return;
      add(provider.name, provider.wallet, "legacy");
    });

    return entries;
  }

  // App-ready side of the Wallet Standard handshake: wallets that load before
  // this code are asked to register now, and wallets that load later are caught
  // by the register-wallet listener.
  function createWalletRegistry(target) {
    var wallets = [];
    var listeners = [];
    var api = Object.freeze({ register: register });

    function register() {
      var added = [];
      for (var i = 0; i < arguments.length; i += 1) {
        var wallet = arguments[i];
        if (wallet && wallets.indexOf(wallet) === -1) {
          wallets.push(wallet);
          added.push(wallet);
        }
      }
      if (!added.length) return;
      listeners.forEach(function (listener) {
        try {
          listener(wallets.slice());
        } catch (_) {
          /* a broken listener must not stop discovery */
        }
      });
    }

    if (target && typeof target.addEventListener === "function") {
      target.addEventListener(REGISTER_WALLET_EVENT, function (event) {
        var callback = event && event.detail;
        if (typeof callback !== "function") return;
        try {
          callback(api);
        } catch (_) {
          /* an unresponsive wallet must not stop discovery */
        }
      });
    }

    if (target && typeof target.dispatchEvent === "function") {
      try {
        target.dispatchEvent(
          new CustomEvent(APP_READY_EVENT, { detail: api })
        );
      } catch (_) {
        /* discovery continues with later registrations */
      }
    }

    return Object.freeze({
      register: register,
      get: function () {
        return wallets.slice();
      },
      onChange: function (listener) {
        listeners.push(listener);
        return function () {
          listeners = listeners.filter(function (existing) {
            return existing !== listener;
          });
        };
      }
    });
  }

  // The standard's deprecated `navigator.wallets` callback array, still used by
  // some older wallet versions, is replayed into the same registry.
  function attachDeprecatedRegistry(target, register) {
    if (typeof register !== "function") return false;
    var nav = target && target.navigator;
    if (!nav || (nav.wallets && !Array.isArray(nav.wallets))) return false;
    var pending = Array.isArray(nav.wallets) ? nav.wallets.slice() : [];
    var registry = Object.freeze({
      push: function () {
        for (var i = 0; i < arguments.length; i += 1) {
          try {
            arguments[i]({ register: register });
          } catch (_) {
            /* skip a wallet that fails to replay */
          }
        }
      }
    });
    try {
      Object.defineProperty(nav, "wallets", {
        configurable: true,
        value: registry
      });
    } catch (_) {
      return false;
    }
    registry.push.apply(registry, pending);
    return true;
  }

  function unsupported(message) {
    var error = new Error(message);
    error.code = UNSUPPORTED_WALLET;
    return error;
  }

  async function connectWallet(wallet) {
    if (!wallet) throw unsupported("No wallet was selected.");

    var feature = standardFeature(wallet, STANDARD_CONNECT);
    if (feature && typeof feature.connect === "function") {
      var result = await feature.connect();
      var address =
        addressOf(result && Array.isArray(result.accounts) ? result.accounts[0] : null) ||
        addressOf(Array.isArray(wallet.accounts) ? wallet.accounts[0] : null);
      if (!address) throw unsupported("The wallet did not share a public address.");
      return address;
    }

    if (typeof wallet.connect === "function") {
      var legacy = await wallet.connect();
      var legacyAddress =
        addressOf(legacy && legacy.publicKey) ||
        addressOf(Array.isArray(wallet.accounts) ? wallet.accounts[0] : null) ||
        addressOf(wallet.publicKey) ||
        addressOf(legacy);
      if (!legacyAddress) throw unsupported("The wallet did not share a public address.");
      return legacyAddress;
    }

    throw unsupported("This wallet does not support connecting from a website.");
  }

  async function disconnectWallet(wallet) {
    if (!wallet) return;
    var feature = standardFeature(wallet, STANDARD_DISCONNECT);
    try {
      if (feature && typeof feature.disconnect === "function") {
        await feature.disconnect();
        return;
      }
      if (typeof wallet.disconnect === "function") await wallet.disconnect();
    } catch (_) {
      /* the page still clears its own connection state */
    }
  }

  // Account switching and external disconnection, through the standard events
  // feature and the injected providers' legacy events. Returns an unsubscribe
  // function.
  function watchWallet(wallet, handlers) {
    var callbacks = handlers || {};
    var unsubscribers = [];

    var feature = standardFeature(wallet, STANDARD_EVENTS);
    if (feature && typeof feature.on === "function") {
      try {
        var offChange = feature.on("change", function (properties) {
          if (!properties || !("accounts" in properties)) return;
          var accounts = Array.isArray(properties.accounts) ? properties.accounts : [];
          if (!accounts.length) {
            callbacks.onDisconnect?.();
            return;
          }
          var address = addressOf(accounts[0]);
          if (address) callbacks.onAccount?.(address);
        });
        if (typeof offChange === "function") unsubscribers.push(offChange);
      } catch (_) {
        /* no account-change notifications from this wallet */
      }
    }

    if (wallet && typeof wallet.on === "function") {
      try {
        var offAccount = wallet.on("accountChanged", function (publicKey) {
          var address = addressOf(publicKey);
          if (address) callbacks.onAccount?.(address);
          else callbacks.onDisconnect?.();
        });
        if (typeof offAccount === "function") unsubscribers.push(offAccount);
      } catch (_) {
        /* no account-change notifications from this provider */
      }
      try {
        var offDisconnect = wallet.on("disconnect", function () {
          callbacks.onDisconnect?.();
        });
        if (typeof offDisconnect === "function") unsubscribers.push(offDisconnect);
      } catch (_) {
        /* no disconnect notifications from this provider */
      }
    }

    return function unsubscribe() {
      unsubscribers.forEach(function (off) {
        try {
          off();
        } catch (_) {
          /* already removed */
        }
      });
      unsubscribers = [];
    };
  }

  // Plain-language guidance for rejected, cancelled, unsupported and failed
  // connection attempts.
  function describeConnectionError(error, walletLabel) {
    var label = walletLabel ? walletLabel + " " : "";
    var code = error && error.code;
    var message =
      error && typeof error.message === "string" ? error.message.trim() : "";

    if (code === "USOL_INVALID_ADDRESS") {
      return "The wallet returned an address this page could not validate. Try connecting again.";
    }

    if (code === UNSUPPORTED_WALLET && message) return message;

    if (code === 4001 || /reject|denied|declin|cancel/i.test(message)) {
      return label
        ? label + "cancelled the connection request. Nothing was connected."
        : "The connection request was cancelled. Nothing was connected.";
    }

    if (code === -32002) {
      return (
        label +
        "already has an approval window open. Finish it there, then try again."
      );
    }

    if (code === 4100) {
      return label + "has not authorized this site yet. Approve the connection request in the wallet.";
    }

    if (code === 4900) {
      return label + "lost its connection to the network. Check the wallet's connection and try again.";
    }

    if (code === -32603) {
      return label + "reported an internal error. Reload the wallet, then try again.";
    }

    if (message) return "Could not connect: " + message;
    return label
      ? "Could not connect to " + walletLabel.trim() + "."
      : "Could not connect to the wallet.";
  }

  return {
    APP_READY_EVENT: APP_READY_EVENT,
    REGISTER_WALLET_EVENT: REGISTER_WALLET_EVENT,
    UNSUPPORTED_WALLET: UNSUPPORTED_WALLET,
    isSolanaWallet: isSolanaWallet,
    supportsConnect: supportsConnect,
    collectWallets: collectWallets,
    createWalletRegistry: createWalletRegistry,
    attachDeprecatedRegistry: attachDeprecatedRegistry,
    connectWallet: connectWallet,
    disconnectWallet: disconnectWallet,
    watchWallet: watchWallet,
    describeConnectionError: describeConnectionError,
    mobileBrowseUrl: mobileBrowseUrl,
    installUrl: installUrl
  };
});
