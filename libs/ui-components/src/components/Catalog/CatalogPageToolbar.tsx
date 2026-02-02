import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import * as React from 'react';
import TableTextSearch from '../Table/TableTextSearch';
import { useTranslation } from '../../hooks/useTranslation';
import { CatalogFilter } from './useCatalogFilter';
import TablePagination from '../Table/TablePagination';
import { PaginationDetails } from '../../hooks/useTablePagination';
import { CatalogItemList } from '@flightctl/types/alpha';
import AddOsModal from './AddOsModal';

type CatalogPageToolbarProps = CatalogFilter & {
  showCreate: boolean;
  pagination: PaginationDetails<CatalogItemList>;
  isUpdating: boolean;
};

const CatalogPageToolbar: React.FC<CatalogPageToolbarProps> = ({
  name,
  setName,
  showCreate,
  pagination,
  isUpdating,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isOsModalOpen, setIsOsModalOpen] = React.useState(false);
  const { t } = useTranslation();
  return (
    <>
      <Toolbar inset={{ default: 'insetNone' }}>
        <ToolbarContent>
          <ToolbarItem>
            <TableTextSearch value={name} setValue={setName} placeholder={t('Search by name')} />
          </ToolbarItem>
          {showCreate && (
            <ToolbarItem>
              <Dropdown
                isOpen={isOpen}
                onSelect={(_, v) => {
                  if (v === 'system') {
                    setIsOsModalOpen(true);
                  }
                  setIsOpen(false);
                }}
                onOpenChange={setIsOpen}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsOpen((prev) => !prev)}
                    isExpanded={isOpen}
                    variant="primary"
                  >
                    {t('Add item')}
                  </MenuToggle>
                )}
                ouiaId="BasicDropdown"
                shouldFocusToggleOnSelect
              >
                <DropdownList>
                  <DropdownItem value="system">{t('Add operating system')}</DropdownItem>
                  <DropdownItem
                    value={1}
                    key="link"
                    to="#default-link2"
                    // Prevent the default onClick functionality for example purposes
                    onClick={(ev: any) => ev.preventDefault()}
                  >
                    {t('Add application')}
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </ToolbarItem>
          )}
          <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
            <TablePagination pagination={pagination} isUpdating={isUpdating} />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      {isOsModalOpen && <AddOsModal onClose={() => setIsOsModalOpen(false)} />}
    </>
  );
};

export default CatalogPageToolbar;
