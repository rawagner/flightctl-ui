import { CatalogItemCategory, CatalogItemType } from '@flightctl/types/alpha';
import * as React from 'react';

export type CatalogFilter = {
  name: string;
  setName: (name: string) => void;
  itemCategory: CatalogItemCategory[] | undefined;
  setItemCategory: (types: CatalogItemCategory[] | undefined) => void;
  itemType: CatalogItemType[] | undefined;
  setItemType: (type: CatalogItemType[] | undefined) => void;
};

export const useCatalogFilter = (): CatalogFilter => {
  const [name, setName] = React.useState('');
  const [itemCategory, setItemCategory] = React.useState<CatalogItemCategory[]>();
  const [itemType, setItemType] = React.useState<CatalogItemType[]>();

  return {
    name,
    setName,
    itemCategory,
    setItemCategory,
    itemType,
    setItemType,
  };
};
