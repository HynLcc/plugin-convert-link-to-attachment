import { axios } from "@teable/openapi";
import { usePluginBridge } from "@teable/sdk";
import { useEffect, useState } from "react";

export const useInitApi = () => {
  const bridge = usePluginBridge();
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    if (!bridge) {
      return;
    }
    axios.interceptors.request.use(async (config) => {
      config.baseURL = 'https://app.teable.ai/api';
      config.headers.Authorization = `Bearer ${await bridge.getSelfTempToken().then(res => res.accessToken)}`;
      return config;
    });
    setIsInit(true);
  }, [bridge]);

  return isInit;
};
