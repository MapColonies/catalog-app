import { get } from 'lodash';
import React from 'react';
import { useStore } from '../../../models';
import { LayerMetadataMixedUnionKeys } from '../../layer-details/entity-types-keys';
import ExportGeneralFieldComponent from '../common/fields/export-general-field.component';
import ExportOptionsField from '../common/fields/export-options-field.component';
import { ExportFieldProps } from '../types/interfaces';
import useZoomLevelsTable from '../hooks/useZoomLevelsTable';
import { degreesPerPixelToZoomLevel } from '@map-colonies/mc-utils';

const RasterSelectionField: React.FC<ExportFieldProps> = (props) => {
  const { fieldName, fieldInfo, selectionIdx } = props;
  const { exportStore } = useStore();
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const MAX_PADDING_LENGTH = 18;
  const MAX_VALUE_LENGTH = 10;

  switch (fieldName) {
    case 'minResolutionDeg': {
      const currentRes = (
        get(
          exportStore.geometrySelectionsCollection.features[selectionIdx - 1],
          `properties.minResolutionDeg`
        ) as number | undefined
      )?.toString();

      const maxResFromLayer = (
        get(exportStore.layerToExport, `maxResolutionDeg`) as number | undefined
      )?.toString();

      const getValidResolutions = (): string[] => {
        return Object.values(ZOOM_LEVELS_TABLE)
          .map((res) => res.toString())
          .filter((res) => {
            return typeof maxResFromLayer !== 'undefined'
              ? +res >= +maxResFromLayer
              : res;
          });
      };

      const options = getValidResolutions();

      return (
        <>
          <ExportOptionsField
            options={Array.from(new Set(options))}
            defaultValue={currentRes}
            valueToPresentPredicate={(value: string): string => {
              const [integers, decimals] = value.split('.');
              const substrStart = 0;
              const numberOfDecimals = 8;
              const resString = `${integers}.${decimals.substring(
                substrStart,
                numberOfDecimals
              )}`;
              const zoomLevel = degreesPerPixelToZoomLevel(
                Number.parseFloat(value)
              );
              return `${resString.padEnd(
                MAX_PADDING_LENGTH + (MAX_VALUE_LENGTH - resString.length),
                ' '
              )}${zoomLevel}`;
            }}
            {...props}
          />
        </>
      );
    }
    case 'maxResolutionDeg': {
      const currentRes = (
        get(
          exportStore.layerToExport,
          fieldInfo.defaultsFromEntityField as LayerMetadataMixedUnionKeys
        ) as number
      ).toString();

      const resFromEntityProps = (
        get(
          exportStore.geometrySelectionsCollection.features[selectionIdx - 1],
          `properties.maxResolutionDeg`
        ) as number | undefined
      )?.toString();

      const getValidResolutions = (): string[] => {
        return Object.values(ZOOM_LEVELS_TABLE)
          .map((res) => res.toString())
          .filter((res) => {
            const resolutionPrecision = currentRes.split('.')[1].length;
            const samePrecisionResFromTable =
              Number(res).toFixed(resolutionPrecision);

            return Number(currentRes) <= Number(samePrecisionResFromTable);
          });
      };

      return (
        <>
          <ExportOptionsField
            options={Array.from(
              new Set([currentRes, ...getValidResolutions()])
            )}
            defaultValue={resFromEntityProps ?? currentRes}
            valueToPresentPredicate={(value: string): string => {
              const [integers, decimals] = value.split('.');
              const substrStart = 0;
              const numberOfDecimals = 8;
              const resString = `${integers}.${decimals.substring(
                substrStart,
                numberOfDecimals
              )}`;
              const zoomLevel = degreesPerPixelToZoomLevel(
                Number.parseFloat(value)
              );
              return `${resString.padEnd(
                MAX_PADDING_LENGTH + (MAX_VALUE_LENGTH - resString.length),
                ' '
              )}${zoomLevel}`;
            }}
            {...props}
          />
        </>
      );
    }
    case 'description': {
      return (
        <>
          <ExportGeneralFieldComponent type="text" {...props} />
        </>
      );
    }
    default: {
      return (
        <>
          <ExportGeneralFieldComponent {...props} />
        </>
      );
    }
  }
};

export default RasterSelectionField;
