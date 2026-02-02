import * as React from 'react';
import { FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

// Helper component for displaying errors
const FieldErrors = ({ errors }: { errors?: string[] }) =>
  !!errors?.length && (
    <FormHelperText>
      <HelperText>
        <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
          {errors.join(', ')}
        </HelperTextItem>
      </HelperText>
    </FormHelperText>
  );

export default FieldErrors;
