import React, { useEffect } from 'react';
// import { BaseMapsLegendsFetcher } from './base-maps-legends-fetcher-component';
import { EntityDescriptorsFetcher } from './entity-descriptors-fetcher.component';
import { LookupTablesFetcher } from './lookup-tables-fetcher.component';
import { MCEnumsFetcher } from './mc-enums-fetcher.component';
import { WfsFeaturesFetcher } from './wfs-features-fetcher.component';
import { ServicesAvailabilityFetcher } from './services-availability-fetcher-component';
import { useStore } from '../../../models';

export const StaticDataFetcher: React.FC = () => {
  const store = useStore();

  // Init stores after some dependencies are set
  useEffect(() => {
    if (store.servicesAvailabilityStore.servicesAvailability) {
      // Here we have the services availabilities initialized.
      store.mapMenusManagerStore.initStore();
    }
  }, [
    store.mapMenusManagerStore.wfsFeatureTypes,
    store.servicesAvailabilityStore.servicesAvailability,
  ]);

  return (
    <>
      <EntityDescriptorsFetcher />
      <ServicesAvailabilityFetcher />
      <MCEnumsFetcher />
      <LookupTablesFetcher />
      <WfsFeaturesFetcher />
      {/* <BaseMapsLegendsFetcher /> */}
    </>
  );
};
