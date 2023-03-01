import { RCesiumEntityProps } from "@map-colonies/react-components";
import { get } from "lodash";
import { useCallback, useContext, useMemo } from "react";
import EnumsMapContext, { IEnumsMapType } from "../../../../common/contexts/enumsMap.context";
import { RecordType, useStore } from "../../../models";

const useGetEntityLabelForDomain = (): (item: RCesiumEntityProps) => string => {
    const {exportStore: { layerToExport }} = useStore();
    const { enumsMap } = useContext(EnumsMapContext);
    const enums = enumsMap as IEnumsMapType;
    const layerRecordType = useMemo(() => get(enums, `${layerToExport?.productType as string}.parentDomain`) as unknown as RecordType, [layerToExport]);

    const getEntityLabel = useCallback((item: RCesiumEntityProps): string => {
        /* eslint-disable */
        switch(layerRecordType) {
            case RecordType.RECORD_RASTER: 
            case RecordType.RECORD_DEM: 
                return item.properties?.resolution.getValue().toString() as string | null ?? '';
            default:
                return '';
            }
        /* eslint-enable */
    }, [layerRecordType]);

    return getEntityLabel;
}

export default useGetEntityLabelForDomain;