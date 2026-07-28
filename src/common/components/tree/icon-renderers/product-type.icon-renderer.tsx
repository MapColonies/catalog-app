import React, { useMemo } from 'react';
import { ILayerImage } from '../../../../discrete-layer/models/layerImage';
import { LayerRasterRecordModelType } from '../../../../discrete-layer/models';
import { hasWFSLink } from '../../../../discrete-layer/components/helpers/layersUtils';
import { getIconStyle, isPolygonPartsDisabled } from '../../../helpers/style';
import { TypeIcon } from '../../shared/type-icon';

interface IProductTypeCellRendererParams {
  data: ILayerImage;
  thumbnailUrl?: string;
  onClick?: (data: ILayerImage, value: boolean) => void;
}

export const ProductTypeRenderer: React.FC<IProductTypeCellRendererParams> = ({
  data,
  thumbnailUrl,
  onClick,
}) => {
  const handleClick = () => {
    const rasterData = data as LayerRasterRecordModelType;

    if (onClick && hasWFSLink(rasterData as unknown as Record<string, unknown>)) {
      onClick(data, !rasterData.polygonPartsShown);
    }
  };

  const computedStyle = useMemo(() => {
    return {
      ...(getIconStyle(data as any, 'color') ?? {}),
    };
  }, [data]);

  return (
    <TypeIcon
      typeName={data.productType as string}
      thumbnailUrl={thumbnailUrl}
      style={computedStyle}
      disabled={isPolygonPartsDisabled(data as unknown as Record<string, unknown>)}
      onClick={data.__typename === 'LayerRasterRecord' ? handleClick : undefined}
    />
  );
};
