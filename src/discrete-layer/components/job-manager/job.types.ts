import { Status } from '../../models';

export const FINAL_STATUSES = [
  Status.Completed,
  Status.Expired,
  Status.Failed,
  Status.Aborted,
  Status.Suspended,
];

export const NON_RESUMABLE_STATUSES: Status[] = FINAL_STATUSES.filter(
  (status) => status !== Status.Suspended
);

export const JOB_ENTITY = 'Job';
