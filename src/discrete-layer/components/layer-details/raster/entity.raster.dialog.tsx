/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useCallback, useState, useLayoutEffect, useRef, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { FormikValues } from 'formik';
import { cloneDeep, get, isEmpty } from 'lodash';
import { observer } from 'mobx-react';
import { DraftResult } from 'vest/vestResult';
import * as Yup from 'yup';
import { DialogContent } from '@material-ui/core';
import {
  Dialog,
  DialogTitle,
  Icon,
  IconButton,
  Typography
} from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import CONFIG from '../../../../common/config';
import { emphasizeByHTML } from '../../../../common/helpers/formatters';
import { getTextStyle } from '../../../../common/helpers/style';
import { Mode } from '../../../../common/models/mode.enum';
import {
  EntityDescriptorModelType,
  FieldConfigModelType,
  JobModelType,
  LayerRasterRecordModel,
  LayerRasterRecordModelType,
  ProductType,
  RecordStatus,
  RecordType,
  useStore,
  ValidationConfigModelType,
  ValidationValueType
} from '../../../models';
import { ILayerImage } from '../../../models/layerImage';
import { LayerRasterRecordInput } from '../../../models/RootStore.base';
import {
  LayerRasterRecordModelKeys,
  LayerRecordTypes
} from '../entity-types-keys';
import { LayersDetailsComponent } from '../layer-details';
import { FieldInfoName } from '../layer-details.field-info';
import {
  cleanUpEntityPayload,
  clearSyncWarnings,
  filterModeDescriptors,
  getFlatEntityDescriptors,
  getValidationType,
  getYupFieldConfig,
  getBasicType,
  isEnumType,
  jobType2Mode,
  RasterJobTypeEnum
} from '../utils';
import suite from '../validate';
import EntityRasterForm from './layer-details-form.raster';
import { Events } from './state-machine/types';
import { RasterWorkflowProvider, RasterWorkflowContext } from './state-machine/context';
import { getUIIngestionFieldDescriptors } from './utils';

import './entity.raster.dialog.css';

const DEFAULT_ID = 'DEFAULT_UI_ID';
const DEFAULT_TYPE_NAME = 'DEFAULT_TYPE_NAME';
const NONE = 0;
const START = 0;

interface EntityRasterDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  job?: JobModelType;
  setJob?: (job: JobModelType | undefined) => void;
}

interface EntityRasterInnerProps extends EntityRasterDialogProps {
  layerRecord: ILayerImage;
  mode: Mode;
  recordType?: RecordType;
}

const setDefaultValues = (record: Record<string, unknown>, descriptors: EntityDescriptorModelType[]): void => {
  getFlatEntityDescriptors(
    record.__typename as LayerRecordTypes ?? 'LayerRasterRecord',
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

export const buildRasterRecord = (descriptors: EntityDescriptorModelType[]): ILayerImage => {
  const record = {} as Record<string, unknown>;
  LayerRasterRecordModelKeys.forEach((key) => {
    record[key as string] = undefined;
  });
  setDefaultValues(record, descriptors);
  record.productType = ProductType.ORTHOPHOTO;
  record.productStatus = RecordStatus.UNPUBLISHED;
  record['__typename'] = LayerRasterRecordModel.properties['__typename'].name.replaceAll('"','');
  record.id = DEFAULT_ID;
  record.type = RecordType.RECORD_RASTER;
  return record as unknown as ILayerImage;
};

export const EntityRasterDialog: React.FC<EntityRasterDialogProps> = observer((props: EntityRasterDialogProps) => {

  const store = useStore();

  const { job } = props;

  const determineIsUpdateMode = (job: JobModelType | undefined): boolean => {
    if (job) {
      const type = job.type || RasterJobTypeEnum.NEW;
      return jobType2Mode[type] === Mode.UPDATE;
    }

    return store.discreteLayersStore.selectedLayerOperationMode === Mode.UPDATE;
  };

  const getRecordLayer = (jobObj: JobModelType | undefined): ILayerImage => {
    const { selectedLayer, entityDescriptors, findRasterUniqueLayer } = store.discreteLayersStore;

    // 1. START_NEW mode - always return empty base layer
    if (!determineIsUpdateMode(jobObj)) { 
      return buildRasterRecord(entityDescriptors as EntityDescriptorModelType[]);
    }

    // 2. RESTORE mode - Try to get the matching layer
    if (jobObj?.resourceId && jobObj.productType) {
      const layerRecord = cloneDeep(findRasterUniqueLayer(jobObj?.resourceId, jobObj.productType));

      if (layerRecord) { return layerRecord; }
    }

    // 3. START_UPDATE mode - return the currently selected layer
    if (selectedLayer) { return selectedLayer; }

    // 4. Fallback (should rarely happen) - return record for START_NEW mode
    return buildRasterRecord(entityDescriptors as EntityDescriptorModelType[]);
  };

  return (
    <RasterWorkflowProvider>
      <EntityRasterDialogInner
        {...props}
        layerRecord={getRecordLayer(job)}
        mode={determineIsUpdateMode(job) ? Mode.UPDATE : Mode.NEW}
        recordType={RecordType.RECORD_RASTER}
      />
    </RasterWorkflowProvider>
  );
});

const EntityRasterDialogInner: React.FC<EntityRasterInnerProps> = observer((props: EntityRasterInnerProps) => {

    //#region STATE MACHINE
    const actorRef = RasterWorkflowContext.useActorRef();

    // Subscribe to state using a selector
    const state = RasterWorkflowContext.useSelector((s) => s);

    const { isOpen, onSetOpen, job, setJob, mode, layerRecord } = props;

    const isUpdateMode = () => mode === Mode.UPDATE;

    useEffect(() => {
      if (!actorRef) return;

      if (job) {
        actorRef.send({
          type: 'RESTORE',
          job: { jobId: job.id }
        } satisfies Events);
      } else if (isUpdateMode()) {
        actorRef.send({
          type: 'START_UPDATE',
          updatedLayer: layerRecord as LayerRasterRecordModelType
        } satisfies Events);
      } else {
        actorRef.send({
          type: 'START_NEW',
          flowType: Mode.NEW,
          selectionMode: CONFIG.SELECTION_MODE_DEFAULT === '' ? 'auto' : CONFIG.SELECTION_MODE_DEFAULT
        } satisfies Events);
      }
    }, [mode, layerRecord, actorRef]);
    //#endregion

    const store = useStore();
    const intl = useIntl();
    const dialogContainerRef = useRef<HTMLDivElement>(null);

    const [recordType] = useState<RecordType>(props.recordType ?? (layerRecord.type as RecordType));
    const [vestValidationResults, setVestValidationResults] = useState<DraftResult>({} as DraftResult);
    const [descriptors, setDescriptors] = useState<unknown[]>([]);
    const [schema, setSchema] = useState<Record<string, Yup.AnySchema>>({});
    const [inputValues, setInputValues] = useState<FormikValues>({});
    const [isAllInfoReady, setIsAllInfoReady] = useState<boolean>(false);

    const typedEntityDescriptors = store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[];

    const metadataPayloadKeys = useMemo(() => {
      return getFlatEntityDescriptors(
        layerRecord.__typename,
        typedEntityDescriptors
      )
      .filter(descriptor => descriptor.isCreateEssential || descriptor.fieldName === 'id')
      .map(descriptor => descriptor.fieldName);
    }, [typedEntityDescriptors]);

    const dialogTitleParam = recordType;
    const dialogTitleParamTranslation = intl.formatMessage({
      id: `record-type.${(dialogTitleParam as string).toLowerCase()}.label`,
    });
    const dialogTitle = intl.formatMessage(
      { id: `general.title.${(mode).toLowerCase()}` },
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
      if (vestValidationResults.errorCount === NONE) {
        const { __typename, ...metadata } = inputValues;
        const data = cleanUpEntityPayload(metadata, metadataPayloadKeys as string[]) as unknown as LayerRasterRecordInput;
        const resolutionDegree = metadata.resolutionDegree as number;
        actorRef.send({ type: 'SUBMIT', data, resolutionDegree } satisfies Events);
      }
    }, [vestValidationResults]);

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
        filterModeDescriptors(mode as unknown as Mode, typedEntityDescriptors)
      );

      const uiIngestionFieldDescriptors = getUIIngestionFieldDescriptors(typedEntityDescriptors);

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
      if (job) {
        setJob?.(undefined);
      }
      store.discreteLayersStore.resetUpdateMode();
      clearSyncWarnings();
    }, [onSetOpen, store.discreteLayersStore]);

    const UpdateLayerHeader = (): JSX.Element => {
      return (
        <Box id="updateLayerHeader">
          <Box id="updateLayerHeaderContent">
            <LayersDetailsComponent
              className="detailsPanelProductView"
              entityDescriptors={typedEntityDescriptors}
              layerRecord={layerRecord}
              isBrief={true}
              mode={Mode.VIEW}
            />
          </Box>
          { 
            state.context.selectionMode === 'restore' &&
            state.context.flowType === Mode.UPDATE &&
            <Box className='lockedIcon'>
              <Icon icon={{ icon: 'lock', size: 'xlarge' }} />
              <Typography tag="span">{ intl.formatMessage({ id: 'general.title.locked' }) }</Typography>
            </Box>
          }
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
              isUpdateMode() &&
              <UpdateLayerHeader />
            }
            {
              isAllInfoReady && (
              <EntityRasterForm
                mode={mode}
                entityDescriptors={typedEntityDescriptors}
                recordType={recordType}
                // For fields that need to be changed in update. See "getRecordForUpdate()"
                layerRecord={layerRecord}
                yupSchema={Yup.object({
                  ...schema,
                })}
                onSubmit={(values): void => {
                  setInputValues(values);
                  // eslint-disable-next-line
                  const vestSuite = suite(
                    descriptors as FieldConfigModelType[],
                    values
                  );
                  // eslint-disable-next-line
                  setVestValidationResults(get(vestSuite, "get")()) ;
                }}
                vestValidationResults={vestValidationResults}
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
