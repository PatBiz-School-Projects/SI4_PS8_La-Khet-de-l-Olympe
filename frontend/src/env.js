import { Capacitor } from "https://cdn.jsdelivr.net/npm/@capacitor/core@8.3.1/+esm";

export const PLATFORM = Capacitor.getPlatform();

export const IS_ANDROID_WEBVIEW = PLATFORM === "android";
export const IS_IOS_WEBVIEW = PLATFORM === "ios";
export const IS_MOBILE_WEBVIEW = IS_IOS_WEBVIEW || IS_ANDROID_WEBVIEW;

export const API_HOST = IS_MOBILE_WEBVIEW ? "https://khet-olympe.ps8.pns.academy" : window.location.origin;
