import React, { useCallback, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { observer } from 'mobx-react';
import { cloneDeep } from 'lodash';
import { Box } from '@map-colonies/react-components';
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  TabBar,
  Tab,
  Button,
  TabBarOnActivateEventT,
} from '@map-colonies/react-core';
import { GraphQLError } from '../../../../common/components/error/graphql.error-presentor';
import { useQuery, useStore } from '../../../models/RootStore';
import { ExternalServiceModelType } from '../../../models';
import { DeploymentWithServicesModelType } from '../../../models';
import { ExternalServices } from './external-services/external-services';
import { InternalService } from './internal-service/internal-service';

import './system-core-info.dialog.css';

interface SystemCoreInfoDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
}

export type CategorizedServices = Record<
  string,
  ExternalServiceModelType[] | undefined
>;

const EXTERNAL_SERVICES_TAB_INDEX = 0;
const INTERNAL_SERVICES_TAB_INDEX = 1;
const INTERNAL_SERVICES_QUERY = `name
 status
 image
 services {
  name
  uid
  addresses
 }`;

export const SystemCoreInfoDialog: React.FC<SystemCoreInfoDialogProps> =
  observer(({ isOpen, onSetOpen }: SystemCoreInfoDialogProps) => {
    const store = useStore();
    const clusterServicesQuery = useQuery();
    const externalServicesQuery = useQuery();

    const [clusterServices, setClusterServices] = useState<
      DeploymentWithServicesModelType[]
    >([]);
    const [externalServices, setExternalServices] =
      useState<CategorizedServices>({});
    const [clusterServicesError, setClusterServicesError] = useState<Record<
      string,
      unknown
    > | null>(null);
    const [externalServicesError, setExternalServicesError] = useState<Record<
      string,
      unknown
    > | null>(null);
    const [activeTab, setActiveTab] = useState<number>(
      EXTERNAL_SERVICES_TAB_INDEX
    );
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      clusterServicesQuery.setQuery(
        store.queryGetClusterServices(undefined, INTERNAL_SERVICES_QUERY)
      );
      externalServicesQuery.setQuery(store.queryGetExternalServices());
    }, []);

    useEffect(() => {
      // eslint-disable-next-line
      const { data, loading, error } = clusterServicesQuery;

      if (!loading) {
        if (error as boolean) {
          setClusterServicesError(error);
        } else if (data) {
          const internalServices = cloneDeep(
            (data as { getClusterServices: DeploymentWithServicesModelType[] })
              .getClusterServices
          );
          setClusterServices(internalServices);
        }
      }
    }, [
      clusterServicesQuery.data,
      clusterServicesQuery.loading,
      clusterServicesQuery.error,
    ]);

    useEffect(() => {
      // eslint-disable-next-line
      const { data, loading, error } = externalServicesQuery;
      if (!loading) {
        if (error as boolean) {
          setExternalServicesError(error);
        } else if (data) {
          const externalServices = cloneDeep(
            (data as { getExternalServices: ExternalServiceModelType[] })
              .getExternalServices
          );

          const getCategorizedServices = (): CategorizedServices => {
            const categorizedServices: CategorizedServices = {};
            for (const service of externalServices) {
              const currentCategoryArr =
                categorizedServices[service.type as string] ?? [];
              categorizedServices[service.type as string] = [
                ...currentCategoryArr,
                service,
              ];
            }

            return categorizedServices;
          };

          setExternalServices(getCategorizedServices());
        }
      }
    }, [
      externalServicesQuery.data,
      externalServicesQuery.loading,
      externalServicesQuery.error,
    ]);

    useEffect(() => {
      setIsLoading(
        externalServicesQuery.loading || clusterServicesQuery.loading
      );
    }, [externalServicesQuery.loading, clusterServicesQuery.loading]);

    const closeDialog = useCallback(() => {
      onSetOpen(false);
    }, [onSetOpen]);

    const renderClusterServices = useCallback(() => {
      let renderContent;

      if (clusterServicesError) {
        renderContent = <GraphQLError error={clusterServicesError} />;
      } else {
        const sortedServicesByStatus = clusterServices.sort((a, b) => {
          const A_BEFORE_B = -1;
          const B_BEFORE_A = 1;
          return a.status === true && b.status === false
            ? A_BEFORE_B
            : B_BEFORE_A;
        });

        renderContent = sortedServicesByStatus.map((service) => {
          return (
            <InternalService service={service} key={service.name as string} />
          );
        });
      }

      return <Box className="flex-column-center">{renderContent}</Box>;
    }, [clusterServicesError, clusterServices]);

    const renderExternalServices = useCallback(() => {
      let renderContent;

      if (externalServicesError) {
        renderContent = <GraphQLError error={externalServicesError} />;
      } else {
        renderContent = <ExternalServices services={externalServices} />;
      }

      return <Box className="flex-column-center">{renderContent}</Box>;
    }, [externalServicesError, externalServices]);

    const renderDialogContent = useCallback(() => {
      if (isLoading) {
        return (
          <Box className="loader">
            <CircularProgress />
            <Typography className="loaderText" tag="p">
              <FormattedMessage id="general.loading.text" />
            </Typography>
          </Box>
        );
      }

      let activeTabToRender;

      if (activeTab === EXTERNAL_SERVICES_TAB_INDEX) {
        activeTabToRender = renderExternalServices();
      } else if (activeTab === INTERNAL_SERVICES_TAB_INDEX) {
        activeTabToRender = renderClusterServices();
      }

      return <Box className="tabContent">{activeTabToRender}</Box>;
    }, [
      isLoading,
      renderExternalServices,
      renderClusterServices,
      activeTab,
      closeDialog,
    ]);

    return (
      <Box id="systemCoreInfoDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogTitle>
            <FormattedMessage id="system-core-info.title" />

            <IconButton
              className="closeIcon mc-icon-Close"
              onClick={(): void => {
                closeDialog();
              }}
            />
          </DialogTitle>
          <DialogContent
            id="systemCoreInfoBody"
            style={{ '--tab-bar-height': '50px' } as React.CSSProperties}
          >
            <TabBar
              activeTabIndex={activeTab}
              onActivate={(evt: TabBarOnActivateEventT): void =>
                setActiveTab(evt.detail.index)
              }
            >
              <Tab>
                <FormattedMessage id="system-core-info.externalServicesTitle" />
              </Tab>
              <Tab>
                <FormattedMessage id="system-core-info.innerServicesTitle" />
              </Tab>
            </TabBar>
            {renderDialogContent()}
          </DialogContent>
          <Button
            raised
            id="closeBtn"
            type="button"
            onClick={(): void => {
              closeDialog();
            }}
          >
            <FormattedMessage id="general.close-btn.text" />
          </Button>
        </Dialog>
      </Box>
    );
  });
