import type { CSSProperties, ChangeEvent, MouseEvent } from 'react';
import { Handle, Position } from 'reactflow';

export interface NetworkNodeData {
  label: string;
  description?: string;
  icon?: string;
  isDark?: boolean;
  editing?: boolean;
  onUpdate?: (field: 'label' | 'description', value: string) => void;
}

interface NetworkNodeShellProps {
  data: NetworkNodeData;
  selected?: boolean;
  icon: string;
  color: string;
  accent?: string;
}

export default function NetworkNodeShell({
  data,
  selected,
  icon,
  color,
  accent = color,
}: NetworkNodeShellProps) {
  const stop = (event: MouseEvent | ChangeEvent) => event.stopPropagation();
  const isDark = Boolean(data.isDark);
  const handleStyle: CSSProperties = {
    background: color,
    width: 10,
    height: 10,
    border: `2px solid ${isDark ? '#1e293b' : '#ffffff'}`,
  };

  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: 12,
        background: isDark
          ? `linear-gradient(135deg, ${color}2e 0%, ${accent}18 100%)`
          : `linear-gradient(135deg, #ffffff 0%, ${color}1f 100%)`,
        border: selected ? `2px solid ${color}` : `1.5px solid ${color}66`,
        boxShadow: selected
          ? `0 0 22px ${color}66, 0 0 0 4px ${color}22`
          : isDark
            ? '0 5px 18px rgba(0,0,0,.30)'
            : '0 4px 14px rgba(2,132,199,.15)',
        minWidth: 158,
        color: isDark ? '#e2e8f0' : '#0c4a6e',
        transition: 'box-shadow .2s ease, border .2s ease',
        position: 'relative',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 27, marginBottom: 5 }}>{data.icon || icon}</div>
      {data.editing ? (
        <div className="nodrag nowheel" onMouseDown={stop} onClick={stop}>
          <input
            autoFocus
            value={data.label}
            aria-label="Label node"
            onChange={(event) => data.onUpdate?.('label', event.target.value)}
            style={inlineInput}
          />
          <input
            value={data.description || ''}
            aria-label="Sublabel node"
            placeholder="Sublabel / IP / model"
            onChange={(event) => data.onUpdate?.('description', event.target.value)}
            style={{ ...inlineInput, marginTop: 5, fontSize: 10, opacity: .88 }}
          />
        </div>
      ) : (
        <>
          <div style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#fff' : '#0c4a6e', marginBottom: 2 }}>
            {data.label || 'Tanpa nama'}
          </div>
          {data.description && (
            <div style={{ fontSize: 11, color: isDark ? '#a8b5c8' : '#5b7a99', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.description}
            </div>
          )}
        </>
      )}
      {/* Kabel selalu keluar-masuk lewat sisi kiri/kanan, tidak pernah dari atas-bawah */}
      <Handle
        id="t-side"
        type="target"
        position={Position.Left}
        isConnectableStart={false}
        style={handleStyle}
      />
      <Handle
        id="s-side"
        type="source"
        position={Position.Right}
        isConnectableEnd={false}
        style={handleStyle}
      />
    </div>
  );
}

const inlineInput: CSSProperties = {
  display: 'block',
  width: '100%',
  minWidth: 122,
  padding: '4px 6px',
  borderRadius: 5,
  border: '1px solid rgba(255,255,255,.24)',
  outline: 'none',
  background: 'rgba(2,6,23,.72)',
  color: '#fff',
  textAlign: 'center',
  fontSize: 12,
  fontWeight: 650,
};
