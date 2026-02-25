import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Box } from '@map-colonies/react-components';
import useAddFeatureWithProps, {
  AvailableProperties,
  ExportFieldOptions,
} from './hooks/useAddFeatureWithProps';
import { useStore } from '../../models';
import './export-layer.component.css';
import { get, isEmpty } from 'lodash';
import useGetSelectionFieldForDomain from './hooks/useGetSelectionFieldForDomain';
import {
  GENERAL_FIELDS_ID,
  GENERAL_FIELDS_IDX,
  SELECTION_ERROR_CLASSNAME,
} from './constants';
import ExportSelectionComponent from './export-selection.component';
import { usePrevious } from '../../../common/hooks/previous.hook';

const scrollToElement = (elem?: Element | null): void => {
  setTimeout(() => {
    elem?.scrollIntoView({
      behavior: 'smooth',
    });
  }, NONE);
};

const NONE = 0;

const ExportSelectionFieldsContainer: React.FC = observer(() => {
  const store = useStore();
  const selectionsContainerRef = useRef<HTMLDivElement | null>(null);
  const exportGeometrySelections =
    store.exportStore.geometrySelectionsCollection;
  const selectionServerError = store.exportStore.serverErroredSelectionId;

  const { externalFields, internalFields, propsForDomain } =
    useAddFeatureWithProps();

  const SelectionFieldPerDomainRenderer = useGetSelectionFieldForDomain();

  const featuresWithProps = exportGeometrySelections.features;

  const prevFeaturesList = usePrevious(featuresWithProps);

  const renderExportSelectionsFields = useMemo((): JSX.Element[] => {
    return featuresWithProps.map((feature, selectionIdx) => {
      return (
        <ExportSelectionComponent
          key={get(feature, 'properties.id') as string}
          feature={feature}
          selectionIdx={selectionIdx}
          internalFields={internalFields}
          propsForDomain={propsForDomain}
        />
      );
    });
  }, [featuresWithProps, internalFields]);

  useLayoutEffect(() => {
    if ((prevFeaturesList?.length ?? NONE) >= featuresWithProps.length) return;

    scrollToElement(selectionsContainerRef.current?.lastElementChild);
  }, [featuresWithProps]);

  useLayoutEffect(() => {
    if (typeof selectionServerError !== 'undefined') {
      const erroredSelection = selectionsContainerRef.current?.querySelector(
        `.${SELECTION_ERROR_CLASSNAME}`
      );

      if (!isEmpty(erroredSelection)) {
        scrollToElement(erroredSelection);
      }
    }
  }, [selectionServerError]);

  const externalExportFields = useMemo((): JSX.Element | JSX.Element[] => {
    const generalExportFields = Object.entries(
      externalFields as Record<AvailableProperties, unknown>
    ).map(([key]) => {
      const formFieldValue = Object.entries(
        store.exportStore.formData
      ).reduce<string>((storedValue, [fieldName, value]): string => {
        if (fieldName.includes(key)) {
          return value as string;
        }
        return storedValue;
      }, '');

      return (
        <SelectionFieldPerDomainRenderer
          selectionIdx={GENERAL_FIELDS_IDX}
          selectionId={GENERAL_FIELDS_ID}
          fieldInfo={get(propsForDomain, key) as ExportFieldOptions}
          fieldName={key as AvailableProperties}
          fieldValue={formFieldValue}
        />
      );
    });

    return generalExportFields;
  }, [store.exportStore.formData, externalFields]);

  return (
    <>
      {propsForDomain && externalFields && internalFields && (
        <div ref={selectionsContainerRef} className="exportSelectionsContainer">
          <Box className="externalFields">{externalExportFields}</Box>
          {renderExportSelectionsFields}
        </div>
      )}
    </>
  );
});

export default ExportSelectionFieldsContainer;
