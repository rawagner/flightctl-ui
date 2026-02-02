import { ApplicationProviderSpec, ContainerApplication, DeviceSpec } from '@flightctl/types';
import { ArrowCircleUpIcon } from '@patternfly/react-icons/dist/esm/icons/arrow-circle-up-icon';
import { ActionsColumn, IAction, Table, Tbody, Td, Tr } from '@patternfly/react-table';
import * as React from 'react';
import {
  APP_CATALOG_LABEL_KEY,
  APP_CHANNEL_LABEL_KEY,
  APP_ITEM_LABEL_KEY,
  OS_CATALOG_LABEL_KEY,
  OS_CHANNEL_LABEL_KEY,
  OS_ITEM_LABEL_KEY,
} from './const';
import { CatalogItem, CatalogItemVersion } from '@flightctl/types/alpha';
import { useCatalogItem } from './useCatalogs';
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Content,
  ContentVariants,
  Divider,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { CubeIcon } from '@patternfly/react-icons/dist/esm/icons/cube-icon';
import { getFullReferenceURI, getUpdates } from './utils';
import { useFetch } from '../../hooks/useFetch';

import defaultIcon from '../../../assets/flight-control-logo.png';
import { useTranslation } from '../../hooks/useTranslation';
import DeleteModal from '../modals/DeleteModal/DeleteModal';
import OsUpdateModal from './UpdateModal/OsUpdateModal';
import AppUpdateModal from './UpdateModal/AppUpdateModal';
import EditAppModal, { AppUpdateFormik } from './UpdateModal/EditAppModal';

type UpdateColumnProps = {
  catalogItem: CatalogItem;
  channel: string;
  catalogItemVersion: CatalogItemVersion;
  onUpdate: (catalogItem: CatalogItem, version: string, channel: string, values: AppUpdateFormik) => Promise<void>;
  appSpec: ApplicationProviderSpec;
  exisingLabels: Record<string, string> | undefined;
};

const UpdateAppColumn = ({
  onUpdate,
  catalogItem,
  channel,
  catalogItemVersion,
  appSpec,
  exisingLabels,
}: UpdateColumnProps) => {
  const { t } = useTranslation();
  const [openModal, setOpenModal] = React.useState(false);
  const updates = getUpdates(catalogItem, channel, catalogItemVersion.version);

  const handleUpdate = async (version: string, channel: string, values: AppUpdateFormik) => {
    await onUpdate(catalogItem, version, channel, values);
    setOpenModal(false);
  };

  return (
    <>
      {!!updates.length && (
        <Button variant="link" isInline onClick={() => setOpenModal(true)} icon={<ArrowCircleUpIcon />}>
          {t('Update available')}
        </Button>
      )}
      {openModal && (
        <AppUpdateModal
          onClose={() => setOpenModal(false)}
          catalogItem={catalogItem}
          currentVersion={catalogItemVersion}
          currentChannel={channel}
          onUpdate={handleUpdate}
          updates={updates}
          appSpec={appSpec as ApplicationProviderSpec}
          exisingLabels={exisingLabels}
        />
      )}
    </>
  );
};

type UpdateOsColumnProps = {
  catalogItem: CatalogItem;
  channel: string;
  catalogItemVersion: CatalogItemVersion;
  onUpdate: (catalogItem: CatalogItem, version: string, channel: string) => Promise<void>;
};

const UpdateOsColumn = ({ onUpdate, catalogItem, channel, catalogItemVersion }: UpdateOsColumnProps) => {
  const { t } = useTranslation();
  const [openModal, setOpenModal] = React.useState(false);
  const updates = getUpdates(catalogItem, channel, catalogItemVersion.version);

  const handleUpdate = async (version: string, channel: string) => {
    await onUpdate(catalogItem, version, channel);
    setOpenModal(false);
  };

  return (
    <>
      {!!updates.length && (
        <Button variant="link" isInline onClick={() => setOpenModal(true)} icon={<ArrowCircleUpIcon />}>
          {t('Update available')}
        </Button>
      )}
      {openModal && (
        <OsUpdateModal
          onClose={() => setOpenModal(false)}
          currentVersion={catalogItemVersion}
          currentChannel={channel}
          onUpdate={handleUpdate}
          updates={updates}
        />
      )}
    </>
  );
};

type InstalledSoftwareProps = {
  labels: Record<string, string> | undefined;
  spec: DeviceSpec | undefined;
  onUpdateOs: (catalogItem: CatalogItem, version: string, channel: string) => Promise<void>;
  onDeleteOs?: () => Promise<void>;
  onDeleteApp?: (appName: string) => Promise<void>;
  onUpdateApp: (catalogItem: CatalogItem, version: string, channel: string, values: AppUpdateFormik) => Promise<void>;
  canEdit: boolean;
};

type AppItem = { item: CatalogItem; name: string };

const InstalledSoftware = ({
  labels,
  spec,
  onUpdateOs,
  onDeleteOs,
  onDeleteApp,
  onUpdateApp,
  canEdit,
}: InstalledSoftwareProps) => {
  const { t } = useTranslation();
  const [appItems, setAppItems] = React.useState<AppItem[]>();
  const [appsLoading, setAppsLoading] = React.useState(true);
  const [deleteOs, setDeleteOs] = React.useState(false);
  const [appToDelete, setAppToDelete] = React.useState<string | null>(null);
  const [appToEdit, setAppToEdit] = React.useState<string | null>(null);
  const osItemId = labels?.[OS_ITEM_LABEL_KEY];
  const osChannel = labels?.[OS_CHANNEL_LABEL_KEY];
  const osCatalog = labels?.[OS_CATALOG_LABEL_KEY];

  const { get } = useFetch();

  const apps = React.useMemo(() => {
    if (!labels) {
      return [];
    }
    return Object.keys(labels).reduce(
      (acc, key) => {
        if (key.endsWith(APP_ITEM_LABEL_KEY)) {
          const appName = key.slice(0, -(APP_ITEM_LABEL_KEY.length + 1));
          const item = labels[`${appName}.${APP_ITEM_LABEL_KEY}`];
          const catalog = labels[`${appName}.${APP_CATALOG_LABEL_KEY}`];
          const channel = labels[`${appName}.${APP_CHANNEL_LABEL_KEY}`];
          if (item && catalog && channel && spec?.applications?.find((a) => a.name === appName)) {
            acc.push({
              item,
              catalog,
              channel,
              name: appName,
            });
          }
        }
        return acc;
      },
      [] as {
        item: string;
        catalog: string;
        channel: string;
        name: string;
      }[],
    );
  }, [labels]);

  React.useEffect(() => {
    (async () => {
      const appRequests = apps.map((app) => get<CatalogItem>(`catalogs/${app.catalog}/items/${app.item}`));
      const results = await Promise.allSettled(appRequests);

      const items: AppItem[] = [];
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          console.warn(`Failed to fetch catalog item ${apps[idx].catalog}/${apps[idx].item}`);
        } else {
          items.push({
            item: r.value,
            name: apps[idx].name,
          });
        }
      });
      setAppItems(items);
      setAppsLoading(false);
    })();
  }, [apps]);

  const [osItem, osLoading, osError] = useCatalogItem(osCatalog, osItemId);

  if (osLoading || appsLoading) {
    return <EmptyState titleText={t('Loading installed software')} headingLevel="h4" icon={Spinner} />;
  }

  const catalogItemVersion = osItem?.spec.versions.find(
    (v) =>
      getFullReferenceURI(osItem.spec.reference.uri, v) === spec?.os?.image && v.channels.includes(osChannel || ''),
  );

  const hasOs = !!(osItem && osCatalog && osChannel && catalogItemVersion && spec);
  const hasApps = !!(appItems && appItems.length > 0);
  const isEmpty = !hasOs && !hasApps;

  return (
    <>
      <Card>
        <CardTitle>{t('Deployed Software')}</CardTitle>
        <CardBody>
          {isEmpty ? (
            <EmptyState headingLevel="h4" icon={CubeIcon} titleText={t('No software deployed')}>
              <EmptyStateBody>{t('Select an operating system or application from the catalog below.')}</EmptyStateBody>
            </EmptyState>
          ) : (
            <Table>
              <Tbody>
                {osItem && osCatalog && osChannel && catalogItemVersion && spec && (
                  <Tr key={osItem.metadata.name}>
                    <Td>
                      <Flex
                        alignItems={{ default: 'alignItemsCenter' }}
                        alignContent={{ default: 'alignContentCenter' }}
                      >
                        <FlexItem>
                          <img
                            src={osItem.spec.icon || defaultIcon}
                            alt={`${osItem.metadata.name} icon`}
                            style={{ maxWidth: '30px' }}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Stack>
                            <StackItem>
                              <Title headingLevel="h3">{osItem.spec.displayName || osItem.metadata.name}</Title>
                            </StackItem>
                            <StackItem>
                              <Content component={ContentVariants.small}>
                                Version: {catalogItemVersion.version}, Channel {osChannel}
                              </Content>
                            </StackItem>
                          </Stack>
                        </FlexItem>
                      </Flex>
                    </Td>
                    <Td>
                      <UpdateOsColumn
                        catalogItem={osItem}
                        catalogItemVersion={catalogItemVersion}
                        channel={osChannel}
                        onUpdate={onUpdateOs}
                      />
                    </Td>
                    <Td isActionCell>
                      {canEdit && (
                        <ActionsColumn
                          items={
                            onDeleteOs
                              ? [
                                  {
                                    title: t('Delete'),
                                    onClick: () => setDeleteOs(true),
                                  },
                                ]
                              : []
                          }
                        />
                      )}
                    </Td>
                  </Tr>
                )}
                {appItems?.map((app) => {
                  const appChannel = labels?.[`${app.name}.${APP_CHANNEL_LABEL_KEY}`] || '';
                  const appSpec = spec?.applications?.find((a) => a.name === app.name);
                  const itemVersion =
                    appSpec &&
                    app.item.spec.versions.find((v) => {
                      const refUri = getFullReferenceURI(app.item.spec.reference.uri, v);
                      const imageMatches = refUri === (appSpec as ContainerApplication).image;
                      return imageMatches && v.channels.includes(appChannel);
                    });
                  let actions: IAction[] = [
                    {
                      title: t('Edit'),
                      onClick: () => setAppToEdit(app.name),
                    },
                  ];

                  if (onDeleteApp) {
                    actions.push({
                      title: t('Delete'),
                      onClick: () => setAppToDelete(app.name),
                    });
                  }

                  return (
                    <React.Fragment key={app.name}>
                      <Tr>
                        <Td>
                          <Flex
                            alignItems={{ default: 'alignItemsCenter' }}
                            alignContent={{ default: 'alignContentCenter' }}
                          >
                            <FlexItem>
                              <img
                                src={app.item.spec.icon || defaultIcon}
                                alt={`${app.item.metadata.name} icon`}
                                style={{ maxWidth: '30px' }}
                              />
                            </FlexItem>
                            <FlexItem>
                              <Stack>
                                <StackItem>
                                  <Title headingLevel="h3">{app.item.spec.displayName || app.item.metadata.name}</Title>
                                </StackItem>
                                <StackItem>
                                  <Title headingLevel="h6">{app.name}</Title>
                                </StackItem>
                                {itemVersion && (
                                  <StackItem>
                                    <Content component={ContentVariants.small}>
                                      Version: {itemVersion.version}, Channel: {appChannel}
                                    </Content>
                                  </StackItem>
                                )}
                              </Stack>
                            </FlexItem>
                          </Flex>
                        </Td>
                        <Td>
                          {itemVersion && canEdit && spec && (
                            <UpdateAppColumn
                              catalogItem={app.item}
                              catalogItemVersion={itemVersion}
                              channel={appChannel}
                              onUpdate={onUpdateApp}
                              appSpec={appSpec}
                              exisingLabels={labels}
                            />
                          )}
                        </Td>
                        <Td isActionCell>{canEdit && <ActionsColumn items={actions} />}</Td>
                      </Tr>
                      {appToEdit && appSpec && itemVersion && (
                        <EditAppModal
                          currentApps={spec?.applications}
                          onClose={() => setAppToEdit(null)}
                          appSpec={appSpec}
                          catalogItem={app.item}
                          currentVersion={itemVersion}
                          onSubmit={onUpdateApp}
                          currentChannel={appChannel}
                          exisingLabels={labels}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>
      {deleteOs && onDeleteOs && (
        <DeleteModal
          onClose={() => setDeleteOs(false)}
          onDelete={async () => {
            await onDeleteOs();
            setDeleteOs(false);
          }}
          resourceName={osItem?.spec.displayName || osItem?.metadata.name || ''}
          resourceType={t('operating system')}
        />
      )}
      {appToDelete && onDeleteApp && (
        <DeleteModal
          onClose={() => setAppToDelete(null)}
          onDelete={async () => {
            await onDeleteApp(appToDelete);
            setAppToDelete(null);
          }}
          resourceName={appToDelete}
          resourceType={t('application')}
        />
      )}
    </>
  );
};

export default InstalledSoftware;
