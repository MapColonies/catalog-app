# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.0.1](https://github.com/MapColonies/catalog-app/compare/v3.0.0...v3.0.1) (2025-11-27)


### Bug Fixes

* helm ([#758](https://github.com/MapColonies/catalog-app/issues/758)) ([d4e615e](https://github.com/MapColonies/catalog-app/commit/d4e615e99b109127ece07bd1aa1cb9c915d94181))

## [3.0.0](https://github.com/MapColonies/catalog-app/compare/v2.24.1...v3.0.0) (2025-11-26)


### ⚠ BREAKING CHANGES

* new raster ingestion api ( MAPCO-8421 ) ([#711](https://github.com/MapColonies/catalog-app/issues/711))

### Features

* add delete dialog to 3D layer ([#675](https://github.com/MapColonies/catalog-app/issues/675)) ([78914a4](https://github.com/MapColonies/catalog-app/commit/78914a46ea6824d146cc6912da87f6a1bda6829f))
* find tasks (MAPCO-8436) ([#726](https://github.com/MapColonies/catalog-app/issues/726)) ([cdefd39](https://github.com/MapColonies/catalog-app/commit/cdefd3987ac6893e221775f6ea6d9872adcad13c))
* new raster ingestion api ( MAPCO-8421 ) ([#711](https://github.com/MapColonies/catalog-app/issues/711)) ([090fd2a](https://github.com/MapColonies/catalog-app/commit/090fd2a6f05c249f1d59446de99d00f08a2a21ba))
* raster file selection by file type[shp, gpkg] ( MAPCO-8627 ) ([#707](https://github.com/MapColonies/catalog-app/issues/707)) ([68c17f7](https://github.com/MapColonies/catalog-app/commit/68c17f79748f4b46f055534c550dfcfd352c0a45))
* raster ingestion state machine ([#678](https://github.com/MapColonies/catalog-app/issues/678)) ([0aa2ceb](https://github.com/MapColonies/catalog-app/commit/0aa2cebee9bde203d98f16bf4b40c2e783f85ce2))
* split source info queries ([#689](https://github.com/MapColonies/catalog-app/issues/689)) ([3da534c](https://github.com/MapColonies/catalog-app/commit/3da534c592bcda39f89f334ea9229d8876c3b3d0))
* upload shape files time warning (MAPCO-8417) ([#748](https://github.com/MapColonies/catalog-app/issues/748)) ([c2d94e8](https://github.com/MapColonies/catalog-app/commit/c2d94e8076b8b4dde8894f55231b04bfdf1e1887))
* using callback url ( MAPCO-8712 ) ([#677](https://github.com/MapColonies/catalog-app/issues/677)) ([d9ef4a7](https://github.com/MapColonies/catalog-app/commit/d9ef4a70387a0eaad2d125582efe2b23f5a3842c))


### Bug Fixes

* backslash at begining ([#736](https://github.com/MapColonies/catalog-app/issues/736)) ([d2a990d](https://github.com/MapColonies/catalog-app/commit/d2a990dbb34929112df1aa13dcd1357d8218e640))
* buttons ([#713](https://github.com/MapColonies/catalog-app/issues/713)) ([9330f0d](https://github.com/MapColonies/catalog-app/commit/9330f0df9f7b498645452ff2bc2ce7996b38febc))
* cesium info panel overlap ([#674](https://github.com/MapColonies/catalog-app/issues/674)) ([bf5d091](https://github.com/MapColonies/catalog-app/commit/bf5d091d4992d295049bcf04c670bdf8a2c0f05a))
* clean code (MAPCO-8436) ([#733](https://github.com/MapColonies/catalog-app/issues/733)) ([605be55](https://github.com/MapColonies/catalog-app/commit/605be550bd9ad4571da09bb85ed64897d2e682ac))
* clean errors on mode switch ([#700](https://github.com/MapColonies/catalog-app/issues/700)) ([d5bbb97](https://github.com/MapColonies/catalog-app/commit/d5bbb97d4809003a2445b5c6b8fd9c46fdce2cad))
* clean up product file removal ([#740](https://github.com/MapColonies/catalog-app/issues/740)) ([8fabbbd](https://github.com/MapColonies/catalog-app/commit/8fabbbdda474beec04be826feecd1d3b8dbd5116))
* clean warning color on files reselection and clear progressbar in case of error during restore ([#754](https://github.com/MapColonies/catalog-app/issues/754)) ([481ab9c](https://github.com/MapColonies/catalog-app/commit/481ab9c230ef07c5fe1a3f6423c81ab0f4a09c82))
* color shape files in case of warning ([#752](https://github.com/MapColonies/catalog-app/issues/752)) ([88c20ab](https://github.com/MapColonies/catalog-app/commit/88c20abc080752f2bd0c4c8d2751326c16183661))
* configurable switch ([#712](https://github.com/MapColonies/catalog-app/issues/712)) ([d7375d5](https://github.com/MapColonies/catalog-app/commit/d7375d5a675c22671e977a8a9c4a8c737c4b45ee))
* curtain ([#698](https://github.com/MapColonies/catalog-app/issues/698)) ([e97883b](https://github.com/MapColonies/catalog-app/commit/e97883be8b6afe62a202a6973de06dda61455356))
* curtain with loading component ([#724](https://github.com/MapColonies/catalog-app/issues/724)) ([cf65c9b](https://github.com/MapColonies/catalog-app/commit/cf65c9be2c574faccb06a98a7b403dfb51ca44e6))
* fetch product  without mocking ([#738](https://github.com/MapColonies/catalog-app/issues/738)) ([0efd300](https://github.com/MapColonies/catalog-app/commit/0efd300825937cf5bb9f73a671e60cba347cccfe))
* fix format ([#720](https://github.com/MapColonies/catalog-app/issues/720)) ([52695fd](https://github.com/MapColonies/catalog-app/commit/52695fde742517d77ba8ba4bd4af42837f2b83fa))
* handle undefined filesActor ([#679](https://github.com/MapColonies/catalog-app/issues/679)) ([f27e02e](https://github.com/MapColonies/catalog-app/commit/f27e02e39945e23c0dcb7995b71a774435a7165d))
* hardcoded labels ([#692](https://github.com/MapColonies/catalog-app/issues/692)) ([506bf57](https://github.com/MapColonies/catalog-app/commit/506bf57dc048a722b2cb4f0fc46e9698d46fa899))
* infinite loading ([#709](https://github.com/MapColonies/catalog-app/issues/709)) ([4d2f8d5](https://github.com/MapColonies/catalog-app/commit/4d2f8d552a8b9fd2e2863c48879130544cfd590d))
* loading ([#701](https://github.com/MapColonies/catalog-app/issues/701)) ([cc498ad](https://github.com/MapColonies/catalog-app/commit/cc498ad3ba50c82ef770e818a04b1c93715b0565))
* loading ([#703](https://github.com/MapColonies/catalog-app/issues/703)) ([bbce7cc](https://github.com/MapColonies/catalog-app/commit/bbce7cc748552e953720dd469af96355f12758f4))
* loading css ([#705](https://github.com/MapColonies/catalog-app/issues/705)) ([e523cd4](https://github.com/MapColonies/catalog-app/commit/e523cd41f5eaf984ac3b62280838803280fef127))
* manual ([#690](https://github.com/MapColonies/catalog-app/issues/690)) ([c1f46d9](https://github.com/MapColonies/catalog-app/commit/c1f46d9a3376afcc6dc4d4a3d5fc13662a90c527))
* manual labels are being rendered incorrectly ([#745](https://github.com/MapColonies/catalog-app/issues/745)) ([b336ac0](https://github.com/MapColonies/catalog-app/commit/b336ac08ce68288d22f56fa06bde8ff0a10af0a7))
* manual mode missing labels ([#686](https://github.com/MapColonies/catalog-app/issues/686)) ([733c629](https://github.com/MapColonies/catalog-app/commit/733c629dead573d0b2a1ecc615601437938b877f))
* maual ([#693](https://github.com/MapColonies/catalog-app/issues/693)) ([a29b2dd](https://github.com/MapColonies/catalog-app/commit/a29b2dd9cdb2ca6919526c342cd36c65b3613b65))
* mount dir for restore (MAPCO-8436) ([#716](https://github.com/MapColonies/catalog-app/issues/716)) ([1a98089](https://github.com/MapColonies/catalog-app/commit/1a98089e346273af10a1d7325cfa523e68499bc0))
* remove dolar sign ([#680](https://github.com/MapColonies/catalog-app/issues/680)) ([c5392f7](https://github.com/MapColonies/catalog-app/commit/c5392f7389bb071ec9d810fa811f5d7cf3f37468))
* rename API to ExplorerGetByPath ([#639](https://github.com/MapColonies/catalog-app/issues/639)) ([f631e76](https://github.com/MapColonies/catalog-app/commit/f631e76151a8b52b1b871cb6c1aa649a0dedc3ec))
* replace pp marker ([#672](https://github.com/MapColonies/catalog-app/issues/672)) ([204e4a4](https://github.com/MapColonies/catalog-app/commit/204e4a47c12205f6d2e49f5af9bcae7fa924c893))
* resolve job metadata as entity ([#756](https://github.com/MapColonies/catalog-app/issues/756)) ([ad50625](https://github.com/MapColonies/catalog-app/commit/ad50625b555d697ed56e430c5605ab286f794e0a))
* restore ([#682](https://github.com/MapColonies/catalog-app/issues/682)) ([8794608](https://github.com/MapColonies/catalog-app/commit/8794608d60b61d114a669db542fdf6ec8829aef1))
* restructure focus row function ( MAPCO-9077 ) ([#747](https://github.com/MapColonies/catalog-app/issues/747)) ([56172df](https://github.com/MapColonies/catalog-app/commit/56172dfa554685a16801ca1b74acea214aa972a2))
* revert loading changes ([#708](https://github.com/MapColonies/catalog-app/issues/708)) ([6239782](https://github.com/MapColonies/catalog-app/commit/623978205a0cf600616dda34b608cad0a372683c))
* selection mode ([#684](https://github.com/MapColonies/catalog-app/issues/684)) ([f3a1976](https://github.com/MapColonies/catalog-app/commit/f3a1976a556754cf4e9e371ce632f8d4d2e7996e))
* share common statemachine logic ([#681](https://github.com/MapColonies/catalog-app/issues/681)) ([81ce4fd](https://github.com/MapColonies/catalog-app/commit/81ce4fdf499cbf516bfc4cf035343404ca038a43))
* stable version for integration ([#727](https://github.com/MapColonies/catalog-app/issues/727)) ([17c3521](https://github.com/MapColonies/catalog-app/commit/17c3521a9185eb3459b495a829de406c08f3a4fc))
* switch ([#687](https://github.com/MapColonies/catalog-app/issues/687)) ([9a48fdc](https://github.com/MapColonies/catalog-app/commit/9a48fdc686a4473162d39596655e0c9df0af3c24))
* sync ([#731](https://github.com/MapColonies/catalog-app/issues/731)) ([e62ef3a](https://github.com/MapColonies/catalog-app/commit/e62ef3ad54a2aa48d47dc2ef1195b2d08680bb3e))
* sync with bff ([#729](https://github.com/MapColonies/catalog-app/issues/729)) ([58f278b](https://github.com/MapColonies/catalog-app/commit/58f278bd418cca08c32f3a626c81e823a5b032da))
* update selectionMode in parent ([#717](https://github.com/MapColonies/catalog-app/issues/717)) ([5d5942a](https://github.com/MapColonies/catalog-app/commit/5d5942aae34bd682eb180536f550a4372830e2d4))
* use new raster files structure config and restore should use jobId from both invocations ([#722](https://github.com/MapColonies/catalog-app/issues/722)) ([bf4c6e2](https://github.com/MapColonies/catalog-app/commit/bf4c6e2f6537321102665770b1a540c8019aa6ee))
* validation task report (MAPCO-8423) ([#742](https://github.com/MapColonies/catalog-app/issues/742)) ([e71b995](https://github.com/MapColonies/catalog-app/commit/e71b9957276b03e577213b611444ee92bdf68c4c))

## [2.24.1](https://github.com/MapColonies/catalog-app/compare/v2.24.0...v2.24.1) (2025-09-14)


### Bug Fixes

* override query action ([#669](https://github.com/MapColonies/catalog-app/issues/669)) ([334a59e](https://github.com/MapColonies/catalog-app/commit/334a59e3308497e90e3c4149792222f197682e30))

## [2.24.0](https://github.com/MapColonies/catalog-app/compare/v2.23.16...v2.24.0) (2025-09-11)


### Features

* cesium active layers (MAPCO-7160) and geocoding custom component (MAPCO-7826) ([#640](https://github.com/MapColonies/catalog-app/issues/640)) ([4f9ee69](https://github.com/MapColonies/catalog-app/commit/4f9ee6975f5804af432dbc78c7e86dcbf8591886))
* customize store behavior ([#623](https://github.com/MapColonies/catalog-app/issues/623)) ([9f58d7c](https://github.com/MapColonies/catalog-app/commit/9f58d7cfc100d4b9cbcf11005a051edf51d78f9a))


### Bug Fixes

* ag-grid upgrade ( MAPCO-6884 ) ([#648](https://github.com/MapColonies/catalog-app/issues/648)) ([aaa0312](https://github.com/MapColonies/catalog-app/commit/aaa0312441f65e969d9497f23ef438b5e17b5199))

## [2.23.16](https://github.com/MapColonies/catalog-app/compare/v2.23.15...v2.23.16) (2025-09-02)


### Bug Fixes

* change to be strict value ([#664](https://github.com/MapColonies/catalog-app/issues/664)) ([b1c7fdc](https://github.com/MapColonies/catalog-app/commit/b1c7fdc49f1ddd3ec9309c546abfe7c01fc10ed7))

## [2.23.15](https://github.com/MapColonies/catalog-app/compare/v2.23.14...v2.23.15) (2025-09-01)


### Bug Fixes

* control state when re-select shapefile ([#661](https://github.com/MapColonies/catalog-app/issues/661)) ([963b307](https://github.com/MapColonies/catalog-app/commit/963b3070dbcdb206a6cac1851cb7c50466a7fc02))

## [2.23.14](https://github.com/MapColonies/catalog-app/compare/v2.23.13...v2.23.14) (2025-09-01)


### Bug Fixes

* add hours to imagingTimeBeginUTC and imagingTimeEndUTC ([#658](https://github.com/MapColonies/catalog-app/issues/658)) ([7de5e7f](https://github.com/MapColonies/catalog-app/commit/7de5e7f33cc9e7ddad8adeb63f4af3024598c13b))

## [2.23.13](https://github.com/MapColonies/catalog-app/compare/v2.23.12...v2.23.13) (2025-08-31)


### Bug Fixes

* add crossOrigin: 'anonymous' ([#646](https://github.com/MapColonies/catalog-app/issues/646)) ([cb03503](https://github.com/MapColonies/catalog-app/commit/cb03503ba68dc0420fca01608304c78ae75d4ba6))
* bugfix layer without pp ( MAPCO - 8435 ) ([#641](https://github.com/MapColonies/catalog-app/issues/641)) ([c993eb3](https://github.com/MapColonies/catalog-app/commit/c993eb3c5455ddc27a34a95c4f7b5e37493cd00a))
* catch error and showing error in dialog ( MAPCO-8501 ) ([#649](https://github.com/MapColonies/catalog-app/issues/649)) ([9835399](https://github.com/MapColonies/catalog-app/commit/9835399c4ff4c71c898d8292a1f8d73c0a881fcd))
* check button state after selecting shape file with less parts than previous  ([#655](https://github.com/MapColonies/catalog-app/issues/655)) ([4ac58d1](https://github.com/MapColonies/catalog-app/commit/4ac58d1566d18d87275c025dfee602f320359224))
* remove caching tiles ([#653](https://github.com/MapColonies/catalog-app/issues/653)) ([1940e27](https://github.com/MapColonies/catalog-app/commit/1940e27112892cfd833f29443031f0d9787476a7))

## [2.23.12](https://github.com/MapColonies/catalog-app/compare/v2.23.11...v2.23.12) (2025-08-05)


### Bug Fixes

* debug panel ([#637](https://github.com/MapColonies/catalog-app/issues/637)) ([10c91ea](https://github.com/MapColonies/catalog-app/commit/10c91ea02e177ed0d95d65adee75ea9be1ec6ddc))

## [2.23.11](https://github.com/MapColonies/catalog-app/compare/v2.23.10...v2.23.11) (2025-07-30)


### Bug Fixes

* handle repo renaming ([#635](https://github.com/MapColonies/catalog-app/issues/635)) ([aca632a](https://github.com/MapColonies/catalog-app/commit/aca632a18ccc377aaf7f2b6e9992b128b705eb28))

### [2.23.10](https://github.com/MapColonies/discrete-layer-client/compare/v2.23.9...v2.23.10) (2025-07-22)


### Bug Fixes

* near world wide pp geometry undefined after buufer is applied ([#631](https://github.com/MapColonies/discrete-layer-client/issues/631)) ([2b0c729](https://github.com/MapColonies/discrete-layer-client/commit/2b0c729405937fbb3d414e4aa2abba34efa65fda))
* uncleaned labels ([#633](https://github.com/MapColonies/discrete-layer-client/issues/633)) ([d5de9c0](https://github.com/MapColonies/discrete-layer-client/commit/d5de9c01e555767954fb54af83b5b36ad1d95217))
* whole world footrpint with holes ([#632](https://github.com/MapColonies/discrete-layer-client/issues/632)) ([065df65](https://github.com/MapColonies/discrete-layer-client/commit/065df65cb16ae2a4e1a374ae9fae553e3bcce97c))

### [2.23.9](https://github.com/MapColonies/discrete-layer-client/compare/v2.23.8...v2.23.9) (2025-07-20)


### Bug Fixes

* small polygon collapsed after buffer in res collision check ([#629](https://github.com/MapColonies/discrete-layer-client/issues/629)) ([21fcf4d](https://github.com/MapColonies/discrete-layer-client/commit/21fcf4d1125efd958ea36a238a535dcf47ee8871))
* wfs layer key field should be configurable ([#630](https://github.com/MapColonies/discrete-layer-client/issues/630)) ([262ed5c](https://github.com/MapColonies/discrete-layer-client/commit/262ed5c789ac4420708eca4654a91afee674a5dc))

### [2.23.8](https://github.com/MapColonies/discrete-layer-client/compare/v2.23.7...v2.23.8) (2025-07-07)


### Bug Fixes

* fix ([#627](https://github.com/MapColonies/discrete-layer-client/issues/627)) ([6812c35](https://github.com/MapColonies/discrete-layer-client/commit/6812c35659402810a93921696f0dac30ad5973e9))
* set empty numeric fields from string to undefined (MAPCO-8148) ([#626](https://github.com/MapColonies/discrete-layer-client/issues/626)) ([c120852](https://github.com/MapColonies/discrete-layer-client/commit/c1208525b14713e5afb861b862a3cbd1b0a32e90))
* typo ([#628](https://github.com/MapColonies/discrete-layer-client/issues/628)) ([00d2f2f](https://github.com/MapColonies/discrete-layer-client/commit/00d2f2fe36726935f1a9d598d4fcb3be5734736f))

### [2.23.7](https://github.com/MapColonies/discrete-layer-client/compare/v2.23.6...v2.23.7) (2025-07-06)


### Bug Fixes

* entity fields order ([#625](https://github.com/MapColonies/discrete-layer-client/issues/625)) ([f5a4537](https://github.com/MapColonies/discrete-layer-client/commit/f5a4537bc63bfd27d206d04b4ebf153ac5467c62))
* low resolution collision long check progress ([#624](https://github.com/MapColonies/discrete-layer-client/issues/624)) ([0e62be9](https://github.com/MapColonies/discrete-layer-client/commit/0e62be93293df59508461b4410a56b299afd42b8))
* shape button disabled when performing GPKG validation( MAPCO-8143 )  ([#622](https://github.com/MapColonies/discrete-layer-client/issues/622)) ([d41e840](https://github.com/MapColonies/discrete-layer-client/commit/d41e8400752d11378d50da209e15831b6aa8f31c))

### [2.23.6](https://github.com/MapColonies/discrete-layer-client/compare/v2.23.5...v2.23.6) (2025-07-01)


### Bug Fixes

* cesium workers cache ([a4797ae](https://github.com/MapColonies/discrete-layer-client/commit/a4797aea8cf6698541e85fac43789eb80ca39c71))

### [2.23.5](https://github.com/MapColonies/discrete-layer-client/compare/v2.23.4...v2.23.5) (2025-07-01)


### Bug Fixes

* update pp check process improved ([#620](https://github.com/MapColonies/discrete-layer-client/issues/620)) ([ff235d0](https://github.com/MapColonies/discrete-layer-client/commit/ff235d0d72bbbe8643ec05e44ab60ec86349a071))

### [2.23.4](https://github.com/MapColonies/discrete-layer-client/compare/v2.23.3...v2.23.4) (2025-06-29)


### Bug Fixes

* eslint ([#618](https://github.com/MapColonies/discrete-layer-client/issues/618)) ([e82ef34](https://github.com/MapColonies/discrete-layer-client/commit/e82ef340dc8ce243f46c2ea95cf2a41f949fc2b6))

### [2.23.3](https://github.com/MapColonies/discrete-layer-client/compare/v2.23.2...v2.23.3) (2025-06-29)


### Bug Fixes

* eye of current layer should be turned off in all branches of catalog tree ([#617](https://github.com/MapColonies/discrete-layer-client/issues/617)) ([b141648](https://github.com/MapColonies/discrete-layer-client/commit/b1416480c94b4f4544a4c12a1874f22380edc29c))

### [2.23.2](https://github.com/MapColonies/discrete-layer-client/compare/v2.23.1...v2.23.2) (2025-06-26)


### Bug Fixes

* pp ol from config ([#616](https://github.com/MapColonies/discrete-layer-client/issues/616)) ([0b61ef1](https://github.com/MapColonies/discrete-layer-client/commit/0b61ef1e7e109107a9ab20354ea7b0b2b86a65d8))

### [2.23.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.23.0...v2.23.1) (2025-06-26)


### Bug Fixes

* active layers filter button does not work properly ([#614](https://github.com/MapColonies/discrete-layer-client/issues/614)) ([a267c0d](https://github.com/MapColonies/discrete-layer-client/commit/a267c0d6ec6c5ef49341e5fb6ac1f2ff502a516e))
* mutual border of exisitng and inserting parts ( MAPCO-8075 ) ([#615](https://github.com/MapColonies/discrete-layer-client/issues/615)) ([e784ee6](https://github.com/MapColonies/discrete-layer-client/commit/e784ee67cba730210193c56269cc75c8e8f308d0))
* polygon parts low zoom multypolygon footprint ([#613](https://github.com/MapColonies/discrete-layer-client/issues/613)) ([b242335](https://github.com/MapColonies/discrete-layer-client/commit/b242335e805b0b3c07efd143ff4b87a653556ddf))

## [2.23.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.22.1...v2.23.0) (2025-06-24)


### Features

* active layers catalog filter ([#610](https://github.com/MapColonies/discrete-layer-client/issues/610)) ([4861cad](https://github.com/MapColonies/discrete-layer-client/commit/4861cadbfa4f7a566adbe9491ae08250aa6d2457))
* cesium polygon parts ([#605](https://github.com/MapColonies/discrete-layer-client/issues/605)) ([be5052d](https://github.com/MapColonies/discrete-layer-client/commit/be5052db3bdec78b5535341bc55b935dc047fd5e))


### Bug Fixes

* debug panel should be removed from dom on dialog close instead of hidden ([#612](https://github.com/MapColonies/discrete-layer-client/issues/612)) ([795beb6](https://github.com/MapColonies/discrete-layer-client/commit/795beb6fa703fb425f0d365f460d5d0eb9dd5944))

### [2.22.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.22.0...v2.22.1) (2025-06-18)


### Bug Fixes

* for wfs ([6f61223](https://github.com/MapColonies/discrete-layer-client/commit/6f61223dea2df74fdc3d9bcdb447884c74b6d0c3))

## [2.22.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.21.2...v2.22.0) (2025-06-18)


### Features

* add vector catalog to the tree ([#595](https://github.com/MapColonies/discrete-layer-client/issues/595)) ([24ab9f6](https://github.com/MapColonies/discrete-layer-client/commit/24ab9f602ca52ae0df494f0a079debb3a0350855))
* raster product status publish unpublish ([#606](https://github.com/MapColonies/discrete-layer-client/issues/606)) ([785b8f8](https://github.com/MapColonies/discrete-layer-client/commit/785b8f80a5368ab9e58c20eac256af37a56ae8c1))


### Bug Fixes

* add backend_local to confEnvShim ([#603](https://github.com/MapColonies/discrete-layer-client/issues/603)) ([d254d2c](https://github.com/MapColonies/discrete-layer-client/commit/d254d2c56c252269b7c5060a6e6e51f28ea9bb63))
* add feature structure table presentor ([#599](https://github.com/MapColonies/discrete-layer-client/issues/599)) ([ad51d7a](https://github.com/MapColonies/discrete-layer-client/commit/ad51d7a02c7459f11e1c3da2b04ed46582e28ce2))
* build errors and file picker btn does not work ([#602](https://github.com/MapColonies/discrete-layer-client/issues/602)) ([66e94e5](https://github.com/MapColonies/discrete-layer-client/commit/66e94e5b4f55c217cc93f0878441a6260d011c1d))
* dialogs transparency ([#598](https://github.com/MapColonies/discrete-layer-client/issues/598)) ([5df0d8c](https://github.com/MapColonies/discrete-layer-client/commit/5df0d8cf6bf9fa9d0baffcf2e1646785e0e83ec6))
* download linkes bug ([#607](https://github.com/MapColonies/discrete-layer-client/issues/607)) ([22da473](https://github.com/MapColonies/discrete-layer-client/commit/22da4730878707d591477dc7889901b20241cfe9))
* eslint ([#601](https://github.com/MapColonies/discrete-layer-client/issues/601)) ([117e2bd](https://github.com/MapColonies/discrete-layer-client/commit/117e2bd18219cc6d26c7c3f925d08edfb1e46e8c))
* manual part vertex density tollerance in degrees ([#609](https://github.com/MapColonies/discrete-layer-client/issues/609)) ([da3c495](https://github.com/MapColonies/discrete-layer-client/commit/da3c495250345f5702b42d3f074feeb079c54774))
* remove vector record from bests ([#604](https://github.com/MapColonies/discrete-layer-client/issues/604)) ([ffd286d](https://github.com/MapColonies/discrete-layer-client/commit/ffd286dff09789f8b032511cf0fd6939681d556a))

### [2.21.2](https://github.com/MapColonies/discrete-layer-client/compare/v2.21.1...v2.21.2) (2025-03-20)


### Bug Fixes

* fetch all relevant pp on update check stage ([#597](https://github.com/MapColonies/discrete-layer-client/issues/597)) ([12cb04d](https://github.com/MapColonies/discrete-layer-client/commit/12cb04d47950f664b3a7cefb32f8f7a7edb40533))

### [2.21.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.21.0...v2.21.1) (2025-03-16)


### Bug Fixes

* pp date label field rename and intersect crash ( MAPCO-7054 ,  MAPCO-7056 ) ([#596](https://github.com/MapColonies/discrete-layer-client/issues/596)) ([b78cfe0](https://github.com/MapColonies/discrete-layer-client/commit/b78cfe0bb8a8c42421ff37c4700d31d5e2446e8c))

## [2.21.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.20.0...v2.21.0) (2025-02-23)


### Features

* ol dynamically text in pp ([#593](https://github.com/MapColonies/discrete-layer-client/issues/593)) ([bbba27f](https://github.com/MapColonies/discrete-layer-client/commit/bbba27fb88ce3486db697215b9886a62f11b5c9d))

## [2.20.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.19.1...v2.20.0) (2025-02-20)


### Features

* pp wfs pagination ( MAPCO-6827 ) ([#592](https://github.com/MapColonies/discrete-layer-client/issues/592)) ([300f88f](https://github.com/MapColonies/discrete-layer-client/commit/300f88fc78ce96487dea91d82b89307f8e57fa22))


### Bug Fixes

* change files to be compatible with convention of confd ([#591](https://github.com/MapColonies/discrete-layer-client/issues/591)) ([8e29ad4](https://github.com/MapColonies/discrete-layer-client/commit/8e29ad441e175f743b3af6ba5996cc35ba25bca1))

### [2.19.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.19.0...v2.19.1) (2025-02-16)


### Bug Fixes

* change self intersection to works with gpsi library ([#590](https://github.com/MapColonies/discrete-layer-client/issues/590)) ([0a8d97a](https://github.com/MapColonies/discrete-layer-client/commit/0a8d97a73adbe5bf3fd0c739978502299666a608))

## [2.19.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.18.2...v2.19.0) (2025-02-16)


### Features

* fetch job from bff on download ([#589](https://github.com/MapColonies/discrete-layer-client/issues/589)) ([32b7a1e](https://github.com/MapColonies/discrete-layer-client/commit/32b7a1ee7a864b5b799de3cbea742f20d3ef8bef))

### [2.18.2](https://github.com/MapColonies/discrete-layer-client/compare/v2.18.1...v2.18.2) (2025-02-11)


### Bug Fixes

* empty error message ([#588](https://github.com/MapColonies/discrete-layer-client/issues/588)) ([cff5cb8](https://github.com/MapColonies/discrete-layer-client/commit/cff5cb893122776fe2fb9ac68d505ab2e6d209ba))
* vivid date parsing and production_tmpl numbers ([#587](https://github.com/MapColonies/discrete-layer-client/issues/587)) ([cb4a48f](https://github.com/MapColonies/discrete-layer-client/commit/cb4a48f0de0f8961920cb964037c993199e845c9))

### [2.18.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.18.0...v2.18.1) (2025-02-09)


### Bug Fixes

* change calculation of small polygons to be by native resolution ([#586](https://github.com/MapColonies/discrete-layer-client/issues/586)) ([0fafc0a](https://github.com/MapColonies/discrete-layer-client/commit/0fafc0ac8508ee97ebb3a5ad969343a3b7f9766a))

## [2.18.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.17.0...v2.18.0) (2025-02-03)


### Features

* patch Ver 2.0.0 ([#585](https://github.com/MapColonies/discrete-layer-client/issues/585)) ([9caf37c](https://github.com/MapColonies/discrete-layer-client/commit/9caf37cef1db7f3e99cce047729bbff446dcb5cc))


### Bug Fixes

* add maximum zoom level when requesting tiles in Cesium ( MAPCO-6226 ) ([#582](https://github.com/MapColonies/discrete-layer-client/issues/582)) ([9a855db](https://github.com/MapColonies/discrete-layer-client/commit/9a855db3df8df615045b738b7aed2ee6c2ff159b))
* change default to unchecked ([#581](https://github.com/MapColonies/discrete-layer-client/issues/581)) ([c321c16](https://github.com/MapColonies/discrete-layer-client/commit/c321c16e30046bdeca932dc74fddedaa6132c728))
* set removed pp fields to untouched ([#584](https://github.com/MapColonies/discrete-layer-client/issues/584)) ([1ccf71d](https://github.com/MapColonies/discrete-layer-client/commit/1ccf71d6ad0995bd077ed41026d60aa26951bc4f))
* use useEffect to trigger ingestQueries only when submitting form ( MAPCO-6199 ) ([#583](https://github.com/MapColonies/discrete-layer-client/issues/583)) ([bc53226](https://github.com/MapColonies/discrete-layer-client/commit/bc532262808793e73e141d73028ad650bbaef3db))

## [2.17.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.16.3...v2.17.0) (2025-01-01)


### Features

* add vertices limit to env configuration ([#579](https://github.com/MapColonies/discrete-layer-client/issues/579)) ([e015eb7](https://github.com/MapColonies/discrete-layer-client/commit/e015eb707d8b7502e6568338bcc5c0c62ce5671d))


### Bug Fixes

* delete typename from metadata.recordModel and send to bff only necessary fields ([#578](https://github.com/MapColonies/discrete-layer-client/issues/578)) ([b052c0a](https://github.com/MapColonies/discrete-layer-client/commit/b052c0a38d01dc68c1f0d84d39f83c69fa229f6b))
* disable error icon click ([#577](https://github.com/MapColonies/discrete-layer-client/issues/577)) ([1e415a4](https://github.com/MapColonies/discrete-layer-client/commit/1e415a43bb3648c329531d58a84ba3b640e050e9))
* total of coordination ([#580](https://github.com/MapColonies/discrete-layer-client/issues/580)) ([3eb0b03](https://github.com/MapColonies/discrete-layer-client/commit/3eb0b03b921edb97beef7ca27f85b463f1e7ffaf))

### [2.16.3](https://github.com/MapColonies/discrete-layer-client/compare/v2.16.2...v2.16.3) (2024-12-25)


### Bug Fixes

* set state PPCheck ([#576](https://github.com/MapColonies/discrete-layer-client/issues/576)) ([141d65b](https://github.com/MapColonies/discrete-layer-client/commit/141d65bf096db2eef06aa2cd49867b9466621c48))
* use currentTarget instead of target in onChange and onBlur ([#575](https://github.com/MapColonies/discrete-layer-client/issues/575)) ([5261e36](https://github.com/MapColonies/discrete-layer-client/commit/5261e36aeb3bdbed6f29994d2458825b78bd8532))

### [2.16.2](https://github.com/MapColonies/discrete-layer-client/compare/v2.16.1...v2.16.2) (2024-12-24)


### Bug Fixes

* bug ([#574](https://github.com/MapColonies/discrete-layer-client/issues/574)) ([da524da](https://github.com/MapColonies/discrete-layer-client/commit/da524da6816b74365395388f6aab1be3b507cbd2))

### [2.16.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.16.0...v2.16.1) (2024-12-24)

## [2.16.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.15.0...v2.16.0) (2024-12-24)


### Features

* 3D new validation api ([#566](https://github.com/MapColonies/discrete-layer-client/issues/566)) ([7c8993f](https://github.com/MapColonies/discrete-layer-client/commit/7c8993f24933e42cd0d174ed707a4ff4d6a763b2))
* add new ability to find gaps betweem polygon parts ([#565](https://github.com/MapColonies/discrete-layer-client/issues/565)) ([b4159c0](https://github.com/MapColonies/discrete-layer-client/commit/b4159c079d77a980f6b891c0812fe127f6a489e0))


### Bug Fixes

* datePicker setFieldTouched true on change ([#572](https://github.com/MapColonies/discrete-layer-client/issues/572)) ([2be8e7c](https://github.com/MapColonies/discrete-layer-client/commit/2be8e7c2ea3470149ca2a5605125ae71f6257d07))
* export highlighted selection ([#562](https://github.com/MapColonies/discrete-layer-client/issues/562)) ([140ae9f](https://github.com/MapColonies/discrete-layer-client/commit/140ae9fc2e06c7a886731a28e96693cf7f3703d6))
* intersect exception and topology for more clear perimeter ([#567](https://github.com/MapColonies/discrete-layer-client/issues/567)) ([06801c1](https://github.com/MapColonies/discrete-layer-client/commit/06801c19ed24a10f14c04905e4891f3d1fe19933))
* polugon parts ol map fit  behaviour ([#569](https://github.com/MapColonies/discrete-layer-client/issues/569)) ([b9cd9ef](https://github.com/MapColonies/discrete-layer-client/commit/b9cd9ef08f5cc2448d88406916e9dc2fee816f28))
* Raster ingestion submit button is disabled (MAPCO-5945) ([#564](https://github.com/MapColonies/discrete-layer-client/issues/564)) ([79ee47e](https://github.com/MapColonies/discrete-layer-client/commit/79ee47e4c20e2fb678929edd9c78447467167120))
* resolution on blur should clear custom errors ([#568](https://github.com/MapColonies/discrete-layer-client/issues/568)) ([d66aba9](https://github.com/MapColonies/discrete-layer-client/commit/d66aba9f1a172cac34bc856597fc58e0d30b1752))
* sent e.target to formik handleChange and handleBlur ([#563](https://github.com/MapColonies/discrete-layer-client/issues/563)) ([5bd3aca](https://github.com/MapColonies/discrete-layer-client/commit/5bd3acade1e15e2694e2dc37b03900409093526c))
* shape null values as undefined ([#561](https://github.com/MapColonies/discrete-layer-client/issues/561)) ([87535e1](https://github.com/MapColonies/discrete-layer-client/commit/87535e19b974bc59b868db330f97ea5489158bfe))
* show loading spinner before display exisitng parts on map ([#570](https://github.com/MapColonies/discrete-layer-client/issues/570)) ([0bf8303](https://github.com/MapColonies/discrete-layer-client/commit/0bf83030afaaa1d844290a6e9e1075c05ca297af))
* submit enable when replace gpkg ( MAPCO-5944 ) ([#571](https://github.com/MapColonies/discrete-layer-client/issues/571)) ([82052b1](https://github.com/MapColonies/discrete-layer-client/commit/82052b17afdcf0d81acf5d20a074b51def026c9d))

## [2.15.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.14.1...v2.15.0) (2024-12-16)


### Features

* add new job status called 'Suspended' ([#558](https://github.com/MapColonies/discrete-layer-client/issues/558)) ([a70a876](https://github.com/MapColonies/discrete-layer-client/commit/a70a8764a87c0739f3a48c19606ddde435ef1214))
* rotate cesium map instead of infinite scroll and adding it to t… ([#555](https://github.com/MapColonies/discrete-layer-client/issues/555)) ([04f9c01](https://github.com/MapColonies/discrete-layer-client/commit/04f9c01ae798047237d70f9f153ac801d31d1095))


### Bug Fixes

* add missing translation ([#559](https://github.com/MapColonies/discrete-layer-client/issues/559)) ([4ec03b4](https://github.com/MapColonies/discrete-layer-client/commit/4ec03b4b6a5525468cc912f6a1561551e7c872a7))
* change by convention of mapMode2D and remove the ts error for mapmode2d is a string ([#557](https://github.com/MapColonies/discrete-layer-client/issues/557)) ([b0dda0f](https://github.com/MapColonies/discrete-layer-client/commit/b0dda0f7b0a3ed5793afd2d99b5fb6610c756f33))
* display payload too large error message ([#553](https://github.com/MapColonies/discrete-layer-client/issues/553)) ([28550d9](https://github.com/MapColonies/discrete-layer-client/commit/28550d94d3df9cc2565266a946d164680d819ed2))
* dusable gpkg vs extent verification ([#560](https://github.com/MapColonies/discrete-layer-client/issues/560)) ([24332ba](https://github.com/MapColonies/discrete-layer-client/commit/24332ba2269e1ec858959abd7877892432e0c083))
* filter lookupOptions by current value (MAPCO-5661) ([#549](https://github.com/MapColonies/discrete-layer-client/issues/549)) ([483d7f7](https://github.com/MapColonies/discrete-layer-client/commit/483d7f76fd0a75bb5447943d22bb3e448033868b))
* Ingestion inputs value ( MAPCO-4191, MAPCO-5683 ) ([#550](https://github.com/MapColonies/discrete-layer-client/issues/550)) ([c12c497](https://github.com/MapColonies/discrete-layer-client/commit/c12c4972f9c9587b7f3953b941a4681015e457c3))
* Ingestion inputs values (directory and file) should not push buttons left (MAPCO-4191) ([#547](https://github.com/MapColonies/discrete-layer-client/issues/547)) ([56d694c](https://github.com/MapColonies/discrete-layer-client/commit/56d694cb036ce039392825548239c7dfa3697e10))
* max parts per shape and wfs service errors ([#556](https://github.com/MapColonies/discrete-layer-client/issues/556)) ([30070e0](https://github.com/MapColonies/discrete-layer-client/commit/30070e0c747a40574b2d85114fb69257dd30c492))
* poygon parts fit behavior ([#554](https://github.com/MapColonies/discrete-layer-client/issues/554)) ([8d50bd2](https://github.com/MapColonies/discrete-layer-client/commit/8d50bd24df445a0f7689e15d2abf328de3f2568d))
* precise condition in [sourceExtent, outlinedPerimeter] useEffect ([#545](https://github.com/MapColonies/discrete-layer-client/issues/545)) ([fb7c6b1](https://github.com/MapColonies/discrete-layer-client/commit/fb7c6b1d4dc7584706217c2c77c89d7854d7aca6))
* Query jobs error with proper presentation when data integrity is broken ( MAPCO-4946 ) ([#546](https://github.com/MapColonies/discrete-layer-client/issues/546)) ([52a0328](https://github.com/MapColonies/discrete-layer-client/commit/52a03282b9b638f49deb4959d7e0c215cc714ce1))
* remove autofill of saved passwords in search TextFeild ([#551](https://github.com/MapColonies/discrete-layer-client/issues/551)) ([19d666e](https://github.com/MapColonies/discrete-layer-client/commit/19d666e71bf7d5c62851d162a526f043243cb3f9))
* revert bad merge ([#552](https://github.com/MapColonies/discrete-layer-client/issues/552)) ([1ac212f](https://github.com/MapColonies/discrete-layer-client/commit/1ac212f9d7af545c9da67a9de4df9faabd925816))
* wfs resolution with zoom and allow only polygon geometry ([#548](https://github.com/MapColonies/discrete-layer-client/issues/548)) ([1f17056](https://github.com/MapColonies/discrete-layer-client/commit/1f17056f166f538cadc0b42d5cc98562d276cc54))

### [2.14.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.14.0...v2.14.1) (2024-12-03)


### Bug Fixes

* bff error message ([#544](https://github.com/MapColonies/discrete-layer-client/issues/544)) ([3b2dacb](https://github.com/MapColonies/discrete-layer-client/commit/3b2dacbad87ce0bfcb09d903dd688b1acad7efc9))

## [2.14.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.13.0...v2.14.0) (2024-12-03)


### Features

* add view option in panel to a regular user ([#543](https://github.com/MapColonies/discrete-layer-client/issues/543)) ([4065fae](https://github.com/MapColonies/discrete-layer-client/commit/4065faee9429dca4b9bcfdf679a6e907d9f1c78e))
* new vest validation for productId ([#541](https://github.com/MapColonies/discrete-layer-client/issues/541)) ([c71f053](https://github.com/MapColonies/discrete-layer-client/commit/c71f053b9195dc13f09af0edb2de1378a826c4a7))


### Bug Fixes

* add 'scrollToIndex' to react-virtualized <List/> and convert all expandedParts to false ([#538](https://github.com/MapColonies/discrete-layer-client/issues/538)) ([dcbe785](https://github.com/MapColonies/discrete-layer-client/commit/dcbe785159c9db68e6a9a38bf16765ba6c6e7e85))
* add manage metadata option to dialogs ([#525](https://github.com/MapColonies/discrete-layer-client/issues/525)) ([d623341](https://github.com/MapColonies/discrete-layer-client/commit/d6233416b34c75932dc59a41da10520409f90823))
* add type null to sourceId types in pp record ([#539](https://github.com/MapColonies/discrete-layer-client/issues/539)) ([7fef8b9](https://github.com/MapColonies/discrete-layer-client/commit/7fef8b95de0e475799b324e9d5eb2482053b86d4))
* add zoomlevel to resolutionDegree in polygonParts info box ([#524](https://github.com/MapColonies/discrete-layer-client/issues/524)) ([0e91b68](https://github.com/MapColonies/discrete-layer-client/commit/0e91b68cc0732ad27350bd2ec6418f8133b3f8a6))
* bug, remove MARKER from pp-map Legends ([#532](https://github.com/MapColonies/discrete-layer-client/issues/532)) ([0755491](https://github.com/MapColonies/discrete-layer-client/commit/07554918361e5ba8e28470668f532c3097ba2a4d))
* change in he/en.json from sourceDate to imagingTime ([#531](https://github.com/MapColonies/discrete-layer-client/issues/531)) ([998d1c7](https://github.com/MapColonies/discrete-layer-client/commit/998d1c71b4a06d081e5b40267ab64e8c476303c5))
* chart.yaml bump version ([1384768](https://github.com/MapColonies/discrete-layer-client/commit/1384768a3b5473e56736df3ccde441bbc449deb1))
* current site use memo ([#530](https://github.com/MapColonies/discrete-layer-client/issues/530)) ([9ce97b3](https://github.com/MapColonies/discrete-layer-client/commit/9ce97b388c7db4f7fb566e1822b966abce2a2812))
* defaults ([732810c](https://github.com/MapColonies/discrete-layer-client/commit/732810c2e83e3483a52743171b46cd27e28a1f3a))
* error handling ([#540](https://github.com/MapColonies/discrete-layer-client/issues/540)) ([e8fccdb](https://github.com/MapColonies/discrete-layer-client/commit/e8fccdb79c52c2c48c28ea397c5c6fd38f355f73))
* eslint ([f4ac480](https://github.com/MapColonies/discrete-layer-client/commit/f4ac480b9d2e5cd2f4a669bd8280bcf13b041dfa))
* graphql error pp list indication ([#542](https://github.com/MapColonies/discrete-layer-client/issues/542)) ([46b80d9](https://github.com/MapColonies/discrete-layer-client/commit/46b80d97f74ca2c20495a53e9d85650e2a7e5980))
* lookup tables crashes app in case that service is not available ([#537](https://github.com/MapColonies/discrete-layer-client/issues/537)) ([1de0869](https://github.com/MapColonies/discrete-layer-client/commit/1de0869d62ca95fe166a58cfe71ee71be8ec5836))
* pp resolution in manual mode from gpkg ([#535](https://github.com/MapColonies/discrete-layer-client/issues/535)) ([a9d78ef](https://github.com/MapColonies/discrete-layer-client/commit/a9d78efd0a6b51e16d6c970d91f3dd37b4fe953e))
* remove geopackageValidation from edit rester and unnecessary sho… ([#536](https://github.com/MapColonies/discrete-layer-client/issues/536)) ([963d671](https://github.com/MapColonies/discrete-layer-client/commit/963d6713c59ecbd5ae5ac52d225336ef7fbb1c50))
* shape file date fields wrong format ( MAPCO-5495 ) ([#526](https://github.com/MapColonies/discrete-layer-client/issues/526)) ([25b1125](https://github.com/MapColonies/discrete-layer-client/commit/25b1125087b43875f86f94d253d0de4291ec3aa4))
* state errors and vest errors ([#534](https://github.com/MapColonies/discrete-layer-client/issues/534)) ([6caac7e](https://github.com/MapColonies/discrete-layer-client/commit/6caac7e6bd8b8d34040b5b7b35c5f0c126c82e10))
* update raster labels en.json and he.json ([#528](https://github.com/MapColonies/discrete-layer-client/issues/528)) ([54c4fa1](https://github.com/MapColonies/discrete-layer-client/commit/54c4fa1c03f1526265dde05d8916a52acb375743))

## [2.13.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.11.0...v2.13.0) (2024-11-21)


### Features

* values schema integration ([#521](https://github.com/MapColonies/discrete-layer-client/issues/521)) ([0a9d9d6](https://github.com/MapColonies/discrete-layer-client/commit/0a9d9d64b49f3d7ffbf1bfd2e29aa321d04c7900))


### Bug Fixes

* helm artifacts ([3615873](https://github.com/MapColonies/discrete-layer-client/commit/3615873db9480c4c8bf1d3a9230c850a5cfcb478))
* support empty value ([df1cd11](https://github.com/MapColonies/discrete-layer-client/commit/df1cd1147b3dc0f6a9180e114840e41da67c3f24))
* support specific and official route ([94a76b0](https://github.com/MapColonies/discrete-layer-client/commit/94a76b0413ed03ca7bbe52e5eb32ecd144f7bbbd))
* sync ([ef8fab7](https://github.com/MapColonies/discrete-layer-client/commit/ef8fab7889eef8baca352c56606797d53079e529))
* v2 ([ec9b316](https://github.com/MapColonies/discrete-layer-client/commit/ec9b316b50f8b403768ad35a2c8af5608b47e725))

## [2.12.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.11.0...v2.12.0) (2024-11-21)


### Features

* values schema integration ([#521](https://github.com/MapColonies/discrete-layer-client/issues/521)) ([0a9d9d6](https://github.com/MapColonies/discrete-layer-client/commit/0a9d9d64b49f3d7ffbf1bfd2e29aa321d04c7900))


### Bug Fixes

* helm artifacts ([3615873](https://github.com/MapColonies/discrete-layer-client/commit/3615873db9480c4c8bf1d3a9230c850a5cfcb478))
* support empty value ([df1cd11](https://github.com/MapColonies/discrete-layer-client/commit/df1cd1147b3dc0f6a9180e114840e41da67c3f24))
* support specific and official route ([94a76b0](https://github.com/MapColonies/discrete-layer-client/commit/94a76b0413ed03ca7bbe52e5eb32ecd144f7bbbd))
* sync ([ef8fab7](https://github.com/MapColonies/discrete-layer-client/commit/ef8fab7889eef8baca352c56606797d53079e529))
* v2 ([ec9b316](https://github.com/MapColonies/discrete-layer-client/commit/ec9b316b50f8b403768ad35a2c8af5608b47e725))

## [2.11.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.10.10...v2.11.0) (2024-09-19)


### Features

* use helm common ([#520](https://github.com/MapColonies/discrete-layer-client/issues/520)) ([47af458](https://github.com/MapColonies/discrete-layer-client/commit/47af4580599ebe94c1c46f4c85da7e36f0013841))

### [2.10.10](https://github.com/MapColonies/discrete-layer-client/compare/v2.10.9...v2.10.10) (2024-08-15)


### Bug Fixes

* sso volumes ([4313808](https://github.com/MapColonies/discrete-layer-client/commit/431380854c5b6191b10abfcfd7b89f9aa44589a8))

### [2.10.9](https://github.com/MapColonies/discrete-layer-client/compare/v2.10.8...v2.10.9) (2024-08-15)


### Bug Fixes

* for index.html ([16d2f87](https://github.com/MapColonies/discrete-layer-client/commit/16d2f87cbaff1d4ddc839e99d19a656923723fc4))

### [2.10.8](https://github.com/MapColonies/discrete-layer-client/compare/v2.10.7...v2.10.8) (2024-08-15)


### Bug Fixes

* add header Cache-Control to index.html location ([#514](https://github.com/MapColonies/discrete-layer-client/issues/514)) ([e4ff2e1](https://github.com/MapColonies/discrete-layer-client/commit/e4ff2e1d021ff48ff6e00b0a9391d55a46b52f4e))

### [2.10.7](https://github.com/MapColonies/discrete-layer-client/compare/v2.10.6...v2.10.7) (2024-08-14)

### [2.10.6](https://github.com/MapColonies/discrete-layer-client/compare/v2.10.5...v2.10.6) (2024-08-13)

### [2.10.5](https://github.com/MapColonies/discrete-layer-client/compare/v2.10.4...v2.10.5) (2024-08-13)


### Bug Fixes

* config generation ([#516](https://github.com/MapColonies/discrete-layer-client/issues/516)) ([952619a](https://github.com/MapColonies/discrete-layer-client/commit/952619a6f85ea1902556accde97e9a8c9b608e81))
* import button state with new DR sync ([#517](https://github.com/MapColonies/discrete-layer-client/issues/517)) ([27cc883](https://github.com/MapColonies/discrete-layer-client/commit/27cc883f2ce52eaaeda3cec075678618dcc1b0ba))

### [2.10.4](https://github.com/MapColonies/discrete-layer-client/compare/v2.10.3...v2.10.4) (2024-08-08)


### Bug Fixes

* use new getProduct query instead of searchById query ([#513](https://github.com/MapColonies/discrete-layer-client/issues/513)) ([d910de3](https://github.com/MapColonies/discrete-layer-client/commit/d910de35a412e684c1cf79f64a4286eb9eba5018))

### [2.10.3](https://github.com/MapColonies/discrete-layer-client/compare/v2.10.2...v2.10.3) (2024-08-06)


### Bug Fixes

* clear old validations ([0da8951](https://github.com/MapColonies/discrete-layer-client/commit/0da89511bb355e531685a674fd5752e1f5a2abd8))
* curtain is closed when a new file is valid ([#511](https://github.com/MapColonies/discrete-layer-client/issues/511)) ([1183fba](https://github.com/MapColonies/discrete-layer-client/commit/1183fba61bb83448e07b9438ced7d212ec6f8e75))
* error list direction ([#512](https://github.com/MapColonies/discrete-layer-client/issues/512)) ([95bf063](https://github.com/MapColonies/discrete-layer-client/commit/95bf063f36da5acdb0c74167abbe8da83b31150e))
* footprint bug ([79bc1d9](https://github.com/MapColonies/discrete-layer-client/commit/79bc1d9b1c4af62cb80462fd2885c1c06fdcd3a4))

### [2.10.2](https://github.com/MapColonies/discrete-layer-client/compare/v2.10.1...v2.10.2) (2024-08-04)


### Bug Fixes

* validation api warning should not overflow and use ellipsis instead ([0f668b0](https://github.com/MapColonies/discrete-layer-client/commit/0f668b005641e6d8246bd8ca2e7031f76e6efc61))
* version validation ([#510](https://github.com/MapColonies/discrete-layer-client/issues/510)) ([aee507b](https://github.com/MapColonies/discrete-layer-client/commit/aee507b5600d5f10f28a0883c308a897a189b664))

### [2.10.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.10.0...v2.10.1) (2024-08-01)


### Bug Fixes

* sites config env var ([4c94795](https://github.com/MapColonies/discrete-layer-client/commit/4c94795233f4d22ada7de1f641027079be288fc3))

## [2.10.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.8.6...v2.10.0) (2024-08-01)


### Features

* sync DR ([#509](https://github.com/MapColonies/discrete-layer-client/issues/509)) ([eb5a920](https://github.com/MapColonies/discrete-layer-client/commit/eb5a920ee1dcf2a0b83565455b85bc51195a773a))

## [2.9.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.8.6...v2.9.0) (2024-08-01)


### Features

* sync DR ([#509](https://github.com/MapColonies/discrete-layer-client/issues/509)) ([eb5a920](https://github.com/MapColonies/discrete-layer-client/commit/eb5a920ee1dcf2a0b83565455b85bc51195a773a))

### [2.8.6](https://github.com/MapColonies/discrete-layer-client/compare/v2.8.5...v2.8.6) (2024-02-21)


### Bug Fixes

* sleep syntax ([#508](https://github.com/MapColonies/discrete-layer-client/issues/508)) ([d214999](https://github.com/MapColonies/discrete-layer-client/commit/d2149995fb8b57890e4a34c8fc5ab17aa3b374b5))

### [2.8.5](https://github.com/MapColonies/discrete-layer-client/compare/v2.8.4...v2.8.5) (2024-02-21)


### Bug Fixes

* add sleep to entrypoint ([#507](https://github.com/MapColonies/discrete-layer-client/issues/507)) ([241b145](https://github.com/MapColonies/discrete-layer-client/commit/241b1454aa6957d76f1d834dc8e509e733d1b330))

### [2.8.4](https://github.com/MapColonies/discrete-layer-client/compare/v2.8.3...v2.8.4) (2024-02-20)


### Bug Fixes

* execfile to exec ([#506](https://github.com/MapColonies/discrete-layer-client/issues/506)) ([be03f93](https://github.com/MapColonies/discrete-layer-client/commit/be03f933b3cd9bc044cc615015e80c5453f91ed4))

### [2.8.3](https://github.com/MapColonies/discrete-layer-client/compare/v2.8.2...v2.8.3) (2024-02-20)


### Bug Fixes

* entrypoint ([#505](https://github.com/MapColonies/discrete-layer-client/issues/505)) ([ae68acc](https://github.com/MapColonies/discrete-layer-client/commit/ae68acc8c8070c80beede1e1873dc8e101d6397a))

### [2.8.2](https://github.com/MapColonies/discrete-layer-client/compare/v2.8.1...v2.8.2) (2024-02-20)


### Bug Fixes

* entrypoint special chars ([#504](https://github.com/MapColonies/discrete-layer-client/issues/504)) ([d8c76f7](https://github.com/MapColonies/discrete-layer-client/commit/d8c76f72b5003d8bede220bce5c5b980daf9bb46))

### [2.8.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.8.0...v2.8.1) (2024-02-18)


### Bug Fixes

* synch operations in entrypoint ([#503](https://github.com/MapColonies/discrete-layer-client/issues/503)) ([6a4e72d](https://github.com/MapColonies/discrete-layer-client/commit/6a4e72d63afcb0b5e4c98306c8e8f2fe9877f091))

## [2.8.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.7.7...v2.8.0) (2024-02-14)


### Features

* login by bff ([#502](https://github.com/MapColonies/discrete-layer-client/issues/502)) ([32a6e6b](https://github.com/MapColonies/discrete-layer-client/commit/32a6e6b8fa87a5a3dd1c5d8e09f0f356757c8854))


### Bug Fixes

* layerpolygonparts field removal from api ([#501](https://github.com/MapColonies/discrete-layer-client/issues/501)) ([0e90a3f](https://github.com/MapColonies/discrete-layer-client/commit/0e90a3fd602627c7cf5415c3b930ac5818b21080))

### [2.7.7](https://github.com/MapColonies/discrete-layer-client/compare/v2.7.6...v2.7.7) (2024-01-17)


### Bug Fixes

* fly-to export behavior ([#499](https://github.com/MapColonies/discrete-layer-client/issues/499)) ([f60221d](https://github.com/MapColonies/discrete-layer-client/commit/f60221d1d7556c6482e6f910453cf9bce6bcd393))
* imagery layer context menu ([#500](https://github.com/MapColonies/discrete-layer-client/issues/500)) ([c7d9790](https://github.com/MapColonies/discrete-layer-client/commit/c7d9790f1d25adc7e598b88f22fad4d45a1c8777))

### [2.7.6](https://github.com/MapColonies/discrete-layer-client/compare/v2.7.5...v2.7.6) (2024-01-14)


### Bug Fixes

* build errors ([#498](https://github.com/MapColonies/discrete-layer-client/issues/498)) ([914759b](https://github.com/MapColonies/discrete-layer-client/commit/914759b8c080f3bceaf95fcda0f66d516ae6e5f3))

### [2.7.5](https://github.com/MapColonies/discrete-layer-client/compare/v2.7.4...v2.7.5) (2024-01-14)

### [2.7.4](https://github.com/MapColonies/discrete-layer-client/compare/v2.7.3...v2.7.4) (2024-01-11)


### Bug Fixes

* json empty value ([#497](https://github.com/MapColonies/discrete-layer-client/issues/497)) ([411e6ce](https://github.com/MapColonies/discrete-layer-client/commit/411e6ceadc729ecae9da068257eb33642dfe2673))

### [2.7.3](https://github.com/MapColonies/discrete-layer-client/compare/v2.7.2...v2.7.3) (2024-01-10)


### Bug Fixes

* q3-3 bug fix ([#496](https://github.com/MapColonies/discrete-layer-client/issues/496)) ([d4d92da](https://github.com/MapColonies/discrete-layer-client/commit/d4d92da612d8fb04f7c9a19e64b2523f57824211))

### [2.7.2](https://github.com/MapColonies/discrete-layer-client/compare/v2.7.1...v2.7.2) (2023-12-26)


### Bug Fixes

* geometry in wgs84 format validation ([#495](https://github.com/MapColonies/discrete-layer-client/issues/495)) ([64d9622](https://github.com/MapColonies/discrete-layer-client/commit/64d96226f79b8e7bf3cb479d5ca86870cfc47013))

### [2.7.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.7.0...v2.7.1) (2023-12-25)


### Bug Fixes

* job manager open raw state console errors ([#494](https://github.com/MapColonies/discrete-layer-client/issues/494)) ([6a2bfae](https://github.com/MapColonies/discrete-layer-client/commit/6a2bfae9f62715b91107c1e3b06543c9cff5879e))

## [2.7.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.6.2...v2.7.0) (2023-12-25)


### Features

* donload job details action ([#493](https://github.com/MapColonies/discrete-layer-client/issues/493)) ([8ee9a33](https://github.com/MapColonies/discrete-layer-client/commit/8ee9a33e66ceaff08746e6abae3abc00b29efcc2))

### [2.6.2](https://github.com/MapColonies/discrete-layer-client/compare/v2.6.1...v2.6.2) (2023-12-24)


### Bug Fixes

* linearrings closing check added ([#492](https://github.com/MapColonies/discrete-layer-client/issues/492)) ([17a2aed](https://github.com/MapColonies/discrete-layer-client/commit/17a2aedf1257ce90dbf147686bc8915990049659))

### [2.6.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.6.0...v2.6.1) (2023-12-21)


### Bug Fixes

* invalid geojson presentation ([#491](https://github.com/MapColonies/discrete-layer-client/issues/491)) ([c89e6e3](https://github.com/MapColonies/discrete-layer-client/commit/c89e6e3f18fb5b525639ece11da18600cb55dcb3))

## [2.6.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.5.3...v2.6.0) (2023-12-21)


### Features

* ol preview map ([#489](https://github.com/MapColonies/discrete-layer-client/issues/489)) ([56bce55](https://github.com/MapColonies/discrete-layer-client/commit/56bce552c9fbec248acbb318fb4bb0d8d3b18c38))
* Raster resolution fields handling ( MAPCO-3631 ) ([#485](https://github.com/MapColonies/discrete-layer-client/issues/485)) ([2a5bf0e](https://github.com/MapColonies/discrete-layer-client/commit/2a5bf0ed55d054ef552a195be67192261d154367))


### Bug Fixes

* context menu wfs bug ([#490](https://github.com/MapColonies/discrete-layer-client/issues/490)) ([5eb5c0c](https://github.com/MapColonies/discrete-layer-client/commit/5eb5c0c93dde50b87a4bd30320abd3fbe012a4ad))
* double label of raster insertdate ([#483](https://github.com/MapColonies/discrete-layer-client/issues/483)) ([8e2e92d](https://github.com/MapColonies/discrete-layer-client/commit/8e2e92dc2d98cdf50fa70fe7dd0e316b1963b3f8))
* future dates validation ([#486](https://github.com/MapColonies/discrete-layer-client/issues/486)) ([016659e](https://github.com/MapColonies/discrete-layer-client/commit/016659efd340e0693b8c2999db5bbca1c67f7a2f))
* json field presenation ([#484](https://github.com/MapColonies/discrete-layer-client/issues/484)) ([7e7abb4](https://github.com/MapColonies/discrete-layer-client/commit/7e7abb40b6030f3a2049ac7f4f5b80bab0ecc074))
* only fields with rows def should preserve new line ([#482](https://github.com/MapColonies/discrete-layer-client/issues/482)) ([608241f](https://github.com/MapColonies/discrete-layer-client/commit/608241fc5177d847b7f4129c5ddc0a5d91d91d60))
* search results actions disappeared ([#487](https://github.com/MapColonies/discrete-layer-client/issues/487)) ([2a2ea1c](https://github.com/MapColonies/discrete-layer-client/commit/2a2ea1c03926068900e550ef0f7def432986074d))
* search results list values ([#488](https://github.com/MapColonies/discrete-layer-client/issues/488)) ([92c6ce6](https://github.com/MapColonies/discrete-layer-client/commit/92c6ce6bc599c85a71c7400799d989541ad565f4))

### [2.5.3](https://github.com/MapColonies/discrete-layer-client/compare/v2.5.2...v2.5.3) (2023-11-05)


### Bug Fixes

* styling of brief panel in headers ([#481](https://github.com/MapColonies/discrete-layer-client/issues/481)) ([4f7c266](https://github.com/MapColonies/discrete-layer-client/commit/4f7c26651fc3a8146eb646c277af1991bf9967fc))
* thumbnails ([02d3eb4](https://github.com/MapColonies/discrete-layer-client/commit/02d3eb48b31a1e8c1158789d75a5c0a7067d6d66))

### [2.5.2](https://github.com/MapColonies/discrete-layer-client/compare/v2.5.0...v2.5.2) (2023-11-05)


### Bug Fixes

* layers results rerender issue ([bf4fcae](https://github.com/MapColonies/discrete-layer-client/commit/bf4fcae825b8a89ec0e9a38bbffbf51ff4a364f4))
* no capabilities state bug ([#480](https://github.com/MapColonies/discrete-layer-client/issues/480)) ([022536e](https://github.com/MapColonies/discrete-layer-client/commit/022536e9f0dc453fc94bcebe110318a5f9619a7f))

### [2.5.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.5.0...v2.5.1) (2023-11-05)


### Bug Fixes

* no capabilities state bug ([#480](https://github.com/MapColonies/discrete-layer-client/issues/480)) ([022536e](https://github.com/MapColonies/discrete-layer-client/commit/022536e9f0dc453fc94bcebe110318a5f9619a7f))

## [2.5.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.4.0...v2.5.0) (2023-11-02)


### Features

* add direction to map settings locale ([#477](https://github.com/MapColonies/discrete-layer-client/issues/477)) ([4bb8827](https://github.com/MapColonies/discrete-layer-client/commit/4bb8827c35d892ad0eb10ebb791fc55f90415ee5))


### Bug Fixes

* cesium workers cache nginx location config ([#476](https://github.com/MapColonies/discrete-layer-client/issues/476)) ([d0695e8](https://github.com/MapColonies/discrete-layer-client/commit/d0695e812c46a5a25930ac745abfb12393db7bea))
* elevations new input & output format ([#478](https://github.com/MapColonies/discrete-layer-client/issues/478)) ([67408fc](https://github.com/MapColonies/discrete-layer-client/commit/67408fce4a3b131f4d41600352ebc2c0e830302b))

## [2.4.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.3.3...v2.4.0) (2023-10-25)


### Features

* 3d analyze viewer ([#475](https://github.com/MapColonies/discrete-layer-client/issues/475)) ([853ebd2](https://github.com/MapColonies/discrete-layer-client/commit/853ebd27cdaeebf3f2f02ee90712fca1927a6440))

### [2.3.3](https://github.com/MapColonies/discrete-layer-client/compare/v2.3.2...v2.3.3) (2023-10-17)

### [2.3.2](https://github.com/MapColonies/discrete-layer-client/compare/v2.3.1...v2.3.2) (2023-10-15)

### [2.3.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.3.0...v2.3.1) (2023-10-12)


### Bug Fixes

* confd keys ([#473](https://github.com/MapColonies/discrete-layer-client/issues/473)) ([3f704a7](https://github.com/MapColonies/discrete-layer-client/commit/3f704a7eedadcbc1f36d8ef81d501d7064e009ba))

## [2.3.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.2.1...v2.3.0) (2023-10-12)


### Features

* whats new  ([#472](https://github.com/MapColonies/discrete-layer-client/issues/472)) ([548e285](https://github.com/MapColonies/discrete-layer-client/commit/548e285163e6515bbec0eb6da7b53f6040875618))

### [2.2.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.2.0...v2.2.1) (2023-10-12)

## [2.2.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.1.4...v2.2.0) (2023-10-10)


### Features

* loading progress ([#470](https://github.com/MapColonies/discrete-layer-client/issues/470)) ([a1619b2](https://github.com/MapColonies/discrete-layer-client/commit/a1619b2d0f928785e66b9a150d4330b206e63e10))


### Bug Fixes

* reset selected layer in search tab after record change ([#469](https://github.com/MapColonies/discrete-layer-client/issues/469)) ([dacd521](https://github.com/MapColonies/discrete-layer-client/commit/dacd5213ba0ea7faa46875569ee72163ea12c1f2))

### [2.1.4](https://github.com/MapColonies/discrete-layer-client/compare/v2.1.3...v2.1.4) (2023-10-05)


### Bug Fixes

* mark freetext search fields ([#467](https://github.com/MapColonies/discrete-layer-client/issues/467)) ([bd8a529](https://github.com/MapColonies/discrete-layer-client/commit/bd8a52969bcb5d962cd6e72c840f39635490ea77))

### [2.1.3](https://github.com/MapColonies/discrete-layer-client/compare/v2.1.2...v2.1.3) (2023-10-03)

### [2.1.2](https://github.com/MapColonies/discrete-layer-client/compare/v2.1.1...v2.1.2) (2023-10-02)


### Bug Fixes

* v2.1.1 bugs and improvements ([#465](https://github.com/MapColonies/discrete-layer-client/issues/465)) ([2823b26](https://github.com/MapColonies/discrete-layer-client/commit/2823b2688680a19283b3ceab803fa85bc1c2b7d5))

### [2.1.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.1.0...v2.1.1) (2023-09-28)

## [2.1.0](https://github.com/MapColonies/discrete-layer-client/compare/v2.0.7...v2.1.0) (2023-09-28)


### Features

* catalog side panel collapse ([#463](https://github.com/MapColonies/discrete-layer-client/issues/463)) ([caa0fac](https://github.com/MapColonies/discrete-layer-client/commit/caa0facffc129c96ee6294d08557912f6b3aa753))


### Bug Fixes

* catalog filters reset state issues ([3ae2227](https://github.com/MapColonies/discrete-layer-client/commit/3ae2227588465e59561137edf867559eae089e58))
* polygon parts marker position + cesium tools z-index ([80b543e](https://github.com/MapColonies/discrete-layer-client/commit/80b543eb48ef999dc5bd396d2fb076f8db77af13))

### [2.0.7](https://github.com/MapColonies/discrete-layer-client/compare/v2.0.6...v2.0.7) (2023-09-27)


### Bug Fixes

* file picker state issues and styles + fix hot areas menu click h… ([#461](https://github.com/MapColonies/discrete-layer-client/issues/461)) ([3eb1514](https://github.com/MapColonies/discrete-layer-client/commit/3eb15148e1ec78e9f141c060d5358332d2259927))
* file picker state issues and styles + fix hot areas menu click handling ([4a059dc](https://github.com/MapColonies/discrete-layer-client/commit/4a059dc56f31eb54d419888f91e46746946fe71e))
* replace in mainjs caused by webpack5 ([#462](https://github.com/MapColonies/discrete-layer-client/issues/462)) ([fefd27f](https://github.com/MapColonies/discrete-layer-client/commit/fefd27fe5809c187bd9a27e6013ca6b7a9b14aac))

### [2.0.6](https://github.com/MapColonies/discrete-layer-client/compare/v2.0.5...v2.0.6) (2023-09-21)


### Bug Fixes

* remove md font copy ([9645f7b](https://github.com/MapColonies/discrete-layer-client/commit/9645f7baaf724ff8cdd7df98c79533d9d399123d))

### [2.0.5](https://github.com/MapColonies/discrete-layer-client/compare/v2.0.4...v2.0.5) (2023-09-21)


### Bug Fixes

* add material-icons ([d783b4c](https://github.com/MapColonies/discrete-layer-client/commit/d783b4c49a45b852f3be33d556b260333c5a0c7b))
* project version toml ([6dc3d6a](https://github.com/MapColonies/discrete-layer-client/commit/6dc3d6ad10234bd1749f87aeac38fcb31cd93228))
* remove md icons copy ([98bbd14](https://github.com/MapColonies/discrete-layer-client/commit/98bbd143e390a4efc85fd40d5b7e9b636bfa967e))

### [2.0.4](https://github.com/MapColonies/discrete-layer-client/compare/v2.0.3...v2.0.4) (2023-09-21)


### Bug Fixes

* exclude tests from build ([3811640](https://github.com/MapColonies/discrete-layer-client/commit/3811640a0148429f3d2de2e007db9839b4750129))

### [2.0.3](https://github.com/MapColonies/discrete-layer-client/compare/v2.0.2...v2.0.3) (2023-09-21)


### Bug Fixes

* build script to use rewired + uuid import ([2ea45bd](https://github.com/MapColonies/discrete-layer-client/commit/2ea45bdffbad671d1a19967c5dde1b58737ca2b5))

### [2.0.2](https://github.com/MapColonies/discrete-layer-client/compare/v2.0.1...v2.0.2) (2023-09-21)


### Bug Fixes

* add uuid as dep ([7eb6501](https://github.com/MapColonies/discrete-layer-client/commit/7eb650119ad6e87089e1e9a082df09f511711741))

### [2.0.1](https://github.com/MapColonies/discrete-layer-client/compare/v2.0.0...v2.0.1) (2023-09-21)


### Bug Fixes

* dockerfile node version ([31c8e22](https://github.com/MapColonies/discrete-layer-client/commit/31c8e22bdea5a6981ff392939a3c98a2f61d93c9))

## [2.0.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.29.3...v2.0.0) (2023-09-21)


### Features

* add project version to app title ([#460](https://github.com/MapColonies/discrete-layer-client/issues/460)) ([e61e5a8](https://github.com/MapColonies/discrete-layer-client/commit/e61e5a881ee789891b603d23626dbb875571a05b))
* add query polygon parts feature to context menu (MAPCO-3275) ([#456](https://github.com/MapColonies/discrete-layer-client/issues/456)) ([fd7d4fa](https://github.com/MapColonies/discrete-layer-client/commit/fd7d4fad158a8042de6133db9b44aaa8ac9005b6))
* improve 3d tiles visibility ([#453](https://github.com/MapColonies/discrete-layer-client/issues/453)) ([9328052](https://github.com/MapColonies/discrete-layer-client/commit/932805239f6a04a065bd32c75c36335c6a61fe2c))


### Bug Fixes

* capabilities bug ([#457](https://github.com/MapColonies/discrete-layer-client/issues/457)) ([f78ae89](https://github.com/MapColonies/discrete-layer-client/commit/f78ae8962e0b83e1a011020a49f5d6fcf5b1f6c9))
* context menu terrain height not updating on position change ([#454](https://github.com/MapColonies/discrete-layer-client/issues/454)) ([d88bbdd](https://github.com/MapColonies/discrete-layer-client/commit/d88bbdd5066d4cf15bd8954856d588c819ea3d64))

### [1.29.3](https://github.com/MapColonies/discrete-layer-client/compare/v1.29.2...v1.29.3) (2023-07-13)


### Bug Fixes

* date control dissapers after selcting the date ([#450](https://github.com/MapColonies/discrete-layer-client/issues/450)) ([79203bd](https://github.com/MapColonies/discrete-layer-client/commit/79203bd5ddf0757af94bc2e2d68d310dfd4aea73))

### [1.29.2](https://github.com/MapColonies/discrete-layer-client/compare/v1.29.1...v1.29.2) (2023-07-13)

### [1.29.1](https://github.com/MapColonies/discrete-layer-client/compare/v1.29.0...v1.29.1) (2023-07-11)


### Bug Fixes

* add chrome portable as browser option ([#449](https://github.com/MapColonies/discrete-layer-client/issues/449)) ([1264412](https://github.com/MapColonies/discrete-layer-client/commit/1264412afbec127034e4a0f90dc78cc988816402))
* copy button should have type attr ([#448](https://github.com/MapColonies/discrete-layer-client/issues/448)) ([6286a98](https://github.com/MapColonies/discrete-layer-client/commit/6286a98e07d4c808166cb1c1d62f7f00876a3fa5))
* export server error ([#446](https://github.com/MapColonies/discrete-layer-client/issues/446)) ([88e7652](https://github.com/MapColonies/discrete-layer-client/commit/88e7652aae52e69cf16dbfe6849aa262a853929c))
* no thumbnail while export ([#447](https://github.com/MapColonies/discrete-layer-client/issues/447)) ([427281b](https://github.com/MapColonies/discrete-layer-client/commit/427281b4431c7e208be264133df680023fb18d7e))

## [1.29.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.28.1...v1.29.0) (2023-06-25)


### Features

* zoom level tracker ([#443](https://github.com/MapColonies/discrete-layer-client/issues/443)) ([43d242d](https://github.com/MapColonies/discrete-layer-client/commit/43d242d70d94fff62324f7608be22de913cbe1f5))


### Bug Fixes

* update build_and_push.yaml ([a222db1](https://github.com/MapColonies/discrete-layer-client/commit/a222db1842cd0112ab2454e4a4af3c8405f92c73))
* zoom level and gpu error msg ([#445](https://github.com/MapColonies/discrete-layer-client/issues/445)) ([800a02f](https://github.com/MapColonies/discrete-layer-client/commit/800a02f54b5703b45e76a06fd2854603c7bdd11e))

### [1.28.1](https://github.com/MapColonies/discrete-layer-client/compare/v1.28.0...v1.28.1) (2023-04-16)


### Bug Fixes

* export layer selection fields styling ([#442](https://github.com/MapColonies/discrete-layer-client/issues/442)) ([e7c6b53](https://github.com/MapColonies/discrete-layer-client/commit/e7c6b53851575570b95dabe0dc3e1d291f473a6b))

## [1.28.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.27.5...v1.28.0) (2023-04-13)


### Features

* add min resolution field to raster export feature ([#439](https://github.com/MapColonies/discrete-layer-client/issues/439)) ([69644d0](https://github.com/MapColonies/discrete-layer-client/commit/69644d03dd0b61265a6b891f8f74c8343607e66d))


### Bug Fixes

* qmesh export actions permissions ([#438](https://github.com/MapColonies/discrete-layer-client/issues/438)) ([fa33799](https://github.com/MapColonies/discrete-layer-client/commit/fa33799db39a5a057bfec3df73d579eb2b24b773))
* validationAgainstField watch should be of type AvailableProperties ([842e5d3](https://github.com/MapColonies/discrete-layer-client/commit/842e5d30da746c499d017cbfdb62b37a8b0fe915))

### [1.27.5](https://github.com/MapColonies/discrete-layer-client/compare/v1.27.4...v1.27.5) (2023-03-27)


### Bug Fixes

* clean up dem deprecated translation ([#432](https://github.com/MapColonies/discrete-layer-client/issues/432)) ([4c8e658](https://github.com/MapColonies/discrete-layer-client/commit/4c8e6587994a3c65323c7ea61e258ae71206183c))

### [1.27.4](https://github.com/MapColonies/discrete-layer-client/compare/v1.27.3...v1.27.4) (2023-03-15)

### [1.27.3](https://github.com/MapColonies/discrete-layer-client/compare/v1.27.2...v1.27.3) (2023-03-14)

### [1.27.2](https://github.com/MapColonies/discrete-layer-client/compare/v1.27.1...v1.27.2) (2023-03-14)


### Bug Fixes

* cesium geojson layer shows behind terrain on 3d mode ([#431](https://github.com/MapColonies/discrete-layer-client/issues/431)) ([a1513d8](https://github.com/MapColonies/discrete-layer-client/commit/a1513d8ecd41953e4f17ff21c44e92d2b1c1a32d))
* http to https ([#434](https://github.com/MapColonies/discrete-layer-client/issues/434)) ([a08df48](https://github.com/MapColonies/discrete-layer-client/commit/a08df48c8fd4318e7b17274ec88c237cb2525b14))
* icons ([#429](https://github.com/MapColonies/discrete-layer-client/issues/429)) ([3320980](https://github.com/MapColonies/discrete-layer-client/commit/33209800fcd82ac6b67409c1693026bf563fa747))

### [1.27.1](https://github.com/MapColonies/discrete-layer-client/compare/v1.27.0...v1.27.1) (2023-02-06)


### Bug Fixes

* don't fail terrain provider if a tile is missing ([#428](https://github.com/MapColonies/discrete-layer-client/issues/428)) ([70d279e](https://github.com/MapColonies/discrete-layer-client/commit/70d279efd56ae0388ea5bf2a3d722b162de1fc4a))

## [1.27.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.26.2...v1.27.0) (2023-01-31)


### Features

* error message when system gpu is insufficient ([#427](https://github.com/MapColonies/discrete-layer-client/issues/427)) ([e0011fd](https://github.com/MapColonies/discrete-layer-client/commit/e0011fdcc22ad8cb0d7cb934ef1349a4c5ae2038))

### [1.26.2](https://github.com/MapColonies/discrete-layer-client/compare/v1.26.1...v1.26.2) (2023-01-29)


### Bug Fixes

* new link type wmts base should be displayed with a copy icon ([#425](https://github.com/MapColonies/discrete-layer-client/issues/425)) ([957b81a](https://github.com/MapColonies/discrete-layer-client/commit/957b81a8a5e246e9c1a5c90c413669878b6f4639))
* producttype freeze support and context placement ([#426](https://github.com/MapColonies/discrete-layer-client/issues/426)) ([217ff14](https://github.com/MapColonies/discrete-layer-client/commit/217ff14b4f6654704d6f4316a20f8cf6d1003be2))

### [1.26.1](https://github.com/MapColonies/discrete-layer-client/compare/v1.26.0...v1.26.1) (2023-01-24)


### Bug Fixes

* web tools confd ([#424](https://github.com/MapColonies/discrete-layer-client/issues/424)) ([58bcd05](https://github.com/MapColonies/discrete-layer-client/commit/58bcd059abeae5d65577c84c5819cf99122fa311))

## [1.26.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.25.3...v1.26.0) (2023-01-24)


### Features

* web tools btn ([#423](https://github.com/MapColonies/discrete-layer-client/issues/423)) ([efd487f](https://github.com/MapColonies/discrete-layer-client/commit/efd487f1d34aa8acae4bc3aba9efcfbb74750716))

### [1.25.2](https://github.com/MapColonies/discrete-layer-client/compare/v1.25.1...v1.25.2) (2023-01-18)


### Bug Fixes

* show hide icon renamed ([#420](https://github.com/MapColonies/discrete-layer-client/issues/420)) ([db13629](https://github.com/MapColonies/discrete-layer-client/commit/db13629568e5232c712859f2f1c7da708f0a2b23))

### [1.25.1](https://github.com/MapColonies/discrete-layer-client/compare/v1.25.0...v1.25.1) (2023-01-18)


### Bug Fixes

* icons rename ([#419](https://github.com/MapColonies/discrete-layer-client/issues/419)) ([f09f52f](https://github.com/MapColonies/discrete-layer-client/commit/f09f52f5f26df0584007ce6fcb78e0c517701945))

## [1.25.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.24.0...v1.25.0) (2023-01-18)


### Features

* font 3_0 integrated ([#418](https://github.com/MapColonies/discrete-layer-client/issues/418)) ([1187df1](https://github.com/MapColonies/discrete-layer-client/commit/1187df152b835849d47a19d2d088999bff35bdbf))
* new icons start implementation ([#412](https://github.com/MapColonies/discrete-layer-client/issues/412)) ([d336852](https://github.com/MapColonies/discrete-layer-client/commit/d336852486b604d4febe6e4d13966cc471ea5dc2))


### Bug Fixes

* classification tranaslations ([#415](https://github.com/MapColonies/discrete-layer-client/issues/415)) ([acacfc4](https://github.com/MapColonies/discrete-layer-client/commit/acacfc44dabcd0fa974a2e1beae2a3439e3dd8f4))
* revert 2d fly to along with 3d ([#416](https://github.com/MapColonies/discrete-layer-client/issues/416)) ([a7ff126](https://github.com/MapColonies/discrete-layer-client/commit/a7ff126f6cf9bb0da97535bdc59c4e10a8b752df))

## [1.24.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.23.0...v1.24.0) (2023-01-16)


### Features

* wfs polygon to polyline logic ([#414](https://github.com/MapColonies/discrete-layer-client/issues/414)) ([f319648](https://github.com/MapColonies/discrete-layer-client/commit/f3196487b485f9afcf15596306abb465f824b09c))

## [1.23.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.22.2...v1.23.0) (2023-01-15)


### Features

* set 3d scene mode in case of fly to a 3d model ([#406](https://github.com/MapColonies/discrete-layer-client/issues/406)) ([168725a](https://github.com/MapColonies/discrete-layer-client/commit/168725acdd42c701339a03fba6469c8feaab9e16))
* transparency field added to model ([#404](https://github.com/MapColonies/discrete-layer-client/issues/404)) ([2a9a3ec](https://github.com/MapColonies/discrete-layer-client/commit/2a9a3ece4c183a30b5cf41663a277ce239678ec7))


### Bug Fixes

* add gap between date range picker inputs ([#411](https://github.com/MapColonies/discrete-layer-client/issues/411)) ([7023fd4](https://github.com/MapColonies/discrete-layer-client/commit/7023fd459d0124dee0a053b93388b342ace8aac1))
* alignment in case of a small screen ([ae90bf6](https://github.com/MapColonies/discrete-layer-client/commit/ae90bf69f80a34582f55ce7cee39992ea9faace4))
* app crashes when there is no default style ([#410](https://github.com/MapColonies/discrete-layer-client/issues/410)) ([d676247](https://github.com/MapColonies/discrete-layer-client/commit/d676247e34ffc2e8f7f2c2aa4e89ef9cfaabc21a))
* change abort and reset jobs logic according to job model ([#407](https://github.com/MapColonies/discrete-layer-client/issues/407)) ([6cf0a4b](https://github.com/MapColonies/discrete-layer-client/commit/6cf0a4b8414fe4ce1f6eb008304fb34a7f382d23))
* disable browser context menu on top of app context menu ([#409](https://github.com/MapColonies/discrete-layer-client/issues/409)) ([7b183aa](https://github.com/MapColonies/discrete-layer-client/commit/7b183aaf95cd138d7b8f1c7b838b86f5701c1cd1))
* tab view data bug MAPCO-2728 ([#401](https://github.com/MapColonies/discrete-layer-client/issues/401)) ([325370d](https://github.com/MapColonies/discrete-layer-client/commit/325370d71beca935b748b5b335cc31fe6430de76))
* use wmts layer url from capabilities (MAPCO-2648) ([#395](https://github.com/MapColonies/discrete-layer-client/issues/395)) ([d0e89a1](https://github.com/MapColonies/discrete-layer-client/commit/d0e89a15495dbcb9fc0904e133381c932e8e6d2b))
* wfs feature store observation and no terrain functionality ([#408](https://github.com/MapColonies/discrete-layer-client/issues/408)) ([761a4e3](https://github.com/MapColonies/discrete-layer-client/commit/761a4e3686452362e261bdd86dedea7ee0d6e89f))

### [1.22.2](https://github.com/MapColonies/discrete-layer-client/compare/v1.22.1...v1.22.2) (2022-11-07)


### Bug Fixes

* details panel font and tooltip ([#396](https://github.com/MapColonies/discrete-layer-client/issues/396)) ([994fcb8](https://github.com/MapColonies/discrete-layer-client/commit/994fcb8f49a87dd08a3fd3495e85e33374f8eb3a))

### [1.22.1](https://github.com/MapColonies/discrete-layer-client/compare/v1.22.0...v1.22.1) (2022-11-06)


### Bug Fixes

* capabilities error should not affect catalog view ([#394](https://github.com/MapColonies/discrete-layer-client/issues/394)) ([1065b37](https://github.com/MapColonies/discrete-layer-client/commit/1065b37aa7bccecfc229b43ee6df5f5878bca107))
* date granularity should be set to minutes for app's dates (MAPCO-2637) ([#392](https://github.com/MapColonies/discrete-layer-client/issues/392)) ([50f1fc3](https://github.com/MapColonies/discrete-layer-client/commit/50f1fc3ff08897d526b54433b4595f43e22faffc))
* fix layer results not updating entity ([#379](https://github.com/MapColonies/discrete-layer-client/issues/379)) ([726c5f2](https://github.com/MapColonies/discrete-layer-client/commit/726c5f2f1ac283852deb88fdc88500bceaa1d3f1))
* flyto should be added in every model ([#385](https://github.com/MapColonies/discrete-layer-client/issues/385)) ([e4f6ba7](https://github.com/MapColonies/discrete-layer-client/commit/e4f6ba774a795a9d7e583e80dde239cb8defe71c))
* hide missing icons glow to fix layer details scrollbar ([#384](https://github.com/MapColonies/discrete-layer-client/issues/384)) ([43a927f](https://github.com/MapColonies/discrete-layer-client/commit/43a927f8a8b41e9cdc044b2ccd375ffb3cf0a300))
* irrelevant quote mark ([#377](https://github.com/MapColonies/discrete-layer-client/issues/377)) ([131bc7d](https://github.com/MapColonies/discrete-layer-client/commit/131bc7d6f5c1d804cdb059f1510eb1385ec6dc87))
* legend title should be the name field MAPCO-2638 ([#393](https://github.com/MapColonies/discrete-layer-client/issues/393)) ([0972e02](https://github.com/MapColonies/discrete-layer-client/commit/0972e028e7d3cef50eb8e8dc0ac614b84e018d77))
* path direction auto ([#378](https://github.com/MapColonies/discrete-layer-client/issues/378)) ([2f4da1c](https://github.com/MapColonies/discrete-layer-client/commit/2f4da1cd6954d2fac3c09d21160e4f03e2f2952a))
* remove tooltip from JSON fields ([#382](https://github.com/MapColonies/discrete-layer-client/issues/382)) ([fa4bd73](https://github.com/MapColonies/discrete-layer-client/commit/fa4bd7322e85b7947f3a9ddb347696aed7d2fdef))
* styles collision with chonky ([#376](https://github.com/MapColonies/discrete-layer-client/issues/376)) ([77f7003](https://github.com/MapColonies/discrete-layer-client/commit/77f7003bd02127bd37c90dc92d1740c1cfc7e9b0))
* support 4XX status error codes (MAPCO-2574, MAPCO-2575) ([#381](https://github.com/MapColonies/discrete-layer-client/issues/381)) ([3aca35b](https://github.com/MapColonies/discrete-layer-client/commit/3aca35b1b04a67b1c2e364f90927518f5cc273de))
* tooltips and dialog names ([#383](https://github.com/MapColonies/discrete-layer-client/issues/383)) ([e697a8b](https://github.com/MapColonies/discrete-layer-client/commit/e697a8b18c9759692c37e7bb1306904b8969202e))
* when curtain shown there shouldn't be scrolling ([#388](https://github.com/MapColonies/discrete-layer-client/issues/388)) ([84bce15](https://github.com/MapColonies/discrete-layer-client/commit/84bce1514cc034ac1dade433bc2184321290b6b6))

## [1.22.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.19.3...v1.22.0) (2022-10-12)


### Features

* 3D profile 2.0 ([#349](https://github.com/MapColonies/discrete-layer-client/issues/349)) ([908956e](https://github.com/MapColonies/discrete-layer-client/commit/908956ec72ebdf758cd17b62e11096d3edb068ba))
* added reset app state action ([#367](https://github.com/MapColonies/discrete-layer-client/issues/367)) ([fc48da2](https://github.com/MapColonies/discrete-layer-client/commit/fc48da2b5b4ade10d3075a5730019573b83cf90a))
* fetch raw enums from bff basic concept ([#365](https://github.com/MapColonies/discrete-layer-client/issues/365)) ([af8a607](https://github.com/MapColonies/discrete-layer-client/commit/af8a607bbd9b18f983876edfdfb9ac58b9807fcd))
* metadata exporter basic concept ([#351](https://github.com/MapColonies/discrete-layer-client/issues/351)) ([b857643](https://github.com/MapColonies/discrete-layer-client/commit/b857643f2b2e470e35f007410bbfd73a4b3435e3))
* new helper actions, fixes for current actions and documentation added ([#358](https://github.com/MapColonies/discrete-layer-client/issues/358)) ([476be60](https://github.com/MapColonies/discrete-layer-client/commit/476be6001d0650d39d7f715128a074bd03f1479c))


### Bug Fixes

* abort job synch + remark job actions ([#366](https://github.com/MapColonies/discrete-layer-client/issues/366)) ([cefadc4](https://github.com/MapColonies/discrete-layer-client/commit/cefadc4267a5adaf750995a76f66d53a826ae569))
* ag grid update rows when data changes ([#363](https://github.com/MapColonies/discrete-layer-client/issues/363)) ([1f196ed](https://github.com/MapColonies/discrete-layer-client/commit/1f196edb559f508271e0ddc0f9427c88306b4408))
* catalog tree capabilities bug + empty list bug ([#371](https://github.com/MapColonies/discrete-layer-client/issues/371)) ([cdf4f6a](https://github.com/MapColonies/discrete-layer-client/commit/cdf4f6afb96fdcc16205dbe637b5fdfe3bc40ac7))
* clean up unpublish logic ([#359](https://github.com/MapColonies/discrete-layer-client/issues/359)) ([c6a2c09](https://github.com/MapColonies/discrete-layer-client/commit/c6a2c095a1ac2aaefbb877034b385779b881fea4))
* disable feature by role ([#357](https://github.com/MapColonies/discrete-layer-client/issues/357)) ([a37bd5f](https://github.com/MapColonies/discrete-layer-client/commit/a37bd5f013023945eda2ebd8f77b4bfcab554fa9))
* disabled buttons color ([#370](https://github.com/MapColonies/discrete-layer-client/issues/370)) ([d378180](https://github.com/MapColonies/discrete-layer-client/commit/d378180823c74d337ff041f2ef755d26527a6900))
* fix ([#373](https://github.com/MapColonies/discrete-layer-client/issues/373)) ([55b69cd](https://github.com/MapColonies/discrete-layer-client/commit/55b69cdd3d83900cc1bae78b00cfc30c636c1a7f))
* footprint with optional convexhull ([#354](https://github.com/MapColonies/discrete-layer-client/issues/354)) ([d4a5b51](https://github.com/MapColonies/discrete-layer-client/commit/d4a5b515753827b39bc300ddf250272d3d97a518))
* getEditablePartialObject should consider lifecycle mutable fields ([9e9f020](https://github.com/MapColonies/discrete-layer-client/commit/9e9f0205e2890f84422af33cfefd732191db7b93))
* getEditablePartialObject should consider lifecycle mutable fields ([#372](https://github.com/MapColonies/discrete-layer-client/issues/372)) ([d4e4621](https://github.com/MapColonies/discrete-layer-client/commit/d4e462148af76bc024eaddf25ec1601b86469118))
* mc models version ([#364](https://github.com/MapColonies/discrete-layer-client/issues/364)) ([d8c1867](https://github.com/MapColonies/discrete-layer-client/commit/d8c1867264a9c992b000f4f2ffb21bfc46c24880))
* missing fields from layer details MAPCO-2523 ([#353](https://github.com/MapColonies/discrete-layer-client/issues/353)) ([1a4689d](https://github.com/MapColonies/discrete-layer-client/commit/1a4689dd2fe6dafbf6eb87910d513a8c1f640838))
* product status ([#360](https://github.com/MapColonies/discrete-layer-client/issues/360)) ([ddec8b9](https://github.com/MapColonies/discrete-layer-client/commit/ddec8b9d5f35d6b951fad8002703621877a39f8e))
* tiles uri with version ([#356](https://github.com/MapColonies/discrete-layer-client/issues/356)) ([f097904](https://github.com/MapColonies/discrete-layer-client/commit/f097904ba88c7d980b8cbda4b027cf4dd0d5f937))
* typo ([333590c](https://github.com/MapColonies/discrete-layer-client/commit/333590c16f19cdb1d5b971d1930a99fb35f7611b))
* unpublished value presentor ([#369](https://github.com/MapColonies/discrete-layer-client/issues/369)) ([2a0bfe6](https://github.com/MapColonies/discrete-layer-client/commit/2a0bfe6f688a590fe72ab6399a8b0e6e2a8908bb))
* user role hard coded defaults to admin ([#380](https://github.com/MapColonies/discrete-layer-client/issues/380)) ([e54649a](https://github.com/MapColonies/discrete-layer-client/commit/e54649aac8117605ec182fc7a423ffa7fe605dbf))

## [1.21.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.19.3...v1.21.0) (2022-10-03)


### Features

* 3D profile 2.0 ([#349](https://github.com/MapColonies/discrete-layer-client/issues/349)) ([908956e](https://github.com/MapColonies/discrete-layer-client/commit/908956ec72ebdf758cd17b62e11096d3edb068ba))
* added reset app state action ([#367](https://github.com/MapColonies/discrete-layer-client/issues/367)) ([fc48da2](https://github.com/MapColonies/discrete-layer-client/commit/fc48da2b5b4ade10d3075a5730019573b83cf90a))
* fetch raw enums from bff basic concept ([#365](https://github.com/MapColonies/discrete-layer-client/issues/365)) ([af8a607](https://github.com/MapColonies/discrete-layer-client/commit/af8a607bbd9b18f983876edfdfb9ac58b9807fcd))
* metadata exporter basic concept ([#351](https://github.com/MapColonies/discrete-layer-client/issues/351)) ([b857643](https://github.com/MapColonies/discrete-layer-client/commit/b857643f2b2e470e35f007410bbfd73a4b3435e3))
* new helper actions, fixes for current actions and documentation added ([#358](https://github.com/MapColonies/discrete-layer-client/issues/358)) ([476be60](https://github.com/MapColonies/discrete-layer-client/commit/476be6001d0650d39d7f715128a074bd03f1479c))


### Bug Fixes

* abort job synch + remark job actions ([#366](https://github.com/MapColonies/discrete-layer-client/issues/366)) ([cefadc4](https://github.com/MapColonies/discrete-layer-client/commit/cefadc4267a5adaf750995a76f66d53a826ae569))
* ag grid update rows when data changes ([#363](https://github.com/MapColonies/discrete-layer-client/issues/363)) ([1f196ed](https://github.com/MapColonies/discrete-layer-client/commit/1f196edb559f508271e0ddc0f9427c88306b4408))
* catalog tree capabilities bug + empty list bug ([#371](https://github.com/MapColonies/discrete-layer-client/issues/371)) ([cdf4f6a](https://github.com/MapColonies/discrete-layer-client/commit/cdf4f6afb96fdcc16205dbe637b5fdfe3bc40ac7))
* clean up unpublish logic ([#359](https://github.com/MapColonies/discrete-layer-client/issues/359)) ([c6a2c09](https://github.com/MapColonies/discrete-layer-client/commit/c6a2c095a1ac2aaefbb877034b385779b881fea4))
* disable feature by role ([#357](https://github.com/MapColonies/discrete-layer-client/issues/357)) ([a37bd5f](https://github.com/MapColonies/discrete-layer-client/commit/a37bd5f013023945eda2ebd8f77b4bfcab554fa9))
* disabled buttons color ([#370](https://github.com/MapColonies/discrete-layer-client/issues/370)) ([d378180](https://github.com/MapColonies/discrete-layer-client/commit/d378180823c74d337ff041f2ef755d26527a6900))
* fix ([#373](https://github.com/MapColonies/discrete-layer-client/issues/373)) ([55b69cd](https://github.com/MapColonies/discrete-layer-client/commit/55b69cdd3d83900cc1bae78b00cfc30c636c1a7f))
* footprint with optional convexhull ([#354](https://github.com/MapColonies/discrete-layer-client/issues/354)) ([d4a5b51](https://github.com/MapColonies/discrete-layer-client/commit/d4a5b515753827b39bc300ddf250272d3d97a518))
* getEditablePartialObject should consider lifecycle mutable fields ([9e9f020](https://github.com/MapColonies/discrete-layer-client/commit/9e9f0205e2890f84422af33cfefd732191db7b93))
* getEditablePartialObject should consider lifecycle mutable fields ([#372](https://github.com/MapColonies/discrete-layer-client/issues/372)) ([d4e4621](https://github.com/MapColonies/discrete-layer-client/commit/d4e462148af76bc024eaddf25ec1601b86469118))
* mc models version ([#364](https://github.com/MapColonies/discrete-layer-client/issues/364)) ([d8c1867](https://github.com/MapColonies/discrete-layer-client/commit/d8c1867264a9c992b000f4f2ffb21bfc46c24880))
* missing fields from layer details MAPCO-2523 ([#353](https://github.com/MapColonies/discrete-layer-client/issues/353)) ([1a4689d](https://github.com/MapColonies/discrete-layer-client/commit/1a4689dd2fe6dafbf6eb87910d513a8c1f640838))
* product status ([#360](https://github.com/MapColonies/discrete-layer-client/issues/360)) ([ddec8b9](https://github.com/MapColonies/discrete-layer-client/commit/ddec8b9d5f35d6b951fad8002703621877a39f8e))
* tiles uri with version ([#356](https://github.com/MapColonies/discrete-layer-client/issues/356)) ([f097904](https://github.com/MapColonies/discrete-layer-client/commit/f097904ba88c7d980b8cbda4b027cf4dd0d5f937))
* typo ([333590c](https://github.com/MapColonies/discrete-layer-client/commit/333590c16f19cdb1d5b971d1930a99fb35f7611b))
* unpublished value presentor ([#369](https://github.com/MapColonies/discrete-layer-client/issues/369)) ([2a0bfe6](https://github.com/MapColonies/discrete-layer-client/commit/2a0bfe6f688a590fe72ab6399a8b0e6e2a8908bb))

## [1.20.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.19.3...v1.20.0) (2022-10-03)


### Features

* 3D profile 2.0 ([#349](https://github.com/MapColonies/discrete-layer-client/issues/349)) ([908956e](https://github.com/MapColonies/discrete-layer-client/commit/908956ec72ebdf758cd17b62e11096d3edb068ba))
* added reset app state action ([#367](https://github.com/MapColonies/discrete-layer-client/issues/367)) ([fc48da2](https://github.com/MapColonies/discrete-layer-client/commit/fc48da2b5b4ade10d3075a5730019573b83cf90a))
* fetch raw enums from bff basic concept ([#365](https://github.com/MapColonies/discrete-layer-client/issues/365)) ([af8a607](https://github.com/MapColonies/discrete-layer-client/commit/af8a607bbd9b18f983876edfdfb9ac58b9807fcd))
* metadata exporter basic concept ([#351](https://github.com/MapColonies/discrete-layer-client/issues/351)) ([b857643](https://github.com/MapColonies/discrete-layer-client/commit/b857643f2b2e470e35f007410bbfd73a4b3435e3))
* new helper actions, fixes for current actions and documentation added ([#358](https://github.com/MapColonies/discrete-layer-client/issues/358)) ([476be60](https://github.com/MapColonies/discrete-layer-client/commit/476be6001d0650d39d7f715128a074bd03f1479c))


### Bug Fixes

* abort job synch + remark job actions ([#366](https://github.com/MapColonies/discrete-layer-client/issues/366)) ([cefadc4](https://github.com/MapColonies/discrete-layer-client/commit/cefadc4267a5adaf750995a76f66d53a826ae569))
* ag grid update rows when data changes ([#363](https://github.com/MapColonies/discrete-layer-client/issues/363)) ([1f196ed](https://github.com/MapColonies/discrete-layer-client/commit/1f196edb559f508271e0ddc0f9427c88306b4408))
* catalog tree capabilities bug + empty list bug ([#371](https://github.com/MapColonies/discrete-layer-client/issues/371)) ([cdf4f6a](https://github.com/MapColonies/discrete-layer-client/commit/cdf4f6afb96fdcc16205dbe637b5fdfe3bc40ac7))
* clean up unpublish logic ([#359](https://github.com/MapColonies/discrete-layer-client/issues/359)) ([c6a2c09](https://github.com/MapColonies/discrete-layer-client/commit/c6a2c095a1ac2aaefbb877034b385779b881fea4))
* disable feature by role ([#357](https://github.com/MapColonies/discrete-layer-client/issues/357)) ([a37bd5f](https://github.com/MapColonies/discrete-layer-client/commit/a37bd5f013023945eda2ebd8f77b4bfcab554fa9))
* disabled buttons color ([#370](https://github.com/MapColonies/discrete-layer-client/issues/370)) ([d378180](https://github.com/MapColonies/discrete-layer-client/commit/d378180823c74d337ff041f2ef755d26527a6900))
* fix ([#373](https://github.com/MapColonies/discrete-layer-client/issues/373)) ([55b69cd](https://github.com/MapColonies/discrete-layer-client/commit/55b69cdd3d83900cc1bae78b00cfc30c636c1a7f))
* footprint with optional convexhull ([#354](https://github.com/MapColonies/discrete-layer-client/issues/354)) ([d4a5b51](https://github.com/MapColonies/discrete-layer-client/commit/d4a5b515753827b39bc300ddf250272d3d97a518))
* mc models version ([#364](https://github.com/MapColonies/discrete-layer-client/issues/364)) ([d8c1867](https://github.com/MapColonies/discrete-layer-client/commit/d8c1867264a9c992b000f4f2ffb21bfc46c24880))
* missing fields from layer details MAPCO-2523 ([#353](https://github.com/MapColonies/discrete-layer-client/issues/353)) ([1a4689d](https://github.com/MapColonies/discrete-layer-client/commit/1a4689dd2fe6dafbf6eb87910d513a8c1f640838))
* product status ([#360](https://github.com/MapColonies/discrete-layer-client/issues/360)) ([ddec8b9](https://github.com/MapColonies/discrete-layer-client/commit/ddec8b9d5f35d6b951fad8002703621877a39f8e))
* tiles uri with version ([#356](https://github.com/MapColonies/discrete-layer-client/issues/356)) ([f097904](https://github.com/MapColonies/discrete-layer-client/commit/f097904ba88c7d980b8cbda4b027cf4dd0d5f937))
* unpublished value presentor ([#369](https://github.com/MapColonies/discrete-layer-client/issues/369)) ([2a0bfe6](https://github.com/MapColonies/discrete-layer-client/commit/2a0bfe6f688a590fe72ab6399a8b0e6e2a8908bb))

### [1.19.3](https://github.com/MapColonies/discrete-layer-client/compare/v1.19.2...v1.19.3) (2022-09-07)


### Bug Fixes

* browser check scripts should be sync ([#352](https://github.com/MapColonies/discrete-layer-client/issues/352)) ([9f7e570](https://github.com/MapColonies/discrete-layer-client/commit/9f7e57099badb1838ac31ad25ac6f5b929c24573))

### [1.19.2](https://github.com/MapColonies/discrete-layer-client/compare/v1.19.1...v1.19.2) (2022-09-06)


### Bug Fixes

* side panel details overflows on x axis ([#350](https://github.com/MapColonies/discrete-layer-client/issues/350)) ([31fb351](https://github.com/MapColonies/discrete-layer-client/commit/31fb3515c9c66bb1ada5114c07404290cfde1086))

### [1.19.1](https://github.com/MapColonies/discrete-layer-client/compare/v1.19.0...v1.19.1) (2022-09-05)


### Bug Fixes

* using variables in media query won't work ([60e0acc](https://github.com/MapColonies/discrete-layer-client/commit/60e0acc6851d3f0cf629a75efea4652413d931b8))

## [1.19.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.18.0...v1.19.0) (2022-09-05)


### Features

* app and document title ([79e047d](https://github.com/MapColonies/discrete-layer-client/commit/79e047d4879b4733e39c2401062d0ad61bbceb7b))


### Bug Fixes

* footprint ([#347](https://github.com/MapColonies/discrete-layer-client/issues/347)) ([b914e66](https://github.com/MapColonies/discrete-layer-client/commit/b914e6607d7ead4296b3f267ade464066076e72c))
* timeout errors ([#348](https://github.com/MapColonies/discrete-layer-client/issues/348)) ([01da459](https://github.com/MapColonies/discrete-layer-client/commit/01da4598f270bceb6b6c19de06fbad8bbfa7d763))

## [1.18.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.17.3...v1.18.0) (2022-08-30)


### Features

* add text area support for string presentors ([2c5bf31](https://github.com/MapColonies/discrete-layer-client/commit/2c5bf317e4a4fce3636b34118c40cdd313492898))


### Bug Fixes

* date value presentor tooltip icon misplaced ([8ffd8c6](https://github.com/MapColonies/discrete-layer-client/commit/8ffd8c6ccb8a729f8105601066d3b94b4b68782f))

### [1.17.3](https://github.com/MapColonies/discrete-layer-client/compare/v1.17.2...v1.17.3) (2022-08-30)


### Bug Fixes

* catalog tree order ([#343](https://github.com/MapColonies/discrete-layer-client/issues/343)) ([26ae297](https://github.com/MapColonies/discrete-layer-client/commit/26ae297bae3d38a7fbd48cb33a6fd4e4dfcaf4b8))

### [1.17.2](https://github.com/MapColonies/discrete-layer-client/compare/v1.17.1...v1.17.2) (2022-08-25)

## [1.17.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.16.0...v1.17.0) (2022-08-23)


### Features

*  root compatibility check ([#331](https://github.com/MapColonies/discrete-layer-client/issues/331)) ([a0e090b](https://github.com/MapColonies/discrete-layer-client/commit/a0e090b0a997a9720cfe7f7baa09136f5c8417bb))
* style sidebar ([#324](https://github.com/MapColonies/discrete-layer-client/issues/324)) ([48aa87c](https://github.com/MapColonies/discrete-layer-client/commit/48aa87cfe552c1defe4a3a0948a0415ee8d55c34)), closes [#326](https://github.com/MapColonies/discrete-layer-client/issues/326)


### Bug Fixes

* cesium abstraction ([#333](https://github.com/MapColonies/discrete-layer-client/issues/333)) ([df9f30d](https://github.com/MapColonies/discrete-layer-client/commit/df9f30d3ccc6f1d072bf44bf89c82453696571b1))
* fix ([#329](https://github.com/MapColonies/discrete-layer-client/issues/329)) ([9a4d04e](https://github.com/MapColonies/discrete-layer-client/commit/9a4d04eede5c47e4d277eda27a4f941ca7fc9b0d))
* flyto behavior and entity actions ([#335](https://github.com/MapColonies/discrete-layer-client/issues/335)) ([bbc99e3](https://github.com/MapColonies/discrete-layer-client/commit/bbc99e3b61ac147cfef08b262cb161d79dd8faa9))

## [1.16.0](https://github.com/MapColonies/discrete-layer-client/compare/v1.15.13...v1.16.0) (2022-08-04)


### Features

* unpublished ([#322](https://github.com/MapColonies/discrete-layer-client/issues/322)) ([4425869](https://github.com/MapColonies/discrete-layer-client/commit/44258694a031da506696f1e637be009105130f3d))


### Bug Fixes

* 3d update integration ([#325](https://github.com/MapColonies/discrete-layer-client/issues/325)) ([7043a6e](https://github.com/MapColonies/discrete-layer-client/commit/7043a6e273944c9278963bc9b6d525566983bf44))

### [1.15.11](https://github.com/MapColonies/discrete-layer-client/compare/v1.15.10...v1.15.11) (2022-05-25)


### Bug Fixes

* model string array fields treatment ([24b1909](https://github.com/MapColonies/discrete-layer-client/commit/24b1909d165a846669bf5eb16e4e07fb71cbfafc))

### [1.15.10](https://github.com/MapColonies/discrete-layer-client/compare/v1.15.9...v1.15.10) (2022-05-24)


### Bug Fixes

* poi ([50e8fd2](https://github.com/MapColonies/discrete-layer-client/commit/50e8fd2f160410f4eb88100a17517e2be1f2300c))

### [1.15.9](https://github.com/MapColonies/discrete-layer-client/compare/v1.15.7...v1.15.9) (2022-05-24)

### [1.14.1](https://github.com/MapColonies/discrete-layer-client/compare/v1.14.0...v1.14.1) (2022-03-28)


### Bug Fixes

* system core info close btn over content ([#282](https://github.com/MapColonies/discrete-layer-client/issues/282)) ([ea1bb95](https://github.com/MapColonies/discrete-layer-client/commit/ea1bb958709fc22030fe6b5ed0797636f2cdfd59))
