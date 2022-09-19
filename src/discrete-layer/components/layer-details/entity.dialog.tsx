/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useCallback, useState, useLayoutEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { FormikValues } from 'formik';
import { cloneDeep, get, isEmpty } from 'lodash';
import moment from 'moment';
import * as Yup from 'yup';
import { MixedSchema } from 'yup/lib/mixed';
import { DraftResult } from 'vest/vestResult';
import { DialogContent } from '@material-ui/core';
import { Dialog, DialogTitle, IconButton } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { emphasizeByHTML } from '../../../common/helpers/formatters';
import { getStatusColoredBackground } from '../../../common/helpers/style';
import { Mode } from '../../../common/models/mode.enum';
import {
  BestRecordModelType,
  EntityDescriptorModelType,
  Layer3DRecordModel,
  LayerMetadataMixedUnion,
  LayerRasterRecordModel,
  RecordType,
  useQuery,
  useStore,
  ValidationConfigModelType,
  FieldConfigModelType,
  ProductType,
  RecordStatus,
  ValidationValueType,
  LayerDemRecordModel
} from '../../models';
import { IDispatchAction } from '../../models/actionDispatcherStore';
import { ILayerImage } from '../../models/layerImage';
import {
  Layer3DRecordInput,
  LayerDemRecordInput,
  LayerRasterRecordInput,
} from '../../models/RootStore.base';
import { UserAction } from '../../models/userStore';
import {
  FieldConfigModelKeys,
  Layer3DRecordModelKeys,
  LayerDemRecordModelKeys,
  LayerRasterRecordModelKeys,
} from './entity-types-keys';
import { LayersDetailsComponent } from './layer-details';
import { IRecordFieldInfo } from './layer-details.field-info';
import EntityForm from './layer-datails-form';
import {
  getFlatEntityDescriptors,
  getPartialRecord,
  getRecordForUpdate,
  getValidationType
} from './utils';
import suite from './validate';

import './entity.dialog.css';

const IS_EDITABLE = 'isManuallyEditable';
const DEFAULT_ID = 'DEFAULT_UI_ID';
const IMMEDIATE_EXECUTION = 0;
const NONE = 0;
const START = 0;

interface EntityDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  recordType?: RecordType;
  layerRecord?: ILayerImage | null;
  isSelectedLayerUpdateMode?: boolean;
}

const setDefaultValues = (record: Record<string, unknown>, descriptors: EntityDescriptorModelType[]): void => {
  getFlatEntityDescriptors(
    record['__typename'] as "Layer3DRecord" | "LayerRasterRecord" | "BestRecord" | "LayerDemRecord" | "VectorBestRecord" | "QuantizedMeshBestRecord",
    descriptors
  ).filter(
    field => field.default
  ).forEach(
    descriptor => record[descriptor.fieldName as string] = descriptor.default
  );
};

const buildRecord = (recordType: RecordType, descriptors: EntityDescriptorModelType[]): ILayerImage => {
  const record = {} as Record<string, unknown>;
  switch (recordType) {
    case RecordType.RECORD_DEM:
      LayerDemRecordModelKeys.forEach((key) => {
        record[key as string] = undefined;
      });
      record.productType = ProductType.DTM;
      record['__typename'] = LayerDemRecordModel.properties['__typename'].name.replaceAll('"','');
      break;
    case RecordType.RECORD_3D:
      Layer3DRecordModelKeys.forEach((key) => {
        record[key as string] = undefined;
      });
      record.productType = ProductType.PHOTO_REALISTIC_3D;
      record.productStatus = RecordStatus.UNPUBLISHED;
      record['__typename'] = Layer3DRecordModel.properties['__typename'].name.replaceAll('"','');
      break;
    case RecordType.RECORD_RASTER:
      LayerRasterRecordModelKeys.forEach((key) => {
        record[key as string] = undefined;
      });
      record.updateDate = moment();
      record.sensors = [];
      record.productType = ProductType.ORTHOPHOTO;
      record['__typename'] = LayerRasterRecordModel.properties['__typename'].name.replaceAll('"','');
      break;
    default:
      break;
  }

  setDefaultValues(record, descriptors);

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

export const EntityDialog: React.FC<EntityDialogProps> = observer(
  (props: EntityDialogProps) => {

    const store = useStore();
    const intl = useIntl();
    const mutationQuery = useQuery();

    const dialogContainerRef = useRef<HTMLDivElement>(null);

    const decideMode = useCallback(() => {
      if (props.isSelectedLayerUpdateMode === true && props.layerRecord) {
        return Mode.UPDATE;
      }
      return !props.layerRecord ? Mode.NEW : Mode.EDIT;
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
      DraftResult
    >({} as DraftResult);
    const [descriptors, setDescriptors] = useState<unknown[]>([]);
    const [schema, setSchema] = useState<Record<string, Yup.AnySchema>>({});
    const [inputValues, setInputValues] = useState<FormikValues>({});
    const [isAllInfoReady, setIsAllInfoReady] = useState<boolean>(false);

    const dialogTitleParam = recordType;
    const dialogTitleParamTranslation = intl.formatMessage({
      id: `record-type.${(dialogTitleParam as string).toLowerCase()}.label`,
    });
    const dialogTitle = intl.formatMessage(
      { id: `general.title.${(mode as string).toLowerCase()}` },
      { value: dialogTitleParamTranslation }
    );

    const dispatchAction = (action: Record<string,unknown>): void => {
      store.actionDispatcherStore.dispatchAction(
        {
          action: action.action,
          data: action.data,
        } as IDispatchAction
      );
    };

    useEffect(() => {
      if(!isEmpty(descriptors) && !isEmpty(layerRecord)) {
        setIsAllInfoReady(true);
      }
    }, [descriptors, layerRecord]);

    useLayoutEffect(() => {
      const CONTENT_HEIGHT_VAR_NAME = '--content-height';
      /* eslint-disable */
      if(dialogContainerRef.current !== null){
        const baseContentHeight = getComputedStyle(dialogContainerRef.current).getPropertyValue('--base-content-height');
        const currentIngestionFieldsHeight = getComputedStyle(dialogContainerRef.current).getPropertyValue('--ingestion-fields-height');
        const currentUpdateHeaderHeight = getComputedStyle(dialogContainerRef.current).getPropertyValue('--update-layer-header-height');
  
        switch(mode){
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

    const ingestionFields =
      layerRecord.__typename !== 'BestRecord'
        ? [
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
          ]
        : [];

    useEffect(() => {
      const descriptors = getFlatEntityDescriptors(
        layerRecord.__typename,
        store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]
      );

      const getYupRequiredFieldConfig = (
        field: FieldConfigModelType
      ): MixedSchema => {
        return Yup.mixed().required(
          intl.formatMessage(
            { id: 'validation-general.required' },
            { fieldName: emphasizeByHTML(`${intl.formatMessage({ id: field.label })}`) }
          )
        );
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const yupSchema: Record<string, any> = {};
      [
        ...ingestionFields,
        ...descriptors
      ].forEach((field) => {
        const fieldName: string = field.fieldName as string;
        switch (mode) {
          case Mode.NEW:
            if ((field.isRequired as boolean) && field.isAutoGenerated !== true) {
              yupSchema[fieldName] = getYupRequiredFieldConfig(field);
            }
            break;
          case Mode.UPDATE:
            if ((field.isRequired as boolean) && field.isAutoGenerated !== true) {
              yupSchema[fieldName] = getYupRequiredFieldConfig(field);
            }
            break;
          case Mode.EDIT:
            if ((field.isRequired as boolean) && field.isManuallyEditable === true) {
              yupSchema[fieldName] = getYupRequiredFieldConfig(field);
            }
            break;
          default:
            break;
        }
      });
      setSchema(yupSchema);

      const desc = [...ingestionFields, ...descriptors].map(
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
                return {
                  ...val,
                  errorMsgTranslation: finalMsg,
                };
              }
            ),
          };
        }
      );
      setDescriptors(desc as any[]);
    }, []);

    useEffect(() => {
      if (vestValidationResults.errorCount === NONE) {
        if (mode === Mode.EDIT) {
          if (inputValues.__typename !== 'BestRecord') {
            mutationQuery.setQuery(
              store.mutateUpdateMetadata({
                data: {
                  id: inputValues.id as string,
                  type: inputValues.type as RecordType,
                  partialRecordData: getPartialRecord(inputValues as Record<string, unknown> as Partial<ILayerImage>, descriptors as unknown[] as FieldConfigModelType[], IS_EDITABLE),
                },
              })
            );
          } else {
            setTimeout(() => {
              store.bestStore.editBest({
                ...(inputValues as BestRecordModelType),
                // @ts-ignore
                sensors:
                  inputValues.sensors !== undefined
                    ? (JSON.parse(
                        '[' + (inputValues.sensors as string) + ']'
                      ) as string[])
                    : [],
              });
            }, IMMEDIATE_EXECUTION);
            closeDialog();
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const { directory, fileNames, __typename, ...metadata } = inputValues;
          switch (recordType) {
            case RecordType.RECORD_DEM:
              mutationQuery.setQuery(
                store.mutateStartDemIngestion({
                  data: {
                    directory: directory as string,
                    fileNames: (fileNames as string).split(','),
                    metadata: metadata as LayerDemRecordInput,
                    type: RecordType.RECORD_DEM,
                  },
                })
              );
              break;
            case RecordType.RECORD_3D:
              mutationQuery.setQuery(
                store.mutateStart3DIngestion({
                  data: {
                    directory: directory as string,
                    fileNames: [fileNames as string],
                    metadata: metadata as Layer3DRecordInput,
                    type: RecordType.RECORD_3D,
                  },
                })
              );
              break;
            case RecordType.RECORD_RASTER:
              mutationQuery.setQuery(
                store.mutateStartRasterIngestion({
                  data: {
                    directory: directory as string,
                    fileNames: (fileNames as string).split(','),
                    metadata: metadata as LayerRasterRecordInput,
                    type: RecordType.RECORD_RASTER,
                  },
                })
              );
              break;
            default:
              break;
          }
        }
      }
    }, [vestValidationResults]);

    const closeDialog = useCallback(() => {
      onSetOpen(false);
    }, [onSetOpen]);

    useEffect(() => {
      // @ts-ignore
      if (!mutationQuery.loading && (mutationQuery.data?.updateMetadata === 'ok' || mutationQuery.data?.start3DIngestion === 'ok' || mutationQuery.data?.startRasterIngestion === 'ok')) {
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
              mode={Mode.UPDATE}
            />
          </Box>
        </Box>
      );
    };

    return (
      <div id="entityDialog" ref={dialogContainerRef}>
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogTitle style={mode !== Mode.NEW ? getStatusColoredBackground(layerRecord as any) : undefined}>
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
            {mode === Mode.UPDATE && <UpdateLayerHeader />}
            {isAllInfoReady && (
              <EntityForm
                mode={mode}
                entityDescriptors={
                  store.discreteLayersStore
                    .entityDescriptors as EntityDescriptorModelType[]
                }
                ingestionFields={ingestionFields}
                recordType={recordType}
                layerRecord={
                  mode === Mode.UPDATE
                    ? getRecordForUpdate(
                        props.layerRecord as LayerMetadataMixedUnion,
                        layerRecord,
                        descriptors as FieldConfigModelType[]
                      )
                    : layerRecord
                }
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
                // eslint-disable-next-line
                mutationQueryError={mutationQuery.error}
                mutationQueryLoading={mutationQuery.loading}
                closeDialog={closeDialog}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);
