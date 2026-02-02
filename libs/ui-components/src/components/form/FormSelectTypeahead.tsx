import * as React from 'react';

import {
  FormGroup,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
} from '@patternfly/react-core';
import { useField } from 'formik';
import ErrorHelperText, { DefaultHelperText } from './FieldHelperText';

import './FormSelect.css';
import { t } from 'i18next';

export type SelectItem = {
  label: string;
  description?: string;
  isDisabled?: boolean;
  value: unknown;
  valueToKey: (val: unknown) => string;
};

type FormSelectProps = {
  name: string;
  items: Record<string, string | SelectItem>;
  defaultId?: string;
  helperText?: React.ReactNode;
  placeholderText?: string;
  isValidTypedItem?: (value: string) => boolean;
  transformTypedItem?: (value: string) => string;
  /** Called when input value changes. When provided, client-side filtering is disabled (use for backend filtering). */
  onInputChange?: (value: string) => void;
  emptyOptionLabel?: string;
};

const isItemObject = (item: string | SelectItem): item is SelectItem => typeof item === 'object';

const getItemLabel = (item: string | SelectItem) => (isItemObject(item) ? item.label : item);

const getItemValue = (key: string, item: string | SelectItem): unknown => (isItemObject(item) ? item.value : key);

const findItemByStoredValue = (
  items: Record<string, string | SelectItem>,
  storedValue: unknown,
): { key: string; item: string | SelectItem } | undefined => {
  if (storedValue) {
    for (const key of Object.keys(items)) {
      const item = items[key];
      if (isItemObject(item)) {
        if (item.valueToKey(storedValue) === key) {
          return { key, item };
        }
      } else if (key === storedValue) {
        return { key, item };
      }
    }
  }
  return undefined;
};

const FormSelectTypeahead = ({
  name,
  items,
  defaultId,
  helperText,
  placeholderText,
  isValidTypedItem,
  transformTypedItem,
  onInputChange,
  children,
  emptyOptionLabel,
}: React.PropsWithChildren<FormSelectProps>) => {
  const [field, meta, { setValue, setTouched }] = useField<string>({
    name: name,
  });

  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState<string | undefined>(undefined);
  const [focusedItemIndex, setFocusedItemIndex] = React.useState<number | null>(null);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
  const textInputRef = React.useRef<HTMLInputElement>();

  const currentValue = field.value;

  const fieldId = `selectfield-${name}`;
  const itemKeys = Object.keys(items);

  let defaultValue = '';
  if (defaultId) {
    const defaultItem = items[defaultId];
    defaultValue = isItemObject(defaultItem) ? defaultItem.description || '' : defaultItem;
  }

  React.useEffect(() => {
    const hasOneItem = itemKeys.length === 1;
    if (hasOneItem && !currentValue) {
      const key = itemKeys[0];
      const item = items[key];
      setValue(getItemValue(key, item) as string, true);
    }
  }, [itemKeys, items, currentValue, setValue]);

  let selectedText = defaultValue;
  if (inputValue) {
    selectedText = inputValue;
  } else if (currentValue) {
    const found = findItemByStoredValue(items, currentValue);
    selectedText = found ? getItemLabel(found.item) : currentValue;
  }

  // When onInputChange is provided, skip client-side filtering (backend filtering mode)
  const itemKeysFiltered = onInputChange
    ? itemKeys
    : itemKeys.filter((key) => {
        if (!inputValue) {
          return true;
        }
        return getItemLabel(items[key]).toLowerCase().includes(inputValue.toLowerCase());
      });

  const setActiveAndFocusedItem = (itemIndex: number) => {
    setFocusedItemIndex(itemIndex);
    const focusedItem = itemKeysFiltered[itemIndex];
    setActiveItemId(`${fieldId}-${focusedItem}`);
  };

  const resetActiveAndFocusedItem = () => {
    setFocusedItemIndex(null);
    setActiveItemId(null);
  };

  const handleMenuArrowKeys = (key: string) => {
    let indexToFocus = 0;

    if (!isOpen) {
      setIsOpen(true);
    }

    if (itemKeysFiltered.length === 0) {
      return;
    }

    if (key === 'ArrowUp') {
      // When no index is set or at the first index, focus to the last, otherwise decrement focus index
      if (focusedItemIndex === null || focusedItemIndex === 0) {
        indexToFocus = itemKeysFiltered.length - 1;
      } else {
        indexToFocus = focusedItemIndex - 1;
      }
    }

    if (key === 'ArrowDown') {
      // When no index is set or at the last index, focus to the first, otherwise increment focus index
      if (focusedItemIndex === null || focusedItemIndex === itemKeysFiltered.length - 1) {
        indexToFocus = 0;
      } else {
        indexToFocus = focusedItemIndex + 1;
      }
    }

    setActiveAndFocusedItem(indexToFocus);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const focusedItem = focusedItemIndex !== null ? itemKeysFiltered[focusedItemIndex] : null;

    switch (event.key) {
      case 'Enter':
        if (isOpen && focusedItem) {
          event.preventDefault();
          const item = items[focusedItem];
          const valueToStore = getItemValue(focusedItem, item);
          setTouched(true);
          setValue(valueToStore as string, true);
          setInputValue(undefined);
          setIsOpen(false);
          resetActiveAndFocusedItem();
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        handleMenuArrowKeys(event.key);
        break;
      case 'Escape':
        if (isOpen) {
          setIsOpen(false);
          resetActiveAndFocusedItem();
        }
        break;
    }
  };

  return (
    <FormGroup id={`form-control__${fieldId}`} fieldId={fieldId}>
      <Select
        id={fieldId}
        className="fctl-form-select"
        selected={findItemByStoredValue(items, currentValue)?.key || defaultId}
        onSelect={(_, selectedKey) => {
          const item = items[selectedKey as string];
          const valueToStore = getItemValue(selectedKey as string, item);
          setTouched(true);
          setValue(valueToStore as string, true);
          setInputValue(undefined);
          setIsOpen(false);
          resetActiveAndFocusedItem();
        }}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => {
              if (isOpen && !meta.touched) {
                setTouched(true);
              }
              setIsOpen(!isOpen);
              textInputRef?.current?.focus();
            }}
            isExpanded={isOpen}
            className="fctl-form-select__toggle"
            id={`${fieldId}-menu`}
            variant="typeahead"
          >
            <TextInputGroup isPlain>
              <TextInputGroupMain
                value={selectedText}
                onClick={() => {
                  if (isOpen && !meta.touched) {
                    setTouched(true);
                  }
                  setIsOpen(!isOpen);
                  textInputRef?.current?.focus();
                }}
                onChange={(_, value) => {
                  setInputValue(value || undefined);
                  onInputChange?.(value || '');
                  resetActiveAndFocusedItem();
                  if (!isOpen) {
                    setIsOpen(true);
                  }
                }}
                onBlur={() => {
                  if (!inputValue) {
                    return;
                  }

                  // If there is no "isValidTypedItem", it means selection must always be done by selecting from the list
                  const skipSetValue = isValidTypedItem ? !isValidTypedItem(inputValue) : true;
                  if (skipSetValue) {
                    if (itemKeysFiltered.length === 0) {
                      setInputValue(undefined);
                      setIsOpen(false);
                    } else {
                      // The typed text has no matches from the list. We clear the value to use the default/empty
                      setValue('');
                    }
                    return;
                  }
                  const transformedValue = transformTypedItem?.(inputValue) || inputValue;
                  setInputValue(undefined);
                  void setValue(transformedValue);
                  setIsOpen(false);
                }}
                id={`create-typeahead-select-input-${name}`}
                autoComplete="off"
                role="combobox"
                isExpanded={isOpen}
                aria-controls={`${fieldId}-listbox`}
                placeholder={placeholderText}
                onKeyDown={onInputKeyDown}
                innerRef={textInputRef}
                {...(activeItemId && { 'aria-activedescendant': activeItemId })}
              />
            </TextInputGroup>
          </MenuToggle>
        )}
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (!meta.touched) {
              setTouched(true);
            }
            resetActiveAndFocusedItem();
          } else {
            textInputRef?.current?.focus();
          }
          setIsOpen(open);
        }}
      >
        <SelectList className="fctl-form-select__menu" id={`${fieldId}-listbox`}>
          {itemKeysFiltered.length ? (
            itemKeysFiltered.map((key, index) => {
              const item = items[key];
              const desc = isItemObject(item) ? item.description : undefined;
              return (
                <SelectOption
                  className="fctl-form-select__item"
                  key={key}
                  value={key}
                  description={desc}
                  isFocused={focusedItemIndex === index}
                  id={`${fieldId}-${key}`}
                >
                  {getItemLabel(item)}
                </SelectOption>
              );
            })
          ) : (
            <SelectOption isDisabled className="fctl-form-select__item">
              {emptyOptionLabel ?? t<string>('Not found')}
            </SelectOption>
          )}
        </SelectList>
        {children}
      </Select>

      <DefaultHelperText helperText={helperText} />
      <ErrorHelperText meta={meta} />
    </FormGroup>
  );
};

const FormSelectTypeaheadWrapper = ({
  name,
  items,
  isDisabled,
  ...rest
}: FormSelectProps & { isDisabled?: boolean }) => {
  const [{ value }] = useField<string>({
    name: name,
  });
  if (isDisabled) {
    let displayText: string = '';
    if (value) {
      const found = findItemByStoredValue(items, value);
      displayText = found ? getItemLabel(found.item) : value;
    } else if (rest.defaultId) {
      displayText = getItemLabel(items[rest.defaultId]) || rest.defaultId;
    }
    return displayText || rest.placeholderText || '-';
  }
  return <FormSelectTypeahead name={name} items={items} {...rest} />;
};

export default FormSelectTypeaheadWrapper;
