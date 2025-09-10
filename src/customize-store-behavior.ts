import { Instance } from "mobx-state-tree";
import { DocumentNode } from 'graphql';
import { rootStore } from "./discrete-layer/models";

type StoreType = Instance<typeof rootStore>;

export const customizeStoreBehavior = (store: StoreType) => {
  const originalQuery = store.query;

  //@ts-ignore
  store.query = function (
    queryStr: string | DocumentNode,
    variables?: any,
    options: any = {}
  ) {
    const mergedOptions = {
      fetchPolicy: 'no-cache',
      ...options,
    };

    const regex = /query\W{1,2}[a-zA-Z]*/;

    if (typeof queryStr === 'string') {
      const matched = queryStr.match(regex)?.[0];
      const queryNameSplited = matched?.split('(');
      const queryName = queryNameSplited?.[0].replace('query ', '');
      console.log(`[mst-gql] global no-cache applied to query: ${queryName}`);
    }

    return originalQuery.call(this, queryStr, variables, mergedOptions);
  };
}
