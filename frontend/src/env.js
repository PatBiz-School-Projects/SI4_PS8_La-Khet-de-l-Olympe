import { isMobile } from "/utils/platform.js";

export const API_HOST = isMobile() ? "https://khet-olympe.ps8.pns.academy" : window.location.origin;
