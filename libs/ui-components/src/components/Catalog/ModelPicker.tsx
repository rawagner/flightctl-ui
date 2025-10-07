import * as React from 'react';
import { ModelValue, OLMBundle, OLMCatalogItem, isFctlMetaProps, isFctlModelProps } from '../../hooks/useCatalogItems';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  FormGroup,
  MenuToggle,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import FlightCtlForm from '../form/FlightCtlForm';
import './ModelPicker.css';

const getVersion = (bundleName: string) => {
  const match = bundleName.match(/v(\d+\.\d+\.\d+)/);

  if (match) {
    return match[1];
  }
  return bundleName;
};

const ModelCard = ({
  ci,
  bundle,
  isSelected,
  onSelect,
  onChannelSelect,
  onVersionSelect,
}: {
  ci: OLMCatalogItem;
  bundle: OLMBundle;
  isSelected: boolean;
  onSelect: VoidFunction;
  onChannelSelect: (channel: string) => void;
  onVersionSelect: (version: string) => void;
}) => {
  const [isChannelOpen, setIsChannelOpen] = React.useState(false);
  const [isVersionOpen, setIsVersionOpen] = React.useState(false);
  const [selectedChannel, setSelectedChannel] = React.useState(ci.defaultChannel);
  const [selectedVersion, setSelectedVersion] = React.useState(Object.keys(ci.Channels[selectedChannel].Bundles)[0]);

  const setVersion = (version: string) => {
    setSelectedVersion(version);
    onVersionSelect(version);
  };

  const setChannel = (channel: string) => {
    setSelectedChannel(channel);
    onChannelSelect(channel);
  };

  const sortedBundles = Object.keys(ci.Channels[selectedChannel].Bundles).sort((bA, bB) => {
    const a = getVersion(bA);
    const b = getVersion(bB);
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);

    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });

  React.useEffect(() => {
    setVersion(sortedBundles[0]);
    // eslint-disable-next-line
  }, []);

  return (
    <Card isFullHeight className="fctl-model-card" isSelected={isSelected} isSelectable>
      <CardHeader
        selectableActions={{
          selectableActionId: bundle.csvName,
          selectableActionAriaLabelledby: 'clickable-card-example-1',
          name: 'clickable-card-example',
          variant: 'single',
          onChange: () => {
            onSelect();
            onVersionSelect(selectedVersion);
            onChannelSelect(selectedChannel);
          },
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
      <CardBody isFilled>
        <Stack hasGutter>
          <StackItem isFilled>{ci.description}</StackItem>
          <StackItem>
            <Split hasGutter>
              <SplitItem>
                <FormGroup label="Channel">
                  <Select
                    id="channel"
                    isOpen={isChannelOpen}
                    selected={selectedChannel}
                    onSelect={(_, v) => setChannel(v as string)}
                    onOpenChange={(isOpen) => setIsChannelOpen(isOpen)}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsChannelOpen(!isChannelOpen)}
                        isExpanded={isChannelOpen}
                        isFullWidth
                      >
                        {selectedChannel}
                      </MenuToggle>
                    )}
                    shouldFocusToggleOnSelect
                  >
                    <SelectList>
                      {Object.keys(ci.Channels).map((k) => (
                        <SelectOption key={k} value={k}>
                          {k}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </FormGroup>
              </SplitItem>
              <SplitItem>
                <FormGroup label="Version">
                  <Select
                    id="version"
                    isOpen={isVersionOpen}
                    selected={selectedVersion}
                    onSelect={(_, v) => setVersion(v as string)}
                    onOpenChange={(isOpen) => setIsVersionOpen(isOpen)}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsVersionOpen(!isVersionOpen)}
                        isExpanded={isVersionOpen}
                        isFullWidth
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
              </SplitItem>
            </Split>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

type ModelPickerProps = {
  item: OLMCatalogItem;
  packages: OLMCatalogItem[];
  bundle: OLMBundle;
  selectedModel: string | undefined;
  onSelect: (model: string) => void;
  onChannelSelect: (channel: string) => void;
  onVersionSelect: (version: string) => void;
};

const ModelPicker: React.FC<ModelPickerProps> = ({
  packages,
  bundle,
  onChannelSelect,
  onVersionSelect,
  selectedModel,
  onSelect,
}) => {
  const models = bundle.properties.find(isFctlModelProps)?.value;
  if (!models) {
    return false;
  }

  const modelsValue = JSON.parse(models) as ModelValue;

  const modelPackages = modelsValue.reference.map((r) => r.value.packageName);
  const pkgs = packages.filter((p) => modelPackages.includes(p.name));

  return (
    <FlightCtlForm>
      <FormGroup label="Choose a model:">
        <PageSection style={{ backgroundColor: '#f0f0f0', overflowX: 'auto' }}>
          <Split hasGutter>
            {pkgs.map((ci, index) => (
              <SplitItem key={index} style={index === pkgs.length - 1 ? { paddingRight: '1.5rem' } : undefined}>
                <ModelCard
                  ci={ci}
                  bundle={bundle}
                  isSelected={ci.name === selectedModel}
                  onSelect={() => onSelect(ci.name)}
                  onChannelSelect={onChannelSelect}
                  onVersionSelect={onVersionSelect}
                />
              </SplitItem>
            ))}
          </Split>
        </PageSection>
      </FormGroup>
    </FlightCtlForm>
  );
};

export default ModelPicker;
