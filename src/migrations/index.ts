import * as migration_20260601_002704 from './20260601_002704';

export const migrations = [
  {
    up: migration_20260601_002704.up,
    down: migration_20260601_002704.down,
    name: '20260601_002704'
  },
];
