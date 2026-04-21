import { Capacitor } from "https://cdn.jsdelivr.net/npm/@capacitor/core@8.3.1/+esm";

export function isMobile() {
    return Capacitor.getPlatform() !== "web";
}
