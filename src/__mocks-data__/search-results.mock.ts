/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ILayerImage } from '../discrete-layer/models/layerImage';

export const createMockData = (count: number, prefix: string): ILayerImage[] => {
  const rowData: ILayerImage[] = [];
  for (let i = 0; i < count; i++) {
    // @ts-ignore
    rowData.push({
      id: i.toString(),
      productName: `${prefix}  ("name",${i})`,
      creationDate: new Date(),
      // description: '',
      footprint: {
        type: 'Polygon',
        coordinates: [[[]]],
      },
      // type: '',
      // source: '',
      // footprintShown: true,
      order: null,
    });
  }
  return rowData;
};

export const MOCK_DATA_IMAGERY_LAYERS_ISRAEL = [
  {
    id: 1,
    name: `Weizmann Institute of Science (Rehovot, Israel)`,
    creationDate: new Date('2018-02-13T13:39:55.400Z'),
    description: '',
    geojson: {
      type: 'Polygon',
      coordinates: [[
        [34.8076891807199, 31.9042863434239],
        [34.816135996859, 31.9042863434239],
        [34.816135996859,31.9118071956932],
        [34.8076891807199,31.9118071956932],
        [34.8076891807199,31.9042863434239],
      ]],
    },
    referenceSystem: '',
    imagingTimeStart: new Date(),
    imagingTimeEnd: new Date(),
    type: '',
    source: '',
    category: '',
    thumbnail: '',
    properties: {
      protocol: 'XYZ_LAYER',
      url: 'https://tiles.openaerialmap.org/5a852c072553e6000ce5ac8d/0/7950e2de-5d9e-49aa-adec-6e92384be0b9/{z}/{x}/{y}.png',
      meta: 'http://oin-hotosm.s3.amazonaws.com/5a852c072553e6000ce5ac8d/0/7950e2de-5d9e-49aa-adec-6e92384be0b9_meta.json'
    },
  },
  {
    id: 2,
    name: `Weizmann Institute of Science`,
    creationDate: new Date('2018-03-06T13:39:55.400Z'),
    description: '',
    geojson: {
      type: 'Polygon',
      coordinates: [[
        [34.8099445223518, 31.9061345394902],
        [34.8200994167574, 31.9061345394902],
        [34.8200994167574, 31.9106311613979],
        [34.8099445223518, 31.9106311613979],
        [34.8099445223518, 31.9061345394902],
      ]],
    },
    referenceSystem: '',
    imagingTimeStart: new Date(),
    imagingTimeEnd: new Date(),
    type: '',
    source: '',
    category: '',
    thumbnail: '',
    properties: {
      protocol: 'XYZ_LAYER',
      url: 'https://tiles.openaerialmap.org/5a9f90c42553e6000ce5ad6c/0/eee1a570-128e-4947-9ffa-1e69c1efab7c/{z}/{x}/{y}.png',
      meta: 'http://oin-hotosm.s3.amazonaws.com/5a9f90c42553e6000ce5ad6c/0/eee1a570-128e-4947-9ffa-1e69c1efab7c_meta.json'
    },
  },
  {
    id: 3,
    name: `Weizmann Institute Citrus orchard (Rehovot, Israel)`,
    creationDate: new Date('2018-02-13T13:39:55.400Z'),
    description: '',
    geojson: {
      type: 'Polygon',
      coordinates: [[
        [34.8106008249547, 31.9076273723004],
        [34.8137969069015, 31.9076273723004],
        [34.8137969069015, 31.9103791381117],
        [34.8106008249547, 31.9103791381117],
        [34.8106008249547, 31.9076273723004],
      ]],
    },
    referenceSystem: '',
    imagingTimeStart: new Date(),
    imagingTimeEnd: new Date(),
    type: '',
    source: '',
    category: '',
    thumbnail: '',
    properties: {
      protocol: 'XYZ_LAYER',
      url: 'https://tiles.openaerialmap.org/5a8316e22553e6000ce5ac7f/0/c3fcbe99-d339-41b6-8ec0-33d90ccca020/{z}/{x}/{y}.png',
      meta: 'http://oin-hotosm.s3.amazonaws.com/5a8316e22553e6000ce5ac7f/0/c3fcbe99-d339-41b6-8ec0-33d90ccca020_meta.json'
    },
  },
  {
    id: 4,
    name: `Weizmann Institute of Science (Rehovot II, Israel)`,
    creationDate: new Date('2018-02-13T16:39:55.400Z'),
    description: '',
    geojson: {
      type: 'Polygon',
      coordinates: [[
        [34.8043847068541, 31.9023297972932],
        [34.8142791322292, 31.9023297972932],
        [34.8142791322292, 31.9108796531516],
        [34.8043847068541, 31.9108796531516],
        [34.8043847068541, 31.9023297972932],
      ]],
    },
    referenceSystem: '',
    imagingTimeStart: new Date(),
    imagingTimeEnd: new Date(),
    type: '',
    source: '',
    category: '',
    thumbnail: '',
    properties: {
      protocol: 'XYZ_LAYER',
      url: 'https://tiles.openaerialmap.org/5a831b4a2553e6000ce5ac80/0/d02ddc76-9c2e-4994-97d4-a623eb371456/{z}/{x}/{y}.png',
      meta: 'http://oin-hotosm.s3.amazonaws.com/5a831b4a2553e6000ce5ac80/0/d02ddc76-9c2e-4994-97d4-a623eb371456_meta.json'
    },
  },
  {
    id: 5,
    name: `Solar tower (Rehovot, Israel)`,
    creationDate: new Date('2018-06-01T16:39:55.400Z'),
    description: '',
    geojson: {
      type:'MultiPolygon',
      coordinates:[
        [[
          [34.820514,31.90975],[34.820513,31.909689],[34.820549,31.909688],[34.82055,31.909749],[34.820514,31.90975]
        ]],
        [[
          [34.81642,31.913197],[34.816419,31.913136],[34.816383,31.913136],[34.816312,31.913138],[34.81631,31.913076],
          [34.816275,31.913077],[34.816239,31.913077],[34.816238,31.913047],[34.816166,31.913048],[34.816167,31.913079],
          [34.816095,31.91308],[34.816095,31.913049],[34.816059,31.91305],[34.816023,31.91305],[34.816021,31.912959],
          [34.816057,31.912958],[34.816056,31.912897],[34.81602,31.912897],[34.816017,31.912745],[34.815981,31.912745],
          [34.815873,31.912747],[34.815828,31.910458],[34.815864,31.910458],[34.815863,31.910397],[34.815899,31.910396],
          [34.815897,31.910274],[34.815861,31.910274],[34.815858,31.910122],[34.815822,31.910122],[34.815818,31.909939],
          [34.815854,31.909939],[34.815854,31.909908],[34.815889,31.909908],[34.815888,31.909847],[34.815924,31.909846],
          [34.815923,31.909816],[34.815888,31.909816],[34.815887,31.909786],[34.815851,31.909786],[34.815852,31.909817],
          [34.815816,31.909817],[34.815812,31.909634],[34.815848,31.909634],[34.815848,31.909603],[34.815883,31.909603],
          [34.815882,31.909542],[34.815954,31.909541],[34.815952,31.909449],[34.816167,31.909446],[34.816166,31.909354],
          [34.81882,31.909316],[34.818821,31.909377],[34.818893,31.909376],[34.818929,31.909376],[34.818929,31.909406],
          [34.819252,31.909402],[34.81925,31.90931],[34.819896,31.909301],[34.819896,31.909331],[34.819932,31.909331],
          [34.819933,31.909392],[34.820364,31.909386],[34.8204,31.909385],[34.820406,31.90969],[34.820442,31.90969],
          [34.820477,31.909689],[34.820479,31.909751],[34.820514,31.90975],[34.820515,31.909781],[34.820551,31.90978],
          [34.820608,31.912679],[34.820536,31.91268],[34.820539,31.912833],[34.820468,31.912834],[34.820471,31.912986],
          [34.820363,31.912988],[34.820366,31.913141],[34.81642,31.913197]
        ]]
      ],
      bbox:[34.815812,31.909301,34.820608,31.913197]
    },
    referenceSystem: '',
    imagingTimeStart: new Date(),
    imagingTimeEnd: new Date(),
    type: '',
    source: '',
    category: '',
    thumbnail: '',
    properties: {
      protocol: 'XYZ_LAYER',
      url: 'https://tiles.openaerialmap.org/5b1388c02b6a08001185f4f3/0/5b1388c02b6a08001185f4f4/{z}/{x}/{y}.png',
      meta: 'http://oin-hotosm.s3.amazonaws.com/5b1388c02b6a08001185f4f3/0/5b1388c02b6a08001185f4f4_meta.json'
    },
  },
  {
    id: 6,
    name: `Tel Aviv park (Israel)`,
    creationDate: new Date('2018-06-08T16:39:55.400Z'),
    description: '',
    geojson: {
      type:'MultiPolygon',
      coordinates:[[
        [
          [34.813942,32.041277],[34.813942,32.041233],[34.813916,32.041233],[34.813813,32.041235],[34.813812,32.041169],[34.813786,32.04117],
          [34.813785,32.041126],[34.81376,32.041126],[34.813734,32.041127],[34.813733,32.041061],[34.813707,32.041061],[34.813656,32.041062],
          [34.813653,32.040909],[34.813627,32.040909],[34.813602,32.04091],[34.8136,32.040844],[34.813575,32.040845],[34.813575,32.040866],
          [34.813549,32.040867],[34.813521,32.039446],[34.813624,32.039444],[34.813624,32.039423],[34.813649,32.039422],[34.813648,32.039378],
          [34.813751,32.039377],[34.81375,32.039311],[34.813775,32.039311],[34.813775,32.039289],[34.813852,32.039288],[34.813851,32.039266],
          [34.813928,32.039265],[34.81393,32.039331],[34.814161,32.039327],[34.81416,32.039284],[34.814211,32.039283],[34.814211,32.039261],
          [34.81457,32.039256],[34.81457,32.0393],[34.814801,32.039296],[34.8148,32.039253],[34.815236,32.039246],[34.815237,32.03929],
          [34.81534,32.039289],[34.81534,32.039267],[34.815468,32.039265],[34.815467,32.039243],[34.815749,32.039239],[34.81575,32.039283],
          [34.815853,32.039281],[34.815852,32.039238],[34.81598,32.039236],[34.816006,32.039235],[34.816007,32.039301],[34.816366,32.039296],
          [34.816392,32.039295],[34.816401,32.039733],[34.816426,32.039732],[34.816452,32.039732],[34.816475,32.040912],[34.816424,32.040913],
          [34.816428,32.041132],[34.816403,32.041132],[34.816403,32.041154],[34.816377,32.041154],[34.816378,32.041176],[34.816352,32.041177],
          [34.816353,32.041198],[34.816301,32.041199],[34.816302,32.041221],[34.816327,32.041221],[34.816328,32.041243],[34.814789,32.041265],
          [34.814788,32.041243],[34.814763,32.041243],[34.814763,32.041265],[34.814712,32.041266],[34.814711,32.041244],[34.814609,32.041245],
          [34.814609,32.041267],[34.813942,32.041277]
        ],
        [
          [34.814956,32.039316],[34.815058,32.039314],[34.815058,32.039293],[34.814955,32.039294],[34.814956,32.039316]
        ],
        [
          [34.814481,32.041247],[34.81448,32.041225],[34.814583,32.041224],[34.814583,32.041246],[34.814481,32.041247]
        ]
      ]],
      bbox :[34.813521,32.039235,34.816475,32.041277]
    },
    referenceSystem: '',
    imagingTimeStart: new Date(),
    imagingTimeEnd: new Date(),
    type: '',
    source: '',
    category: '',
    thumbnail: '',
    properties: {
      protocol: 'XYZ_LAYER',
      url: 'https://tiles.openaerialmap.org/5b25fa612b6a08001185f80f/0/5b25fa612b6a08001185f810/{z}/{x}/{y}.png',
      meta: 'http://oin-hotosm.s3.amazonaws.com/5b25fa612b6a08001185f80f/0/5b25fa612b6a08001185f810_meta.json'
    },
  },
  {
    id: 7,
    name: `Solar tower 3D (Rehovot, Israel)`,
    creationDate: new Date('2021-01-07T10:39:55.400Z'),
    description: '',
    geojson: {
      type:'Polygon',
      coordinates:[[
        [34.81576, 31.91132],
        [34.81901, 31.91126],
        [34.81904, 31.90932],
        [34.81569, 31.90938],
        [34.81576, 31.91132],
      ]],
    },
    referenceSystem: '',
    imagingTimeStart: new Date(),
    imagingTimeEnd: new Date(),
    type: '',
    source: '',
    category: '',
    thumbnail: '',
    properties: {
      protocol: '3D_LAYER',
      url: '/mock/Rehovot_solar_tileset/L16_31023/L16_31023.json',
      meta: 'NOT_DEFINED'
    },
  },
  {
    id: 8,
    name: `Trees 3D (Rehovot, Israel)`,
    creationDate: new Date('2021-01-07T10:39:55.400Z'),
    description: '',
    geojson: {
      type:'Polygon',
      coordinates:[[
        [34.82720, 31.91292],
        [34.83051, 31.91287],
        [34.83042, 31.91093],
        [34.82717, 31.91097],
        [34.82720, 31.91292],
      ]],
    },
    referenceSystem: '',
    imagingTimeStart: new Date(),
    imagingTimeEnd: new Date(),
    type: '',
    source: '',
    category: '',
    thumbnail: '',
    properties: {
      protocol: '3D_LAYER',
      url: '/mock/Rehovot_solar_tileset/L16_31023/L16_31023.json',
      meta: 'NOT_DEFINED'
    },
  },
];
