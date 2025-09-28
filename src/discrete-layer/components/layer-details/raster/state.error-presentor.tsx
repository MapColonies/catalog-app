import React from 'react';
import { GraphQLError } from '../../../../common/components/error/graphql.error-presentor';
import { LogicError } from '../../../../common/components/error/logic.error-presentor';
import { IErrorEntry } from './state-machine.raster';

const FIRST = 0;

interface StateMachineErrorProps {
  errors: IErrorEntry[];
}

export const StateMachineError: React.FC<StateMachineErrorProps> = ({ errors }) => {
  return (
    <>
      <GraphQLError error={errors[FIRST]} />
      <LogicError errors={errors.filter((err: IErrorEntry) => err.source === "logic")} />
    </>
  );
};
