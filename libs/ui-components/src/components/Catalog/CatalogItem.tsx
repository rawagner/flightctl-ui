import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Content,
  ContentVariants,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { getCatalogItemTitles } from './utils';
import { CatalogItem } from '@flightctl/types/alpha';

import defaultIcon from '../../../assets/flight-control-logo.png';

export type CatalogItemProps = {
  catalogItem: CatalogItem;
  onSelect: VoidFunction;
  isSelectable?: boolean;
  isSelected?: boolean;
};

const CatalogItem: React.FC<CatalogItemProps> = ({ catalogItem, onSelect, isSelectable, isSelected }) => {
  const { t } = useTranslation();
  return (
    <Card isCompact isClickable={!isSelectable} isSelectable={isSelectable} isSelected={isSelected}>
      <CardHeader
        selectableActions={{
          onClickAction: onSelect,
          selectableActionAriaLabelledby: `clickable-card-${catalogItem.metadata.name}`,
          onChange: onSelect,
          isHidden: isSelectable ? true : undefined,
        }}
      >
        <Split>
          <SplitItem isFilled>
            <img
              src={catalogItem.spec.icon || defaultIcon}
              alt={`${catalogItem.metadata.name} icon`}
              style={{ maxWidth: '60px' }}
            />
          </SplitItem>
          <SplitItem>
            <Badge isRead>{getCatalogItemTitles(catalogItem.spec.category, t)}</Badge>
          </SplitItem>
        </Split>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Stack>
              <StackItem>
                <Title headingLevel="h3">{catalogItem.spec.displayName || catalogItem.metadata.name}</Title>
              </StackItem>
              {catalogItem.spec.provider && (
                <StackItem>
                  <Content component={ContentVariants.small}>Provided by {catalogItem.spec.provider}</Content>
                </StackItem>
              )}
            </Stack>
          </StackItem>
          {catalogItem.spec.shortDescription && <StackItem>{catalogItem.spec.shortDescription}</StackItem>}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default CatalogItem;
