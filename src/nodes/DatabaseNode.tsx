import { memo } from 'react';
import NetworkNodeShell, { type NetworkNodeData } from './NetworkNodeShell';

export default memo(({ data, selected }: { data: NetworkNodeData; selected?: boolean }) => (
  <NetworkNodeShell data={data} selected={selected} icon="🗄️" color="#fcd34d" accent="#fde68a" />
));
