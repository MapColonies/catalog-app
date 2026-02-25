import React, { useMemo } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { getLinkUrlWithToken } from '../../../../discrete-layer/components/helpers/layersUtils';
import { ILayerImage } from '../../../../discrete-layer/models/layerImage';
import {
  LayerRasterRecordModelType,
  LinkModelType,
} from '../../../../discrete-layer/models';
import { getIconStyle } from '../../../helpers/style';
import { LinkType } from '../../../models/link-type.enum';
import { TypeIcon } from '../../shared/type-icon';
import { GridApi } from '..';

interface IProductTypeCellRendererParams extends ICellRendererParams {
  style?: Record<string, unknown>;
  onClick?: (data: ILayerImage, value: boolean, gridApi: GridApi) => void;
}

export const ProductTypeRenderer: React.FC<IProductTypeCellRendererParams> = (
  props
) => {
  const data = props.data as ILayerImage;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      props.onClick(
        data,
        !(data as LayerRasterRecordModelType).polygonPartsShown,
        props.api
      );
    }
  };

  const computedStyle = useMemo(() => {
    return {
      ...(props.style ?? {}),
      ...(getIconStyle(data as any, 'color') ?? {}),
    };
  }, [props.style, data]);

  return (
    <TypeIcon
      typeName={data.productType as string}
      thumbnailUrl={
        data.links
          ? getLinkUrlWithToken(
              data.links as LinkModelType[],
              LinkType.THUMBNAIL_S
            )
          : undefined
      }
      style={computedStyle}
      onClick={
        data.__typename === 'LayerRasterRecord' ? handleClick : undefined
      }
    />
  );
};
