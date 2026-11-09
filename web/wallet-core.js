"use strict";

// Pure helpers for the Phantom wallet page. This file has no DOM, wallet,
// network, storage, signing, or transaction code; it can be loaded by the
// browser and exercised directly by the offline tests.

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

  return {
    isPublicAddress: isPublicAddress,
    phantomBrowseUrl: phantomBrowseUrl,
    describeConnectionError: describeConnectionError
  };
});
