/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */
import { ObservableMap } from "mobx"
import { types } from "mobx-state-tree"
import { MSTGQLStore, configureStoreMixin, QueryOptions, withTypedRefs } from "mst-gql"

import { CapabilityModel, CapabilityModelType } from "./CapabilityModel"
import { capabilityModelPrimitives, CapabilityModelSelector } from "./CapabilityModel.base"
import { StyleModel, StyleModelType } from "./StyleModel"
import { styleModelPrimitives, StyleModelSelector } from "./StyleModel.base"
import { TileMatrixSetModel, TileMatrixSetModelType } from "./TileMatrixSetModel"
import { tileMatrixSetModelPrimitives, TileMatrixSetModelSelector } from "./TileMatrixSetModel.base"
import { ResourceUrlModel, ResourceUrlModelType } from "./ResourceUrlModel"
import { resourceUrlModelPrimitives, ResourceUrlModelSelector } from "./ResourceUrlModel.base"
import { Layer3DRecordModel, Layer3DRecordModelType } from "./Layer3DRecordModel"
import { layer3DRecordModelPrimitives, Layer3DRecordModelSelector } from "./Layer3DRecordModel.base"
import { LinkModel, LinkModelType } from "./LinkModel"
import { linkModelPrimitives, LinkModelSelector } from "./LinkModel.base"
import { LayerRasterRecordModel, LayerRasterRecordModelType } from "./LayerRasterRecordModel"
import { layerRasterRecordModelPrimitives, LayerRasterRecordModelSelector } from "./LayerRasterRecordModel.base"
import { LayerDemRecordModel, LayerDemRecordModelType } from "./LayerDemRecordModel"
import { layerDemRecordModelPrimitives, LayerDemRecordModelSelector } from "./LayerDemRecordModel.base"
import { VectorBestRecordModel, VectorBestRecordModelType } from "./VectorBestRecordModel"
import { vectorBestRecordModelPrimitives, VectorBestRecordModelSelector } from "./VectorBestRecordModel.base"
import { VectorFeatureTypeStructureModel, VectorFeatureTypeStructureModelType } from "./VectorFeatureTypeStructureModel"
import { vectorFeatureTypeStructureModelPrimitives, VectorFeatureTypeStructureModelSelector } from "./VectorFeatureTypeStructureModel.base"
import { FieldFeatureTypeModel, FieldFeatureTypeModelType } from "./FieldFeatureTypeModel"
import { fieldFeatureTypeModelPrimitives, FieldFeatureTypeModelSelector } from "./FieldFeatureTypeModel.base"
import { QuantizedMeshBestRecordModel, QuantizedMeshBestRecordModelType } from "./QuantizedMeshBestRecordModel"
import { quantizedMeshBestRecordModelPrimitives, QuantizedMeshBestRecordModelSelector } from "./QuantizedMeshBestRecordModel.base"
import { StringArrayObjectTypeModel, StringArrayObjectTypeModelType } from "./StringArrayObjectTypeModel"
import { stringArrayObjectTypeModelPrimitives, StringArrayObjectTypeModelSelector } from "./StringArrayObjectTypeModel.base"
import { EntityDescriptorModel, EntityDescriptorModelType } from "./EntityDescriptorModel"
import { entityDescriptorModelPrimitives, EntityDescriptorModelSelector } from "./EntityDescriptorModel.base"
import { CategoryConfigModel, CategoryConfigModelType } from "./CategoryConfigModel"
import { categoryConfigModelPrimitives, CategoryConfigModelSelector } from "./CategoryConfigModel.base"
import { FieldConfigModel, FieldConfigModelType } from "./FieldConfigModel"
import { fieldConfigModelPrimitives, FieldConfigModelSelector } from "./FieldConfigModel.base"
import { FilterableFieldConfigModel, FilterableFieldConfigModelType } from "./FilterableFieldConfigModel"
import { filterableFieldConfigModelPrimitives, FilterableFieldConfigModelSelector } from "./FilterableFieldConfigModel.base"
import { FilterFieldValidationModel, FilterFieldValidationModelType } from "./FilterFieldValidationModel"
import { filterFieldValidationModelPrimitives, FilterFieldValidationModelSelector } from "./FilterFieldValidationModel.base"
import { BriefFieldConfigModel, BriefFieldConfigModelType } from "./BriefFieldConfigModel"
import { briefFieldConfigModelPrimitives, BriefFieldConfigModelSelector } from "./BriefFieldConfigModel.base"
import { AutocompletionModel, AutocompletionModelType } from "./AutocompletionModel"
import { autocompletionModelPrimitives, AutocompletionModelSelector } from "./AutocompletionModel.base"
import { ValidationConfigModel, ValidationConfigModelType } from "./ValidationConfigModel"
import { validationConfigModelPrimitives, ValidationConfigModelSelector } from "./ValidationConfigModel.base"
import { EnumAspectsModel, EnumAspectsModelType } from "./EnumAspectsModel"
import { enumAspectsModelPrimitives, EnumAspectsModelSelector } from "./EnumAspectsModel.base"
import { UpdateRulesModel, UpdateRulesModelType } from "./UpdateRulesModel"
import { updateRulesModelPrimitives, UpdateRulesModelSelector } from "./UpdateRulesModel.base"
import { UpdateRulesValueModel, UpdateRulesValueModelType } from "./UpdateRulesValueModel"
import { updateRulesValueModelPrimitives, UpdateRulesValueModelSelector } from "./UpdateRulesValueModel.base"
import { UpdateRulesOperationModel, UpdateRulesOperationModelType } from "./UpdateRulesOperationModel"
import { updateRulesOperationModelPrimitives, UpdateRulesOperationModelSelector } from "./UpdateRulesOperationModel.base"
import { LookupTableBindingModel, LookupTableBindingModelType } from "./LookupTableBindingModel"
import { lookupTableBindingModelPrimitives, LookupTableBindingModelSelector } from "./LookupTableBindingModel.base"
import { DependentFieldModel, DependentFieldModelType } from "./DependentFieldModel"
import { dependentFieldModelPrimitives, DependentFieldModelSelector } from "./DependentFieldModel.base"
import { ShapeMappingModel, ShapeMappingModelType } from "./ShapeMappingModel"
import { shapeMappingModelPrimitives, ShapeMappingModelSelector } from "./ShapeMappingModel.base"
import { McEnumsModel, McEnumsModelType } from "./McEnumsModel"
import { mcEnumsModelPrimitives, McEnumsModelSelector } from "./McEnumsModel.base"
import { PolygonPartRecordModel, PolygonPartRecordModelType } from "./PolygonPartRecordModel"
import { polygonPartRecordModelPrimitives, PolygonPartRecordModelSelector } from "./PolygonPartRecordModel.base"
import { EstimatedSizeModel, EstimatedSizeModelType } from "./EstimatedSizeModel"
import { estimatedSizeModelPrimitives, EstimatedSizeModelSelector } from "./EstimatedSizeModel.base"
import { FreeDiskSpaceModel, FreeDiskSpaceModelType } from "./FreeDiskSpaceModel"
import { freeDiskSpaceModelPrimitives, FreeDiskSpaceModelSelector } from "./FreeDiskSpaceModel.base"
import { TriggerExportTaskModel, TriggerExportTaskModelType } from "./TriggerExportTaskModel"
import { triggerExportTaskModelPrimitives, TriggerExportTaskModelSelector } from "./TriggerExportTaskModel.base"
import { ExternalServiceModel, ExternalServiceModelType } from "./ExternalServiceModel"
import { externalServiceModelPrimitives, ExternalServiceModelSelector } from "./ExternalServiceModel.base"
import { JobModel, JobModelType } from "./JobModel"
import { jobModelPrimitives, JobModelSelector } from "./JobModel.base"
import { AvailableActionsModel, AvailableActionsModelType } from "./AvailableActionsModel"
import { availableActionsModelPrimitives, AvailableActionsModelSelector } from "./AvailableActionsModel.base"
import { LookupTableDataModel, LookupTableDataModelType } from "./LookupTableDataModel"
import { lookupTableDataModelPrimitives, LookupTableDataModelSelector } from "./LookupTableDataModel.base"
import { DeploymentWithServicesModel, DeploymentWithServicesModelType } from "./DeploymentWithServicesModel"
import { deploymentWithServicesModelPrimitives, DeploymentWithServicesModelSelector } from "./DeploymentWithServicesModel.base"
import { K8SServiceModel, K8SServiceModelType } from "./K8SServiceModel"
import { k8SServiceModelPrimitives, K8SServiceModelSelector } from "./K8SServiceModel.base"
import { FileModel, FileModelType } from "./FileModel"
import { fileModelPrimitives, FileModelSelector } from "./FileModel.base"
import { DecryptedIdModel, DecryptedIdModelType } from "./DecryptedIdModel"
import { decryptedIdModelPrimitives, DecryptedIdModelSelector } from "./DecryptedIdModel.base"
import { TasksGroupModel, TasksGroupModelType } from "./TasksGroupModel"
import { tasksGroupModelPrimitives, TasksGroupModelSelector } from "./TasksGroupModel.base"
import { GetFeatureModel, GetFeatureModelType } from "./GetFeatureModel"
import { getFeatureModelPrimitives, GetFeatureModelSelector } from "./GetFeatureModel.base"
import { WfsFeatureModel, WfsFeatureModelType } from "./WfsFeatureModel"
import { wfsFeatureModelPrimitives, WfsFeatureModelSelector } from "./WfsFeatureModel.base"
import { GetFeatureTypesModel, GetFeatureTypesModelType } from "./GetFeatureTypesModel"
import { getFeatureTypesModelPrimitives, GetFeatureTypesModelSelector } from "./GetFeatureTypesModel.base"
import { PositionsWithHeightsModel, PositionsWithHeightsModelType } from "./PositionsWithHeightsModel"
import { positionsWithHeightsModelPrimitives, PositionsWithHeightsModelSelector } from "./PositionsWithHeightsModel.base"
import { PositionWithHeightModel, PositionWithHeightModelType } from "./PositionWithHeightModel"
import { positionWithHeightModelPrimitives, PositionWithHeightModelSelector } from "./PositionWithHeightModel.base"
import { UserLoginModel, UserLoginModelType } from "./UserLoginModel"
import { userLoginModelPrimitives, UserLoginModelSelector } from "./UserLoginModel.base"
import { SourceValidationModel, SourceValidationModelType } from "./SourceValidationModel"
import { sourceValidationModelPrimitives, SourceValidationModelSelector } from "./SourceValidationModel.base"
import { RasterIngestionModel, RasterIngestionModelType } from "./RasterIngestionModel"
import { rasterIngestionModelPrimitives, RasterIngestionModelSelector } from "./RasterIngestionModel.base"
import { TaskModel, TaskModelType } from "./TaskModel"
import { taskModelPrimitives, TaskModelSelector } from "./TaskModel.base"

import { layerMetadataMixedModelPrimitives, LayerMetadataMixedModelSelector , LayerMetadataMixedUnion } from "./"

import { RecordType } from "./RecordTypeEnum"
import { ProductType } from "./ProductTypeEnum"
import { RecordStatus } from "./RecordStatusEnum"
import { Transparency } from "./TransparencyEnum"
import { UndulationModel } from "./UndulationModelEnum"
import { DemDataType } from "./DemDataTypeEnum"
import { NoDataValue } from "./NoDataValueEnum"
import { FieldCategory } from "./FieldCategoryEnum"
import { AutocompletionType } from "./AutocompletionTypeEnum"
import { ValidationValueType } from "./ValidationValueTypeEnum"
import { DateGranularityType } from "./DateGranularityTypeEnum"
import { OperationType } from "./OperationTypeEnum"
import { FractionType } from "./FractionTypeEnum"
import { ProviderType } from "./ProviderTypeEnum"
import { ServiceType } from "./ServiceTypeEnum"
import { Status } from "./StatusEnum"
import { RasterIngestionFilesTypeConfig } from "./RasterIngestionFilesTypeConfigEnum"

export type CapabilitiesLayersSearchParams = {
  data: CapabilitiesLayersSearchParam[]
}
export type CapabilitiesLayersSearchParam = {
  recordType: RecordType
  idList: string[]
}
export type SearchOptions = {
  filter?: FilterField[]
  sort?: SortField[]
}
export type FilterField = {
  or?: boolean
  field: string
  like?: string
  eq?: string
  neq?: string
  gt?: string
  lt?: string
  gteq?: string
  lteq?: string
  in?: string[]
  bbox?: Bbox
}
export type Bbox = {
  llat: number
  llon: number
  ulat: number
  ulon: number
}
export type SortField = {
  field: string
  desc?: boolean
}
export type StringArray = {
  value: string[]
}
export type GetExportEstimatedSizeInput = {
  type: RecordType
  selections: GeojsonFeatureCollectionInput
}
export type GeojsonFeatureCollectionInput = {
  type: string
  features: GeojsonFeatureInput[]
}
export type GeojsonFeatureInput = {
  type: string
  geometry: any
  id?: string
  bbox?: number[]
  properties: any
}
export type GetFreeDiskSpaceInput = {
  type: RecordType
}
export type TriggerExportTaskInput = {
  type: RecordType
  catalogRecordID: string
  parameters: any
}
export type JobsSearchParams = {
  resourceId?: string
  version?: string
  isCleaned?: boolean
  status?: Status
  type?: string
  fromDate?: any
  tillDate?: any
}
export type GetLookupTablesParams = {
  lookupFields?: LookupTableFieldInput[]
}
export type LookupTableFieldInput = {
  lookupTable?: string
  lookupExcludeFields?: string
}
export type ExplorerGetByPath = {
  path: string
  type: RecordType
  rasterIngestionFilesTypeConfig?: RasterIngestionFilesTypeConfig
}
export type ExplorerGetById = {
  id: string
  type: RecordType
}
export type ExplorerResolveMetadataAsModel = {
  metadata: string
  type: RecordType
}
export type TasksSearchParams = {
  jobId: string
  type?: string
}
export type WfsGetFeatureParams = {
  pointCoordinates: string[]
  typeName: string
  count?: number
  dWithin?: number
}
export type GetDemPointsHeightsInput = {
  positions: DemHeightsPositionInput[]
  productType?: string
}
export type DemHeightsPositionInput = {
  latitude: number
  longitude: number
}
export type WfsPolygonPartsGetFeatureParams = {
  feature: GeojsonFeatureInput
  typeName: string
  count?: number
  startIndex?: number
  dWithin?: number
  filterProperties?: WfsFilterPropertyParam[]
}
export type WfsFilterPropertyParam = {
  propertyName: string
  propertyValue: string
}
export type UserLoginParams = {
  userName: string
  userPassword: string
}
export type SourceValidationParams = {
  originDirectory: string
  fileNames: string[]
  type: RecordType
}
export type SourceGpkgValidationParams = {
  gpkgFilesPath: string[]
  type: RecordType
}
export type RecordUpdatePartial = {
  id: string
  type: RecordType
  partialRecordData: any
}
export type IngestionRasterData = {
  inputFiles: InputFilesRaster
  metadata: LayerRasterRecordInput
  ingestionResolution: number
  type: RecordType
}
export type InputFilesRaster = {
  gpkgFilesPath: string[]
  metadataShapefilePath: string
  productShapefilePath: string
}
export type LayerRasterRecordInput = {
  id: string
  type?: RecordType
  classification: string
  productName: string
  description?: string
  srs: string
  producerName: string
  // creationDateUTC?: any --> will not be generated by code-generator currently remarked in BFF
  // ingestionDate?: any --> will not be generated by code-generator currently remarked in BFF
  // updateDateUTC?: any --> will not be generated by code-generator currently remarked in BFF
  // imagingTimeBeginUTC: any --> will not be generated by code-generator currently remarked in BFF
  // imagingTimeEndUTC: any --> will not be generated by code-generator currently remarked in BFF
  // maxHorizontalAccuracyCE90: number --> will not be generated by code-generator currently remarked in BFF
  // minHorizontalAccuracyCE90?: number --> will not be generated by code-generator currently remarked in BFF
  // sensors: string[] --> will not be generated by code-generator currently remarked in BFF
  region: string[]
  productId?: string
  productVersion?: string
  productType: ProductType
  productSubType?: string
  srsName: string
  // maxResolutionDeg?: number --> will not be generated by code-generator currently remarked in BFF
  // minResolutionDeg: number --> will not be generated by code-generator currently remarked in BFF
  // maxResolutionMeter?: number --> will not be generated by code-generator currently remarked in BFF
  // minResolutionMeter: number --> will not be generated by code-generator currently remarked in BFF
  rms?: number
  scale?: number
  // footprint: any --> will not be generated by code-generator currently remarked in BFF
  productBoundingBox?: string
  productStatus?: RecordStatus
  transparency: Transparency
  insertDate?: any
  keywords?: string
  links?: LinkInput[]
}
export type LinkInput = {
  name?: string
  description?: string
  protocol: string
  url: string
}
export type Ingestion3DData = {
  directory: string
  fileNames: string[]
  metadata: Layer3DRecordInput
  type: RecordType
}
export type Layer3DRecordInput = {
  type?: RecordType
  productId?: string
  productName: string
  productVersion?: string
  productType: ProductType
  description?: string
  creationDate?: any
  updateDate?: any
  sourceDateStart: any
  sourceDateEnd: any
  minResolutionMeter?: number
  maxResolutionMeter?: number
  maxAccuracyCE90: number
  absoluteAccuracyLE90: number
  accuracySE90?: number
  relativeAccuracySE90?: number
  visualAccuracy?: number
  sensors: string[]
  footprint: any
  heightRangeFrom?: number
  heightRangeTo?: number
  srsId: string
  srsName: string
  region: string[]
  classification: string
  productionSystem: string
  productionSystemVer: string
  producerName: string
  minFlightAlt?: number
  maxFlightAlt?: number
  geographicArea?: string
  productBoundingBox?: string
  productSource?: string
  productStatus?: RecordStatus
  id: string
  insertDate?: any
  wktGeometry?: string
  keywords?: string
  links?: LinkInput[]
}
export type IngestionDemData = {
  directory: string
  fileNames: string[]
  metadata: LayerDemRecordInput
  type: RecordType
}
export type LayerDemRecordInput = {
  type?: RecordType
  classification: string
  productName: string
  description?: string
  srsId: string
  srsName: string
  producerName: string
  updateDate?: any
  sourceDateStart: any
  sourceDateEnd: any
  sensors: string[]
  region: string[]
  productId?: string
  productType: ProductType
  footprint: any
  absoluteAccuracyLEP90: number
  relativeAccuracyLEP90?: number
  resolutionDegree?: number
  resolutionMeter: number
  imagingSortieAccuracyCEP90?: number
  layerPolygonParts?: any
  productBoundingBox?: string
  heightRangeFrom?: number
  heightRangeTo?: number
  geographicArea?: string
  undulationModel: UndulationModel
  dataType: DemDataType
  noDataValue: NoDataValue
  productStatus?: RecordStatus
  hasTerrain?: boolean
  id: string
  insertDate?: any
  wktGeometry?: string
  keywords?: string
  links?: LinkInput[]
}
export type RecordDeletePartial = {
  id: string
  type: RecordType
}
export type JobUpdateData = {
  parameters?: any
  status?: string
  percentage?: number
  reason?: string
  isCleaned?: boolean
  priority?: number
}
/* The TypeScript type that explicits the refs to other models in order to prevent a circular refs issue */
type Refs = {
  layerRasterRecords: ObservableMap<string, LayerRasterRecordModelType>,
  layer3DRecords: ObservableMap<string, Layer3DRecordModelType>,
  layerDemRecords: ObservableMap<string, LayerDemRecordModelType>,
  entityDescriptors: ObservableMap<string, EntityDescriptorModelType>,
  vectorBestRecords: ObservableMap<string, VectorBestRecordModelType>,
  quantizedMeshBestRecords: ObservableMap<string, QuantizedMeshBestRecordModelType>,
  polygonPartRecords: ObservableMap<string, PolygonPartRecordModelType>
}


/**
* Enums for the names of base graphql actions
*/
export enum RootStoreBaseQueries {
queryCapabilities="queryCapabilities",
querySearch="querySearch",
querySearchById="querySearchById",
queryGetDomain="queryGetDomain",
queryGetProduct="queryGetProduct",
queryEntityDescriptors="queryEntityDescriptors",
queryGetMcEnums="queryGetMcEnums",
queryGetPolygonPartsDUMMY="queryGetPolygonPartsDUMMY",
queryGetEstimatedSize="queryGetEstimatedSize",
queryGetFreeDiskSpace="queryGetFreeDiskSpace",
queryTriggerExportTask="queryTriggerExportTask",
queryGetExternalServices="queryGetExternalServices",
queryJobs="queryJobs",
queryJob="queryJob",
queryGetLookupTablesData="queryGetLookupTablesData",
queryGetClusterServices="queryGetClusterServices",
queryGetDirectory="queryGetDirectory",
queryGetDirectoryById="queryGetDirectoryById",
queryGetFile="queryGetFile",
queryResolveMetadataAsModel="queryResolveMetadataAsModel",
queryGetFileById="queryGetFileById",
queryGetDecryptedId="queryGetDecryptedId",
queryTasks="queryTasks",
queryGetFeature="queryGetFeature",
queryGetFeatureTypes="queryGetFeatureTypes",
queryGetPointsHeights="queryGetPointsHeights",
queryServicesAvailability="queryServicesAvailability",
queryGetPolygonPartsFeature="queryGetPolygonPartsFeature",
queryLogin="queryLogin",
queryValidateSource="queryValidateSource",
queryValidateGPKGSource="queryValidateGPKGSource"
}
export enum RootStoreBaseMutations {
mutateUpdateStatus="mutateUpdateStatus",
mutateUpdateMetadata="mutateUpdateMetadata",
mutateStartRasterIngestion="mutateStartRasterIngestion",
mutateStartRasterUpdateGeopkg="mutateStartRasterUpdateGeopkg",
mutateStart3DIngestion="mutateStart3DIngestion",
mutateStartDemIngestion="mutateStartDemIngestion",
mutateDeleteLayer="mutateDeleteLayer",
mutateUpdateJob="mutateUpdateJob",
mutateJobRetry="mutateJobRetry",
mutateJobAbort="mutateJobAbort",
mutateFindTasks="mutateFindTasks"
}

/**
* Store, managing, among others, all the objects received through graphQL
*/
export const RootStoreBase = withTypedRefs<Refs>()(MSTGQLStore
  .named("RootStore")
  .extend(configureStoreMixin([['Capability', () => CapabilityModel], ['Style', () => StyleModel], ['TileMatrixSet', () => TileMatrixSetModel], ['ResourceURL', () => ResourceUrlModel], ['Layer3DRecord', () => Layer3DRecordModel], ['Link', () => LinkModel], ['LayerRasterRecord', () => LayerRasterRecordModel], ['LayerDemRecord', () => LayerDemRecordModel], ['VectorBestRecord', () => VectorBestRecordModel], ['VectorFeatureTypeStructure', () => VectorFeatureTypeStructureModel], ['FieldFeatureType', () => FieldFeatureTypeModel], ['QuantizedMeshBestRecord', () => QuantizedMeshBestRecordModel], ['StringArrayObjectType', () => StringArrayObjectTypeModel], ['EntityDescriptor', () => EntityDescriptorModel], ['CategoryConfig', () => CategoryConfigModel], ['FieldConfig', () => FieldConfigModel], ['FilterableFieldConfig', () => FilterableFieldConfigModel], ['FilterFieldValidation', () => FilterFieldValidationModel], ['BriefFieldConfig', () => BriefFieldConfigModel], ['Autocompletion', () => AutocompletionModel], ['ValidationConfig', () => ValidationConfigModel], ['EnumAspects', () => EnumAspectsModel], ['UpdateRules', () => UpdateRulesModel], ['UpdateRulesValue', () => UpdateRulesValueModel], ['UpdateRulesOperation', () => UpdateRulesOperationModel], ['LookupTableBinding', () => LookupTableBindingModel], ['DependentField', () => DependentFieldModel], ['ShapeMapping', () => ShapeMappingModel], ['MCEnums', () => McEnumsModel], ['PolygonPartRecord', () => PolygonPartRecordModel], ['EstimatedSize', () => EstimatedSizeModel], ['FreeDiskSpace', () => FreeDiskSpaceModel], ['TriggerExportTask', () => TriggerExportTaskModel], ['ExternalService', () => ExternalServiceModel], ['Job', () => JobModel], ['AvailableActions', () => AvailableActionsModel], ['LookupTableData', () => LookupTableDataModel], ['DeploymentWithServices', () => DeploymentWithServicesModel], ['K8sService', () => K8SServiceModel], ['File', () => FileModel], ['DecryptedId', () => DecryptedIdModel], ['TasksGroup', () => TasksGroupModel], ['GetFeature', () => GetFeatureModel], ['WfsFeature', () => WfsFeatureModel], ['GetFeatureTypes', () => GetFeatureTypesModel], ['PositionsWithHeights', () => PositionsWithHeightsModel], ['PositionWithHeight', () => PositionWithHeightModel], ['UserLogin', () => UserLoginModel], ['SourceValidation', () => SourceValidationModel], ['RasterIngestion', () => RasterIngestionModel], ['Task', () => TaskModel]], ['LayerRasterRecord', 'Layer3DRecord', 'LayerDemRecord', 'EntityDescriptor', 'VectorBestRecord', 'QuantizedMeshBestRecord', 'PolygonPartRecord'], "js"))
  .props({
    layerRasterRecords: types.optional(types.map(types.late((): any => LayerRasterRecordModel)), {}),
    layer3DRecords: types.optional(types.map(types.late((): any => Layer3DRecordModel)), {}),
    layerDemRecords: types.optional(types.map(types.late((): any => LayerDemRecordModel)), {}),
    entityDescriptors: types.optional(types.map(types.late((): any => EntityDescriptorModel)), {}),
    vectorBestRecords: types.optional(types.map(types.late((): any => VectorBestRecordModel)), {}),
    quantizedMeshBestRecords: types.optional(types.map(types.late((): any => QuantizedMeshBestRecordModel)), {}),
    polygonPartRecords: types.optional(types.map(types.late((): any => PolygonPartRecordModel)), {})
  })
  .actions(self => ({
    queryCapabilities(variables: { params: CapabilitiesLayersSearchParams }, resultSelector: string | ((qb: CapabilityModelSelector) => CapabilityModelSelector) = capabilityModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ capabilities: CapabilityModelType[]}>(`query capabilities($params: CapabilitiesLayersSearchParams!) { capabilities(params: $params) {
        ${typeof resultSelector === "function" ? resultSelector(new CapabilityModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    querySearch(variables: { opts?: SearchOptions, end?: number, start?: number }, resultSelector: string | ((qb: LayerMetadataMixedModelSelector) => LayerMetadataMixedModelSelector) = layerMetadataMixedModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ search: LayerMetadataMixedUnion[]}>(`query search($opts: SearchOptions, $end: Float, $start: Float) { search(opts: $opts, end: $end, start: $start) {
        ${typeof resultSelector === "function" ? resultSelector(new LayerMetadataMixedModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    querySearchById(variables: { idList: StringArray }, resultSelector: string | ((qb: LayerMetadataMixedModelSelector) => LayerMetadataMixedModelSelector) = layerMetadataMixedModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ searchById: LayerMetadataMixedUnion[]}>(`query searchById($idList: StringArray!) { searchById(idList: $idList) {
        ${typeof resultSelector === "function" ? resultSelector(new LayerMetadataMixedModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetDomain(variables: { recordType: string, domain: string }, resultSelector: string | ((qb: StringArrayObjectTypeModelSelector) => StringArrayObjectTypeModelSelector) = stringArrayObjectTypeModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getDomain: StringArrayObjectTypeModelType}>(`query getDomain($recordType: String!, $domain: String!) { getDomain(recordType: $recordType, domain: $domain) {
        ${typeof resultSelector === "function" ? resultSelector(new StringArrayObjectTypeModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetProduct(variables: { productType: string, productId: string }, resultSelector: string | ((qb: LayerMetadataMixedModelSelector) => LayerMetadataMixedModelSelector) = layerMetadataMixedModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getProduct: LayerMetadataMixedUnion}>(`query getProduct($productType: String!, $productId: String!) { getProduct(productType: $productType, productId: $productId) {
        ${typeof resultSelector === "function" ? resultSelector(new LayerMetadataMixedModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryEntityDescriptors(variables?: {  }, resultSelector: string | ((qb: EntityDescriptorModelSelector) => EntityDescriptorModelSelector) = entityDescriptorModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ entityDescriptors: EntityDescriptorModelType[]}>(`query entityDescriptors { entityDescriptors {
        ${typeof resultSelector === "function" ? resultSelector(new EntityDescriptorModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetMcEnums(variables?: {  }, resultSelector: string | ((qb: McEnumsModelSelector) => McEnumsModelSelector) = mcEnumsModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getMcEnums: McEnumsModelType}>(`query getMcEnums { getMcEnums {
        ${typeof resultSelector === "function" ? resultSelector(new McEnumsModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetPolygonPartsDUMMY(variables?: {  }, resultSelector: string | ((qb: PolygonPartRecordModelSelector) => PolygonPartRecordModelSelector) = polygonPartRecordModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getPolygonPartsDUMMY: PolygonPartRecordModelType[]}>(`query getPolygonPartsDUMMY { getPolygonPartsDUMMY {
        ${typeof resultSelector === "function" ? resultSelector(new PolygonPartRecordModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetEstimatedSize(variables: { data: GetExportEstimatedSizeInput }, resultSelector: string | ((qb: EstimatedSizeModelSelector) => EstimatedSizeModelSelector) = estimatedSizeModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getEstimatedSize: EstimatedSizeModelType}>(`query getEstimatedSize($data: GetExportEstimatedSizeInput!) { getEstimatedSize(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new EstimatedSizeModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetFreeDiskSpace(variables: { data: GetFreeDiskSpaceInput }, resultSelector: string | ((qb: FreeDiskSpaceModelSelector) => FreeDiskSpaceModelSelector) = freeDiskSpaceModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getFreeDiskSpace: FreeDiskSpaceModelType}>(`query getFreeDiskSpace($data: GetFreeDiskSpaceInput!) { getFreeDiskSpace(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new FreeDiskSpaceModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryTriggerExportTask(variables: { data: TriggerExportTaskInput }, resultSelector: string | ((qb: TriggerExportTaskModelSelector) => TriggerExportTaskModelSelector) = triggerExportTaskModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ triggerExportTask: TriggerExportTaskModelType}>(`query triggerExportTask($data: TriggerExportTaskInput!) { triggerExportTask(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new TriggerExportTaskModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetExternalServices(variables?: {  }, resultSelector: string | ((qb: ExternalServiceModelSelector) => ExternalServiceModelSelector) = externalServiceModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getExternalServices: ExternalServiceModelType[]}>(`query getExternalServices { getExternalServices {
        ${typeof resultSelector === "function" ? resultSelector(new ExternalServiceModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryJobs(variables: { params?: JobsSearchParams }, resultSelector: string | ((qb: JobModelSelector) => JobModelSelector) = jobModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ jobs: JobModelType[]}>(`query jobs($params: JobsSearchParams) { jobs(params: $params) {
        ${typeof resultSelector === "function" ? resultSelector(new JobModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryJob(variables: { id: string }, resultSelector: string | ((qb: JobModelSelector) => JobModelSelector) = jobModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ job: JobModelType}>(`query job($id: String!) { job(id: $id) {
        ${typeof resultSelector === "function" ? resultSelector(new JobModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetLookupTablesData(variables: { data: GetLookupTablesParams }, resultSelector: string | ((qb: LookupTableDataModelSelector) => LookupTableDataModelSelector) = lookupTableDataModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getLookupTablesData: LookupTableDataModelType}>(`query getLookupTablesData($data: GetLookupTablesParams!) { getLookupTablesData(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new LookupTableDataModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetClusterServices(variables?: {  }, resultSelector: string | ((qb: DeploymentWithServicesModelSelector) => DeploymentWithServicesModelSelector) = deploymentWithServicesModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getClusterServices: DeploymentWithServicesModelType[]}>(`query getClusterServices { getClusterServices {
        ${typeof resultSelector === "function" ? resultSelector(new DeploymentWithServicesModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetDirectory(variables: { data: ExplorerGetByPath }, resultSelector: string | ((qb: FileModelSelector) => FileModelSelector) = fileModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getDirectory: FileModelType[]}>(`query getDirectory($data: ExplorerGetByPath!) { getDirectory(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new FileModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetDirectoryById(variables: { data: ExplorerGetById }, resultSelector: string | ((qb: FileModelSelector) => FileModelSelector) = fileModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getDirectoryById: FileModelType[]}>(`query getDirectoryById($data: ExplorerGetById!) { getDirectoryById(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new FileModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetFile(variables: { data: ExplorerGetByPath }, resultSelector: string | ((qb: LayerMetadataMixedModelSelector) => LayerMetadataMixedModelSelector) = layerMetadataMixedModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getFile: LayerMetadataMixedUnion}>(`query getFile($data: ExplorerGetByPath!) { getFile(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new LayerMetadataMixedModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryResolveMetadataAsModel(variables: { data: ExplorerResolveMetadataAsModel }, resultSelector: string | ((qb: LayerMetadataMixedModelSelector) => LayerMetadataMixedModelSelector) = layerMetadataMixedModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ resolveMetadataAsModel: LayerMetadataMixedUnion}>(`query resolveMetadataAsModel($data: ExplorerResolveMetadataAsModel!) { resolveMetadataAsModel(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new LayerMetadataMixedModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetFileById(variables: { data: ExplorerGetById }, resultSelector: string | ((qb: LayerMetadataMixedModelSelector) => LayerMetadataMixedModelSelector) = layerMetadataMixedModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getFileById: LayerMetadataMixedUnion}>(`query getFileById($data: ExplorerGetById!) { getFileById(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new LayerMetadataMixedModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetDecryptedId(variables: { data: ExplorerGetById }, resultSelector: string | ((qb: DecryptedIdModelSelector) => DecryptedIdModelSelector) = decryptedIdModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getDecryptedId: DecryptedIdModelType}>(`query getDecryptedId($data: ExplorerGetById!) { getDecryptedId(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new DecryptedIdModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryTasks(variables: { params?: TasksSearchParams }, resultSelector: string | ((qb: TasksGroupModelSelector) => TasksGroupModelSelector) = tasksGroupModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ tasks: TasksGroupModelType[]}>(`query tasks($params: TasksSearchParams) { tasks(params: $params) {
        ${typeof resultSelector === "function" ? resultSelector(new TasksGroupModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetFeature(variables: { data: WfsGetFeatureParams }, resultSelector: string | ((qb: GetFeatureModelSelector) => GetFeatureModelSelector) = getFeatureModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getFeature: GetFeatureModelType}>(`query getFeature($data: WfsGetFeatureParams!) { getFeature(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new GetFeatureModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetFeatureTypes(variables?: {  }, resultSelector: string | ((qb: GetFeatureTypesModelSelector) => GetFeatureTypesModelSelector) = getFeatureTypesModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getFeatureTypes: GetFeatureTypesModelType}>(`query getFeatureTypes { getFeatureTypes {
        ${typeof resultSelector === "function" ? resultSelector(new GetFeatureTypesModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryGetPointsHeights(variables: { data: GetDemPointsHeightsInput }, resultSelector: string | ((qb: PositionsWithHeightsModelSelector) => PositionsWithHeightsModelSelector) = positionsWithHeightsModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getPointsHeights: PositionsWithHeightsModelType}>(`query getPointsHeights($data: GetDemPointsHeightsInput!) { getPointsHeights(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new PositionsWithHeightsModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryServicesAvailability(variables?: {  }, options: QueryOptions = {}) {
      return self.query<{ servicesAvailability: any }>(`query servicesAvailability { servicesAvailability }`, variables, options)
    },
    queryGetPolygonPartsFeature(variables: { data: WfsPolygonPartsGetFeatureParams }, resultSelector: string | ((qb: GetFeatureModelSelector) => GetFeatureModelSelector) = getFeatureModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ getPolygonPartsFeature: GetFeatureModelType}>(`query getPolygonPartsFeature($data: WfsPolygonPartsGetFeatureParams!) { getPolygonPartsFeature(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new GetFeatureModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryLogin(variables: { data: UserLoginParams }, resultSelector: string | ((qb: UserLoginModelSelector) => UserLoginModelSelector) = userLoginModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ login: UserLoginModelType}>(`query login($data: UserLoginParams!) { login(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new UserLoginModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryValidateSource(variables: { data: SourceValidationParams }, resultSelector: string | ((qb: SourceValidationModelSelector) => SourceValidationModelSelector) = sourceValidationModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ validateSource: SourceValidationModelType[]}>(`query validateSource($data: SourceValidationParams!) { validateSource(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new SourceValidationModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    queryValidateGPKGSource(variables: { data: SourceGpkgValidationParams }, resultSelector: string | ((qb: SourceValidationModelSelector) => SourceValidationModelSelector) = sourceValidationModelPrimitives.toString(), options: QueryOptions = {}) {
      return self.query<{ validateGPKGSource: SourceValidationModelType[]}>(`query validateGPKGSource($data: SourceGPKGValidationParams!) { validateGPKGSource(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new SourceValidationModelSelector()).toString() : resultSelector}
      } }`, variables, options)
    },
    mutateUpdateStatus(variables: { data: RecordUpdatePartial }, optimisticUpdate?: () => void) {
      return self.mutate<{ updateStatus: string }>(`mutation updateStatus($data: RecordUpdatePartial!) { updateStatus(data: $data) }`, variables, optimisticUpdate)
    },
    mutateUpdateMetadata(variables: { data: RecordUpdatePartial }, optimisticUpdate?: () => void) {
      return self.mutate<{ updateMetadata: string }>(`mutation updateMetadata($data: RecordUpdatePartial!) { updateMetadata(data: $data) }`, variables, optimisticUpdate)
    },
    mutateStartRasterIngestion(variables: { data: IngestionRasterData }, resultSelector: string | ((qb: RasterIngestionModelSelector) => RasterIngestionModelSelector) = rasterIngestionModelPrimitives.toString(), optimisticUpdate?: () => void) {
      return self.mutate<{ startRasterIngestion: RasterIngestionModelType}>(`mutation startRasterIngestion($data: IngestionRasterData!) { startRasterIngestion(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new RasterIngestionModelSelector()).toString() : resultSelector}
      } }`, variables, optimisticUpdate)
    },
    mutateStartRasterUpdateGeopkg(variables: { data: IngestionRasterData }, resultSelector: string | ((qb: RasterIngestionModelSelector) => RasterIngestionModelSelector) = rasterIngestionModelPrimitives.toString(), optimisticUpdate?: () => void) {
      return self.mutate<{ startRasterUpdateGeopkg: RasterIngestionModelType}>(`mutation startRasterUpdateGeopkg($data: IngestionRasterData!) { startRasterUpdateGeopkg(data: $data) {
        ${typeof resultSelector === "function" ? resultSelector(new RasterIngestionModelSelector()).toString() : resultSelector}
      } }`, variables, optimisticUpdate)
    },
    mutateStart3DIngestion(variables: { data: Ingestion3DData }, optimisticUpdate?: () => void) {
      return self.mutate<{ start3DIngestion: string }>(`mutation start3DIngestion($data: Ingestion3DData!) { start3DIngestion(data: $data) }`, variables, optimisticUpdate)
    },
    mutateStartDemIngestion(variables: { data: IngestionDemData }, optimisticUpdate?: () => void) {
      return self.mutate<{ startDemIngestion: string }>(`mutation startDemIngestion($data: IngestionDemData!) { startDemIngestion(data: $data) }`, variables, optimisticUpdate)
    },
    mutateDeleteLayer(variables: { data: RecordDeletePartial }, optimisticUpdate?: () => void) {
      return self.mutate<{ deleteLayer: string }>(`mutation deleteLayer($data: RecordDeletePartial!) { deleteLayer(data: $data) }`, variables, optimisticUpdate)
    },
    mutateUpdateJob(variables: { data: JobUpdateData, id: string }, optimisticUpdate?: () => void) {
      return self.mutate<{ updateJob: string }>(`mutation updateJob($data: JobUpdateData!, $id: String!) { updateJob(data: $data, id: $id) }`, variables, optimisticUpdate)
    },
    mutateJobRetry(variables: { id: string }, optimisticUpdate?: () => void) {
      return self.mutate<{ jobRetry: string }>(`mutation jobRetry($id: String!) { jobRetry(id: $id) }`, variables, optimisticUpdate)
    },
    mutateJobAbort(variables: { id: string }, optimisticUpdate?: () => void) {
      return self.mutate<{ jobAbort: string }>(`mutation jobAbort($id: String!) { jobAbort(id: $id) }`, variables, optimisticUpdate)
    },
    mutateFindTasks(variables: { params?: TasksSearchParams }, resultSelector: string | ((qb: TaskModelSelector) => TaskModelSelector) = taskModelPrimitives.toString(), optimisticUpdate?: () => void) {
      return self.mutate<{ findTasks: TaskModelType[]}>(`mutation findTasks($params: TasksSearchParams) { findTasks(params: $params) {
        ${typeof resultSelector === "function" ? resultSelector(new TaskModelSelector()).toString() : resultSelector}
      } }`, variables, optimisticUpdate)
    },
  })))
