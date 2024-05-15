import { Form, FormGroup, FormSection, Grid, Radio } from '@patternfly/react-core';
import * as React from 'react';
import { ImportFleetFormValues } from '../types';
import { FormikErrors, useFormikContext } from 'formik';
import { Repository } from '@flightctl/types';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { RepositoryForm } from '../../../Repository/CreateRepository/CreateRepositoryForm';
import { getRepositoryLastTransitionTime, getRepositorySyncStatus } from '../../../../utils/status/repository';
import StatusInfo from '../../../common/StatusInfo';
import { useTranslation } from '../../../../hooks/useTranslation';
import FormSelect from '../../../form/FormSelect';

export const repositoryStepId = 'repository';

export const isRepoStepValid = (values: ImportFleetFormValues, errors: FormikErrors<ImportFleetFormValues>) => {
  if (values.useExistingRepo) {
    return !errors.existingRepo;
  }
  return !errors.name && !errors.url && !errors.password && !errors.username;
};

const ExistingRepoForm = ({ repositories }: { repositories: Repository[] }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ImportFleetFormValues>();

  const currentRepo = repositories.find((r) => r.metadata.name === values.existingRepo);

  return (
    <>
      <FormGroup label={t('Repository')} fieldId="repository">
        <FormSelect
          name="existingRepo"
          items={repositories.reduce((acc, curr) => {
            acc[curr.metadata.name || ''] = curr.metadata.name || '';
            return acc;
          }, {})}
        />
      </FormGroup>
      {currentRepo && (
        <Table>
          <Thead>
            <Tr>
              <Th>{t('URL')}</Th>
              <Th>{t('Sync status')}</Th>
              <Th>{t('Last transition')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td dataLabel={t('URL')}>{currentRepo.spec.repo}</Td>
              <Td dataLabel={t('Sync status')}>
                <StatusInfo statusInfo={getRepositorySyncStatus(currentRepo)} />
              </Td>
              <Td dataLabel={t('Last transition')}>{getRepositoryLastTransitionTime(currentRepo, t).text}</Td>
            </Tr>
          </Tbody>
        </Table>
      )}
    </>
  );
};

const RepositoryStep = ({ repositories }: { repositories: Repository[] }) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ImportFleetFormValues>();

  return (
    <Form>
      <Grid span={8}>
        <FormSection>
          <FormGroup isInline>
            <Radio
              isChecked={values.useExistingRepo}
              onChange={() => setFieldValue('useExistingRepo', true)}
              id="existing-repo"
              name="repo"
              label={t('Use an existing repository')}
              isDisabled={!repositories.length}
            />
            <Radio
              isChecked={!values.useExistingRepo}
              onChange={() => setFieldValue('useExistingRepo', false)}
              id="new-repo"
              name="repo"
              label={t('Use a new repository')}
            />
          </FormGroup>
        </FormSection>
        <FormSection>
          {values.useExistingRepo ? <ExistingRepoForm repositories={repositories} /> : <RepositoryForm />}
        </FormSection>
      </Grid>
    </Form>
  );
};

export default RepositoryStep;
