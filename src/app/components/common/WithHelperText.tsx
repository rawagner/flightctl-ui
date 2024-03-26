import { Button, Popover, PopoverProps } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';

type WithHelperTextProps = {
  children?: React.ReactNode;
  popoverContent: PopoverProps['bodyContent'];
};

const WithHelperText: React.FC<WithHelperTextProps> = ({ children, popoverContent }) => (
  <>
    {children}
    <Popover triggerAction="hover" aria-label="Helper text" bodyContent={popoverContent}>
      <Button isInline variant="plain" icon={<OutlinedQuestionCircleIcon />} />
    </Popover>
  </>
);

export default WithHelperText;
