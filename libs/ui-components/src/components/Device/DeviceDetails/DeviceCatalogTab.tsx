import { Device } from '@flightctl/types';
import * as React from 'react';
import CatalogPage from '../../Catalog/CatalogPage';

const DeviceCatalogTab = ({ device, refetch }: { device: Required<Device>; refetch: VoidFunction }) => {
  return <CatalogPage device={device} refetch={refetch} />;
};

export default DeviceCatalogTab;
