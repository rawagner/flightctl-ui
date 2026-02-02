import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Flex,
  FlexItem,
  Gallery,
  PageSection,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
  TreeView,
  TreeViewDataItem,
} from '@patternfly/react-core';
import { CubeIcon } from '@patternfly/react-icons/dist/js/icons/cube-icon';
import * as React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import CatalogItem from './CatalogItem';
import CatalogPageToolbar from './CatalogPageToolbar';
import { useCatalogFilter } from './useCatalogFilter';
import CatalogItemDetails from './CatalogItemDetails';
import { useAllCatalogItems } from './useCatalogs';
import ListPageBody from '../ListPage/ListPageBody';
import ResourceListEmptyState from '../common/ResourceListEmptyState';

import '@patternfly/react-catalog-view-extension/dist/css/react-catalog-view-extension.css';
import { CatalogItemCategory, CatalogItemType } from '@flightctl/types/alpha';

import './CatalogPage.css';
import { RESOURCE, VERB } from '../../types/rbac';
import { usePermissionsContext } from '../common/PermissionsContext';
import { ROUTE, useNavigate } from '../../hooks/useNavigate';

const getNewCategoryItems = (
  currentCategories: CatalogItemCategory[] | undefined,
  newCategory: CatalogItemCategory,
) => {
  const newCategories = currentCategories?.includes(newCategory)
    ? currentCategories.filter((c) => c !== newCategory)
    : [...(currentCategories || []), newCategory];
  return newCategories.length ? newCategories : undefined;
};

const getNewTypeItems = (currentTypes: CatalogItemType[] | undefined, newType: CatalogItemType) => {
  const newTypes = currentTypes?.includes(newType)
    ? currentTypes.filter((c) => c !== newType)
    : [...(currentTypes || []), newType];
  return newTypes.length ? newTypes : undefined;
};

type CatalogPageContentProps = {
  showCreate?: boolean;
  canInstall: boolean;
  onInstall: (installItem: { item: CatalogItem; channel: string; version: string }) => void;
  selectedItem:
    | {
        catalog: string;
        itemName: string;
      }
    | undefined;
  setSelectedItem: React.Dispatch<
    React.SetStateAction<
      | {
          itemName: string;
          catalog: string;
        }
      | undefined
    >
  >;
};

const appTypeIds = [
  CatalogItemType.CatalogItemTypeContainer,
  CatalogItemType.CatalogItemTypeHelm,
  CatalogItemType.CatalogItemTypeQuadlet,
  CatalogItemType.CatalogItemTypeCompose,
  CatalogItemType.CatalogItemTypeData,
];

type CatalogEmptyStateProps = {
  hasFilters: boolean;
};

const CatalogEmptyState = ({ hasFilters }: CatalogEmptyStateProps) => {
  const { t } = useTranslation();
  return (
    <ResourceListEmptyState icon={CubeIcon} titleText={hasFilters ? t('No results found') : t('No catalog items yet')}>
      <EmptyStateBody>
        <Stack>
          {hasFilters ? (
            <StackItem>
              {t('No catalog items match the selected filters or search. Try adjusting the category or search.')}
            </StackItem>
          ) : (
            <>
              <StackItem>
                {t('Catalog items are applications and system images you can deploy to your devices.')}
              </StackItem>
            </>
          )}
        </Stack>
      </EmptyStateBody>
      {!hasFilters && (
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button
              variant="link"
              component="a"
              href="https://docs.flightctl.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('Learn about catalogs')}
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      )}
    </ResourceListEmptyState>
  );
};

export const CatalogPageContent = ({
  showCreate = false,
  canInstall,
  onInstall,
  selectedItem,
  setSelectedItem,
}: CatalogPageContentProps) => {
  const { t } = useTranslation();

  const catalogFilter = useCatalogFilter();

  const [catalogItems, isLoading, error, pagination, isUpdating] = useAllCatalogItems({
    itemCategory: catalogFilter.itemCategory,
    itemType: catalogFilter.itemType,
    nameFilter: catalogFilter.name,
  });

  const item = selectedItem
    ? catalogItems?.find(
        ({ metadata }) => metadata.name === selectedItem.itemName && metadata.catalog === selectedItem.catalog,
      )
    : undefined;

  const handleCheck = (event: React.ChangeEvent<HTMLInputElement>, item: TreeViewDataItem) => {
    const id = item.id as string;

    switch (id) {
      case CatalogItemCategory.CatalogItemCategoryApplication:
        catalogFilter.setItemCategory(
          getNewCategoryItems(catalogFilter.itemCategory, CatalogItemCategory.CatalogItemCategoryApplication),
        );
        return;
      default:
        catalogFilter.setItemType(getNewTypeItems(catalogFilter.itemType, id as CatalogItemType));
    }
  };

  const filterIsEmpty = !catalogFilter.itemCategory && !catalogFilter.itemType;
  const osTypeChecked = filterIsEmpty || catalogFilter.itemType?.includes(CatalogItemType.CatalogItemTypeOS);
  const anyAppTypeChecked = filterIsEmpty || appTypeIds.some((t) => catalogFilter.itemType?.includes(t));

  const filterData: TreeViewDataItem[] = [
    {
      name: 'Operating system',
      id: CatalogItemType.CatalogItemTypeOS,
      checkProps: {
        checked: osTypeChecked,
      },
    },
    {
      name: 'Application',
      id: CatalogItemCategory.CatalogItemCategoryApplication,
      checkProps: {
        checked:
          filterIsEmpty ||
          appTypeIds.every((id) => catalogFilter.itemType?.includes(id)) ||
          catalogFilter.itemCategory?.includes(CatalogItemCategory.CatalogItemCategoryApplication)
            ? true
            : anyAppTypeChecked
              ? null
              : false,
      },
      defaultExpanded: true,
      children: [
        {
          name: 'Container',
          id: CatalogItemType.CatalogItemTypeContainer,
          checkProps: {
            checked:
              filterIsEmpty ||
              catalogFilter.itemType?.includes(CatalogItemType.CatalogItemTypeContainer) ||
              catalogFilter.itemCategory?.includes(CatalogItemCategory.CatalogItemCategoryApplication),
          },
        },
        {
          name: 'Helm',
          id: CatalogItemType.CatalogItemTypeHelm,
          checkProps: {
            checked:
              filterIsEmpty ||
              catalogFilter.itemType?.includes(CatalogItemType.CatalogItemTypeHelm) ||
              catalogFilter.itemCategory?.includes(CatalogItemCategory.CatalogItemCategoryApplication),
          },
        },
        {
          name: 'Quadlet',
          id: CatalogItemType.CatalogItemTypeQuadlet,
          checkProps: {
            checked:
              filterIsEmpty ||
              catalogFilter.itemType?.includes(CatalogItemType.CatalogItemTypeQuadlet) ||
              catalogFilter.itemCategory?.includes(CatalogItemCategory.CatalogItemCategoryApplication),
          },
        },
        {
          name: 'Compose',
          id: CatalogItemType.CatalogItemTypeCompose,
          checkProps: {
            checked:
              filterIsEmpty ||
              catalogFilter.itemType?.includes(CatalogItemType.CatalogItemTypeCompose) ||
              catalogFilter.itemCategory?.includes(CatalogItemCategory.CatalogItemCategoryApplication),
          },
        },
        {
          name: 'Data',
          id: CatalogItemType.CatalogItemTypeData,
          checkProps: {
            checked:
              filterIsEmpty ||
              catalogFilter.itemType?.includes(CatalogItemType.CatalogItemTypeData) ||
              catalogFilter.itemCategory?.includes(CatalogItemCategory.CatalogItemCategoryApplication),
          },
        },
      ],
    },
  ];

  return (
    <div>
      <ListPageBody error={error} loading={isLoading}>
        <CatalogPageToolbar
          {...catalogFilter}
          showCreate={showCreate}
          pagination={pagination}
          isUpdating={isUpdating}
        />
        <PageSection hasBodyWrapper={false} type="wizard">
          <Split hasGutter>
            <SplitItem className="fctl-catalog-page">
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Category')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <TreeView
                      hasAnimations
                      aria-label="Catalog filter"
                      data={filterData}
                      onCheck={handleCheck}
                      hasCheckboxes
                    />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </SplitItem>
            <Divider
              orientation={{
                default: 'vertical',
              }}
            />
            <SplitItem isFilled className="fctl-catalog-page">
              {!isLoading && catalogItems.length === 0 ? (
                <CatalogEmptyState hasFilters={!filterIsEmpty || !!catalogFilter.name} />
              ) : (
                <Gallery hasGutter>
                  {catalogItems.map((ci) => (
                    <CatalogItem
                      catalogItem={ci}
                      key={ci.metadata.name}
                      onSelect={() =>
                        setSelectedItem((val) => {
                          if (!val || val.itemName !== ci.metadata.name || val.catalog !== ci.metadata.catalog) {
                            return {
                              itemName: ci.metadata.name || '',
                              catalog: ci.metadata.catalog,
                            };
                          } else {
                            return undefined;
                          }
                        })
                      }
                    />
                  ))}
                </Gallery>
              )}
            </SplitItem>
          </Split>
        </PageSection>
      </ListPageBody>
      {!!item && (
        <CatalogItemDetails
          onClose={() => setSelectedItem(undefined)}
          item={item}
          canInstall={canInstall}
          onInstall={onInstall}
        />
      )}
    </div>
  );
};

const catalogInstallPermissions = [
  { kind: RESOURCE.FLEET, verb: VERB.PATCH },
  { kind: RESOURCE.DEVICE, verb: VERB.PATCH },
];

const CatalogPage = () => {
  const [selectedItem, setSelectedItem] = React.useState<{ itemName: string; catalog: string }>();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { checkPermissions } = usePermissionsContext();
  const [canEditFleet, canEditDevice] = checkPermissions(catalogInstallPermissions);
  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Flex gap={{ default: 'gapMd' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Title headingLevel="h1" size="3xl">
              {t('Catalog')}
            </Title>
          </FlexItem>
        </Flex>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <CatalogPageContent
          showCreate
          canInstall={canEditFleet || canEditDevice}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          onInstall={({ item, channel, version }) => {
            const params = new URLSearchParams({
              channel,
              version,
            });
            navigate({
              route: ROUTE.CATALOG_INSTALL,
              postfix: `${item.metadata.catalog}/${item.metadata.name}?${params.toString()}`,
            });
          }}
        />
      </PageSection>
    </>
  );
};

export default CatalogPage;
