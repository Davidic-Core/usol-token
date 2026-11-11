"use strict";

// Pure helpers shared by the wallet pages: address validation, read-only
// balance formatting and connection error wording. This file has no DOM,
// wallet, network, storage, signing, or transaction code; it can be loaded by
// the browser and exercised directly by the offline tests.

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.USOLWalletCore = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  var BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
  var BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  var PHANTOM_BROWSE_BASE = "https://phantom.com/ul/browse/";

  // Decode base58 to bytes without a dependency. Returns null for any
  // character outside the base58 alphabet.
  function decodeBase58(value) {
    if (typeof value !== "string" || !value || !BASE58.test(value)) return null;

    var number = 0n;
    for (var i = 0; i < value.length; i += 1) {
      var digit = BASE58_ALPHABET.indexOf(value[i]);
      if (digit < 0) return null;
      number = number * 58n + BigInt(digit);
    }

    var bytes = [];
    while (number > 0n) {
      bytes.unshift(Number(number & 0xffn));
      number >>= 8n;
    }

    for (var j = 0; j < value.length && value[j] === "1"; j += 1) {
      bytes.unshift(0);
    }

    return Uint8Array.from(bytes);
  }

  // A Solana public key is a base58 string that decodes to exactly 32 bytes.
  // This validates the shape of the address Phantom shares; it does not claim
  // the address is on-curve or owned by anyone.
  function isPublicAddress(value) {
    if (typeof value !== "string" || value.length < 32 || value.length > 44) {
      return false;
    }

    var bytes = decodeBase58(value);
    return Boolean(bytes && bytes.length === 32);
  }

  // Phantom's documented Browse deep link:
  // https://phantom.com/ul/browse/<url>?ref=<ref>
  function phantomBrowseUrl(pageUrl, referrer) {
    if (typeof pageUrl !== "string" || !pageUrl) return null;

    var reference =
      typeof referrer === "string" && referrer
        ? "?ref=" + encodeURIComponent(referrer)
        : "";

    return PHANTOM_BROWSE_BASE + encodeURIComponent(pageUrl) + reference;
  }

  // Maps Phantom's documented provider errors to plain-language guidance.
  // https://docs.phantom.com/solana/errors
  function describeConnectionError(error) {
    var code = error && error.code;
    var message = typeof (error && error.message) === "string" ? error.message.trim() : "";

    if (code === 4001 || /reject|denied|cancel/i.test(message)) {
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

    if (code === -32000) {
      return "Phantom rejected the connection request. Reload the page and try again.";
    }

    if (code === -32603) {
      return "Phantom reported an internal error. Reload Phantom, then try again.";
    }

    if (code === "USOL_INVALID_ADDRESS") {
      return "Phantom returned an address this page could not validate. Try connecting again.";
    }

    return message ? "Could not connect: " + message : "Could not connect to Phantom.";
  }

  // --- Read-only balance helpers -------------------------------------------

  // The pinned UnitedSOLANA mint and its decimals. Read-only: balances only.
  var USOL_MINT = "FeTG1ezkUZoNkPfs9XmXUCRJpK4dsT7VDRJFRmX7sGMG";
  var USOL_DECIMALS = 9;
  var SOL_DECIMALS = 9; // 1 SOL = 1e9 lamports

  // Formats a raw integer amount (lamports or token base units) as a plain
  // decimal string, trimming trailing zeros. Returns null for unusable input.
  function formatRawAmount(rawAmount, decimals) {
    var places = typeof decimals === "number" && decimals > 0 ? Math.floor(decimals) : 0;

    if (rawAmount === null || rawAmount === undefined) return null;
    if (typeof rawAmount === "number" && !Number.isFinite(rawAmount)) return null;

    var raw;
    try {
      raw = BigInt(rawAmount);
    } catch (_) {
      return null;
    }

    var negative = raw < 0n;
    if (negative) raw = -raw;

    var digits = raw.toString();
    var whole = digits;
    var fraction = "";

    if (places > 0) {
      while (digits.length <= places) digits = "0" + digits;
      whole = digits.slice(0, digits.length - places) || "0";
      fraction = digits.slice(digits.length - places).replace(/0+$/, "");
    }

    return (negative ? "-" : "") + whole + (fraction ? "." + fraction : "");
  }

  // Sums every matching token account's raw base-unit amount. Unreadable
  // entries are skipped, and no accounts at all yields 0n.
  function sumTokenAccounts(accounts) {
    var total = 0n;
    if (!Array.isArray(accounts)) return total;

    accounts.forEach(function (item) {
      var tokenAmount =
        item &&
        item.account &&
        item.account.data &&
        item.account.data.parsed &&
        item.account.data.parsed.info &&
        item.account.data.parsed.info.tokenAmount;
      if (!tokenAmount) return;
      var amount = tokenAmount.amount;
      if (typeof amount !== "string" && typeof amount !== "number") return;
      if (typeof amount === "number" && !Number.isFinite(amount)) return;
      try {
        total += BigInt(amount);
      } catch (_) {
        /* skip an entry the RPC described oddly */
      }
    });

    return total;
  }

  // Groups the whole part of a plain decimal string in thousands:
  // 918807841.194665284 -> 918,807,841.194665284
  function groupThousands(value) {
    var match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value);
    if (!match) return value;
    var whole = match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return match[1] + whole + (match[3] ? "." + match[3] : "");
  }

  // `getBalance` returns lamports; 1 SOL is 1,000,000,000 lamports.
  function formatSolBalance(lamports) {
    var value = formatRawAmount(
      lamports === null || lamports === undefined ? 0 : lamports,
      SOL_DECIMALS
    );
    return value === null ? "Unavailable" : groupThousands(value) + " SOL";
  }

  // USOL uses 9 decimals, so raw base units are summed and divided by 1e9. An
  // empty token-account list formats as "0 USOL". No price or USD value is
  // ever shown here: this is the token quantity only.
  function formatUsolBalance(rawAmount) {
    var value = formatRawAmount(
      rawAmount === null || rawAmount === undefined ? 0 : rawAmount,
      USOL_DECIMALS
    );
    return value === null ? "Unavailable" : groupThousands(value) + " USOL";
  }

  function describeBalanceError(error) {
    var message =
      error && typeof error.message === "string" ? error.message.trim() : "";
    if (!message) return "Balances could not be read. Check your connection and try again.";
    if (/failed to fetch|network ?error|networkerror|load failed/i.test(message)) {
      return "Balances could not be read. Check your connection and try again.";
    }
    return message;
  }

  return {
    USOL_MINT: USOL_MINT,
    USOL_DECIMALS: USOL_DECIMALS,
    isPublicAddress: isPublicAddress,
    phantomBrowseUrl: phantomBrowseUrl,
    describeConnectionError: describeConnectionError,
    formatRawAmount: formatRawAmount,
    sumTokenAccounts: sumTokenAccounts,
    formatSolBalance: formatSolBalance,
    formatUsolBalance: formatUsolBalance,
    describeBalanceError: describeBalanceError
  };
});
