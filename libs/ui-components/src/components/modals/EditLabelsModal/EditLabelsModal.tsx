import * as React from 'react';
import { Formik, useFormikContext } from 'formik';
import { Alert, Bullseye, Button, Form, FormGroup, Modal, Spinner } from '@patternfly/react-core';

import { getErrorMessage } from '../../../utils/error';
import LabelsField from '../../form/LabelsField';
import FlightCtlActionGroup from '../../form/FlightCtlActionGroup';
import { FlightCtlLabel, LabelEditable } from '../../../types/extraTypes';
import { useFetch } from '../../../hooks/useFetch';
import { Device, Fleet } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import { fromAPILabel } from '../../../utils/labels';

type EditLabelsModalProps<MT extends LabelEditable> = {
  resourceType: 'fleets' | 'devices';
  resourceName: string;
  submitTransformer: (data: MT, updatedLabels: FlightCtlLabel[]) => MT;
  onClose: (success?: boolean) => void;
};

type EditLabelsFormProps = {
  onClose: VoidFunction;
  error: string | undefined;
};

type EditLabelsFormValues = {
  labels: FlightCtlLabel[];
};

const EditLabelsForm = ({ onClose, error }: EditLabelsFormProps) => {
  const { t } = useTranslation();
  const { submitForm, isSubmitting } = useFormikContext<EditLabelsFormValues>();
  return (
    <Form onSubmit={(ev) => ev.preventDefault()}>
      <FormGroup label={t('Labels')}>
        <LabelsField name="labels" />
      </FormGroup>
      {error && <Alert isInline title={error} variant="danger" />}
      <FlightCtlActionGroup>
        <Button key="confirm" variant="primary" onClick={submitForm} isDisabled={isSubmitting} isLoading={isSubmitting}>
          {t('Edit labels')}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={isSubmitting}>
          {t('Cancel')}
        </Button>
      </FlightCtlActionGroup>
    </Form>
  );
};

function EditLabelsModal<T extends LabelEditable>({
  resourceType,
  resourceName,
  submitTransformer,
  onClose,
}: EditLabelsModalProps<T>) {
  const { t } = useTranslation();
  const { get, put } = useFetch();
  const [submitError, setSubmitError] = React.useState<string>();
  const [dataItem, setDataItem] = React.useState<T>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadingError, setLoadingError] = React.useState<string>();
  const queryEndpoint = `${resourceType}/${resourceName}`;

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const data = await get<T>(queryEndpoint);
        setDataItem(data);
      } catch (e) {
        setLoadingError(getErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, [get, queryEndpoint]);

  let labels: Record<string, string>;
  if (resourceType === 'fleets') {
    const fleet = dataItem as Fleet;
    labels = fleet?.spec?.selector?.matchLabels || {};
  } else {
    const device = dataItem as Device;
    labels = device?.metadata?.labels || {};
  }

  let modalBody: React.ReactNode;

  if (isLoading) {
    modalBody = (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  } else if (loadingError || !dataItem) {
    modalBody = (
      <Alert
        isInline
        title={t('Failed to retrieve the labels of {{resourceType}} {{resourceName}}', { resourceType, resourceName })}
        variant="danger"
      >
        {loadingError}
      </Alert>
    );
  } else {
    modalBody = (
      <Formik<EditLabelsFormValues>
        initialValues={{
          labels: fromAPILabel(labels),
        }}
        onSubmit={async ({ labels }) => {
          try {
            const updatedData = submitTransformer(dataItem, labels);
            await put(queryEndpoint, updatedData);
            onClose(true);
          } catch (e) {
            setSubmitError(getErrorMessage(e));
          }
        }}
      >
        <EditLabelsForm onClose={onClose} error={submitError} />
      </Formik>
    );
  }

  return (
    <Modal
      title={t('Edit {{type}} labels', { type: resourceType === 'fleets' ? 'fleet' : 'device' })}
      isOpen
      onClose={() => onClose()}
      variant="small"
    >
      {modalBody}
    </Modal>
  );
}

export default EditLabelsModal;
