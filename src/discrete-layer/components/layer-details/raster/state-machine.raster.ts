//@ts-nocheck
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import path from 'path';
// import shp from 'shpjs';
import {
  // ActionArgs,
  assign,
  createMachine,
  EventObject,
  fromPromise,
  PromiseActorRef,
  sendParent,
  SnapshotFrom
} from 'xstate';
import { AnyActorSystem } from 'xstate/dist/declarations/src/system';
import { Mode } from '../../../../common/models/mode.enum';
import { getFirstPoint } from '../../../../common/utils/geo.tools';
import { IBaseRootStore, IRootStore, RecordType, SourceValidationModelType } from '../../../models';
import { FeatureType } from './pp-map.utils';

export interface IErrorEntry {
  source: "formik" | "api" | "logic";
  code: string;
  message: string;
  level: "error" | "warning";
  field?: string;
  addPolicy?: "merge" | "override";
  response?: Record<string,unknown>;
}

interface IFileDetails {
  updateDate: Date;
  size: number;
}

interface IFileBase {
  path: string;
  details: IFileDetails;
  exists: boolean;
}

interface IGeoDetails {
  geoDetails?: {
    feature: Feature<Geometry, GeoJsonProperties>;
    marker: Feature<Geometry, GeoJsonProperties>;
  }
}

interface IGPKGFile extends IFileBase, IGeoDetails {
  validationResult?: SourceValidationModelType;
}

interface IProductFile extends IFileBase, IGeoDetails {
  data: File;
}

interface Context {
  flowType?: Mode.NEW | Mode.UPDATE;
  formData?: Record<string, any>;
  jobId?: string;
  jobStatus?: string;
  autoMode?: boolean;
  errors: IErrorEntry[];
  store: IRootStore | IBaseRootStore;
  files?: {
    gpkg?: IGPKGFile;
    product?: IProductFile;
    metadata?: IFileBase;
  }
}

export type Events =
  | { type: "START_NEW" }
  | { type: "START_UPDATE" }
  | { type: "RESTORE"; jobId: string }
  | { type: "SELECT_GPKG"; file: IGPKGFile }
  | { type: "SET_GPKG"; file: IGPKGFile }
  | { type: "SET_GPKG_VALIDATION"; res: SourceValidationModelType }
  | { type: "AUTO" }
  | { type: "MANUAL" }
  | { type: "SELECT_PRODUCT"; file: File }
  | { type: "SET_PRODUCT"; res: IProductFile }
  | { type: "SELECT_METADATA"; file: File }
  | { type: "SET_METADATA"; res: IFileBase }
  | { type: "DONE" }
  | { type: "UPDATE_FORM"; data: Record<string, any> }
  | { type: "SUBMIT" }
  | { type: "RETRY" }
  | { type: "FORMIK_ERROR"; errors: Record<string, string> }
  | { type: "FLOW_ERROR"; error: IErrorEntry };


// type FlowActionArgs = ActionArgs<Context, Events, Events>;

type FromPromiseArgs<TInput> = {
  input: {
    context: TInput;
  };
  system: AnyActorSystem;
  self: PromiseActorRef<any>;
  signal: AbortSignal;
  emit: (emitted: EventObject) => void;
};

export enum STATE_TAGS {
  GENERAL_LOADING = 'GENERAL_LOADING'
}

const FIRST = 0;

// --- Helpers ---
const addError = assign({
  errors: (ctx: Context, e) => [...ctx.errors, e]
});

const warnUnexpectedStateEvent = (_: any) => {
  //@ts-ignore
  console.warn(`[StateMachine] Unexpected event '${_.event.type}' in state '${_.self._snapshot.value}'`);
};

export const hasLoadingTagDeep = (state: SnapshotFrom<typeof workflowMachine>, tag = STATE_TAGS.GENERAL_LOADING): boolean => {
  // check current state tags
  if (state.hasTag(tag)) return true;

  // check all children recursively
  for (const child of Object.values(state.children)) {
    const childSnap = child.getSnapshot?.();
    if (childSnap && hasLoadingTagDeep(childSnap)) {
      return true;
    }
  }

  return false;
}

// --- verifyGpkg states ---
const verifyGpkgStates = {
  verifying: {
    entry: (ctx: Context) => console.log(">>> verifying entry", ctx),
    tags: [STATE_TAGS.GENERAL_LOADING],
    invoke: {
      id: "verifyGpkgApi",
      src: fromPromise(async ({ input }: FromPromiseArgs<Context>) => {
        console.log("[verifyGpkgApi] ctx.input", input);

        if (!input.context.files?.gpkg) {
          throw new Error("No file selected");
        }

        // Call into MobX-State-Tree store
        const res = await input.context.store.queryValidateSource({
          data: {
            fileNames: [path.basename(input.context.files.gpkg.path)],
            originDirectory: path.dirname(input.context.files.gpkg.path),
            type: RecordType.RECORD_RASTER,
          }
        });

        if (!res.validateSource[FIRST].isValid) {
          throw ({
            source: "logic",
            code: "ingestion.error.invalid-source-file",
            message: res.validateSource[FIRST].message as string,
            level: "error",
            addPolicy: "override"
          });
        }

        const validationResult = { ...res.validateSource[FIRST] };

        let extentPolygon = validationResult.extentPolygon;
        extentPolygon = {
          type: 'Feature',
          properties: {
            featureType: FeatureType.SOURCE_EXTENT
          },
          geometry: {
            ...extentPolygon
          },
        };

        const result = {
          validationResult,
          geoDetails: {
            feature: extentPolygon,
            marker: {
              type: 'Feature',
              properties: {
                featureType: FeatureType.SOURCE_EXTENT_MARKER
              },
              geometry: {
                coordinates: getFirstPoint((extentPolygon as Feature).geometry),
                type: 'Point'
              },
            }
          }
        };

        // return whatever you want to flow into `onDone`
        return result;
      }),
      input: (ctx: Context) => ctx, 
      onDone: { 
        target: "success",
        actions: [
          assign({
            files: (_) => ({
              ..._.context.files,
              gpkg: {
                ..._.context.files.gpkg,
                ..._.event.output
              }
            })
          }),
          sendParent((_: { context: Context; event: any }) => ({
            type: "SET_GPKG_VALIDATION",
            res: _.event.output.validationResult
          }))
        ]
      },
      onError: { target: "failure" }
    }
  },

  success: {
    type: "final"
  },

  failure: {
    entry: 
      sendParent((_: { context: Context; event: any }) => {
        let errObj = {
          type: "FLOW_ERROR",
          error:  {..._.event.error}
        };

        if (_.event.error.response) {
          errObj = {
            type: "FLOW_ERROR",
            error:  {
              source: "api",
              code: "ingestion.error.invalid-source-file",
              message: 'SHOULD_BE_OMMITED',
              response: _.event.error.response,
              level: "error",
              addPolicy: "override"
            }
          }
        }
        return errObj;
        }),
    type: "final"
  }
};
// --- reusable file selection states ---
const fileSelectionStates = {
  idle: {},
  fetchProduct: {
    entry: (ctx: Context) => console.log(">>> fetchProduct entry", ctx),
    tags: [STATE_TAGS.GENERAL_LOADING],
    invoke: {
      src: fromPromise(async ({ input }: FromPromiseArgs<Context>) => {
        console.log("[fileSelectionStates.fetchProduct] ctx.input", input);

        if (!input.context.files?.product) {
          throw new Error("No product file selected");
        }

        // const res = await input.context.store.queryGetFile({
        //   data: {
        //     pathSuffix: input.context.files?.product.path, //input.context.files.gpkg.path + '/Product.shp',
        //     type: RecordType.RECORD_RASTER,
        //   },
        // });

        // const outlinedPolygon = await shp(res.getFile[FIRST]);
        let outlinedPolygon = {
          bbox: [47.5116117000133,29.7960044289981,48.4333988970044,32.1668865940011],
          type: 'MultiPolygon',
          coordinates: [[[[47.5147944627018,31.9032162520446],[47.5148023039116,31.903217113716],[47.514812422706,31.903219025043896],[47.51482045559,31.9032212158304],[47.5148291384753,31.9032242803781],[47.5148383794212,31.903228467711404],[47.514844821116,31.903231981124],[47.51486657662771,31.9032415587733],[47.5148665993016,31.9032415453756],[47.5148730079713,31.903244386481198],[47.5148721703646,31.9032463049523],[47.5148650811046,31.903243219486605],[47.51487996728151,31.9032672142869],[47.5148836635104,31.9032746869777],[47.5150626684678,31.903677882122704],[47.5159788499439,31.905741477721104],[47.5159835079741,31.905751976569405],[47.515986111176,31.905758949431398],[47.5159880745224,31.9057665022075],[47.5159884956368,31.905769160382302],[47.5159894360915,31.9057755495349],[47.5159900213074,31.9057876245556],[47.51600488293,31.9057997171705],[47.5159890184013,31.9059175642093],[47.5158571930478,31.930106163339204],[47.5155248000084,31.9911053],[47.6642651999055,31.9911053],[47.7112811051373,31.991694755788703],[47.7257171851454,31.991875738829105],[47.7257172248555,31.991875209469505],[47.7257449465193,31.9918760806585],[47.725749692855,31.9918763094206],[47.7257559660324,31.991871731144695],[47.7257577932062,31.991875781795002],[47.7257578988844,31.9918760160724],[47.7257583301002,31.991877038710395],[47.7257628085419,31.991877536469705],[47.7257712989927,31.9918791407344],[47.7257800103456,31.991881453054102],[47.7257885499502,31.9918844670322],[47.7257972104877,31.991888373547305],[47.7258001212005,31.991893006222405],[47.7258040654141,31.991892044780304],[47.7258120494647,31.9918972664627],[47.7258184946029,31.991902299655404],[47.7258250872461,31.991908376173896],[47.7258307999117,31.9919147009108],[47.725835245303,31.9919206577351],[47.7258400517054,31.991928527115995],[47.725843088339,31.991934774003404],[47.7258449942055,31.99193990534],[47.7258471971336,31.991945739546203],[47.725849269609505,31.9919452163064],[47.72585096084,31.991954216188905],[47.725850588447,31.991953956782304],[47.725851507495,31.991957070064203],[47.725855009843,31.991975707808304],[47.7258527161749,31.9919763251554],[47.7258498024845,31.991967975239703],[47.72585013612011,31.991980077996004],[47.7258792279364,31.993038012888604],[47.7258790402746,31.9930381594743],[47.7258792118888,31.993050573273603],[47.725879214,31.9931157190216],[47.725879542,32.0169578570001],[47.7258795440001,32.0170573300001],[47.7258803800485,32.0776230152004],[47.7258804001416,32.0789959540035],[47.8003101403916,32.0789959540003],[47.90097385924581,32.0791288547434],[47.9009830236696,32.079129202418],[47.9009872124385,32.0791324704897],[47.9009913838525,32.0791297985486],[47.900991206534904,32.0791301201532],[47.9010006060613,32.0791318977853],[47.9010100641062,32.0791344623349],[47.9010101979604,32.0791339342748],[47.901012167976,32.0791352258209],[47.9010173816845,32.079137063211],[47.9010197380491,32.0791416304894],[47.9010261694308,32.079140928393],[47.9010340611183,32.0791452443366],[47.9010410653257,32.0791498208137],[47.9010477050201,32.0791550271952],[47.9010483282326,32.07915480896],[47.9010493108394,32.0791601792043],[47.9010542110135,32.0791609785676],[47.9010589687945,32.0791662582243],[47.9010607777438,32.0791684173126],[47.9010652754536,32.0791743272034],[47.9010644034639,32.0791782040356],[47.9010717116396,32.0791822573618],[47.9010729727304,32.0791889533133],[47.901075039959906,32.0791944118723],[47.9010745630287,32.0791956159136],[47.9010747251668,32.0791958215467],[47.9010741890105,32.0791962345977],[47.9010734768453,32.0791978055074],[47.901077558961504,32.0792037277054],[47.9010787378595,32.0792110958176],[47.9010790960225,32.0792179009153],[47.9011364845179,32.0878535697551],[47.9016617289959,32.1668865939982],[48.0748996000058,32.1668865940011],[48.074907499987,32.0799722419997],[48.074907904750404,32.079964247921104],[48.07490911318511,32.079956393096],[48.0749111077167,32.0799487141496],[48.074913810398,32.0799414748244],[48.0749177357431,32.0799334828977],[48.0749223147588,32.0799310126136],[48.0749214313849,32.0799273713389],[48.0749313601685,32.0799141270777],[48.0749295375094,32.0799107095589],[48.0749367865039,32.0799068100256],[48.0749408921931,32.0799013441521],[48.0749433912194,32.079903228686],[48.0749610204066,32.0798937137607],[48.0749651596466,32.079894948279],[48.0749685615416,32.0798903417356],[48.0749770763891,32.079887335123],[48.07497807188871,32.0798862133065],[48.07497958542431,32.0798845217748],[48.0749812471752,32.0798826645974],[48.0749812334158,32.0798827132648],[48.0749869834319,32.0798762702175],[48.0750019759647,32.0798796761495],[48.074983029932206,32.079883250605],[48.0749832578252,32.0798847234455],[48.0750034000754,32.0798822833946],[48.0806494560619,32.0794135380518],[48.0856734435293,32.0789964171002],[48.0856789144805,32.0789960773622],[48.0856848634842,32.0789959540011],[48.250682099999,32.0789959540016],[48.25068239962721,32.0573542683012],[48.25068329700011,31.99232165319],[48.2506832906254,31.9922902254212],[48.2506840246894,31.992276574476797],[48.2506840544009,31.992276666081302],[48.2506869214327,31.992265652122803],[48.2506903637226,31.992264035423304],[48.2506895146514,31.992258724334103],[48.2506946562672,31.992247976619804],[48.250710363186,31.9922267285931],[48.2507117857518,31.992227796230004],[48.2507258490494,31.992214731559695],[48.2507212673507,31.992220348163904],[48.2507281162185,31.9922155171853],[48.2507362388706,31.992211074219405],[48.2507448285164,31.9922073056861],[48.2507520778792,31.9922047857791],[48.2507554272617,31.9921997787111],[48.2507615920727,31.992202109157102],[48.2507708122159,31.992200376503895],[48.2507784180256,31.9921994710504],[48.2507878940118,31.992199050514003],[48.338403982,31.991108081999997],[48.3384494109947,31.9911075163611],[48.3385154918046,31.991106666231303],[48.33852148907061,31.991106600013],[48.4264645690011,31.991105300003404],[48.4264667417017,31.9421418655833],[48.4264684000035,31.904229980758004],[48.4264688226496,31.9042217391581],[48.4264698837669,31.9042148418956],[48.4264720188711,31.9042066217447],[48.4264747044203,31.904199428309404],[48.4264784091098,31.9041917013855],[48.4264825118973,31.9041850224293],[48.4264874072164,31.9041784287339],[48.4264930630823,31.9041721612001],[48.4264994600912,31.904166204691503],[48.4265054899481,31.904161417123298],[48.4265067121013,31.904160597481102],[48.4265132014086,31.9041563485736],[48.42652194734901,31.9041515955408],[48.426529037556,31.904148446937704],[48.4265376627091,31.904145400146096],[48.4265473050893,31.904142806481797],[48.4265544460451,31.9041414576346],[48.4265639742477,31.9041400964629],[48.4284719173235,31.9038877146338],[48.4333714639999,31.903239568995804],[48.433375804,31.584348222000102],[48.433375804,31.5842858440898],[48.4333774,31.465753620000005],[48.4333774,31.4657496960896],[48.4333777140001,31.442360819000097],[48.4333777150001,31.442292912],[48.4333836700001,30.9929869010001],[48.4333836710001,30.992964295],[48.4333844060001,30.9367824470001],[48.4333844060001,30.9367629580872],[48.433384775,30.908546991],[48.433384775,30.908537349087],[48.4333851740001,30.877944228000004],[48.433385175000105,30.877887223000105],[48.4333865770001,30.7699662520001],[48.4333865790001,30.769863215999997],[48.4333883620001,30.63181988],[48.4333883620001,30.6318158980847],[48.4333955390001,30.066275957000105],[48.43339554,30.066149568000096],[48.4333962700001,30.0077699280001],[48.4333962700001,30.007764476082997],[48.4333973020001,29.9248112280001],[48.433397304,29.924659055000102],[48.433397337,29.921990467],[48.4333973390001,29.921813258],[48.433397713,29.891752566],[48.4333977140001,29.891637735000103],[48.4333988970044,29.7960044289981],[48.3410849170034,29.7960044289981],[48.3410846139999,29.882859871624298],[48.341084233274906,29.8828674890305],[48.341082919098,29.882876373408],[48.3410899514416,29.882862096113602],[48.3410918650912,29.882863033550905],[48.3410730590848,29.882901627854597],[48.3410645232739,29.882913329897598],[48.3410775352421,29.8829039552926],[48.3410787770153,29.8829056661754],[48.3410541177293,29.8829236602176],[48.3410480238436,29.882928530184603],[48.3410368039856,29.8829360640719],[48.3410251227467,29.882941386732096],[48.3410161608467,29.882944625973195],[48.3410130995232,29.8829429715012],[48.3410097011786,29.882946396529803],[48.3410006812129,29.8829482940189],[48.33888240026981,29.883321430509],[48.3356441493394,29.883891899571005],[48.335633766574,29.8838935608137],[48.3356287983147,29.883891215152403],[48.3356250103171,29.883894703178303],[48.3356162145338,29.883895038999597],[48.2531852975145,29.883895039000503],[48.2526757863085,29.8918670414792],[48.2526763407328,29.891867076913805],[48.252677425811,29.891866947884502],[48.2526779564649,29.891866783420404],[48.2526751442319,29.891876937240802],[48.2526747165413,29.8918837301334],[48.2526692434486,29.8918834383904],[48.2526744180012,29.891887196678997],[48.2526572659144,29.891910656574197],[48.2526308873989,29.8919450781059],[48.2526293885773,29.891943948478502],[48.2526322095222,29.8919401376803],[48.25263221179411,29.8919401454525],[48.2526435918033,29.8919247864437],[48.2526333100874,29.891931699386202],[48.2526303156821,29.891933658999296],[48.2526312977564,29.8919370185999],[48.2526096567928,29.8919429729657],[48.2526083242409,29.891943348984398],[48.252608424036,29.891943578635395],[48.2525781367859,29.891951095673395],[48.2525774889179,29.891948621250897],[48.2525682267634,29.891948989030404],[48.252568191944604,29.891948819315502],[47.8137413010005,29.888755946],[47.8132573298523,29.9715171496217],[47.8132566433026,29.971518127773102],[47.8132609092675,29.971519709569105],[47.8132511544496,29.9715467043902],[47.8132475575092,29.971554265348303],[47.813246741610506,29.9715554678208],[47.8132432868465,29.9715614002848],[47.8132391351164,29.971566992411102],[47.8132382922665,29.971567871828103],[47.8132371974439,29.9715681491046],[47.81323434759,29.9715685030822],[47.813233227309,29.971573860808],[47.8132268077286,29.9715799646714],[47.8132226396502,29.9715799205228],[47.8132208347985,29.971585705647602],[47.8132199993726,29.971585296362605],[47.8132129358705,29.9715900541633],[47.81320532938731,29.9715942086792],[47.8131978666953,29.9715975900661],[47.8131885357771,29.9716009892997],[47.8131867134732,29.971601213896502],[47.8131868320186,29.971604795986302],[47.8131537295537,29.9716062002266],[47.812540350627,29.971606608189095],[47.8095462003925,29.971608648753403],[47.8133278481615,30.441727202208604],[47.8142315100028,30.5540653879994],[47.7941960931257,30.598816788650904],[47.63117960000001,30.962932899999],[47.5116117000133,31.9032157998941],[47.5126416281303,31.9032158324732],[47.5147842091696,31.903215875095],[47.5147944627018,31.9032162520446]]],[[[47.7258483506569,31.991979502815],[47.725846307104,31.9919579165804],[47.7258457602151,31.9919563561843],[47.7258201322851,31.9919612559575],[47.7258483506569,31.991979502815]]],[[[47.7258424389018,31.991946989594602],[47.7258349435489,31.9919256036773],[47.7258188890528,31.991953121369804],[47.7258424389018,31.991946989594602]]],[[[47.5148616850911,31.903241774493],[47.5148531243642,31.9032380679407],[47.5148549215866,31.903242377468505],[47.5148616850911,31.903241774493]]]]
        };
        outlinedPolygon = {
          type: 'Feature',
          properties: {
            featureType: FeatureType.PP_PERIMETER
          },
          geometry: {
            ...outlinedPolygon
          },
        };
        const result = {
          // data: new File(res.getFile[FIRST], path.basename(_.context.files.product.path)),
          geoDetails: {
            feature: outlinedPolygon,
            marker: {
              type: 'Feature',
              properties: {
                featureType: FeatureType.PP_PERIMETER_MARKER
              },
              geometry: {
                coordinates: getFirstPoint((outlinedPolygon as Feature).geometry),
                type: 'Point'
              },
            }
          }
        };
        return result;
      }),
      input: (ctx: Context) => ctx,
      onDone: [
        {
          // target: "idle",
          // guard: (_, e) => e.data.gpkg && e.data.metadata,
          actions: [
            assign({
              files: (_) => ({
                ..._.context.files,
                product: {
                  ..._.context.files.product,
                  ..._.event.output
                }
              })
            }),
            sendParent((_: { context: Context; event: any }) => ({
              type: "SET_PRODUCT",
              res:  {
                ..._.context.files.product,
                ..._.event.output
              }
            }))
          ]
        }
      ],
      onError: {
        actions: sendParent((_: { context: Context; event: any }) => ({
          type: "FLOW_ERROR",
          error: {..._.event.error}
        }))
      }
    }
  },
  auto: {
    entry: (ctx: Context) => console.log(">>> auto entry", ctx),
    tags: [STATE_TAGS.GENERAL_LOADING],
    invoke: {
      src: fromPromise(async ({ input }: FromPromiseArgs<Context>) => {
        console.log("[fileSelectionStates.auto] ctx.input", input);

        if (!input.context.files?.gpkg) {
          throw new Error("No file selected");
        }

        // Call into MobX-State-Tree store
        const result = await input.context.store.queryGetDirectory({
          data: {
            pathSuffix: path.resolve(input.context.files.gpkg.path, '../../Shapes'),
            type: RecordType.RECORD_RASTER,
          },
        });

        const product = result.getDirectory
          .filter(file => file.name === 'Product.shp')
          .map(file => ({
            path: path.resolve(input.context.files.gpkg.path, '../../Shapes', `${file.name}.json`),
            details: {
              updateDate: file.updateDate,
              size: file.size
            },
            exists: true
          }))[FIRST];

        const metadata = result.getDirectory
          .filter(file => file.name === 'ShapeMetadata.shp')
          .map(file => ({
            path: path.resolve(input.context.files.gpkg.path, '../../Shapes', `${file.name}.json`),
            details: {
              updateDate: file.updateDate,
              size: file.size
            },
            exists: true
          }))[FIRST];

        return {
          product,
          metadata
        };
      }),
      input: (ctx: Context) => ctx,
      onDone: [
        {
          target: "fetchProduct",
          // guard: (_, e) => e.data.gpkg && e.data.metadata,
          actions: [
            assign({
              files: (_: { context: Context; event: any }) => ({
                ..._.context.files,
                product: {
                  ..._.context.files.product,
                  ..._.event.output.product
                },
                metadata: {
                  ..._.context.files.metadata,
                  ..._.event.output.metadata
                }
              })
            }),
            sendParent((_: { context: Context; event: any }) => ({
              type: "SET_METADATA",
              res: {
                ..._.context.files.metadata,
                ..._.event.output.metadata
              }
            }))
          ]
        }
      ],
      onError: {
        actions: sendParent((_: { context: Context; event: any }) => ({
          type: "FLOW_ERROR",
          error: {..._.event.error}
        }))
      }
    }
  },
  manual: {
    entry: assign((ctx: Context) => (ctx.files ? { files: ctx.files } : {})),
    always: { target: "idle" }, // you can add guard if needed
    on: {
      SELECT_PRODUCT: { actions: assign({ files: (ctx: Context, e) => ({ ...ctx.files, product: (e as any).file }) }) },
      SELECT_METADATA: { actions: assign({ files: (ctx: Context, e) => ({ ...ctx.files, metadata: (e as any).file }) }) },
      DONE: { 
        actions: sendParent((ctx, e) => ({
          type: "FLOW_SUBMIT",
          error: e.data ?? e
        })) 
      },
      "*": { actions: warnUnexpectedStateEvent }
    }
  }
};

// --- flow submachine ---
const flowMachine = createMachine({
  id: "flow",
  initial: "selectGpkg",
  context: (ctx: any) => ctx.input,
  states: {
    selectGpkg: {
      entry: () => console.log('>>> Enter selectGpkg'),
      on: {
        SELECT_GPKG: {
          target: "verifyGpkg",
          actions: [
            sendParent((_: { context: Context; event: any }) => ({
              type: "SET_GPKG",
              file:  _.event.file
            })),
            assign((_ctx) => ({
              files: {
                ..._ctx.context.files,
                gpkg: {..._ctx.event.file}
              } 
            }))
          ]
        },
        "*": { actions: warnUnexpectedStateEvent }
      }
    },

    verifyGpkg: {
      entry: () => console.log('>>> Enter verifyGpkg parent'),
      type: "compound",
      initial: "verifying",
      states: verifyGpkgStates as any,
      onDone: "modeSelection"
    },

    modeSelection: {
      entry: () => console.log('>>> Enter modeSelection parent'),
      type: "compound",
      initial: "auto",
      states: fileSelectionStates,
      on: {
        AUTO: ".auto",
        MANUAL: ".manual",
        "*": { actions: warnUnexpectedStateEvent }
      }
    },

    mapPreview: {
      invoke: {
        src: "downloadAndRenderProduct",
        input: (ctx: Context) => ctx.files?.product,
        onDone: "formFill",
        onError: {
          target: "error",
          actions: addError
        }
      }
    },

    formFill: {
      entry: assign((ctx: Context) => ({
        formData: ctx.formData ?? {}
      })),
      on: {
        UPDATE_FORM: {
          actions: assign({
            formData: (_, e) => (e as any).data
          })
        },
        FORMIK_ERROR: {
          actions: assign((ctx: Context, e: any) => ({
            errors: [
              ...ctx.errors,
              ...Object.entries(e.errors).map(([field, msg]) => ({
                source: "formik",
                code: `FIELD_${field}`,
                message: msg as string,
                level: "error",
                field
              }))
            ]
          }))
        },
        SUBMIT: {
          actions: sendParent({type: "FLOW_SUBMIT"}),
        },
        "*": { actions: warnUnexpectedStateEvent }
      }
    },

    // parent-level error (instead of child jumping out)
    error: {
      type: "atomic",
      on: {
        RETRY: "selectGpkg" // example recovery path
      }
    }
  }
});

// --- parent workflow machine ---
export const workflowMachine = createMachine({
  id: "workflow",
  initial: "idle",
  context: ({ input }) => ({
    ...input as Context,
    errors: []
  }),
  states: {
    idle: {
      on: {
        START_NEW: { target: "flow", actions: assign({ flowType: Mode.NEW }) },
        START_UPDATE: { target: "flow", actions: assign({ flowType: Mode.UPDATE }) },
        RESTORE: "restoreJob",
        "*": { actions: warnUnexpectedStateEvent }
      }
    },
    restoreJob: {
      invoke: {
        src: "fetchJobData",
        input: (_ctx: Context, e) => (e as any).jobId,
        onDone: {
          target: "restoredReplay",
          actions: assign((_, e) => ({
            flowType: e.data.flowType,
            gpkgFile: e.data.gpkg,
            files: e.data.files,
            formData: e.data.formData,
            autoMode: e.data.autoMode
          }))
        },
        onError: { target: "#workflow.error", actions: addError }
      }
    },
    restoredReplay: { always: "flow" },
    flow: {
      entry: () => console.log('>>> Entering flow state'),
      invoke: {
        id: "flow",              // child actor name
        src: flowMachine,        // reference to your submachine
        input: (ctx: Context) => {
          console.log('[flowMachine share context by data]', ctx);
          return (ctx as any).context;
        },
        // sync: true
      },
      on: {
        SET_GPKG: {
          actions: assign((_) => ({
            files: {
              ..._.context.files,
              gpkg: {..._.event.file}
            } 
          }))
        },
        SET_GPKG_VALIDATION: {
          actions: assign({
            files: (_) => ({
              ..._.context.files,
              gpkg: {
                ..._.context.files.gpkg,
                validationResult: {..._.event.res}
              }
            })
          })
        },
        SET_PRODUCT: {
          actions: assign({
            files: (_) => ({
              ..._.context.files,
              product: {
                ..._.event.res
              }
            })
          })
        },
        SET_METADATA: {
          actions: assign({
            files: (_) => ({
              ..._.context.files,
              metadata: {
                ..._.event.res
              }
            })
          })
        },
        // catch-all errors from any child state     
        FLOW_ERROR: { 
          // target: "error",
          actions: assign({ 
            errors: (_) => {
              return _.event.error.addPolicy === "merge" ? 
                [ ..._.context.errors, _.event.error] : 
                [_.event.error]
            }
          }) 
        },
        FLOW_SUBMIT: "jobSubmission"
      }
    },
    jobSubmission: {
      invoke: {
        src: "createJobApi",
        input: (ctx: Context) => ({ files: ctx.files, formData: ctx.formData, flowType: ctx.flowType }),
        onDone: { target: "jobPolling", actions: assign({ jobId: (_, e) => e.data.jobId }) },
        onError: { target: "#workflow.error", actions: addError }
      }
    },
    jobPolling: {
      invoke: {
        src: "pollJobStatus",
        input: (ctx: Context) => ctx.jobId,
        onDone: { target: "done", actions: assign({ jobStatus: (_, e) => e.data }) },
        onError: { target: "#workflow.error", actions: addError }
      }
    },
    done: { type: "final" },
    error: {
      on: {
        RETRY: "idle",
        "*": { actions: warnUnexpectedStateEvent }
      }
    }
  },
  // on: {
  //   FLOW_ERROR: { target: "#workflow.error", actions: addError },
  //   FLOW_SUBMIT: { target: "#workflow.jobSubmission" }
  // }
});
