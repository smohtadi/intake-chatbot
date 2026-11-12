import { site } from "@/config/site";

// Single source of truth for routes. `path` is used by the router, `getHref`
// builds links, `getDocTitle` sets document.title.
export const paths = {
  home: {
    path: "/",
    getDocTitle: () => site.name,
    getHref: () => "/",
  },
  team: {
    path: "/team",
    getDocTitle: () => `Our Team - ${site.name}`,
    getHref: () => "/team",
  },
  specialistEdit: {
    path: "/team/:id/edit",
    getDocTitle: (name: string) => `Edit ${name} - ${site.name}`,
    getHref: (id: string) => `/team/${id}/edit`,
  },
  login: {
    path: "/login",
    getDocTitle: () => `Sign in - ${site.name}`,
    getHref: () => "/login",
  },
};
