import * as React from 'react';
import { useDebounce } from 'use-debounce';
import { CatalogItem, CatalogItemList } from '@flightctl/types/alpha';
import type { CatalogItemCategory, CatalogItemType } from '@flightctl/types/alpha';
import { useFetchPeriodically } from '../../hooks/useFetchPeriodically';
import { useFetch } from '../../hooks/useFetch';
import { getErrorMessage } from '../../utils/error';
import { PaginationDetails, useTablePagination } from '../../hooks/useTablePagination';
import { PAGE_SIZE } from '../../constants';

export const useCatalogItems = (catalog: string): [CatalogItem[], boolean, unknown, boolean, VoidFunction] => {
  const [list, loading, error, refetch, updating] = useFetchPeriodically<CatalogItemList>({
    endpoint: catalog ? `catalogs/${catalog}/items` : '',
  });

  return [list?.items || [], loading, error, updating, refetch];
};

export const useCatalogItem = (
  catalog: string | undefined,
  item: string | undefined,
): [CatalogItem | undefined, boolean, unknown, boolean, VoidFunction] => {
  const [catalogItem, loading, error, refetch, updating] = useFetchPeriodically<CatalogItem>({
    endpoint: catalog && item ? `catalogs/${catalog}/items/${item}` : '',
  });

  return [catalogItem, loading, error, updating, refetch];
};

function buildCatalogItemsFieldSelector(
  itemCategory: CatalogItemCategory[] | undefined,
  itemType: CatalogItemType[] | undefined,
  nameFilter?: string,
): string | undefined {
  const parts: string[] = [];
  if (itemCategory?.length === 1) {
    parts.push(`spec.category==${itemCategory[0]}`);
  } else if (itemCategory?.length || 0 > 1) {
    parts.push(`spec.category in (${itemCategory?.join(',')})`);
  }
  if (itemType?.length === 1) {
    parts.push(`spec.type==${itemType[0]}`);
  } else if (itemType?.length || 0 > 1) {
    parts.push(`spec.type in (${itemType?.join(',')})`);
  }
  if (nameFilter?.trim()) {
    parts.push(`metadata.name contains ${nameFilter.trim()}`);
  }
  return parts.length > 0 ? parts.join(',') : undefined;
}

export type UseAllCatalogItemsFilter = {
  itemCategory?: CatalogItemCategory[] | undefined;
  itemType?: CatalogItemType[] | undefined;
  nameFilter?: string | undefined;
};

export const useAllCatalogItems = (
  filter?: UseAllCatalogItemsFilter,
): [CatalogItem[], boolean, unknown, PaginationDetails<CatalogItemList>, boolean] => {
  const pagination = useTablePagination<CatalogItemList>();
  const fieldSelector = React.useMemo(
    () =>
      filter ? buildCatalogItemsFieldSelector(filter.itemCategory, filter.itemType, filter.nameFilter) : undefined,
    [filter?.itemCategory, filter?.itemType, filter?.nameFilter],
  );
  const endpoint = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', `${PAGE_SIZE}`);
    if (pagination.nextContinue) {
      params.set('continue', pagination.nextContinue);
    }
    if (fieldSelector) {
      params.set('fieldSelector', fieldSelector);
    }
    const query = params.toString();
    return query ? `catalogitems?${query}` : 'catalogitems';
  }, [fieldSelector, pagination.nextContinue]);

  const [endpointDebounced] = useDebounce(endpoint, 1000);
  const isDebouncing = endpoint !== endpointDebounced;

  React.useEffect(() => {
    pagination.setCurrentPage(1);
  }, [filter?.nameFilter, filter?.itemCategory, filter?.itemType]);

  const [catalogItemsList, loading, error] = useFetchPeriodically<CatalogItemList>(
    { endpoint: endpointDebounced },
    pagination.onPageFetched,
  );

  const isUpdating = loading || isDebouncing;

  return [catalogItemsList?.items || [], loading, error, pagination, isUpdating];
};
