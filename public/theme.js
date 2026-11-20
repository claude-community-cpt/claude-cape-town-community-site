/* Runs before the page paints. Kept as a separate file so the Content
   Security Policy can forbid inline scripts. */
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  // The visitor's own choice wins; otherwise CSS follows the system setting.
  try {
    var stored = localStorage.getItem("cc-theme");
    if (stored === "light" || stored === "dark") root.setAttribute("data-theme", stored);
  } catch (e) {}

  // Links to the old single-page site looked like /#/events. Send them on.
  var hash = location.hash;
  if (location.pathname === "/" && hash.indexOf("#/") === 0) {
    var parts = hash.slice(2).split("/").filter(Boolean);
    var pages = ["events", "gallery", "demos", "speak", "partner", "join"];
    if (parts.length && pages.indexOf(parts[0]) !== -1) {
      if (parts[0] === "gallery") parts = ["events", "past"]; // photos are on each event's page now
      location.replace("/" + parts[0] + "/" + (parts[1] === "past" ? "#past" : ""));
    }
  }
})();
