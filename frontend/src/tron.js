import { TronWeb } from "tronweb";

export const PROPERTY_TOKEN_ADDRESS = import.meta.env.VITE_PROPERTY_TOKEN_ADDRESS || "";
export const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS || "";
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export async function connectTronLink() {
  if (!window.tronWeb || !window.tronWeb.ready) {
    throw new Error("TronLink not found or not unlocked. Install the TronLink extension/app.");
  }
  return window.tronWeb.defaultAddress.base58;
}

export function getTronWeb() {
  if (!window.tronWeb) throw new Error("TronLink not injected");
  return window.tronWeb;
}

export async function getPropertyTokenContract() {
  const tronWeb = getTronWeb();
  return tronWeb.contract().at(PROPERTY_TOKEN_ADDRESS);
}

export async function getMarketplaceContract() {
  const tronWeb = getTronWeb();
  return tronWeb.contract().at(MARKETPLACE_ADDRESS);
}
