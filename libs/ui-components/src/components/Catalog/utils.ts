import { Device, DeviceSpec, Fleet, PatchRequest } from '@flightctl/types';
import { ApplicationProviderSpecFixed } from '../../types/extraTypes';
import { OLMBundle, OLMCatalogItem } from '../../hooks/useCatalogItems';

type Patch = { kind: string; patches: PatchRequest };

export const getOSPatches = (bundle: OLMBundle, fleet?: Fleet, device?: Device): Patch[] => {
  const patches: Patch[] = [];
  if (fleet) {
    patches.push({
      kind: `fleets/${fleet.metadata.name}`,
      patches: [
        {
          op: 'replace',
          path: '/spec/template/spec/os',
          value: { image: bundle.bundlePath },
        },
      ],
    });
  }
  if (device) {
    patches.push({
      kind: `devices/${device.metadata.name}`,
      patches: [
        {
          op: 'add',
          path: '/metadata/labels',
          value: { oscatalog: bundle.csvName },
        },
        {
          op: 'replace',
          path: '/spec/os',
          value: { image: bundle.bundlePath },
        },
      ],
    });
  }
  return patches;
};

export const getAppPatches = (
  bundle: OLMBundle,
  channel: string,
  fleet?: Fleet,
  device?: Device,
  modelBundle?: OLMBundle,
  volumeName?: string,
  modelChannel?: string,
): Patch[] => {
  const volumeImg = modelBundle?.bundlePath;
  const patches: Patch[] = [];
  if (fleet) {
    if (!!fleet.spec.template.spec.applications?.length) {
      const kind = `fleets/${fleet.metadata.name}`;
      if (!fleet.spec.template.spec.applications?.length) {
        patches.push({
          kind,
          patches: [
            {
              op: 'add',
              path: '/spec/template/spec/applications',
              value: [
                {
                  image: bundle.bundlePath,
                },
              ] as ApplicationProviderSpecFixed[],
            },
          ],
        });
      } else {
        patches.push({
          kind,
          patches: [
            {
              op: 'add',
              path: '/spec/template/spec/applications/-',
              value: {
                image: bundle.bundlePath,
              } as ApplicationProviderSpecFixed,
            },
          ],
        });
      }
    }
  }

  if (device) {
    const kind = `devices/${device.metadata.name}`;

    const labels: { [key: string]: string } = {
      appbundle: bundle.csvName,
      appchannel: channel,
      apppackage: bundle.packageName,
    };

    if (!device.spec) {
      patches.push({
        kind,
        patches: [
          {
            op: 'add',
            path: '/spec',
            value: [
              {
                applications: [
                  {
                    image: bundle.bundlePath,
                  },
                ],
              },
            ] as DeviceSpec[],
          },
        ],
      });
    } else if (!device.spec.applications?.length) {
      const appSpec: ApplicationProviderSpecFixed = {
        image: bundle.bundlePath,
      };
      if (volumeImg && volumeName) {
        if (modelBundle && modelChannel) {
          labels.model = modelBundle.csvName;
          labels.modelChannel = modelChannel;
          labels.modelpackage = modelBundle.packageName;
        }
        appSpec.volumes = [
          {
            name: volumeName,
            image: {
              reference: volumeImg,
            },
          },
        ];
      }
      patches.push({
        kind,
        patches: [
          {
            op: 'add',
            path: '/spec/applications',
            value: [appSpec],
          },
        ],
      });
    } else {
      const appSpec: ApplicationProviderSpecFixed = {
        image: bundle.bundlePath,
      };
      if (modelBundle && modelChannel) {
        labels.model = modelBundle?.csvName;
        labels.modelChannel = modelChannel;
        labels.modelpackage = modelBundle.packageName;
      }
      if (volumeImg && volumeName) {
        appSpec.volumes = [
          {
            name: volumeName,
            image: {
              reference: volumeImg,
            },
          },
        ];
      }
      patches.push({
        kind,
        patches: [
          {
            op: 'add',
            path: '/spec/applications/-',
            value: appSpec,
          },
        ],
      });
    }

    patches.push({
      kind,
      patches: [
        {
          op: 'add',
          path: '/metadata/labels',
          value: labels,
        },
      ],
    });
  }

  return patches;
};

export const isAppItem = (ci: OLMCatalogItem) => {
  return ci.Properties.some(({ type, value }) => type === 'flightctl.meta' && value.type === 'app');
};

export const isModelItem = (ci: OLMCatalogItem) => {
  return ci.Properties.some(({ type, value }) => type === 'flightctl.meta' && value.type === 'model');
};

export const isItemInstalled = (ci: OLMCatalogItem, device: Device) => {
  if (isAppItem(ci)) {
    return device.metadata.labels?.apppackage === ci.name;
  }
  if (isModelItem(ci)) {
    return device.metadata.labels?.modelpackage === ci.name;
  }
  return false;
};

export const getItemChannel = (ci: OLMCatalogItem, device: Device) => {
  if (isAppItem(ci)) {
    return device.metadata.labels?.appchannel || '';
  }
  if (isModelItem(ci)) {
    return device.metadata.labels?.modelChannel || '';
  }
  return '';
};

export const getItemName = (ci: OLMCatalogItem, device: Device) => {
  if (isAppItem(ci)) {
    return device.metadata.labels?.appbundle || '';
  }
  if (isModelItem(ci)) {
    return device.metadata.labels?.model || '';
  }
  return '';
};
