import { Box } from '@map-colonies/react-components';
import { CircularProgress } from '@map-colonies/react-core';

import './curtain.component.css';

interface CurtainProps {
  showProgress?: boolean;
}

export const Curtain: React.FC<CurtainProps> = ({ showProgress }) => {
  return (
    <Box className="curtain">
      {showProgress && <CircularProgress className="progress" size="xlarge" />}
    </Box>
  );
};
