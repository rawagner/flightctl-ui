import * as React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';
import UploadField from '../../form/UploadField';

type CatalogItemConfigFieldsProps = {
  fieldName: string;
};

const CatalogItemConfigFields = ({ fieldName }: CatalogItemConfigFieldsProps) => {
  const { t } = useTranslation();

  return <UploadField name={fieldName} ariaLabel={t('Configuration')} />;
};

export default CatalogItemConfigFields;
