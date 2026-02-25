/* eslint-disable @typescript-eslint/naming-convention */
import React, { useEffect } from 'react';
import { observer } from 'mobx-react';
import { useQuery, useStore } from '../../../models/RootStore';

export const ServicesAvailabilityFetcher: React.FC = observer(() => {
  const store = useStore();
  const servicesAvailabilityQuery = useQuery((store) =>
    store.queryServicesAvailability()
  );

  useEffect(() => {
    if (!servicesAvailabilityQuery.loading && servicesAvailabilityQuery.data) {
      store.servicesAvailabilityStore.setServicesAvailabilities(
        servicesAvailabilityQuery.data.servicesAvailability
      );
    }
  }, [servicesAvailabilityQuery.data, servicesAvailabilityQuery.loading]);

  return null;
});
