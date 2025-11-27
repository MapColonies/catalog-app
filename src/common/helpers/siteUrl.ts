import { GraphQLClient } from 'mst-gql/node_modules/graphql-request';
import { createHttpClient } from 'mst-gql';
import { site, siteName } from '../../discrete-layer/models/userStore';
import CONFIG from '../config';

export const currentBffUrl = CONFIG.SERVICE_URL;

export const currentClientUrl = window.location.origin;

export const currentSite = (): siteName => {
  return CONFIG.SITES_CONFIG.slaves.map((slave: site) => slave.dns).includes(currentClientUrl)
    ? 'slave'
    : CONFIG.SITES_CONFIG.masters.map((master: site) => master.dns).includes(currentClientUrl)
    ? 'master'
    : CONFIG.SITES_CONFIG.generics.map((generic: site) => generic.dns).includes(currentClientUrl)
    ? 'generic'
    : 'undefined';
};

export const syncSlavesClients: GraphQLClient[] = CONFIG.SITES_CONFIG.slaves?.filter((slave: site) => !slave.isAlias)
  .map((slave: site) => createHttpClient(slave.dns + CONFIG.BFF_PATH)
);
