"use strict";

(function () {
  const storageKey = "usol-theme";
  const toggle = document.getElementById("theme-toggle");
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  function apply(theme) {
    const dark = theme === "dark";
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    toggle.textContent = dark ? "Light mode" : "Dark mode";
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  }

  const saved = window.localStorage.getItem(storageKey);
  apply(saved === "dark" || saved === "light" ? saved : prefersDark.matches ? "dark" : "light");
  toggle.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(storageKey, next);
    apply(next);
  });
  prefersDark.addEventListener?.("change", (event) => {
    if (!window.localStorage.getItem(storageKey)) apply(event.matches ? "dark" : "light");
  });
})();
