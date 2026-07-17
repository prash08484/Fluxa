/**
 * GLOBAL sidebar / bottom-tabs navigation.
 *
 * After login the only things visible are: Projects (the dashboard) and
 * Library (saved items). Everything else — Get ideas / Write script / Make
 * thumbnail / Judge & analyze / cross-platform extensions — lives INSIDE a
 * project workspace, not at the top level.
 *
 * If you need to add a project-scoped tool, edit InProjectTools.js
 * (not this file).
 */

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Projects", short: "Home", icon: "home" },
  { href: "/library",   label: "Library",  short: "Saved", icon: "bookmark" },
];

export const MOBILE_TABS = NAV_ITEMS;
