import {
  Badge,
  Banner,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Gallery,
  GalleryItem,
  PageSection,
  PageSectionVariants,
  SearchInput,
  Spinner,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import * as React from 'react';
import { VerticalTabs, VerticalTabsTab } from '@patternfly/react-catalog-view-extension';
import fuzzy from 'fuzzysearch';
import { OLMCatalogItem, isFctlMetaProps, useCatalogItems } from '../../hooks/useCatalogItems';
import { Device } from '@flightctl/types';
import CatalogItemModal from './InstallModal';
import { getItemChannel, getItemName, isAppItem, isItemInstalled } from './utils';
import { ArrowCircleUpIcon } from '@patternfly/react-icons/dist/js/icons/arrow-circle-up-icon';
import { StatusDisplayContent } from '../Status/StatusDisplay';

const getVersion = (bundleName: string) => {
  const match = bundleName.match(/v(\d+\.\d+\.\d+)/);

  if (match) {
    return match[1];
  }
  return bundleName;
};

const categoryTitle: { [key: string]: string } = {
  all: 'All items',
  app: 'Applications',
  model: 'AI Models',
  os: 'Operating Systems',
};

const CatalogPageBody = ({
  catalogItems,
  device,
  refetch,
}: {
  refetch: VoidFunction;
  catalogItems: OLMCatalogItem[];
  device: Required<Device>;
}) => {
  const [activeCategory, setActiveCategory] = React.useState<string>('all');
  const [selectedItemId, setSelectedItemId] = React.useState<string>();
  const [search, setSearch] = React.useState<string>();

  const selectedItem = catalogItems.find(({ name }) => name === selectedItemId);
  const currentItems = catalogItems
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((ci) => {
      switch (activeCategory) {
        case 'model':
          return ci.Properties.some(({ type, value }) => type === 'flightctl.meta' && value.type === 'model');
        case 'app':
          return isAppItem(ci);
        case 'os':
          return ci.Properties.some(({ type, value }) => type === 'flightctl.meta' && value.type === 'os');
        default:
          return true;
      }
    })
    .filter((ci) => {
      if (!search) {
        return true;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return fuzzy(search, ci.name);
    });
  return (
    <PageSection variant={PageSectionVariants.light}>
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h1" size="3xl">
            Catalog
          </Title>
        </StackItem>
        <StackItem>
          <Split hasGutter>
            <SplitItem style={{ width: '15rem' }}>
              <VerticalTabs id="vertical-tabs" activeTab={!!activeCategory}>
                {Object.keys(categoryTitle).map((category) => (
                  <VerticalTabsTab
                    id={category}
                    key={category}
                    title={categoryTitle[category] || category}
                    onActivate={() => setActiveCategory(category)}
                    active={activeCategory === category}
                  />
                ))}
              </VerticalTabs>
            </SplitItem>
            <SplitItem isFilled>
              <PageSection style={{ paddingTop: 0 }}>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h2">{categoryTitle[activeCategory] || activeCategory}</Title>
                  </StackItem>
                  <StackItem>
                    <Split hasGutter>
                      <SplitItem isFilled>
                        <SearchInput
                          aria-label="Filter by keyword..."
                          onChange={(_event, value) => setSearch(value)}
                          value={search}
                          placeholder="Filter by keyword..."
                          onClear={() => setSearch('')}
                          style={{ width: '20rem' }}
                        />
                      </SplitItem>
                      <SplitItem>{`${currentItems.length} items`}</SplitItem>
                    </Split>
                  </StackItem>
                </Stack>
              </PageSection>
              <PageSection style={{ backgroundColor: '#f0f0f0' }}>
                <Gallery hasGutter>
                  {currentItems.map((ci, index) => {
                    const isInstalled = isItemInstalled(ci, device);
                    let updateAvailable = false;
                    if (isInstalled) {
                      const channel = getItemChannel(ci, device);

                      const sortedBundles = Object.keys(ci.Channels[channel].Bundles).sort((bA, bB) => {
                        const a = getVersion(bA);
                        const b = getVersion(bB);
                        const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
                        const [bMajor, bMinor, bPatch] = b.split('.').map(Number);

                        if (aMajor !== bMajor) return bMajor - aMajor;
                        if (aMinor !== bMinor) return bMinor - aMinor;
                        return bPatch - aPatch;
                      });

                      const version = getVersion(getItemName(ci, device));
                      const currentIdx = sortedBundles.findIndex((b) => getVersion(b) === version);

                      updateAvailable = currentIdx !== 0;
                    }
                    return (
                      <GalleryItem key={index}>
                        <Card isClickable isFullHeight>
                          <CardHeader
                            selectableActions={{
                              onClickAction: () => setSelectedItemId(ci.name),
                              selectableActionId: ci.name,
                              selectableActionAriaLabelledby: 'clickable-card-example-1',
                              name: 'clickable-card-example',
                            }}
                          >
                            <Stack hasGutter>
                              <StackItem>
                                <Split hasGutter>
                                  <SplitItem isFilled>
                                    {ci.icon && (
                                      <img
                                        src={`data:${ci.icon.mediatype};base64,${ci.icon.base64data}`}
                                        alt={`${ci.name} icon`}
                                        aria-hidden
                                        width="50"
                                        height="50"
                                      />
                                    )}
                                  </SplitItem>
                                  <SplitItem>
                                    <Badge key="source" isRead>
                                      {ci.Properties.find(isFctlMetaProps)?.value?.source}
                                    </Badge>
                                  </SplitItem>
                                </Split>
                              </StackItem>
                              <StackItem>
                                <CardTitle>{ci.name}</CardTitle>
                              </StackItem>
                            </Stack>
                          </CardHeader>
                          <CardBody isFilled>{ci.description}</CardBody>
                          {isInstalled && (
                            <Banner variant="default">
                              <Split hasGutter>
                                <SplitItem isFilled>Installed</SplitItem>
                                {updateAvailable && (
                                  <SplitItem>
                                    <StatusDisplayContent
                                      label="Update available"
                                      level="info"
                                      customIcon={ArrowCircleUpIcon}
                                    />
                                  </SplitItem>
                                )}
                              </Split>
                            </Banner>
                          )}
                        </Card>
                      </GalleryItem>
                    );
                  })}
                </Gallery>
              </PageSection>
            </SplitItem>
          </Split>
        </StackItem>
      </Stack>
      {selectedItem && (
        <CatalogItemModal
          onClose={() => setSelectedItemId(undefined)}
          item={selectedItem}
          device={device}
          packages={catalogItems}
          refetch={refetch}
        />
      )}
    </PageSection>
  );
};

const CatalogPage = ({ device, refetch }: { device: Required<Device>; refetch: VoidFunction }) => {
  const [catalogItems, isLoading] = useCatalogItems();

  if (isLoading) {
    return <Spinner />;
  }

  return <CatalogPageBody catalogItems={catalogItems} device={device} refetch={refetch} />;
};

export default CatalogPage;
