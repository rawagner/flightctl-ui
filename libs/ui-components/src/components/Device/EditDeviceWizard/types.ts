import { FlightCtlLabel } from '../../../types/extraTypes';
import { SpecConfigTemplate } from '../../../types/deviceSpec';

export type DeviceSpecConfigFormValues = {
  osImage?: string;
  configTemplates: SpecConfigTemplate[];
};

export type EditDeviceFormValues = DeviceSpecConfigFormValues & {
  displayName: string;
  labels: FlightCtlLabel[];
};
