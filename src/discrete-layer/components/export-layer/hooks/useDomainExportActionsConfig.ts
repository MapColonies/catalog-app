import { useContext, useEffect, useMemo, useState } from 'react';
import { get, isEmpty } from 'lodash';
import EnumsMapContext, { IEnumsMapType } from '../../../../common/contexts/enumsMap.context';
import { RecordType, useStore } from '../../../models';
import { TabViews } from '../../../views/tab-views';
import { IAction } from '../../../../common/actions/entity.actions';
import lookupTablesContext, {
  ILookupOption,
} from '../../../../common/contexts/lookupTables.context';
import { HOT_AREAS_TABLES_KEY } from '../../../views/components/data-fetchers/lookup-tables-fetcher.component';
import { Feature } from 'geojson';
import { useIntl } from 'react-intl';

export enum ExportActions {
  DRAW_RECTANGLE = 'export-draw-rectangle',
  DRAW_FOOTPRINT = 'export-draw-footprint',
  DRAW_POLYGON = 'export-draw-polygon',
  DRAW_BY_COORDINATES = 'export-draw-coordinates',
  CLEAR_DRAWINGS = 'export-clear-drawings',
  IMPORT_FROM_SHAPE_FILE = 'import-from-shape-file',
  TOGGLE_FULL_LAYER_EXPORT = 'toggle-full-layer-export',
  OPEN_HOT_AREAS_MENU = 'export-open-hot-areas-menu',
  EXPORT_HOT_AREA_SELECTION = 'export-hot_area_selection',
  END_EXPORT_SESSION = 'end_export_session',
}

export type ExportAction =
  | (IAction & {
      toggleExportStoreFieldOptions?: {
        field: string;
        labelChecked: string;
        labelUnchecked: string;
      };
      menuActionOptions?: {
        items: Map<string, unknown>;
        dispatchOnItemClick: {
          action: ExportActions;
          data?: unknown;
        };
      };
    })
  | 'SEPARATOR';

const EXPORT_ACTIONS: ExportAction[] = [
  {
    action: ExportActions.TOGGLE_FULL_LAYER_EXPORT,
    frequent: true,
    symbol: {},
    toggleExportStoreFieldOptions: {
      field: 'isFullLayerExportEnabled',
      labelChecked: 'action.export.full-layer.label',
      labelUnchecked: 'action.export.full-layer.label',
    },
    title: {
      translationId: 'action.export.full-layer.tooltip',
    },
    disabled: false,
    views: [TabViews.EXPORT_LAYER],
  },
  'SEPARATOR',
  {
    action: ExportActions.DRAW_FOOTPRINT,
    frequent: true,
    symbol: {
      class: 'mc-icon-Map-Orthophoto',
    },
    title: {
      translationId: 'action.export.footprint.tooltip',
    },
    disabled: false,
    views: [TabViews.EXPORT_LAYER],
  },
  {
    action: ExportActions.DRAW_RECTANGLE,
    frequent: true,
    symbol: {
      class: 'mc-icon-Rectangle',
    },
    title: {
      translationId: 'action.export.box.tooltip',
    },
    disabled: false,
    views: [TabViews.EXPORT_LAYER],
  },
  {
    action: ExportActions.DRAW_POLYGON,
    frequent: true,
    symbol: {
      class: 'mc-icon-Polygon',
    },
    title: {
      translationId: 'action.export.polygon.tooltip',
    },
    disabled: false,
    views: [TabViews.EXPORT_LAYER],
  },
  {
    action: ExportActions.DRAW_BY_COORDINATES,
    frequent: true,
    symbol: {
      class: 'mc-icon-Coordinates',
    },
    title: {
      translationId: 'action.export.bbox-corners.tooltip',
    },
    disabled: false,
    views: [TabViews.EXPORT_LAYER],
  },
  {
    action: ExportActions.IMPORT_FROM_SHAPE_FILE,
    frequent: true,
    symbol: {
      class: 'mc-icon-Upload',
    },
    title: {
      translationId: 'action.export.import-shape.tooltip',
    },
    disabled: false,
    views: [TabViews.EXPORT_LAYER],
  },
  {
    action: ExportActions.OPEN_HOT_AREAS_MENU,
    frequent: true,
    symbol: {
      class: 'mc-icon-Predefined-AOIs',
    },
    title: {
      translationId: 'action.export.select-hot-area.tooltip',
    },
    menuActionOptions: {
      items: new Map<string, unknown>(),
      dispatchOnItemClick: {
        action: ExportActions.EXPORT_HOT_AREA_SELECTION,
      },
    },
    disabled: false,
    views: [TabViews.EXPORT_LAYER],
  },
  'SEPARATOR',
  {
    action: ExportActions.CLEAR_DRAWINGS,
    frequent: true,
    symbol: {
      class: 'mc-icon-Delete',
    },
    title: {
      translationId: 'action.clear.tooltip',
    },
    disabled: false,
    views: [TabViews.EXPORT_LAYER],
  },
];

/**
 * Used to set export actions general config per domain.
 * Returns export action list based on the state and domain specific conditions.
 */
const useDomainExportActionsConfig = (): ExportAction[] => {
  const store = useStore();
  const intl = useIntl();
  const {
    exportStore: {
      layerToExport,
      geometrySelectionsCollection,
      isFullLayerExportEnabled,
      setIsMultiSelectionAllowed,
    },
  } = store;
  const { enumsMap } = useContext(EnumsMapContext);
  const { lookupTablesData } = useContext(lookupTablesContext);
  const enums = enumsMap as IEnumsMapType;
  const layerRecordType = useMemo(
    () => get(enums, layerToExport?.productType as string).parentDomain as RecordType,
    [layerToExport]
  );

  const selectionsFeatures = geometrySelectionsCollection.features;

  const initExportActions = useMemo((): ExportAction[] => {
    const initializedActions = [...EXPORT_ACTIONS].map((action) => {
      if (action === 'SEPARATOR') return action;

      if (action.menuActionOptions) {
        switch (action.action) {
          case ExportActions.OPEN_HOT_AREAS_MENU: {
            if (!lookupTablesData?.dictionary) {
              return action;
            }

            const hotAreasTable =
              (lookupTablesData.dictionary[HOT_AREAS_TABLES_KEY] as ILookupOption[] | undefined) ??
              [];
            const hotAreasMenuItems = new Map<string, Feature>();

            for (const hotAreaOption of hotAreasTable) {
              const areaTranslation = intl.formatMessage({ id: hotAreaOption.translationCode });
              hotAreasMenuItems.set(areaTranslation, hotAreaOption.properties.footprint as Feature);
            }

            return {
              ...action,
              menuActionOptions: { ...action.menuActionOptions, items: hotAreasMenuItems },
            };
          }

          default:
            return action;
        }
      }

      return action;
    });

    return initializedActions;
  }, []);

  const [domainActionList, setDomainActionList] = useState<ExportAction[]>(initExportActions);

  useEffect(() => {
    switch (layerRecordType) {
      case RecordType.RECORD_RASTER: {
        // Multi selection is allowed.
        // While there is at least one selection, full export should be disabled.
        // If full export ticked, all other drawing actions should be disabled.

        const multiSelectionAllowed = true;
        setIsMultiSelectionAllowed(multiSelectionAllowed);

        const newActionList = domainActionList.map((action) => {
          if (action === 'SEPARATOR' || action.action === ExportActions.CLEAR_DRAWINGS)
            return action;
          const rasterClass: string =
            action.action === ExportActions.DRAW_FOOTPRINT
              ? 'mc-icon-Map-Orthophoto'
              : action.symbol.class ?? '';
          const rasterAction: ExportAction = { ...action, symbol: { class: rasterClass } };

          if (!isEmpty(selectionsFeatures)) {
            if (
              action.action === ExportActions.TOGGLE_FULL_LAYER_EXPORT &&
              !isFullLayerExportEnabled
            ) {
              return { ...rasterAction, disabled: true };
            }

            if (isFullLayerExportEnabled) {
              return {
                ...rasterAction,
                disabled: action.action !== ExportActions.TOGGLE_FULL_LAYER_EXPORT,
              };
            }

            return { ...rasterAction, disabled: !multiSelectionAllowed };
          } else {
            return { ...rasterAction, disabled: false };
          }
        });

        setDomainActionList(newActionList);

        break;
      }
      case RecordType.RECORD_3D: {
        // Only full export is allowed, all other actions are disabled. (including clear selections and full export.)
        // Full export toggle should be ticked automatically.

        const multiSelectionAllowed = false;
        setIsMultiSelectionAllowed(multiSelectionAllowed);

        const newActionList = domainActionList.map((action) => {
          if (action === 'SEPARATOR') return action;

          const action3DClass: string =
            action.action === ExportActions.DRAW_FOOTPRINT
              ? 'mc-icon-Map-3D'
              : action.symbol.class ?? '';
          const action3D: ExportAction = { ...action, symbol: { class: action3DClass } };

          return { ...action3D, disabled: true };
        });

        setDomainActionList(newActionList);

        break;
      }
      case RecordType.RECORD_DEM: {
        // Multi selection is not allowed.
        // After the first selection all drawing actions should be disabled.

        const multiSelectionAllowed = false;
        setIsMultiSelectionAllowed(multiSelectionAllowed);

        const newActionList = domainActionList.map((action) => {
          if (action === 'SEPARATOR' || action.action === ExportActions.CLEAR_DRAWINGS)
            return action;
          const demClass: string =
            action.action === ExportActions.DRAW_FOOTPRINT
              ? 'mc-icon-Map-DTM'
              : action.symbol.class ?? '';
          const demAction: ExportAction = { ...action, symbol: { class: demClass } };

          if (!isEmpty(selectionsFeatures)) {
            if (
              action.action === ExportActions.TOGGLE_FULL_LAYER_EXPORT &&
              !isFullLayerExportEnabled
            ) {
              return { ...demAction, disabled: true };
            }

            if (isFullLayerExportEnabled) {
              return {
                ...demAction,
                disabled: action.action !== ExportActions.TOGGLE_FULL_LAYER_EXPORT,
              };
            }

            return { ...demAction, disabled: !multiSelectionAllowed };
          } else {
            return { ...demAction, disabled: false };
          }
        });

        setDomainActionList(newActionList);

        break;
      }

      default:
        break;
    }
  }, [layerRecordType, geometrySelectionsCollection]);

  return domainActionList;
};

export default useDomainExportActionsConfig;
