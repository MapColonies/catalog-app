import { forwardRef, useImperativeHandle, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { get } from 'lodash';
import { ITooltipParams } from 'ag-grid-community';
import { Typography } from '@map-colonies/react-core';
import { LayerRecordTypes } from '../../../../discrete-layer/components/layer-details/entity-types-keys';
import {
  DateGranularityType,
  FieldConfigModelType,
} from '../../../../discrete-layer/models';
import { ILayerImage } from '../../../../discrete-layer/models/layerImage';
import { dateFormatter } from '../../../helpers/formatters';

import './name.tooltip-renderer.css';

export default forwardRef((props: ITooltipParams, ref) => {
  const [data] = useState<ILayerImage>(
    props.api.getDisplayedRowAtIndex(props?.rowIndex as number)?.data
  );
  const [layerRecordTypename] = useState<LayerRecordTypes>(data.__typename);
  const [color] = useState<string>(get(props, 'color', 'white'));
  const [infoTooltipMap] = useState<
    Map<LayerRecordTypes, FieldConfigModelType[]>
  >(get(props, 'infoTooltipMap'));
  const [fields] = useState<FieldConfigModelType[]>(
    infoTooltipMap.get(layerRecordTypename) as FieldConfigModelType[]
  );

  useImperativeHandle(ref, () => {
    return {
      // eslint-disable-next-line
      getReactContainerClasses() {
        return ['layers-result-custom-tooltip'];
      },
    };
  });

  return (
    <div
      className="layers-result-custom-tooltip"
      style={{ backgroundColor: color }}
    >
      <>
        {fields.map((field: FieldConfigModelType, index: number) => {
          const value = `${get(data, field.fieldName as string)}`;
          return (
            <Typography tag="p" key={`${field}${index}`}>
              <Typography tag="span">
                <FormattedMessage id={`${field.label}`} />:{' '}
              </Typography>
              <bdi>
                {field.dateGranularity
                  ? dateFormatter(
                      value,
                      field.dateGranularity ===
                        DateGranularityType.DATE_AND_TIME
                    )
                  : value}
              </bdi>
            </Typography>
          );
        })}
      </>
    </div>
  );
});
