import * as React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
} from '@patternfly/react-core';
import { Tbody } from '@patternfly/react-table';

import { useFetch } from '@app/hooks/useFetch';
import { useFetchPeriodically } from '@app/hooks/useFetchPeriodically';
import { Device, DeviceList, EnrollmentRequest, EnrollmentRequestList } from '@types';

import ListPage from '../ListPage/ListPage';
import ListPageBody from '../ListPage/ListPageBody';
import { useDeleteListAction } from '../ListPage/ListPageActions';
import AddDeviceModal from './AddDeviceModal/AddDeviceModal';
import { useTableSort } from '@app/hooks/useTableSort';
import { sortByCreationTimestamp, sortByDisplayName, sortByName } from '@app/utils/sort/generic';
import { sortDevicesByFleet, sortDevicesByOS, sortDevicesByStatus } from '@app/utils/sort/device';
import Table, { TableColumn } from '../Table/Table';
import DeviceEnrollmentModal from '../EnrollmentRequest/DeviceEnrollmentModal/DeviceEnrollmentModal';
import EnrollmentRequestTableRow from '../EnrollmentRequest/EnrollmentRequestTableRow';
import DeviceTableToolbar from './DeviceTableToolbar';
import { isEnrollmentRequest, useDeviceFilters } from './useDeviceFilters';
import DeviceTableRow from './DeviceTableRow';

type DeviceEmptyStateProps = {
  onAddDevice: VoidFunction;
};

const DeviceEmptyState: React.FC<DeviceEmptyStateProps> = ({ onAddDevice }) => (
  <EmptyState>
    <EmptyStateHeader titleText={<>There are no devices yet</>} headingLevel="h4" />
    <EmptyStateBody>Add a new device using the &quot;Add&quot; button</EmptyStateBody>
    <EmptyStateFooter>
      <EmptyStateActions>
        <Button onClick={onAddDevice}>Add device</Button>
      </EmptyStateActions>
    </EmptyStateFooter>
  </EmptyState>
);

const getColumns = (showFleet: boolean): TableColumn<Device | EnrollmentRequest>[] => [
  {
    name: 'Fingerprint',
    onSort: sortByName,
  },
  {
    name: 'Name',
    onSort: sortByDisplayName,
  },
  {
    name: 'Status',
    onSort: sortDevicesByStatus,
    defaultSort: true,
  },
  ...(showFleet
    ? [
        {
          name: 'Fleet',
          onSort: sortDevicesByFleet,
        },
      ]
    : []),
  {
    name: 'Created at',
    onSort: sortByCreationTimestamp,
  },
  {
    name: 'Operating system',
    onSort: sortDevicesByOS,
    thProps: {
      modifier: 'wrap',
    },
  },
];

interface DeviceTableProps {
  resources: Array<Device | EnrollmentRequest>;
  showFleet: boolean;
  refetch: VoidFunction;
}

export const DeviceTable = ({ resources, showFleet, refetch }: DeviceTableProps) => {
  const { remove } = useFetch();

  const [requestId, setRequestId] = React.useState<string>();
  const { deleteAction: deleteDeviceAction, deleteModal: deleteDeviceModal } = useDeleteListAction({
    resourceType: 'Device',
    onDelete: async (resourceId: string) => {
      await remove(`devices/${resourceId}`);
      refetch();
    },
  });

  const { deleteAction: deleteErAction, deleteModal: deleteErModal } = useDeleteListAction({
    resourceType: 'Enrollment request',
    onDelete: async (resourceId: string) => {
      await remove(`enrollmentrequests/${resourceId}`);
      refetch();
    },
  });

  const currentEnrollmentRequest = resources.find(
    (res) => res.metadata.name === requestId && isEnrollmentRequest(res),
  ) as EnrollmentRequest | undefined;

  const columns = React.useMemo(() => getColumns(showFleet), [showFleet]);
  const { filteredData, ...rest } = useDeviceFilters(resources);
  const { getSortParams, sortedData } = useTableSort(filteredData, columns);

  return (
    <>
      <DeviceTableToolbar {...rest} />
      <Table aria-label="Devices table" columns={columns} data={filteredData} getSortParams={getSortParams}>
        <Tbody>
          {sortedData.map((resource) =>
            isEnrollmentRequest(resource) ? (
              <EnrollmentRequestTableRow
                er={resource}
                showFleet={showFleet}
                key={resource.metadata.name}
                deleteAction={deleteErAction}
                onApprove={setRequestId}
              />
            ) : (
              <DeviceTableRow
                device={resource}
                showFleet={showFleet}
                key={resource.metadata.name}
                deleteAction={deleteDeviceAction}
              />
            ),
          )}
        </Tbody>
      </Table>
      {deleteDeviceModal}
      {deleteErModal}
      {currentEnrollmentRequest && (
        <DeviceEnrollmentModal
          enrollmentRequest={currentEnrollmentRequest}
          onClose={(updateList) => {
            setRequestId(undefined);
            updateList && refetch();
          }}
        />
      )}
    </>
  );
};

const DeviceList = () => {
  const [addDeviceModal, setAddDeviceModal] = React.useState(false);
  const [devicesList, devicesLoading, devicesError, devicesRefetch] = useFetchPeriodically<DeviceList>({
    endpoint: 'devices',
  });

  const [erList, erLoading, erEror, erRefetch] = useFetchPeriodically<EnrollmentRequestList>({
    endpoint: 'enrollmentrequests',
  });

  const data = [
    ...(devicesList?.items || []),
    ...(erList?.items || []).filter((er) => !devicesList?.items.some((d) => d.metadata.name === er.metadata.name)),
  ];

  const refetch = () => {
    devicesRefetch();
    erRefetch();
  };

  return (
    <>
      <ListPage title="Devices" actions={<Button onClick={() => setAddDeviceModal(true)}>Add device</Button>}>
        <ListPageBody
          data={data}
          error={devicesError || erEror}
          loading={devicesLoading || erLoading}
          emptyState={<DeviceEmptyState onAddDevice={() => setAddDeviceModal(true)} />}
        >
          <DeviceTable resources={data} refetch={refetch} showFleet />
        </ListPageBody>
      </ListPage>
      {addDeviceModal && <AddDeviceModal onClose={() => setAddDeviceModal(false)} />}
    </>
  );
};

export default DeviceList;
