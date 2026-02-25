import React from 'react';
import { GraphQLError } from '../../../../common/components/error/graphql.error-presentor';
import { LogicError } from '../../../../common/components/error/logic.error-presentor';
import { ErrorSource, IStateError } from './state-machine/types';

const FIRST = 0;
const LOGIC_ERROR: ErrorSource = 'logic';
const API_ERROR: ErrorSource = 'api';

interface StateErrorProps {
  errors: IStateError[];
}

export const StateError: React.FC<StateErrorProps> = ({ errors }) => {
  return (
    <>
      <GraphQLError error={errors[FIRST]} />
      <LogicError
        errors={errors.filter((err: IStateError) =>
          [LOGIC_ERROR, API_ERROR].includes(err.source)
        )}
      />
    </>
  );
};
