import * as React from 'react';
import { getInitialAppConfig } from '../InstallWizard/utils';
import { Formik, FormikErrors, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { load } from 'js-yaml';
import { RJSFSchema, RJSFValidationError } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import FlightCtlForm from '../../form/FlightCtlForm';
import { DynamicAppForm, isAppConfigStepValid } from '../InstallWizard/steps/AppConfigStep';
import { DynamicFormConfigFormik, InstallAppFormik } from '../InstallWizard/types';
import { getErrorMessage } from '../../../utils/error';
import { CatalogItem, CatalogItemVersion } from '@flightctl/types/alpha';
import { ApplicationProviderSpec, ContainerApplication, ImageVolumeProviderSpec } from '@flightctl/types';
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Spinner,
  EmptyState,
} from '@patternfly/react-core';
import { useTranslation } from '../../../hooks/useTranslation';
import { useFetch } from '../../../hooks/useFetch';
import { getFullReferenceURI } from '../utils';

type EditAppModalContentProps = {
  onClose: VoidFunction;
  error: string | undefined;
  schemaErrors: RJSFValidationError[] | undefined;
  isEdit: boolean;
};

const EditAppModalContent = ({ onClose, error, schemaErrors, isEdit }: EditAppModalContentProps) => {
  const { t } = useTranslation();
  const { submitForm, isSubmitting, isValid, values, errors } = useFormikContext<AppUpdateFormik>();
  const isConfigValid = isAppConfigStepValid(values, errors);
  return (
    <>
      <ModalHeader title={isEdit ? t('Edit application') : t('Deploy application')} />
      <ModalBody>
        <FlightCtlForm>
          <DynamicAppForm isInModal isEdit={isEdit} schemaErrors={schemaErrors} />
        </FlightCtlForm>
      </ModalBody>
      <ModalFooter>
        <Stack hasGutter>
          <StackItem>
            {error && (
              <Alert
                isInline
                variant="danger"
                title={isEdit ? t('Failed to update the application') : t('Failed to deploy the application')}
              >
                {error}
              </Alert>
            )}
          </StackItem>
          <StackItem>
            <Split hasGutter>
              <SplitItem>
                <Button
                  variant="primary"
                  onClick={submitForm}
                  isLoading={isSubmitting}
                  isDisabled={isSubmitting || !isValid || !isConfigValid}
                >
                  {isEdit ? t('Edit') : t('Deploy')}
                </Button>
              </SplitItem>
              <SplitItem>
                <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
                  {t('Cancel')}
                </Button>
              </SplitItem>
            </Split>
          </StackItem>
        </Stack>
      </ModalFooter>
    </>
  );
};

export type AppUpdateFormik = DynamicFormConfigFormik;

type EditAppModalProps = {
  currentApps: ApplicationProviderSpec[] | undefined;
  catalogItem: CatalogItem;
  onClose: VoidFunction;
  currentVersion: CatalogItemVersion;
  currentChannel: string;
  onSubmit: (catalogItem: CatalogItem, version: string, channel: string, values: AppUpdateFormik) => Promise<void>;
  appSpec?: ApplicationProviderSpec;
  exisingLabels: Record<string, string> | undefined;
};

const EditAppModal = ({
  currentApps,
  catalogItem,
  onClose,
  currentVersion,
  onSubmit,
  appSpec,
  currentChannel,
  exisingLabels,
}: EditAppModalProps) => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<string>();
  const [schemaErrors, setSchemaErrors] = React.useState<RJSFValidationError[] | undefined>(undefined);
  const { get } = useFetch();

  const [initialValues, setInitialValues] = React.useState<DynamicFormConfigFormik>();

  const validationSchema = React.useMemo(
    () =>
      Yup.object({
        appName: Yup.string()
          .required(t('Application name is required'))
          .test('is-unique', t('Application with the same name already exists.'), (value) => {
            if (!currentApps?.length) {
              return true;
            }
            return !currentApps.some((app) => app.name === value);
          }),
      }),
    [t],
  );

  React.useEffect(() => {
    (async () => {
      const appConfig = getInitialAppConfig(catalogItem, currentVersion.version, appSpec, exisingLabels);

      const assetCatalogItems = appConfig.selectedAssets.map((sa) => {
        return get<CatalogItem>(`catalogs/${sa.assetCatalog}/items/${sa.assetItemName}`);
      });

      const results = await Promise.allSettled(assetCatalogItems);
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          const volumeIdx = appConfig.selectedAssets[idx].volumeIndex;
          const volumes = (appSpec as ContainerApplication).volumes;
          const volume = volumes ? volumes[volumeIdx] : undefined;
          const imgRef = (volume as ImageVolumeProviderSpec).image?.reference;
          const v = r.value.spec.versions.find((v) => getFullReferenceURI(r.value.spec.reference.uri, v) === imgRef);
          appConfig.selectedAssets[idx].assetVersion = v?.version || '';
          appConfig.selectedAssets[idx].assetItem = r.value;
        }
      });
      setInitialValues(appConfig);
    })();
  }, []);

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      {initialValues ? (
        <Formik<AppUpdateFormik>
          validationSchema={validationSchema}
          initialValues={initialValues}
          validateOnMount
          onSubmit={async (values) => {
            setError(undefined);
            setSchemaErrors(undefined);
            if (values.configureVia === 'editor') {
              let yamlContent: unknown;
              try {
                yamlContent = load(values.editorContent);
              } catch {
                setError(t('Not a valid configuration'));
                return;
              }
              if (values.configSchema) {
                const validationData = validator.validateFormData(yamlContent, values.configSchema as RJSFSchema);
                if (validationData.errors.length) {
                  setSchemaErrors(validationData.errors);
                  return;
                }
              }
            }
            try {
              await onSubmit(catalogItem, currentVersion.version, currentChannel, values);
              onClose();
            } catch (e) {
              setError(getErrorMessage(e));
            }
          }}
        >
          <EditAppModalContent onClose={onClose} error={error} schemaErrors={schemaErrors} isEdit={!!appSpec} />
        </Formik>
      ) : (
        <EmptyState titleText={t('Loading application details')} headingLevel="h4" icon={Spinner} />
      )}
    </Modal>
  );
};

export default EditAppModal;
