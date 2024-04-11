import * as React from 'react';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  DropdownItem,
  DropdownList,
  Grid,
  GridItem,
} from '@patternfly/react-core';

import { Device } from '@types';
import { getDateDisplay } from '@app/utils/dates';
import { getDeviceFleet, getUpdatedDevice } from '@app/utils/devices';
import { useFetchPeriodically } from '@app/hooks/useFetchPeriodically';
import { useFetch } from '@app/hooks/useFetch';
import LabelsView from '@app/components/common/LabelsView';
import ConditionsTable from '@app/components/DetailsPage/Tables/ConditionsTable';
import ContainersTable from '@app/components/DetailsPage/Tables/ContainersTable';
import IntegrityTable from '@app/components/DetailsPage/Tables/IntegrityTable';
import DetailsPage from '../../DetailsPage/DetailsPage';
import DetailsPageCard, { DetailsPageCardBody } from '@app/components/DetailsPage/DetailsPageCard';
import DetailsPageActions, { useDeleteAction } from '@app/components/DetailsPage/DetailsPageActions';
import DeviceFleet from './DeviceFleet';
import DeviceStatus from './DeviceStatus';
import SystemdTable from './SystemdTable';
import { useEditLabelsAction } from '@app/hooks/useEditLabelsAction';
import { useTranslation } from 'react-i18next';

const DeviceDetails = () => {
  const { t } = useTranslation();
  const { deviceId } = useParams() as { deviceId: string };
  const [device, loading, error, refetch] = useFetchPeriodically<Required<Device>>({ endpoint: `devices/${deviceId}` });

  const navigate = useNavigate();
  const { remove } = useFetch();

  const name = (device?.metadata.labels?.displayName || device?.metadata.name) as string;
  const boundFleet = getDeviceFleet(device?.metadata || {});

  const { deleteAction, deleteModal } = useDeleteAction({
    onDelete: async () => {
      await remove('devices', deviceId);
      navigate('/devicemanagement/devices');
    },
    // Deleting devices bound to fleets directly will be disabled soon
    disabledReason: boundFleet ? '' : '',
    // disabledReason: boundFleet ? 'Devices bound to a fleet cannot be deleted' : '',
    resourceName: name,
    resourceType: 'Device',
  });

  const { editLabelsAction, editLabelsModal } = useEditLabelsAction<Device>({
    submitTransformer: getUpdatedDevice,
    resourceType: 'devices',
    onEditSuccess: refetch,
  });

  const onSystemdUnitsUpdate = () => {
    // Only the device details need to be refreshed.
    // Devices that use templateVersions are bound to a fleet, and they cannot be directly edited.
    refetch();
  };

  return (
    <DetailsPage
      loading={loading}
      error={error}
      id={deviceId}
      title={name}
      resourceLink="/devicemanagement/devices"
      resourceType="Devices"
      actions={
        <DetailsPageActions>
          <DropdownList>
            {deleteAction}
            <DropdownItem
              {...editLabelsAction({
                disabledReason: boundFleet ? t('Devices bound to a fleet cannot be edited') : '',
                resourceId: deviceId,
              })}
            >
              {t('Edit labels')}
            </DropdownItem>
          </DropdownList>
        </DetailsPageActions>
      }
    >
      <Grid hasGutter>
        <GridItem md={12}>
          <Card>
            <CardTitle>{t('Details')}</CardTitle>
            <CardBody>
              <DescriptionList columnModifier={{ lg: '3Col' }}>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Fingerprint')}</DescriptionListTerm>
                  <DescriptionListDescription>{device?.metadata.name || '-'}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {getDateDisplay(device?.metadata.creationTimestamp)}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Fleet')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <DeviceFleet deviceMetadata={device?.metadata || {}} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <DeviceStatus device={device} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('OS')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {device?.status?.systemInfo?.operatingSystem || '-'}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Architecture')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {device?.status?.systemInfo?.architecture || '-'}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Labels')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <LabelsView prefix="deviceDet" labels={device?.metadata?.labels} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem md={6}>
          <DetailsPageCard>
            <CardTitle>{t('Conditions')}</CardTitle>
            <DetailsPageCardBody>
              {device && (
                <ConditionsTable ariaLabel={t('Device conditions table')} conditions={device.status.conditions} />
              )}
            </DetailsPageCardBody>
          </DetailsPageCard>
        </GridItem>
        <GridItem md={6}>
          <DetailsPageCard>
            <CardTitle>{t('Systemd units')}</CardTitle>
            <DetailsPageCardBody>
              {device && <SystemdTable device={device} onSystemdUnitsUpdate={onSystemdUnitsUpdate} />}
            </DetailsPageCardBody>
          </DetailsPageCard>
        </GridItem>
        <GridItem md={6}>
          <DetailsPageCard>
            <CardTitle>{t('Containers')}</CardTitle>
            <DetailsPageCardBody>
              {device && <ContainersTable containers={device.status.containers} />}
            </DetailsPageCardBody>
          </DetailsPageCard>
        </GridItem>
        <GridItem md={6}>
          <DetailsPageCard>
            <CardTitle>{t('System integrity measurements')}</CardTitle>
            <DetailsPageCardBody>
              {device && <IntegrityTable measurements={device.status.systemInfo?.measurements} />}
            </DetailsPageCardBody>
          </DetailsPageCard>
        </GridItem>
      </Grid>
      {deleteModal}
      {editLabelsModal}
    </DetailsPage>
  );
};

export default DeviceDetails;
