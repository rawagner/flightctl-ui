import {
  Alert,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  FormGroup,
  Level,
  LevelItem,
  MenuToggle,
  Modal,
  Select,
  SelectList,
  SelectOption,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import * as React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getAppPatches, getItemChannel, getItemName, getOSPatches, isItemInstalled } from './utils';
import { getErrorMessage } from '../../utils/error';
import {
  ModelValue,
  OLMBundle,
  OLMCatalogItem,
  apiServer,
  isFctlMetaProps,
  isFctlModelProps,
} from '../../hooks/useCatalogItems';
import FlightCtlForm from '../form/FlightCtlForm';
import { Device } from '@flightctl/types';
import { Channel, ChannelLine, ChannelName, ChannelPath, ChannelVersion, ChannelVersionDot } from './Channel';
import { StatusDisplayContent } from '../Status/StatusDisplay';
import { ArrowCircleUpIcon } from '@patternfly/react-icons/dist/js/icons/arrow-circle-up-icon';
import ModelPicker from './ModelPicker';
import { PencilAltIcon } from '@patternfly/react-icons/dist/js/icons/pencil-alt-icon';

import './InstallModal.css';

const getVersion = (bundleName: string) => {
  const match = bundleName.match(/v(\d+\.\d+\.\d+)/);

  if (match) {
    return match[1];
  }
  return bundleName;
};

type InstallModalProps = {
  onClose: VoidFunction;
  item: OLMCatalogItem;
  packages: OLMCatalogItem[];
  device: Required<Device>;
  refetch: VoidFunction;
};

const InstallModal = ({ onClose, item, device, packages, refetch }: InstallModalProps) => {
  const [selectedModel, setSelectedModel] = React.useState<string>();
  const [selectedModelVersion, setSelectedModelVersion] = React.useState<string>();
  const [selectedModelChannel, setSelectedModelChannel] = React.useState<string>();

  const { patch } = useFetch();
  const [isChannelOpen, setIsChannelOpen] = React.useState(false);
  const [selectedChannel, setSelectedChannel] = React.useState(item.defaultChannel);

  const [isVersionOpen, setIsVersionOpen] = React.useState(false);
  const [selectedVersion, setSelectedVersion] = React.useState(Object.keys(item.Channels[selectedChannel].Bundles)[0]);

  const [isPatching, setIsPatching] = React.useState(false);
  const [patchErr, setPatchErr] = React.useState<string>();

  const [currentBundle, setCurrentBundle] = React.useState<OLMBundle>();

  React.useEffect(() => {
    const doItAsync = async () => {
      const resp = await fetch(`${apiServer}/catalog/bundle/${item.name}/${selectedChannel}/${selectedVersion}`);
      const bundle = (await resp.json()) as OLMBundle;
      setCurrentBundle(bundle);
    };
    doItAsync();
  }, [selectedChannel, selectedVersion, item.name]);

  const onInstall = async () => {
    setPatchErr(undefined);
    setIsPatching(true);
    try {
      const resp = await fetch(`${apiServer}/catalog/bundle/${item.name}/${selectedChannel}/${selectedVersion}`);
      const bundle = (await resp.json()) as OLMBundle;

      let modelBundle: OLMBundle | undefined = undefined;
      if (selectedModel) {
        const resp1 = await fetch(
          `${apiServer}/catalog/bundle/${selectedModel}/${selectedModelChannel}/${selectedModelVersion}`,
        );
        modelBundle = (await resp1.json()) as OLMBundle;
      }

      if (item.Properties.some(({ type, value }) => type === 'flightctl.meta' && value.type === 'os')) {
        const patches = getOSPatches(bundle, undefined, device);
        for (const p of patches) {
          await patch(p.kind, p.patches);
        }
      }

      if (item.Properties.some(({ type, value }) => type === 'flightctl.meta' && value.type === 'app')) {
        let modelPath: string | undefined = undefined;
        const models = bundle.properties.find(isFctlModelProps)?.value;
        if (models) {
          const modelsValue = JSON.parse(models) as ModelValue;
          modelPath = modelsValue.volume;
        }
        const patches = getAppPatches(
          bundle,
          selectedChannel,
          undefined,
          device,
          modelBundle,
          modelPath,
          selectedModelChannel,
        );
        for (const p of patches) {
          await patch(p.kind, p.patches);
        }
      }

      refetch();
      onClose();
    } catch (err) {
      setPatchErr(getErrorMessage(err));
    } finally {
      setIsPatching(false);
    }
  };

  const sortedBundles = Object.keys(item.Channels[selectedChannel].Bundles).sort((bA, bB) => {
    const a = getVersion(bA);
    const b = getVersion(bB);
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);

    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });

  React.useEffect(() => {
    setSelectedVersion(sortedBundles[0]);
    // eslint-disable-next-line
  }, []);

  return (
    <Modal
      titleIconVariant={
        item.icon
          ? () => (
              <img
                src={`data:${item.icon?.mediatype};base64,${item.icon?.base64data}`}
                alt={`${item.name} icon`}
                aria-hidden
                width="50"
                height="50"
              />
            )
          : undefined
      }
      title={`Install ${item.name}`}
      isOpen
      onClose={onClose}
      showClose={!isPatching}
      ouiaId="InstallCatalogItemModal"
      variant="large"
    >
      <Stack hasGutter>
        <StackItem isFilled>
          <Split hasGutter>
            <SplitItem style={{ width: '25rem' }}>
              <FlightCtlForm>
                <FormGroup label="Channel">
                  <Select
                    id="channel"
                    isOpen={isChannelOpen}
                    selected={selectedChannel}
                    onSelect={(_, v) => setSelectedChannel(v as string)}
                    onOpenChange={(isOpen) => setIsChannelOpen(isOpen)}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsChannelOpen(!isChannelOpen)}
                        isExpanded={isChannelOpen}
                        style={
                          {
                            width: '200px',
                          } as React.CSSProperties
                        }
                      >
                        {selectedChannel}
                      </MenuToggle>
                    )}
                    shouldFocusToggleOnSelect
                  >
                    <SelectList>
                      {Object.keys(item.Channels).map((k) => (
                        <SelectOption key={k} value={k}>
                          {k}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </FormGroup>
                <FormGroup label="Version">
                  <Select
                    id="version"
                    isOpen={isVersionOpen}
                    selected={selectedVersion}
                    onSelect={(_, v) => setSelectedVersion(v as string)}
                    onOpenChange={(isOpen) => setIsVersionOpen(isOpen)}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsVersionOpen(!isVersionOpen)}
                        isExpanded={isVersionOpen}
                        style={
                          {
                            width: '200px',
                          } as React.CSSProperties
                        }
                      >
                        {getVersion(selectedVersion)}
                      </MenuToggle>
                    )}
                    shouldFocusToggleOnSelect
                  >
                    <SelectList>
                      {sortedBundles.map((k) => (
                        <SelectOption key={k} value={k}>
                          {getVersion(k)}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </FormGroup>
                <FormGroup label="Source">{item.Properties.find(isFctlMetaProps)?.value?.source}</FormGroup>
                <FormGroup label="Provider">{item.Properties.find(isFctlMetaProps)?.value?.provider}</FormGroup>
                <FormGroup label="Support">{item.Properties.find(isFctlMetaProps)?.value?.support}</FormGroup>
              </FlightCtlForm>
            </SplitItem>
            <SplitItem>
              <Divider
                orientation={{
                  default: 'vertical',
                }}
                style={{ height: '100%' }}
              />
            </SplitItem>
            <SplitItem isFilled>
              <Stack hasGutter>
                {item.description && <StackItem>{item.description}</StackItem>}
                {currentBundle && currentBundle.properties.some(isFctlModelProps) && (
                  <ModelPicker
                    item={item}
                    packages={packages}
                    bundle={currentBundle}
                    selectedModel={selectedModel}
                    onSelect={setSelectedModel}
                    onChannelSelect={setSelectedModelChannel}
                    onVersionSelect={setSelectedModelVersion}
                  />
                )}
              </Stack>
            </SplitItem>
          </Split>
        </StackItem>
        <StackItem>
          {patchErr && (
            <StackItem>
              <Alert isInline title={patchErr} variant="danger" />
            </StackItem>
          )}
          <StackItem>
            <Split hasGutter>
              <SplitItem>
                <Button
                  key="confirm"
                  variant="primary"
                  onClick={onInstall}
                  isDisabled={isPatching}
                  isLoading={isPatching}
                >
                  Install
                </Button>
              </SplitItem>
              <SplitItem>
                <Button key="close" variant="link" onClick={onClose} isDisabled={isPatching}>
                  Cancel
                </Button>
              </SplitItem>
            </Split>
          </StackItem>
        </StackItem>
      </Stack>
    </Modal>
  );
};

const ItemUpgradeGraph = ({
  item,
  channel,
  version,
  selectedVersion,
  setSelectedVersion,
}: {
  item: OLMCatalogItem;
  channel: string;
  version: string;
  selectedVersion: string;
  setSelectedVersion: (v: string) => void;
}) => {
  const sortedBundles = Object.keys(item.Channels[channel].Bundles).sort((bA, bB) => {
    const a = getVersion(bA);
    const b = getVersion(bB);
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);

    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });

  const currentIdx = sortedBundles.findIndex((b) => getVersion(b) === version);
  return (
    <div className="co-cluster-settings__updates-graph">
      <Stack hasGutter>
        <StackItem>
          <Level>
            <LevelItem>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>Update status</DescriptionListTerm>
                  <DescriptionListDescription>
                    {currentIdx === 0 ? (
                      <StatusDisplayContent label="Up to date" level="success" />
                    ) : (
                      <StatusDisplayContent label="Update available" level="info" customIcon={ArrowCircleUpIcon} />
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </LevelItem>
            <LevelItem>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>Channel</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>{channel}</FlexItem>
                      <FlexItem>
                        <Button isInline icon={<PencilAltIcon />} variant="link" />
                      </FlexItem>
                    </Flex>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </LevelItem>
          </Level>
        </StackItem>
        <StackItem>
          <Channel>
            <ChannelPath current>
              {sortedBundles.reverse().map((b, idx) => (
                <ChannelLine key={b} isLast={idx === sortedBundles.length - 1}>
                  <ChannelVersion current={b === selectedVersion}>{getVersion(b)}</ChannelVersion>
                  <ChannelVersionDot
                    current={b === selectedVersion}
                    channel={channel}
                    onClick={() => setSelectedVersion(b)}
                  />
                </ChannelLine>
              ))}
            </ChannelPath>
            <ChannelName current>{`${channel} channel`}</ChannelName>
          </Channel>
        </StackItem>
      </Stack>
    </div>
  );
};

const InstalledModal = ({ device, item, packages, onClose }: InstallModalProps) => {
  const initItemVersionRef = React.useRef(getItemName(item, device));
  const [itemVersion, setItemVersion] = React.useState(getItemName(item, device));
  const version = getVersion(getItemName(item, device));
  const channel = getItemChannel(item, device);

  const modelChannel = device.metadata.labels?.modelChannel;
  const modelName = device.metadata.labels?.model;
  const modelVersion = getVersion(modelName || '');

  let modelItem: OLMCatalogItem | undefined = undefined;

  if (item.Properties.find((p) => isFctlMetaProps(p) && p.value.type === 'app') && modelName) {
    modelItem = packages.find((c) =>
      Object.keys(c.Channels).some((ch) => {
        return Object.keys(c.Channels[ch].Bundles).some((b) => b === modelName);
      }),
    );
  }

  const initModelVersionRef = React.useRef(modelItem ? getItemName(modelItem, device) : undefined);
  const [selectedModelVersion, setSelectedModelVersion] = React.useState(
    modelItem ? getItemName(modelItem, device) : undefined,
  );

  const sortedBundles = Object.keys(item.Channels[channel].Bundles).sort((bA, bB) => {
    const a = getVersion(bA);
    const b = getVersion(bB);
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);

    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });

  const currentIdx = sortedBundles.findIndex((b) => getVersion(b) === version);

  const updateAvailable = currentIdx !== 0;

  return (
    <Modal
      titleIconVariant={
        item.icon
          ? () => (
              <img
                src={`data:${item.icon?.mediatype};base64,${item.icon?.base64data}`}
                alt={`${item.name} icon`}
                aria-hidden
                width="50"
                height="50"
              />
            )
          : undefined
      }
      title={`${item.name} details`}
      isOpen
      onClose={onClose}
      ouiaId="InstalledCatalogItemModal"
      variant="large"
      actions={[
        <Button
          key="update"
          variant="primary"
          isDisabled={
            !updateAvailable &&
            initItemVersionRef.current === itemVersion &&
            initModelVersionRef.current === selectedModelVersion
          }
        >
          Update
        </Button>,
        <Button key="close" variant="link" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <Stack hasGutter style={{ overflowY: 'hidden' }}>
        <StackItem>
          <Split hasGutter>
            <SplitItem style={{ width: '25rem' }}>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>Current version</DescriptionListTerm>
                  <DescriptionListDescription>{version}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Source</DescriptionListTerm>
                  <DescriptionListDescription>
                    {item.Properties.find(isFctlMetaProps)?.value?.source}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Provider</DescriptionListTerm>
                  <DescriptionListDescription>
                    {item.Properties.find(isFctlMetaProps)?.value?.provider}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Support</DescriptionListTerm>
                  <DescriptionListDescription>
                    {item.Properties.find(isFctlMetaProps)?.value?.support}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </SplitItem>
            <SplitItem>
              <Divider
                orientation={{
                  default: 'vertical',
                }}
                style={{ height: '100%' }}
              />
            </SplitItem>
            <SplitItem isFilled>
              <Stack hasGutter>
                {item.description && <StackItem>{item.description}</StackItem>}
                <StackItem>
                  <ItemUpgradeGraph
                    version={version}
                    item={item}
                    channel={channel}
                    selectedVersion={itemVersion}
                    setSelectedVersion={setItemVersion}
                  />
                </StackItem>
                {modelName && modelChannel && modelItem && selectedModelVersion && (
                  <>
                    <StackItem>
                      <DescriptionList>
                        <DescriptionListGroup>
                          <DescriptionListTerm>AI Model</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                              <FlexItem>
                                <img
                                  src={`data:${modelItem.icon?.mediatype};base64,${modelItem.icon?.base64data}`}
                                  alt={`${modelItem.name} icon`}
                                  aria-hidden
                                  width="30"
                                  height="30"
                                />
                              </FlexItem>
                              <FlexItem>{modelItem.name}</FlexItem>
                              <FlexItem>
                                <Button isInline icon={<PencilAltIcon />} variant="link" />
                              </FlexItem>
                            </Flex>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </StackItem>
                    <StackItem>
                      <ItemUpgradeGraph
                        version={modelVersion}
                        item={modelItem}
                        channel={modelChannel}
                        selectedVersion={selectedModelVersion}
                        setSelectedVersion={setSelectedModelVersion}
                      />
                    </StackItem>
                  </>
                )}
              </Stack>
            </SplitItem>
          </Split>
        </StackItem>
      </Stack>
    </Modal>
  );
};

const CatalogItemModal = (props: InstallModalProps) => {
  if (isItemInstalled(props.item, props.device)) {
    return <InstalledModal {...props} />;
  }

  return <InstallModal {...props} />;
};

export default CatalogItemModal;
