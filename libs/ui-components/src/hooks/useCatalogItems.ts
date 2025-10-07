import * as React from 'react';

export type OLMBundle = {
  csvName: string;
  bundlePath: string;
  version: string;
  packageName: string;
  properties: (FctlMetaProps | ModelProps)[];
};

export const isFctlMetaProps = (prop: FctlMetaProps | ModelProps): prop is FctlMetaProps => {
  return prop.type === 'flightctl.meta';
};

export const isFctlModelProps = (prop: FctlMetaProps | ModelProps): prop is ModelProps => {
  return prop.type === 'flightctl.model';
};

type FctlMetaProps = {
  type: 'flightctl.meta';
  value: {
    type: 'app' | 'os' | 'model';
    source: string;
    provider: string;
    support: string;
  };
};

export type ModelValue = {
  volume: string;
  reference: {
    type: 'olm.package';
    value: {
      packageName: string;
      version: string;
    };
  }[];
};

type ModelProps = {
  type: 'flightctl.model';
  value: string;
};

export type OLMCatalogItem = {
  name: string;
  description?: string;
  icon?: {
    base64data?: string;
    mediatype?: string;
  };
  defaultChannel: string;
  Channels: {
    [key: string]: {
      name: string;
      Bundles: {
        [key: string]: {
          package: string;
          channel: string;
          name: string;
          replaces: string;
        };
      };
    };
  };
  Properties: (FctlMetaProps | ModelProps)[];
};

declare global {
  interface Window {
    API_PORT?: string;
    isRHEM?: boolean;
  }
}

const apiPort = window.API_PORT || window.location.port;
export const apiServer = `${window.location.protocol}//${window.location.hostname}${apiPort ? `:${apiPort}` : ''}/api`;

export const useCatalogItems = (): [OLMCatalogItem[], boolean] => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [catalogItems, setCatalogItems] = React.useState<OLMCatalogItem[]>([]);

  React.useEffect(() => {
    const doItAsync = async () => {
      try {
        const resp = await fetch(`${apiServer}/catalog/package`);
        if (resp.ok) {
          const catalogItems = (await resp.json()) as OLMCatalogItem[];
          setCatalogItems(catalogItems);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    };

    doItAsync();
  }, []);

  React.useEffect(() => {
    const doItAsync1 = async () => {
      const resp = await fetch(`${apiServer}/catalog/package`);
      const catalogItems = (await resp.json()) as OLMCatalogItem[];
      setCatalogItems(catalogItems);
    };

    const doItAsync = async () => {
      try {
        await doItAsync1();
      } catch {
      } finally {
        setTimeout(doItAsync, 5000);
      }
    };

    if (!isLoading) {
      doItAsync();
    }
  }, [isLoading]);

  return [catalogItems, isLoading];
};

export const useCatalogBundle = (packageName: string, channelName: string, bundleName: string) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [catalogBundle, setCatalogBundle] = React.useState<OLMBundle>();

  React.useEffect(() => {
    const doItAsync = async () => {
      try {
        const resp = await fetch(`${apiServer}/bundle/${packageName}/${channelName}/${bundleName}`);
        const bundle = (await resp.json()) as OLMBundle;
        setCatalogBundle(bundle);
      } finally {
        setIsLoading(false);
      }
    };

    doItAsync();
  }, [packageName, channelName, bundleName]);

  return [catalogBundle, isLoading];
};
