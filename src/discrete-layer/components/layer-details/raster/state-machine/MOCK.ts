export const MOCK_JOB = {
  "__typename": "Job",
  "id": "8b62987a-c1f7-4326-969e-ceca4c81b5aa",
  "resourceId": "elicy_test",
  "version": "1.0",
  "description": "",
  "parameters": {
    "metadata": {
      "srs": "4326",
      "grid": "2x1",
      "region": [
        "אלגיריה"
      ],
      "srsName": "WGS84GEO",
      "catalogId": "025d4fc6-3a01-4c6e-9606-e99fa12d185b",
      "productId": "elicy_test",
      "displayPath": "efb28079-6781-4c68-b4d0-d8ddfd8da42b",
      "productName": "elicy_test",
      "productType": "Orthophoto",
      "producerName": "IDFMU",
      "tileMimeType": "image/png",
      "transparency": "TRANSPARENT",
      "classification": "4",
      "tileOutputFormat": "PNG",
      "layerRelativePath": "025d4fc6-3a01-4c6e-9606-e99fa12d185b/efb28079-6781-4c68-b4d0-d8ddfd8da42b"
    },
    "partsData": [
      {
        "sensors": [
          "WV02"
        ],
        "sourceId": "10300500B7F94C00",
        "footprint": {
          "bbox": [
            34.453125,
            35.67305400967598,
            34.456225633621216,
            35.68359375
          ],
          "type": "Polygon",
          "coordinates": [
            [
              [
                34.45506289601326,
                35.6808565557003
              ],
              [
                34.453125,
                35.67305400967598
              ],
              [
                34.456225633621216,
                35.68359375
              ],
              [
                34.453125,
                35.68359375
              ],
              [
                34.45461764931679,
                35.68273410201073
              ],
              [
                34.45506289601326,
                35.6808565557003
              ]
            ]
          ]
        },
        "sourceName": "Cyprus_after_model22.3",
        "resolutionMeter": 1222.99,
        "resolutionDegree": 0.010986328125,
        "imagingTimeEndUTC": "2021-06-27T09:00:00.000Z",
        "imagingTimeBeginUTC": "2021-06-27T09:00:00.000Z",
        "sourceResolutionMeter": 0.48,
        "horizontalAccuracyCE90": 8.5
      }
    ],
    "inputFiles": {
      "gpkgFilesPath": ["test_dir/shaziri-orthophto-test.gpkg"],
      "productShapefilePath": "Shapes/Product.shp",
      "metadataShapefilePath": "Shapes/ShapeMetadata.shp"
    },
    "ingestionResolution": 0.010986328125,
    "additionalParams": {
      "jobTrackerServiceURL": "http://raster-core-int-job-tracker-service"
    }
  },
  "status": "Failed",
  "reason": "GPKG source /layerSources/ingestion-source/test_dir/blueMarble.gpkg does not exist.",
  "type": "Ingestion_New",
  "percentage": 75,
  "priority": 1000,
  "expirationDate": "1970-01-01T00:00:00.000Z",
  "internalId": "025d4fc6-3a01-4c6e-9606-e99fa12d185b",
  "producerName": null,
  "productName": "elicy_test",
  "productType": "ORTHOPHOTO",
  "created": "2025-09-29T06:32:43.694Z",
  "updated": "2025-09-29T08:40:52.442Z",
  "taskCount": 8,
  "completedTasks": 6,
  "failedTasks": 2,
  "expiredTasks": 0,
  "pendingTasks": 0,
  "inProgressTasks": 0,
  "isCleaned": false,
  "domain": "RASTER",
  "availableActions": null
}