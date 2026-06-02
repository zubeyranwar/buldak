import * as migration_20260601_002704 from './20260601_002704';
import * as migration_20260602_000001 from './20260602_000001';

export const migrations = [
  {
    up: migration_20260601_002704.up,
    down: migration_20260601_002704.down,
    name: '20260601_002704'
  },
  {
    up: migration_20260602_000001.up,
    down: migration_20260602_000001.down,
    name: '20260602_000001'
  },
];
