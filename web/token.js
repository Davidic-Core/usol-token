"use strict";

// Progressive enhancement for the token information section: one copy control
// for the canonical USOL mint address. The page reads fully without this file.
// It does not touch wallets, the network, or any transaction API.

(function () {
  var button = document.querySelector("[data-copy-mint]");
  var status = document.getElementById("mint-copy-status");
  var address = button ? button.getAttribute("data-copy-mint") : null;

  if (!button || !address) return;

  var label = button.querySelector(".copy-button__label");
  var resetTimer;

  function announce(message) {
    if (status) status.textContent = message;
  }

  function markCopied() {
    if (label) label.textContent = "Copied";
    button.setAttribute("data-copied", "true");
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(function () {
      if (label) label.textContent = "Copy";
      button.removeAttribute("data-copied");
      announce("");
    }, 4000);
  }

  function selectAddress() {
    var value = document.getElementById("mint-address");
    var selection = window.getSelection && window.getSelection();

    if (!value || !selection || !document.createRange) {
      announce("Select the mint address above to copy it.");
      return;
    }

    var range = document.createRange();
    range.selectNodeContents(value);
    selection.removeAllRanges();
    selection.addRange(range);
    announce("The mint address is selected — press Ctrl or Command + C to copy it.");
  }

  button.addEventListener("click", function () {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      selectAddress();
      return;
    }

    navigator.clipboard.writeText(address).then(function () {
      markCopied();
      announce("Mint address copied to clipboard.");
    }, selectAddress);
  });
})();
