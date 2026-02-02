import { CatalogItem } from '@flightctl/types/alpha';
import validator from '@rjsf/validator-ajv8';
import { createSchemaUtils } from '@rjsf/utils';
import { dump } from 'js-yaml';
import { DynamicFormConfigFormik } from './types';
import { ApplicationProviderSpec, ApplicationVolume } from '@flightctl/types';
import merge from 'lodash/merge';
import {
  APP_VOLUME_CATALOG_LABEL_KEY,
  APP_VOLUME_CHANNEL_LABEL_KEY,
  APP_VOLUME_ITEM_LABEL_KEY,
  getAppVolumeName,
} from '../const';
import { AssetSelection } from '../../DynamicForm/DynamicForm';
import { FormikHelpers } from 'formik';

const appSpecFilteredKeys = ['name', 'image', 'appType'];

export const getInitialAppConfig = (
  catalogItem: CatalogItem,
  version: string | undefined,
  existingApp?: ApplicationProviderSpec,
  existingLabels?: Record<string, string>,
): DynamicFormConfigFormik => {
  const configSchema =
    catalogItem.spec.versions.find((v) => v.version === version)?.configSchema ??
    catalogItem?.spec.defaults?.configSchema;
  let defaultConfig =
    catalogItem.spec.versions.find((v) => v.version === version)?.config ?? catalogItem?.spec.defaults?.config;

  let formValues: Record<string, unknown> = {};
  if (configSchema) {
    const schemaUtils = createSchemaUtils(validator, configSchema);
    formValues = schemaUtils.getDefaultFormState(configSchema) as Record<string, unknown>;
  }

  let selectedAssets = [];
  if (existingApp) {
    const appConfig = Object.keys(existingApp).reduce((acc, key) => {
      if (!appSpecFilteredKeys.includes(key)) {
        acc[key] = existingApp[key];
      }
      return acc;
    }, {});

    formValues = merge(formValues, appConfig);
    defaultConfig = merge(defaultConfig || {}, appConfig);

    if (existingLabels) {
      const existingVolumes = formValues['volumes'];
      if (Array.isArray(existingVolumes)) {
        selectedAssets = existingVolumes.reduce((acc, curr, idx) => {
          const volumeName = (curr as ApplicationVolume).name;
          if (volumeName) {
            const volumeCatalog =
              existingLabels[`${getAppVolumeName(existingApp.name, volumeName, APP_VOLUME_CATALOG_LABEL_KEY)}`];
            const volumeChannel =
              existingLabels[`${getAppVolumeName(existingApp.name, volumeName, APP_VOLUME_CHANNEL_LABEL_KEY)}`];
            const volumeItem =
              existingLabels[`${getAppVolumeName(existingApp.name, volumeName, APP_VOLUME_ITEM_LABEL_KEY)}`];

            if (volumeCatalog && volumeChannel && volumeItem) {
              acc.push({
                assetCatalog: volumeCatalog,
                assetChannel: volumeChannel,
                assetItemName: volumeItem,
                volumeIndex: idx,
                assetVersion: '', // ?? TODO
              } as AssetSelection);
            }
          }
          return acc;
        }, [] as AssetSelection[]);
      }
    }
  }

  const dynamicFormValid = configSchema
    ? validator.validateFormData(formValues, configSchema).errors?.length === 0
    : true;

  return {
    appName: existingApp?.name || '',
    configureVia: configSchema ? 'form' : 'editor',
    editorContent: defaultConfig ? dump(defaultConfig) : '',
    selectedAssets,
    formValues,
    configSchema,
    dynamicFormValid,
  };
};

export const applyInitialConfig = (
  setFieldValue: FormikHelpers<unknown>['setFieldValue'],
  appConfig: DynamicFormConfigFormik,
) => {
  setFieldValue('configSchema', appConfig.configSchema, true);
  setFieldValue('configureVia', appConfig.configureVia, true);
  setFieldValue('dynamicFormValid', appConfig.dynamicFormValid, true);
  setFieldValue('editorContent', appConfig.editorContent, true);
  setFieldValue('formValues', appConfig.formValues, true);
  setFieldValue('selectedAssets', appConfig.selectedAssets, true);
};
