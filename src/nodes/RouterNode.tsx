import { memo } from 'react';
import NetworkNodeShell, { type NetworkNodeData } from './NetworkNodeShell';

export default memo(({ data, selected }: { data: NetworkNodeData; selected?: boolean }) => (
  <NetworkNodeShell data={data} selected={selected} icon="📡" color="#818cf8" accent="#c7d2fe" />
));
