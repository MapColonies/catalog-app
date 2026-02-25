/* eslint-disable @typescript-eslint/naming-convention */
import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import EnumsMapContext, {
  IEnumsMapType,
} from '../../../../common/contexts/enumsMap.context';
import {
  DemDataType,
  NoDataValue,
  ProductType,
  RecordStatus,
  RecordType,
  UndulationModel,
  Transparency,
} from '../../../models';
import { useQuery, useStore } from '../../../models/RootStore';

export const MCEnumsFetcher: React.FC = observer(() => {
  const store = useStore();
  const mcEnumsQuery = useQuery((store) => store.queryGetMcEnums());
  const { setEnumsMap } = useContext(EnumsMapContext);
  const enumUnion = {
    DemDataType,
    NoDataValue,
    UndulationModel,
    ProductType,
    RecordStatus,
    RecordType,
    Transparency,
  };

  useEffect(() => {
    if (!mcEnumsQuery.loading && mcEnumsQuery.data) {
      const enums = {
        ...(mcEnumsQuery.data.getMcEnums.enums as IEnumsMapType),
      };

      Object.values(enumUnion).forEach(
        (enumValues: Record<string, string>): void => {
          Object.keys(enumValues).forEach((item) => {
            enums[item] = {
              ...enums[item],
              translationKey: `${enums[item].enumName}.${item.toLowerCase()}`,
            };
          });
        }
      );

      const {
        ORTHOPHOTO,
        ORTHOPHOTO_HISTORY,
        ORTHOPHOTO_BEST,
        RASTER_MAP,
        RASTER_MAP_BEST,
        RASTER_AID,
        RASTER_AID_BEST,
        RASTER_VECTOR,
        RASTER_VECTOR_BEST,
        DTM,
        DSM,
        QUANTIZED_MESH_DTM,
        QUANTIZED_MESH_DSM,
        QUANTIZED_MESH_DTM_BEST,
        QUANTIZED_MESH_DSM_BEST,
        PHOTO_REALISTIC_3D,
        POINT_CLOUD,
      } = ProductType;

      enums['LayerRasterRecord'] = {
        enumName: '',
        realValue: '',
        icon: 'mc-icon-Map-Orthophoto',
        translationKey: 'record-type.record_raster.label',
        parent: '',
        internal: false,
        properties: {},
        parentDomain: RecordType.RECORD_RASTER,
      };
      enums['Layer3DRecord'] = {
        enumName: '',
        realValue: '',
        icon: 'mc-icon-Map-3D',
        translationKey: 'record-type.record_3d.label',
        parent: '',
        internal: false,
        properties: {},
        parentDomain: RecordType.RECORD_3D,
      };
      enums['LayerDemRecord'] = {
        enumName: '',
        realValue: '',
        icon: 'mc-icon-Map-DTM',
        translationKey: 'record-type.record_dem.label',
        parent: '',
        internal: false,
        properties: {},
        parentDomain: RecordType.RECORD_DEM,
      };
      enums['QuantizedMeshBestRecord'] = {
        enumName: '',
        realValue: '',
        icon: 'mc-icon-Map-Best-Qmash',
        translationKey: 'record-type.record_quantized_mesh.label',
        parent: '',
        internal: false,
        properties: {},
        parentDomain: RecordType.RECORD_3D,
      };
      enums[ORTHOPHOTO] = {
        ...enums[ORTHOPHOTO],
        icon: 'mc-icon-Map-Orthophoto',
        parent: 'LayerRasterRecord',
        parentDomain: RecordType.RECORD_RASTER,
      };
      enums[ORTHOPHOTO_HISTORY] = {
        ...enums[ORTHOPHOTO_HISTORY],
        icon: 'mc-icon-Map-Orthophoto',
        parent: 'LayerRasterRecord',
        internal: true,
        parentDomain: RecordType.RECORD_RASTER,
      };
      enums[ORTHOPHOTO_BEST] = {
        ...enums[ORTHOPHOTO_BEST],
        icon: 'mc-icon-Map-Best-Orthophoto',
        parent: 'LayerRasterRecord',
        parentDomain: RecordType.RECORD_RASTER,
      };
      enums[RASTER_MAP] = {
        ...enums[RASTER_MAP],
        icon: 'mc-icon-Map-Raster',
        parent: 'LayerRasterRecord',
        parentDomain: RecordType.RECORD_RASTER,
      };
      enums[RASTER_MAP_BEST] = {
        ...enums[RASTER_MAP_BEST],
        icon: 'mc-icon-Map-Best-Raster',
        parent: 'LayerRasterRecord',
        parentDomain: RecordType.RECORD_RASTER,
      };
      enums[RASTER_AID] = {
        ...enums[RASTER_AID],
        icon: 'mc-icon-Map-RasterAid',
        parent: 'LayerRasterRecord',
        parentDomain: RecordType.RECORD_RASTER,
      };
      enums[RASTER_AID_BEST] = {
        ...enums[RASTER_AID_BEST],
        icon: 'mc-icon-Map-Best-RasterAid',
        parent: 'LayerRasterRecord',
        parentDomain: RecordType.RECORD_RASTER,
      };
      enums[RASTER_VECTOR] = {
        ...enums[RASTER_VECTOR],
        icon: 'mc-icon-Map-Vector',
        parent: 'LayerRasterRecord',
        parentDomain: RecordType.RECORD_RASTER,
      };
      enums[RASTER_VECTOR_BEST] = {
        ...enums[RASTER_VECTOR_BEST],
        icon: 'mc-icon-Map-Vector',
        parent: 'LayerRasterRecord',
        parentDomain: RecordType.RECORD_RASTER,
      };
      enums[DTM] = {
        ...enums[DTM],
        icon: 'mc-icon-Map-DTM',
        parent: 'LayerDemRecord',
        parentDomain: RecordType.RECORD_DEM,
      };
      enums[DSM] = {
        ...enums[DSM],
        icon: 'mc-icon-Map-DSM',
        parent: 'LayerDemRecord',
        parentDomain: RecordType.RECORD_DEM,
      };
      enums[QUANTIZED_MESH_DTM] = {
        ...enums[QUANTIZED_MESH_DTM],
        icon: 'mc-icon-Map-QMesh-DTM',
        parent: 'LayerDemRecord',
        parentDomain: RecordType.RECORD_DEM,
      };
      enums[QUANTIZED_MESH_DSM] = {
        ...enums[QUANTIZED_MESH_DSM],
        icon: 'mc-icon-Map-QMesh-DSM',
        parent: 'LayerDemRecord',
        parentDomain: RecordType.RECORD_DEM,
      };
      enums[QUANTIZED_MESH_DTM_BEST] = {
        ...enums[QUANTIZED_MESH_DTM_BEST],
        icon: 'mc-icon-Map-QMesh-DTM',
        parent: 'QuantizedMeshBestRecord',
        parentDomain: RecordType.RECORD_DEM,
      };
      enums[QUANTIZED_MESH_DSM_BEST] = {
        ...enums[QUANTIZED_MESH_DSM_BEST],
        icon: 'mc-icon-Map-QMesh-DSM',
        parent: 'QuantizedMeshBestRecord',
        parentDomain: RecordType.RECORD_DEM,
      };
      enums[PHOTO_REALISTIC_3D] = {
        ...enums[PHOTO_REALISTIC_3D],
        icon: 'mc-icon-Map-3D',
        parent: 'Layer3DRecord',
        parentDomain: RecordType.RECORD_3D,
      };
      enums[POINT_CLOUD] = {
        ...enums[POINT_CLOUD],
        icon: 'mc-icon-Map-3D',
        parent: 'Layer3DRecord',
        parentDomain: RecordType.RECORD_3D,
      };

      const { UNPUBLISHED } = RecordStatus;

      enums[UNPUBLISHED] = { ...enums[UNPUBLISHED], internal: true };

      setEnumsMap(enums);
    }
  }, [mcEnumsQuery.data, mcEnumsQuery.loading, store.discreteLayersStore]);

  return null;
});
