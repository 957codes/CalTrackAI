import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

let currentlyOnline = true;
const listeners: Set<(online: boolean) => void> = new Set();

const unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
  const online = !!(state.isConnected && state.isInternetReachable !== false);
  if (online !== currentlyOnline) {
    currentlyOnline = online;
    listeners.forEach((fn) => fn(online));
  }
});

export function isOnline(): boolean {
  return currentlyOnline;
}

export function onConnectivityChange(fn: (online: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useIsOnline(): boolean {
  const [online, setOnline] = useState(currentlyOnline);
  useEffect(() => {
    setOnline(currentlyOnline);
    return onConnectivityChange(setOnline);
  }, []);
  return online;
}
