import {Capacitor} from 'https://cdn.jsdelivr.net/npm/@capacitor/core@8.3.1/+esm';
const apiHost = Capacitor.getPlatform() === "web" ? window.location.origin : "https://khet-olympe.ps8.pns.academy";

export async function apiFetch(url,options={}) {
    return await fetch(apiHost+url,options);
}
