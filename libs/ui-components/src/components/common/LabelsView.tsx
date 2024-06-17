import * as React from 'react';
import { Label, LabelGroup } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';

import './LabelsView.css';

interface LabelsViewProps {
  prefix: string;
  labels: Record<string, string | undefined> | undefined;
  variant?: 'default' | 'collapsed';
}

const LabelsView = ({ variant, prefix, labels }: LabelsViewProps) => {
  const { t } = useTranslation();
  const labelItems = Object.entries(labels || {});
  if (labelItems.length === 0) {
    return '-';
  }

  const isLimited = variant === 'collapsed';
  return (
    <LabelGroup
      numLabels={isLimited ? 2 : 5}
      className={isLimited ? 'fctl-labels-view__collapsed' : undefined}
      expandedText={t('Show less')}
      // Label group will use this template and inject the correct count of labels.
      // For it to work, the variable name must be "remaining"
      collapsedText={t('{{remaining}} more', { remaining: 0 })}
    >
      {labelItems.map(([key, value], index: number) => (
        <Label key={`${prefix}_${index}`} id={`${prefix}_${index}`} color="blue">
          {value ? `${key}=${value}` : key}
        </Label>
      ))}
    </LabelGroup>
  );
};

export default LabelsView;
