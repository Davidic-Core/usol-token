"use strict";

// Local navigation enhancement: turns the wrapped mobile link list into a
// disclosure dropdown. The page keeps its wrapped-link navigation when this
// file does not run. No network, wallet, or transaction code.

document.documentElement.classList.add("has-js");

(function () {
  function init() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector("[data-nav-toggle]");
    var menu = document.getElementById("site-menu");

    if (!header || !toggle || !menu) return;

    function setOpen(open) {
      header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function isOpen() {
      return header.classList.contains("is-open");
    }

    toggle.addEventListener("click", function () {
      setOpen(!isOpen());
    });

    // Following a section link closes the menu.
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (isOpen() && !header.contains(event.target)) setOpen(false);
    });

    // A dropdown only exists on narrow viewports; close it when the layout
    // returns to the desktop navigation.
    var desktop = window.matchMedia("(min-width: 761px)");
    if (desktop.addEventListener) {
      desktop.addEventListener("change", function (event) {
        if (event.matches) setOpen(false);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
