import { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Icon, Tooltip, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import CONFIG from '../../../../common/config';
import { currentSite } from '../../../../common/helpers/siteUrl';
import packageJson from '../../../../../package.json';

const AppTitle = (): JSX.Element => {
  const intl = useIntl();
  const projectVersion = CONFIG.PROJECT_VERSION;
  const appVersion = packageJson.version;

  const site = useMemo(() => currentSite(), []);

  useEffect(() => {
    document.title = `${intl.formatMessage({
      id: 'general.logo.text',
    })} - ${projectVersion}`;
  }, []);

  const versionText = intl.formatMessage(
    { id: 'general.version.text' },
    { projectVersion, appVersion }
  );

  return (
    <>
      <Box className="appLogoContainer">
        <Box className="appTitleVersionContainer">
          <Typography tag="b">
            {intl.formatMessage({ id: 'general.logo.text' })}
          </Typography>
          <Tooltip
            content={`${intl.formatMessage({
              id: 'general.version.tooltip',
            })} ${projectVersion}`}
          >
            <Box className={`appVersionContainer-${site}`}> {versionText} </Box>
          </Tooltip>
        </Box>
        <Icon className="appIcon mc-icon-AppIcon" />
      </Box>
    </>
  );
};

export default AppTitle;
