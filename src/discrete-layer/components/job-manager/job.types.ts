import { Status } from '../../models';

export const FINAL_STATUSES = [
  Status.Completed,
  Status.Expired,
  Status.Failed,
  Status.Aborted,
];

export const FINAL_NEGATIVE_STATUSES = [
  Status.Expired,
  Status.Failed,
  Status.Aborted,
];

export const JOB_ENTITY = 'Job';