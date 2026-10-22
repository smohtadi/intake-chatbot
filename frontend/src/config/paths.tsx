import { site } from "@/config/site";

// Single source of truth for routes. `path` is used by the router, `getHref`
// builds links, `getDocTitle` sets document.title.
export const paths = {
  intake: {
    path: "/",
    getDocTitle: () => `Intake - ${site.name}`,
    getHref: () => "/",
  },
  login: {
    path: "/login",
    getDocTitle: () => `Sign in - ${site.name}`,
    getHref: () => "/login",
  },
};
