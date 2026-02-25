import React, { useContext } from 'react';
import EnumsMapContext, {
  IEnumsMapType,
} from '../../../../common/contexts/enumsMap.context';
import { useStore } from '../../../models';
import ExportGeneralFieldComponent from '../common/fields/export-general-field.component';
import ExportOptionsField from '../common/fields/export-options-field.component';
import { getEnumRealValues } from '../utils/export-layer-utils';
import { DEMExportProjection } from '../types/enums';
import { get } from 'lodash';
import { ExportFieldProps } from '../types/interfaces';

const DemSelectionField: React.FC<ExportFieldProps> = (props) => {
  const { fieldName, selectionIdx } = props;
  const {
    exportStore: { layerToExport, geometrySelectionsCollection },
  } = useStore();
  const { enumsMap } = useContext(EnumsMapContext);
  const enums = enumsMap as IEnumsMapType;

  switch (fieldName) {
    case 'resolution': {
      return (
        <>
          <ExportGeneralFieldComponent type="number" {...props} />
        </>
      );
    }
    case 'projection': {
      const PROJECTION_OPTIONS = [
        DEMExportProjection.WGS84,
        DEMExportProjection.UTM,
      ];
      const DEFAULT_PROJECTION = DEMExportProjection.WGS84;

      const valueFromEntityProps = (
        get(
          geometrySelectionsCollection.features[selectionIdx - 1],
          `properties.projection`
        ) as number | undefined
      )?.toString();

      return (
        <>
          <ExportOptionsField
            options={PROJECTION_OPTIONS}
            defaultValue={valueFromEntityProps ?? DEFAULT_PROJECTION}
            {...props}
          />
        </>
      );
    }
    case 'resampleMethod': {
      const options = getEnumRealValues(enums, 'ResamplingMethod');
      const defaultResamplingMethod = 'near';

      const valueFromEntityProps = (
        get(
          geometrySelectionsCollection.features[selectionIdx - 1],
          `properties.resampleMethod`
        ) as number | undefined
      )?.toString();

      return (
        <>
          <ExportOptionsField
            options={options}
            defaultValue={valueFromEntityProps ?? defaultResamplingMethod}
            {...props}
          />
        </>
      );
    }
    case 'dataType': {
      const options = getEnumRealValues(enums, 'DEMDataType');
      const defaultValueFromLayer = get(layerToExport, 'dataType') as string;
      const defaultValue = get(enums, defaultValueFromLayer).realValue;

      const valueFromEntityProps = (
        get(
          geometrySelectionsCollection.features[selectionIdx - 1],
          `properties.dataType`
        ) as number | undefined
      )?.toString();

      return (
        <>
          <ExportOptionsField
            options={options}
            defaultValue={valueFromEntityProps ?? defaultValue}
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

export default DemSelectionField;
