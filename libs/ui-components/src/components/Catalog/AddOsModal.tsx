import {
  Alert,
  Button,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { Formik, useFormikContext } from 'formik';
import * as React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import FlightCtlForm from '../form/FlightCtlForm';
import TextField from '../form/TextField';
import TextAreaField from '../form/TextAreaField';
import { useFetch } from '../../hooks/useFetch';
import { getErrorMessage } from '../../utils/error';
import {
  ApiVersion,
  CatalogItem,
  CatalogItemCategory,
  CatalogItemType,
  CatalogItemVisibility,
  CatalogList,
} from '@flightctl/types/alpha';

import * as Yup from 'yup';

type AddOsModalContentProps = {
  onClose: VoidFunction;
  error?: string;
};

const AddOsModalContent = ({ onClose, error }: AddOsModalContentProps) => {
  const { isSubmitting, isValid, submitForm } = useFormikContext();
  const { t } = useTranslation();
  return (
    <Modal isOpen variant="medium" onClose={onClose}>
      <ModalHeader title={t('Add item to catalog')} />
      <ModalBody>
        <FlightCtlForm>
          <FormGroup label={t('Name')} isRequired>
            <TextField name="name" />
          </FormGroup>
          <FormGroup label={t('Display name')} isRequired>
            <TextField name="displayName" />
          </FormGroup>
          <FormGroup label={t('OCI reference')} isRequired>
            <TextField name="ociReference" />
          </FormGroup>
          <FormGroup label={t('Channel')} isRequired>
            <TextField name="channel" />
          </FormGroup>
          <FormGroup label={t('Description')}>
            <TextAreaField name="description" />
          </FormGroup>
        </FlightCtlForm>
      </ModalBody>
      <ModalFooter>
        {error && (
          <Alert variant="danger" isInline title={t('Failed to create item')}>
            {error}
          </Alert>
        )}
        <Split hasGutter>
          <SplitItem>
            <Button
              variant="primary"
              onClick={submitForm}
              isLoading={isSubmitting}
              isDisabled={!isValid || isSubmitting}
            >
              {t('Add')}
            </Button>
          </SplitItem>
          <SplitItem>
            <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
              {t('Cancel')}
            </Button>
          </SplitItem>
        </Split>
      </ModalFooter>
    </Modal>
  );
};

type AddOsModalFormik = {
  name: string;
  displayName: string;
  ociReference: string;
  version: string;
  channel: string;
  description: string;
};

type AddOsModalProps = Pick<AddOsModalContentProps, 'onClose'>;

const AddOsModal = ({ onClose }: AddOsModalProps) => {
  const [error, setError] = React.useState<string>();
  const { post, get } = useFetch();

  const validationSchema = Yup.object({
    name: Yup.string().required(),
  });
  return (
    <Formik<AddOsModalFormik>
      validationSchema={validationSchema}
      initialValues={{
        name: '',
        displayName: '',
        ociReference: '',
        version: '',
        channel: '',
        description: '',
      }}
      onSubmit={async (values) => {
        setError(undefined);
        try {
          const catalogList = await get<CatalogList>('catalog');
          if (catalogList.items.length) {
            await post<CatalogItem>(`catalog/${catalogList.items[0].metadata.name}/catalogItem/${values.name}`, {
              apiVersion: ApiVersion.FLIGHTCTL_IO_V1ALPHA1,
              kind: 'CatalogItem',
              metadata: {
                name: values.name,
                catalog: catalogList.items[0].metadata.name || '',
              },
              spec: {
                displayName: values.displayName,
                shortDescription: values.description,
                visibility: CatalogItemVisibility.CatalogItemVisibilityPublished,
                type: CatalogItemType.CatalogItemTypeOS,
                category: CatalogItemCategory.CatalogItemCategorySystem,
                reference: {
                  uri: values.ociReference,
                },
                versions: [
                  {
                    channels: [values.channel],
                    version: values.version,
                  },
                ],
              },
            });
          }
          onClose();
        } catch (e) {
          setError(getErrorMessage(e));
        }
      }}
    >
      <AddOsModalContent onClose={onClose} error={error} />
    </Formik>
  );
};

export default AddOsModal;
