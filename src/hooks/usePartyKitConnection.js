import { useEffect } from "react";
import { usePartyKitStore } from "./usePartyKitStore";

export function usePartyKitConnection(deviceType = "desktop") {
  const connect = usePartyKitStore((state) => state.connect);
  const disconnect = usePartyKitStore((state) => state.disconnect);

  useEffect(() => {
    connect(deviceType);

    return () => disconnect();
  }, [deviceType, connect, disconnect]);
}