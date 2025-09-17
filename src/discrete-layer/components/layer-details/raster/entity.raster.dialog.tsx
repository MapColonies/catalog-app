/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useCallback, useState, useLayoutEffect, useRef, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { FormikValues } from 'formik';
import { cloneDeep, get, isEmpty } from 'lodash';
// import moment from 'moment';
import * as Yup from 'yup';
import { DraftResult } from 'vest/vestResult';
import { DialogContent } from '@material-ui/core';
import { Dialog, DialogTitle, IconButton } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { emphasizeByHTML } from '../../../../common/helpers/formatters';
import { getTextStyle } from '../../../../common/helpers/style';
import { Mode } from '../../../../common/models/mode.enum';
import { removePropertiesWithPrefix } from '../../../../common/helpers/object';
import {
  EntityDescriptorModelType,
  LayerMetadataMixedUnion,
  LayerRasterRecordModel,
  RecordType,
  useQuery,
  useStore,
  ValidationConfigModelType,
  FieldConfigModelType,
  ProductType,
  ValidationValueType,
  LayerRasterRecordModelType,
  RecordStatus
} from '../../../models';
import { IDispatchAction } from '../../../models/actionDispatcherStore';
import { ILayerImage } from '../../../models/layerImage';
import { LayerRasterRecordInput, PolygonPartRecordInput } from '../../../models/RootStore.base';
import { UserAction } from '../../../models/userStore';
import {
  FieldConfigModelKeys,
  LayerRasterRecordModelKeys,
  LayerRecordTypes,
} from '../entity-types-keys';
import { LayersDetailsComponent } from '../layer-details';
import { FieldInfoName, IRecordFieldInfo } from '../layer-details.field-info';
import EntityRasterForm from './layer-datails-form.raster';
import {
  clearSyncWarnings,
  cleanUpEntityPayload,
  filterModeDescriptors,
  getFlatEntityDescriptors,
  getValidationType,
  getYupFieldConfig,
  getBasicType,
  isEnumType
} from '../utils';
import suite from '../validate';
import { getUIIngestionFieldDescriptors } from './ingestion.utils';
import { RasterWorkflowProvider, RasterWorkflowContext } from './state-machine-context.raster';
import { hasLoadingTagDeep } from './state-machine.raster';

import './entity.raster.dialog.css';

const DEFAULT_ID = 'DEFAULT_UI_ID';
const DEFAULT_TYPE_NAME = 'DEFAULT_TYPE_NAME';
const NONE = 0;
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
      if (field.default){
        record[fieldName] = field.default;
      }
    }
  )
};

export const NESTED_FORMS_PRFIX = 'polygonPart_';

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

const buildFieldInfo = (): IRecordFieldInfo => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recordFieldInfo = {} as Record<string, any>;
  FieldConfigModelKeys.forEach((key) => {
    recordFieldInfo[key as string] = undefined;
  });
  return recordFieldInfo as IRecordFieldInfo;
};

const getLabel = (recordType: RecordType): string => {
  if (recordType === RecordType.RECORD_3D) {
    return 'field-names.3d.fileNames';
  }
  return 'field-names.ingestion.fileNames';
};


export const EntityRasterDialog: React.FC<EntityRasterDialogProps> = (props: EntityRasterDialogProps) => {
  return (
    <RasterWorkflowProvider>
      <EntityRasterDialogInner {...props} />
    </RasterWorkflowProvider>
  );
}

export const EntityRasterDialogInner: React.FC<EntityRasterDialogProps> = observer(
  (props: EntityRasterDialogProps) => {

    const actorRef = RasterWorkflowContext.useActorRef();

    // Subscribe to state using a selector
    const state = RasterWorkflowContext.useSelector((s) => s);

    const isLoading = hasLoadingTagDeep(actorRef?.getSnapshot());

    useEffect(() => {
      if (props.isSelectedLayerUpdateMode && props.layerRecord && actorRef) {
        actorRef.send({ type: "START_UPDATE" });
      } else {
        actorRef.send({ type: "START_NEW"});
        // actorRef.send({ type: "RESTORE", jobId: 'KUKU_JOB' });
      }
      console.log(
        "****** PARENT CHANGE FLOWTYPE(props.isSelectedLayerUpdateMode) *******",
        props.isSelectedLayerUpdateMode
      );
    }, [props.isSelectedLayerUpdateMode, props.layerRecord, actorRef]);
  

    const store = useStore();
    const intl = useIntl();
    const mutationQuery = useQuery();

    const dialogContainerRef = useRef<HTMLDivElement>(null);

    const decideMode = useCallback(() => {
      return (props.isSelectedLayerUpdateMode === true && props.layerRecord) ? Mode.UPDATE : Mode.NEW;
    }, []);

    const { isOpen, onSetOpen } = props;   
    const [recordType] = useState<RecordType>(props.recordType ?? (props.layerRecord?.type as RecordType));
    const [mode] = useState<Mode>(decideMode());
    const [layerRecord] = useState<LayerMetadataMixedUnion>(
      props.layerRecord && mode !== Mode.UPDATE
        ? cloneDeep(props.layerRecord)
        : buildRecord(recordType, store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[])
    );
    const [vestValidationResults, setVestValidationResults] = useState<
      Record<string,DraftResult>
    >({} as Record<string,DraftResult>);
    const [isSubmittedForm, setIsSubmittedForm] = useState(false);
    
    const [descriptors, setDescriptors] = useState<unknown[]>([]);
    const [schema, setSchema] = useState<Record<string, Yup.AnySchema>>({});
    const [inputValues, setInputValues] = useState<FormikValues>({});
    const [isAllInfoReady, setIsAllInfoReady] = useState<boolean>(false);
    const queryGetProduct = useQuery<{getProduct: LayerMetadataMixedUnion | null}>();
    const polygonPartsPayloadKeys = useMemo(
      () => {
        return getFlatEntityDescriptors(
          'PolygonPartRecord',
          store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]
        )
        .filter(descriptor => !descriptor.isAutoGenerated)
        .map(descriptor => descriptor.fieldName);
      },
      [store.discreteLayersStore.entityDescriptors]);
    const metadataPayloadKeys = useMemo(
      () => {
        return getFlatEntityDescriptors(
          'LayerRasterRecord',
          store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]
        )
        .filter(descriptor => descriptor.isCreateEssential || descriptor.fieldName === 'id')
        .map(descriptor => descriptor.fieldName);
      },
      [store.discreteLayersStore.entityDescriptors]);
    
    const dialogTitleParam = recordType;
    const dialogTitleParamTranslation = intl.formatMessage({
      id: `record-type.${(dialogTitleParam as string).toLowerCase()}.label`,
    });
    const dialogTitle = intl.formatMessage(
      { id: `general.title.${(mode as string).toLowerCase()}` },
      { value: dialogTitleParamTranslation }
    );

    const addDescriptorValidations = (desciptors: FieldConfigModelType[]): FieldConfigModelType[] =>{
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
    }

    const dispatchAction = (action: Record<string,unknown>): void => {
      store.actionDispatcherStore.dispatchAction(
        {
          action: action.action,
          data: action.data,
        } as IDispatchAction
      );
    };

    const preparePartsDataPayload = (metadata: Record<string,unknown>) : Record<string,unknown>[] => {
      const partsData = [];
      for (const [fieldName, partObj] of Object.entries(metadata)) {
        if (fieldName.indexOf(NESTED_FORMS_PRFIX) > -1) {
          //build partData array with injected resolutions
          const cleanedPayloadEntity = cleanUpEntityPayload(partObj as Record<string,unknown>, polygonPartsPayloadKeys as string[]);
          partsData.push({
            ...cleanedPayloadEntity,
            resolutionDegree: (metadata as any).resolutionDegree,
            resolutionMeter: (metadata as any).resolutionMeter,
          });
        }
      }
      return partsData;
    }
    
    const handleIngestQueries = (): void => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { directory, fileNames, __typename, ...metadata } = inputValues;
      switch (recordType) {
        case RecordType.RECORD_RASTER:
          mutationQuery.setQuery(
            store.mutateStartRasterIngestion({
              data: {
                directory: directory as string,
                fileNames: (fileNames as string).split(','),
                partsData: [...preparePartsDataPayload(metadata)] as PolygonPartRecordInput[],
                metadata: cleanUpEntityPayload(metadata, metadataPayloadKeys as string[]) as unknown as LayerRasterRecordInput,
                type: RecordType.RECORD_RASTER,
              },
            })
          );
          break;
        default:
          break;
      }
    };

    const handleUpdateQueries = (): void => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { directory, fileNames, __typename, ...metadata } = inputValues;
      if (recordType === RecordType.RECORD_RASTER) {
        mutationQuery.setQuery(
          store.mutateStartRasterUpdateGeopkg({
            data: {
              directory: directory as string,
              fileNames: (fileNames as string).split(','),
              partsData: [...preparePartsDataPayload(metadata)] as PolygonPartRecordInput[],
              metadata: cleanUpEntityPayload(metadata, metadataPayloadKeys as string[]) as unknown as LayerRasterRecordInput,
              type: RecordType.RECORD_RASTER,
            },
          })
        );
      }
    };

    const checkHasQueriesSucceeded = (): boolean => {
      const SUCCESS_RESPONSE_VAL = 'ok';

      const mutationServices = ['updateMetadata', 'startRasterIngestion', 'startRasterUpdateGeopkg'];
      const hasAnyQuerySucceeded = Object.entries(mutationQuery.data ?? {})
      .some(([key, val]) => mutationServices.includes(key) && val === SUCCESS_RESPONSE_VAL);
      
      return hasAnyQuerySucceeded;
    }

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

    const ingestionFields = [
      {
        ...buildFieldInfo(),
        fieldName: 'directory',
        label: 'field-names.ingestion.directory',
        isRequired: true,
        isAutoGenerated: false,
        infoMsgCode: ['info-general-tooltip.required'],
      },
      {
        ...buildFieldInfo(),
        fieldName: 'fileNames',
        label: getLabel(recordType),
        isRequired: true,
        isAutoGenerated: false,
        infoMsgCode: ['info-general-tooltip.required'],
      },
    ];

    const schemaUpdater = (partsNumber: number, startIndex = 0, removePrevNested = false)=>{
      const nestedFormdescriptors = getFlatEntityDescriptors(
        'PolygonPartRecord',
        store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]
      );
      const nestedYupSchema: Record<string, any> = {};
      [
        ...nestedFormdescriptors
      ].forEach((field) => {
        const fieldName: string = field.fieldName as string;
        switch (mode) {
          case Mode.NEW:
          case Mode.UPDATE:
            if ((field.isRequired as boolean) && field.isAutoGenerated !== true) {
              nestedYupSchema[fieldName] = getYupFieldConfig(field, intl);
            }
            break;
          default:
            break;
        }
      });

      const { topLevelEntityVestErrors ,...rest} = vestValidationResults;
      removePrevNested && topLevelEntityVestErrors && Object.keys(topLevelEntityVestErrors).length && setVestValidationResults({topLevelEntityVestErrors});

      const newSchema = { ...(removePrevNested ? removePropertiesWithPrefix(schema, NESTED_FORMS_PRFIX) : schema) };
      
      for(let i=0; i < partsNumber; i++ ){
        newSchema[`${NESTED_FORMS_PRFIX}${i+startIndex}`] = Yup.object().shape({...nestedYupSchema});
      }
      setSchema(newSchema);
    }

    const removePolygonPart = (polygonPartKey: string): string[] => {
      let touchedFields: string[] = [];

      const ppFields = (schema[polygonPartKey] as unknown as Record<string, string>).fields;

      Object.keys(ppFields).forEach((key) => {
        touchedFields.push(key);
      });

      delete schema[polygonPartKey];
      setSchema({...schema});

      const { [polygonPartKey]: polygonPartValue, ...rest } = vestValidationResults;
      setVestValidationResults(rest);
      
      return touchedFields;
    };
          
    useEffect(() => {
      const descriptors = getFlatEntityDescriptors(
        layerRecord.__typename,
        filterModeDescriptors(mode, store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[])
      );

      const uiIngestionFieldDescriptors = getUIIngestionFieldDescriptors(store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const yupSchema: Record<string, any> = {};
      [
        ...ingestionFields,
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

      const desc = addDescriptorValidations([...ingestionFields, ...descriptors]);

      setDescriptors(desc as any[]);

      if ([Mode.UPDATE].includes(mode)) {
        queryGetProduct.setQuery(
          store.queryGetProduct(
            {
              productType: props.layerRecord?.productType as ProductType,
              productId: (props.layerRecord as LayerRasterRecordModelType).productId as string
            }
          )
        );
      }
    }, []);

    useEffect(() => {
      let hasVestErrors = false;
      
      const formDrafts = Object.values(vestValidationResults);
      if (formDrafts.length === NONE) return;
      
      formDrafts.forEach((formDraft: DraftResult)=>{
        hasVestErrors ||= (formDraft.errorCount !== NONE);
      });

      if (!hasVestErrors) {
        switch(mode) {
          case Mode.NEW:
            handleIngestQueries();
          break;
          case Mode.UPDATE:
            handleUpdateQueries();
          break;
        }
      }
    }, [isSubmittedForm]);

    const closeDialog = useCallback(() => {
      onSetOpen(false);
      store.discreteLayersStore.resetUpdateMode();
      clearSyncWarnings();
    }, [onSetOpen, store.discreteLayersStore]);

    useEffect(() => {
      const hasAnyQuerySucceeded = checkHasQueriesSucceeded();

      if (!mutationQuery.loading && hasAnyQuerySucceeded) {
        closeDialog();
        
        dispatchAction({ 
          action: UserAction.SYSTEM_CALLBACK_EDIT,
          data: inputValues as ILayerImage 
        });
      }
    }, [mutationQuery.data, mutationQuery.loading, closeDialog, store.discreteLayersStore, inputValues]);

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

    // ENSPIRED BY NESTED FORMS FROM https://stackblitz.com/edit/react-formik-yup-example-uhdg-x7c85z?file=Form.js,Registration.js
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
          <h1><bdi>[DIALOG][LOADING FROM SOME STATE]:{isLoading+''}</bdi></h1>
          <h1><bdi>[DIALOG][ERRORS]:{JSON.stringify(state.context.errors)}</bdi></h1>
          <h1><bdi>[DIALOG]file:{state.context.files?.gpkg?.path}</bdi></h1>
          <h2><bdi>[DIALOG]validation:{JSON.stringify(state.context?.files?.gpkg?.validationResult)}</bdi></h2>
            {mode === Mode.UPDATE && <UpdateLayerHeader />}
              {isAllInfoReady && (
                <EntityRasterForm
                  mode={mode}
                  entityDescriptors={
                    store.discreteLayersStore
                      .entityDescriptors as EntityDescriptorModelType[]
                  }
                  ingestionFields={ingestionFields}
                  recordType={recordType}
                  layerRecord={
                    mode === Mode.UPDATE
                      ? {...props.layerRecord} as LayerMetadataMixedUnion : layerRecord
                  }
                  schemaUpdater = {schemaUpdater}
                  yupSchema={Yup.object({
                    ...schema,
                  })}
                  onSubmit={(values): void => {
                    setInputValues(values);
                    // eslint-disable-next-line
                    const vestSuiteTopLevel = suite(
                      descriptors as FieldConfigModelType[],
                      values
                    );

                    const vestSuite: Record<string,DraftResult> = {
                      topLevelEntityVestErrors: get(vestSuiteTopLevel, "get")(),
                    }

                    const nestedFormdescriptors = addDescriptorValidations(
                      getFlatEntityDescriptors(
                      'PolygonPartRecord',
                      store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[])
                    );
                    Object.keys(values)
                      .filter((fieldName) => fieldName.includes(NESTED_FORMS_PRFIX))
                      .forEach((nestedFieldName)=>{
                        const vestSuiteNested = suite(
                          nestedFormdescriptors,
                          values[nestedFieldName] as Record<string,unknown>
                        );
                        
                        vestSuite[nestedFieldName] = get(vestSuiteNested, "get")();
                      });
                    
                    setVestValidationResults(vestSuite);

                    setIsSubmittedForm(!isSubmittedForm);
                    // setVestValidationResults(get(vestSuiteTopLevel, "get")()) ;
                  }}
                  vestValidationResults={vestValidationResults}
                  // eslint-disable-next-line
                  mutationQueryError={mutationQuery.error}
                  mutationQueryLoading={mutationQuery.loading}
                  closeDialog={closeDialog}
                  removePolygonPart={removePolygonPart}
                  customErrorReset={store.discreteLayersStore.clearCustomValidationError}
                  customError={store.discreteLayersStore.customValidationError}
                  ppCollisionCheckInProgress={store.discreteLayersStore.ppCollisionCheckInProgress}
                />
              )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);
