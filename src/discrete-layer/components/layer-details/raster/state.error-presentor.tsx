import React from 'react';
import { GraphQLError } from '../../../../common/components/error/graphql.error-presentor';
import { LogicError } from '../../../../common/components/error/logic.error-presentor';
import { IStateError } from './state-machine.raster';

const FIRST = 0;
const LOGIC_ERROR = "logic";

interface StateMachineErrorProps {
  errors: IStateError[];
}

export const StateMachineError: React.FC<StateMachineErrorProps> = ({ errors }) => {
  return (
    <>
      <GraphQLError error={errors[FIRST]} />
      <LogicError errors={errors.filter((err: IStateError) => err.source === LOGIC_ERROR)} />
    </>
  );
};
