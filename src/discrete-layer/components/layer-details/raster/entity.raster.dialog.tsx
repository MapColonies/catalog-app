/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useCallback, useState, useLayoutEffect, useRef, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { cloneDeep, isEmpty } from 'lodash';
import * as Yup from 'yup';
import { DialogContent } from '@material-ui/core';
import { Dialog, DialogTitle, IconButton } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { emphasizeByHTML } from '../../../../common/helpers/formatters';
import { getTextStyle } from '../../../../common/helpers/style';
import { Mode } from '../../../../common/models/mode.enum';
import {
  EntityDescriptorModelType,
  LayerMetadataMixedUnion,
  LayerRasterRecordModel,
  RecordType,
  useStore,
  ValidationConfigModelType,
  FieldConfigModelType,
  ProductType,
  ValidationValueType,
  RecordStatus
} from '../../../models';
import { ILayerImage } from '../../../models/layerImage';
import { LayerRasterRecordInput } from '../../../models/RootStore.base';
import {
  LayerRasterRecordModelKeys,
  LayerRecordTypes,
} from '../entity-types-keys';
import { LayersDetailsComponent } from '../layer-details';
import { FieldInfoName } from '../layer-details.field-info';
import {
  clearSyncWarnings,
  filterModeDescriptors,
  getFlatEntityDescriptors,
  getValidationType,
  getYupFieldConfig,
  getBasicType,
  isEnumType,
  cleanUpEntityPayload
} from '../utils';
import EntityRasterForm from './layer-details-form.raster';
import { Events } from './state-machine/types';
import { RasterWorkflowProvider, RasterWorkflowContext } from './state-machine/context';
import { getUIIngestionFieldDescriptors } from './utils';

import './entity.raster.dialog.css';

const DEFAULT_ID = 'DEFAULT_UI_ID';
const DEFAULT_TYPE_NAME = 'DEFAULT_TYPE_NAME';
const START = 0;

interface EntityRasterDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  recordType?: RecordType;
  layerRecord?: ILayerImage | null;
  isSelectedLayerUpdateMode?: boolean;
}

const setDefaultValues = (record: Record<string, unknown>, descriptors: EntityDescriptorModelType[]): void => {
  getFlatEntityDescriptors(
    record['__typename'] as LayerRecordTypes,
    descriptors
  ).forEach((field) => {
      const fieldName = field.fieldName as string;
      const fieldNameType = getBasicType(field.fieldName as FieldInfoName, DEFAULT_TYPE_NAME);
      if ((field.lookupTable || isEnumType(fieldNameType))) {
        if (field.isMultiSelection) {
          record[fieldName] = [];
        } else {
          record[fieldName] = '';
        }
      }
      if (field.default) {
        record[fieldName] = field.default;
      }
    }
  )
};

export const buildRecord = (recordType: RecordType, descriptors: EntityDescriptorModelType[]): ILayerImage => {
  const record = {} as Record<string, unknown>;
  
  LayerRasterRecordModelKeys.forEach((key) => {
    record[key as string] = undefined;
  });

  setDefaultValues(record, descriptors);
  
  record.productType = ProductType.ORTHOPHOTO;
  record.productStatus = RecordStatus.UNPUBLISHED;
  record['__typename'] = LayerRasterRecordModel.properties['__typename'].name.replaceAll('"','');
  record.id = DEFAULT_ID;
  record.type = recordType;

  return record as unknown as ILayerImage;
};

export const EntityRasterDialog: React.FC<EntityRasterDialogProps> = (props: EntityRasterDialogProps) => {
  return (
    <RasterWorkflowProvider>
      <EntityRasterDialogInner {...props} />
    </RasterWorkflowProvider>
  );
};

export const EntityRasterDialogInner: React.FC<EntityRasterDialogProps> = observer((props: EntityRasterDialogProps) => {

    //#region STATE MACHINE
    const actorRef = RasterWorkflowContext.useActorRef();

    // Subscribe to state using a selector
    const state = RasterWorkflowContext.useSelector((s) => s);

    useEffect(() => {
      if (actorRef) {
        actorRef.send({
          type: 'START',
          flowType: (props.isSelectedLayerUpdateMode && props.layerRecord) ? Mode.UPDATE : Mode.NEW,
          autoMode: 'auto'
        } satisfies Events);
      }
    }, [props.isSelectedLayerUpdateMode, props.layerRecord, actorRef]);
    //#endregion

    const store = useStore();
    const intl = useIntl();
    const dialogContainerRef = useRef<HTMLDivElement>(null);
    const { isOpen, onSetOpen } = props;   
    const [recordType] = useState<RecordType>(props.recordType ?? (props.layerRecord?.type as RecordType));
    const mode = state.context.flowType ?? Mode.NEW;
    const [layerRecord] = useState<LayerMetadataMixedUnion>(
      props.layerRecord && mode !== Mode.UPDATE
        ? cloneDeep(props.layerRecord)
        : buildRecord(recordType, store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[])
    );
    const [descriptors, setDescriptors] = useState<unknown[]>([]);
    const [schema, setSchema] = useState<Record<string, Yup.AnySchema>>({});
    const [isAllInfoReady, setIsAllInfoReady] = useState<boolean>(false);

    const metadataPayloadKeys = useMemo(() => {
      return getFlatEntityDescriptors(
        'LayerRasterRecord',
        store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]
      )
      .filter(descriptor => descriptor.isCreateEssential || descriptor.fieldName === 'id')
      .map(descriptor => descriptor.fieldName);
    }, [store.discreteLayersStore.entityDescriptors]);

    const dialogTitleParam = recordType;
    const dialogTitleParamTranslation = intl.formatMessage({
      id: `record-type.${(dialogTitleParam as string).toLowerCase()}.label`,
    });
    const dialogTitle = intl.formatMessage(
      { id: `general.title.${(mode as string).toLowerCase()}` },
      { value: dialogTitleParamTranslation }
    );

    const addDescriptorValidations = (desciptors: FieldConfigModelType[]): FieldConfigModelType[] => {
      return desciptors.map(
        (field: FieldConfigModelType) => {
          return {
            ...field,
            validation: field.validation?.map(
              (val: ValidationConfigModelType) => {
                const firstParam = intl.formatMessage({ id: field.label });
                const paramType = getValidationType(val) ?? '';
                // @ts-ignore
                // eslint-disable-next-line
                const paramValue: string = val[paramType] ?? '';
                let secondParam = '';
                if (paramType !== '' && paramValue !== '') {
                  if (val.valueType === ValidationValueType.FIELD) {
                    const fieldLabel = field.label as string;
                    const fieldLabelPrefix = fieldLabel.substring(
                      START,
                      fieldLabel.lastIndexOf('.')
                    );
                    secondParam = intl.formatMessage({
                      id: `${fieldLabelPrefix}.${paramValue}`,
                    });
                  } else {
                    secondParam = paramValue;
                  }
                }
                const finalMsg = intl.formatMessage(
                  { id: val.errorMsgCode },
                  {
                    fieldName: emphasizeByHTML(`${firstParam}`),
                    value: emphasizeByHTML(`${secondParam}`),
                  }
                );
                return (secondParam !== '$NOW') ? {
                  ...val,
                  errorMsgTranslation: finalMsg,
                } : undefined;
              }
            ),
          };
        }
      );
    };

    useEffect(() => {
      if (!isEmpty(descriptors) && !isEmpty(layerRecord)) {
        setIsAllInfoReady(true);
      }
    }, [descriptors, layerRecord]);

    useLayoutEffect(() => {
      const CONTENT_HEIGHT_VAR_NAME = '--content-height';
      /* eslint-disable */
      if (dialogContainerRef.current !== null) {
        const baseContentHeight = getComputedStyle(dialogContainerRef.current).getPropertyValue('--base-content-height');
        const currentIngestionFieldsHeight = getComputedStyle(dialogContainerRef.current).getPropertyValue('--ingestion-fields-height');
        const currentUpdateHeaderHeight = getComputedStyle(dialogContainerRef.current).getPropertyValue('--update-layer-header-height');
  
        switch(mode) {
          case Mode.NEW:
            dialogContainerRef.current.style.setProperty(CONTENT_HEIGHT_VAR_NAME, `calc(${baseContentHeight} - ${currentIngestionFieldsHeight})`);
            break;
          case Mode.UPDATE:
            dialogContainerRef.current.style.setProperty(CONTENT_HEIGHT_VAR_NAME, `calc(${baseContentHeight} - ${currentUpdateHeaderHeight} - ${currentIngestionFieldsHeight})`);        
            break;
          default:
            dialogContainerRef.current.style.setProperty(CONTENT_HEIGHT_VAR_NAME, baseContentHeight);
            break;
        }
      }
    }, [mode, dialogContainerRef.current]);
            
    useEffect(() => {
      const descriptors = getFlatEntityDescriptors(
        layerRecord.__typename,
        filterModeDescriptors(mode as unknown as Mode, store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[])
      );

      const uiIngestionFieldDescriptors = getUIIngestionFieldDescriptors(store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const yupSchema: Record<string, any> = {};
      [
        ...uiIngestionFieldDescriptors,
        ...descriptors
      ].forEach((field) => {
        const fieldName: string = field.fieldName as string;
        switch (mode) {
          case Mode.NEW:
          case Mode.UPDATE:
            if ((field.isRequired as boolean) && field.isAutoGenerated !== true) {
              yupSchema[fieldName] = getYupFieldConfig(field, intl);
            }
            break;
          default:
            break;
        }
      });

      setSchema(yupSchema);

      const desc = addDescriptorValidations([ ...descriptors ]);

      setDescriptors(desc as any[]);
    }, []);

    const closeDialog = useCallback(() => {
      onSetOpen(false);
      store.discreteLayersStore.resetUpdateMode();
      clearSyncWarnings();
    }, [onSetOpen, store.discreteLayersStore]);

    const UpdateLayerHeader = (): JSX.Element => {
      return (
        <Box id="updateLayerHeader">
          <Box id="updateLayerHeaderContent">
            <LayersDetailsComponent
              className="detailsPanelProductView"
              entityDescriptors={
                store.discreteLayersStore
                  .entityDescriptors as EntityDescriptorModelType[]
              }
              layerRecord={props.layerRecord}
              isBrief={true}
              mode={Mode.VIEW}
            />
          </Box>
        </Box>
      );
    };

    return (
      <div id="entityRasterDialog" ref={dialogContainerRef}>
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogTitle style={mode !== Mode.NEW ? getTextStyle(layerRecord as any, 'backgroundColor') : undefined}>
            {dialogTitle}
            <IconButton
              className="closeIcon mc-icon-Close"
              label="CLOSE"
              onClick={(): void => {
                closeDialog();
              }}
            />
          </DialogTitle>
          <DialogContent className="dialogBody">
            {
              mode === Mode.UPDATE &&
              <UpdateLayerHeader />
            }
            {
              isAllInfoReady && (
              <EntityRasterForm
                mode={mode}
                entityDescriptors={
                  store.discreteLayersStore
                    .entityDescriptors as EntityDescriptorModelType[]
                }
                recordType={recordType}
                layerRecord={
                  mode === Mode.UPDATE
                    ? {...props.layerRecord} as LayerMetadataMixedUnion : layerRecord
                }
                yupSchema={Yup.object({
                  ...schema,
                })}
                onSubmit={(values): void => {
                  const data = cleanUpEntityPayload(values, metadataPayloadKeys as string[]) as unknown as LayerRasterRecordInput;
                  const resolutionDegree = values.resolutionDegree as number;
                  actorRef.send({ type: 'SUBMIT', data, resolutionDegree } satisfies Events);
                }}
                closeDialog={closeDialog}
                customErrorReset={store.discreteLayersStore.clearCustomValidationError}
                customError={store.discreteLayersStore.customValidationError}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);
