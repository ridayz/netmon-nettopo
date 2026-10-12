import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
} from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useEdgesState,
  useNodesState,
  useViewport,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';

import SwitchNode from './nodes/SwitchNode';
import RouterNode from './nodes/RouterNode';
import FirewallNode from './nodes/FirewallNode';
import PCNode from './nodes/PCNode';
import ServerNode from './nodes/ServerNode';
import CloudNode from './nodes/CloudNode';
import DatabaseNode from './nodes/DatabaseNode';
import APINode from './nodes/APINode';
import type { NetworkNodeData } from './nodes/NetworkNodeShell';

export interface TopologyExportFile {
  app: 'NexGenTopologi';
  version: 1;
  exportedAt: string;
  nodes: Node<NetworkNodeData>[];
  edges: Edge[];
  backgroundImage: string | null;
  bgPos: { x: number; y: number; scale: number; opacity: number };
}

const nodeTypes = {
  switch: SwitchNode,
  router: RouterNode,
  firewall: FirewallNode,
  pc: PCNode,
  server: ServerNode,
  cloud: CloudNode,
  database: DatabaseNode,
  api: APINode,
};

const initialNodes: Node<NetworkNodeData>[] = [
  {
    id: 'pc1',
    type: 'pc',
    position: { x: 80, y: 180 },
    data: { label: 'PC-Client 01', description: '192.168.1.50' },
  },
  {
    id: 'sw1',
    type: 'switch',
    position: { x: 310, y: 180 },
    data: { label: 'Core Switch', description: 'VLAN 10/20' },
  },
  {
    id: 'fw1',
    type: 'firewall',
    position: { x: 550, y: 180 },
    data: { label: 'NextGen Firewall', description: 'IPS & NAT' },
  },
  {
    id: 'r1',
    type: 'router',
    position: { x: 790, y: 180 },
    data: { label: 'Edge Router', description: 'BGP / WAN' },
  },
  {
    id: 'cloud1',
    type: 'cloud',
    position: { x: 1030, y: 180 },
    data: { label: 'Internet Cloud', description: 'Upstream ISP' },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e-pc1-sw1',
    source: 'pc1',
    target: 'sw1',
    type: 'straight',
    label: '1 Gbps',
    animated: true,
    style: { stroke: '#7dd3fc', strokeWidth: 3.5 },
    labelStyle: { fill: '#0369a1', fontWeight: 600, fontSize: 11 },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
  },
  {
    id: 'e-sw1-fw1',
    source: 'sw1',
    target: 'fw1',
    type: 'straight',
    label: 'Trunk 10G',
    animated: true,
    style: { stroke: '#5eead4', strokeWidth: 3.5 },
    labelStyle: { fill: '#0f766e', fontWeight: 600, fontSize: 11 },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
  },
  {
    id: 'e-fw1-r1',
    source: 'fw1',
    target: 'r1',
    type: 'straight',
    label: 'Internal WAN',
    animated: true,
    style: { stroke: '#fda4af', strokeWidth: 3.5 },
    labelStyle: { fill: '#be123c', fontWeight: 600, fontSize: 11 },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
  },
  {
    id: 'e-r1-cloud1',
    source: 'r1',
    target: 'cloud1',
    type: 'straight',
    label: 'Fiber 1G',
    animated: true,
    style: { stroke: '#a5b4fc', strokeWidth: 3.5 },
    labelStyle: { fill: '#4338ca', fontWeight: 600, fontSize: 11 },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
  },
];

function CanvasBackgroundImage({
  src,
  pos,
}: {
  src: string | null;
  pos: { x: number; y: number; scale: number; opacity: number };
}) {
  const { x, y, zoom } = useViewport();
  if (!src) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transformOrigin: '0 0',
        transform: `translate(${x + pos.x * zoom}px, ${y + pos.y * zoom}px) scale(${zoom * pos.scale})`,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: pos.opacity,
        userSelect: 'none',
      }}
    >
      <img src={src} alt="Floorplan/Background" style={{ display: 'block', maxWidth: 'none' }} />
    </div>
  );
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isDark, setIsDark] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Tool cursor mode: 'select' (geser & pilih biasa) | 'delete' (klik device/garis untuk hapus, lalu auto-balik)
  const [toolMode, setToolMode] = useState<'select' | 'delete'>('select');

  // True saat user sedang menarik kabel dari sebuah handle
  const [connecting, setConnecting] = useState(false);

  // Background image state
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgPos, setBgPos] = useState({ x: 0, y: 0, scale: 1, opacity: 0.4 });
  const [showBgControls, setShowBgControls] = useState(false);

  // Text topology popup
  const [showTextModal, setShowTextModal] = useState(false);
  const [topologyText, setTopologyText] = useState(
    'Switch Core -> Firewall Edge -> Router WAN -> Cloud Internet\nSwitch Core -> PC Admin\nSwitch Core -> Server DB'
  );

  // Status message bar
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );
  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) || null,
    [edges, selectedEdgeId]
  );

  // Saat menggambar kabel: sembunyikan handle sisi kiri supaya tidak ada garis melingkar,
  // setelah selesai semua handle tampil kembali.
  const onConnectStart = useCallback(() => {
    setConnecting(true);
  }, []);

  const onConnectEnd = useCallback(() => {
    setConnecting(false);
  }, []);

  // Update node handler passed to custom nodes
  const updateNodeData = useCallback(
    (nodeId: string, field: 'label' | 'description', value: string) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n))
      );
    },
    [setNodes]
  );

  // Inject callbacks into nodes
  const enrichedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isDark,
        sideStraight: connecting,
        editing: node.id === selectedNodeId,
        onUpdate: (field: 'label' | 'description', val: string) => updateNodeData(node.id, field, val),
      },
    }));
  }, [nodes, selectedNodeId, updateNodeData, isDark, connecting]);

  // Connect edges
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'straight',
            animated: true,
            label: 'Link',
            style: { stroke: '#38bdf8', strokeWidth: 3.5 },
            labelStyle: { fill: isDark ? '#38bdf8' : '#0369a1', fontWeight: 600, fontSize: 11 },
            labelBgStyle: { fill: isDark ? '#0f172a' : '#ffffff', fillOpacity: 0.85 },
          },
          eds
        )
      );
    },
    [setEdges, isDark]
  );

  // Add node helper
  const addNode = (type: string, label: string, description: string = '') => {
    const id = `node_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newNode: Node<NetworkNodeData> = {
      id,
      type,
      position: {
        x: 220 + Math.random() * 320,
        y: 120 + Math.random() * 220,
      },
      data: { label, description },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  };

  // Drag and drop node from sidebar
  const onDragStart = (event: DragEvent, nodeType: string, defaultLabel: string) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType);
    event.dataTransfer.setData('application/reactflow-label', defaultLabel);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow-type');
      const label = event.dataTransfer.getData('application/reactflow-label');

      if (!type) return;

      let position = { x: 200, y: 150 };
      if (rfInstance) {
        position = rfInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
      } else if (reactFlowWrapper.current) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        position = {
          x: event.clientX - reactFlowBounds.left - 75,
          y: event.clientY - reactFlowBounds.top - 35,
        };
      }

      const id = `node_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const newNode: Node<NetworkNodeData> = {
        id,
        type,
        position,
        data: { label: label || type, description: '' },
      };
      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(id);
      setSelectedEdgeId(null);
    },
    [rfInstance, setNodes]
  );

  // Click handlers
  const onNodeClick = (_: unknown, node: Node) => {
    if (toolMode === 'delete') {
      setNodes((nds) => nds.filter((n) => n.id !== node.id));
      setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id));
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setToolMode('select');
      notify(`🗑️ Device "${node.data?.label || node.id}" dihapus`);
      return;
    }
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  };

  const onEdgeClick = (_: unknown, edge: Edge) => {
    if (toolMode === 'delete') {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      setSelectedEdgeId(null);
      setSelectedNodeId(null);
      setToolMode('select');
      notify(`🗑️ Link "${typeof edge.label === 'string' ? edge.label : edge.id}" dihapus`);
      return;
    }
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  };

  const onPaneClick = () => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  // Delete selected item
  const deleteSelected = () => {
    if (selectedNodeId) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  };

  // Import background image
  const handleImageImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBgImage(event.target?.result as string);
      setShowBgControls(true);
      notify('Gambar background berhasil diimpor!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Export / Import JSON
  const handleExportJSON = () => {
    const topoData: TopologyExportFile = {
      app: 'NexGenTopologi',
      version: 1,
      exportedAt: new Date().toISOString(),
      nodes,
      edges,
      backgroundImage: bgImage,
      bgPos,
    };
    const blob = new Blob([JSON.stringify(topoData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexgentopologi-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Diagram berhasil diexport ke JSON!');
  };

  const handleImportJSON = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as TopologyExportFile;
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges.map((e) => ({ ...e, type: 'straight' })));
          setBgImage(parsed.backgroundImage || null);
          if (parsed.bgPos) setBgPos(parsed.bgPos);
          notify('Topology diagram JSON berhasil dimuat!');
        } else {
          alert('Format JSON tidak valid (harus memiliki nodes & edges)');
        }
      } catch (err: unknown) {
        alert('Gagal membaca JSON: ' + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export PNG screenshot
  const handleExportPNG = async () => {
    if (!reactFlowWrapper.current) return;
    try {
      notify('Menghasilkan screenshot PNG...');
      const dataUrl = await toPng(reactFlowWrapper.current, {
        backgroundColor: isDark ? '#0b1120' : '#f0f9ff',
        quality: 1,
      });
      const link = document.createElement('a');
      link.download = `nexgentopologi-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      notify('PNG berhasil diunduh!');
    } catch (err) {
      alert('Gagal mengekspor PNG: ' + String(err));
    }
  };

  // Export to Archify HTML via Backend Server
  const handleExportArchify = async () => {
    notify('Mengirim topologi ke Archify engine...');
    try {
      const typeMapping: Record<string, string> = {
        switch: 'backend',
        router: 'backend',
        firewall: 'security',
        server: 'backend',
        cloud: 'cloud',
        pc: 'external',
        database: 'database',
        api: 'backend',
      };

      const components = nodes.map((n, idx) => {
        const archType = typeMapping[n.type || 'server'] || 'backend';
        const cleanId = (n.id || `node_${idx}`).replace(/[^a-zA-Z0-9_-]/g, '_');
        return {
          id: cleanId,
          type: archType,
          label: n.data?.label || n.id,
          sublabel: n.data?.description || '',
          pos: [Math.round((n.position.x || 50) * 0.5), Math.round((n.position.y || 50) * 0.5)],
          size: [130, 60],
        };
      });

      const connections = edges.map((e, idx) => {
        const cleanFrom = (e.source || '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const cleanTo = (e.target || '').replace(/[^a-zA-Z0-9_-]/g, '_');
        return {
          id: (e.id || `conn_${idx}`).replace(/[^a-zA-Z0-9_-]/g, '_'),
          from: cleanFrom,
          to: cleanTo,
          label: typeof e.label === 'string' ? e.label : undefined,
        };
      });

      const spec = {
        schema_version: 1,
        diagram_type: 'architecture',
        meta: {
          title: 'Network Topology (NexGenTopologi)',
          quality_profile: 'showcase',
        },
        components,
        connections,
      };

      const resp = await fetch('/api/archify-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec }),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => null);
        throw new Error(errJson?.error || errJson?.details || `HTTP error ${resp.status}`);
      }

      const blob = await resp.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `nexgentopologi-archify-${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      notify('Export Archify HTML berhasil diunduh!');
    } catch (err: unknown) {
      alert('Gagal export Archify: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Fast text parser (no AI required)
  const handleParseTopologyText = () => {
    const lines = topologyText.split('\n');
    const parsedNodesMap = new Map<string, { id: string; label: string; type: string }>();
    const parsedEdges: Edge[] = [];

    const detectType = (label: string): string => {
      const lower = label.toLowerCase();
      if (lower.includes('switch') || lower.includes('sw')) return 'switch';
      if (lower.includes('router') || lower.includes('rt') || lower.includes('rtr')) return 'router';
      if (lower.includes('firewall') || lower.includes('fw') || lower.includes('waf')) return 'firewall';
      if (lower.includes('server') || lower.includes('srv') || lower.includes('web') || lower.includes('app'))
        return 'server';
      if (lower.includes('cloud') || lower.includes('internet') || lower.includes('wan') || lower.includes('isp'))
        return 'cloud';
      if (lower.includes('database') || lower.includes('db') || lower.includes('sql')) return 'database';
      if (lower.includes('api') || lower.includes('gateway')) return 'api';
      return 'pc';
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const tokens = trimmed.split(/->|→|--/).map((t) => t.trim()).filter(Boolean);

      tokens.forEach((token) => {
        if (!parsedNodesMap.has(token)) {
          const type = detectType(token);
          parsedNodesMap.set(token, {
            id: `txt_${token.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            label: token,
            type,
          });
        }
      });

      for (let i = 0; i < tokens.length - 1; i++) {
        const src = tokens[i];
        const tgt = tokens[i + 1];
        const srcNode = parsedNodesMap.get(src)!;
        const tgtNode = parsedNodesMap.get(tgt)!;
        parsedEdges.push({
          id: `e_${srcNode.id}_${tgtNode.id}`,
          source: srcNode.id,
          target: tgtNode.id,
          type: 'straight',
          animated: true,
          label: 'Link',
          style: { stroke: '#38bdf8', strokeWidth: 3.5 },
          labelStyle: { fill: isDark ? '#38bdf8' : '#0369a1', fontWeight: 600, fontSize: 11 },
          labelBgStyle: { fill: isDark ? '#0f172a' : '#ffffff', fillOpacity: 0.85 },
        });
      }
    });

    const nodeArray = Array.from(parsedNodesMap.values());
    const newReactNodes: Node<NetworkNodeData>[] = nodeArray.map((item, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      return {
        id: item.id,
        type: item.type,
        position: { x: 80 + col * 260, y: 80 + row * 160 },
        data: { label: item.label, description: item.type.toUpperCase() },
      };
    });

    if (newReactNodes.length > 0) {
      setNodes(newReactNodes);
      setEdges(parsedEdges);
      setShowTextModal(false);
      notify(`Berhasil parse: ${newReactNodes.length} node & ${parsedEdges.length} link`);
    } else {
      alert('Tidak ada sintaks topologi valid yang ditemukan.');
    }
  };

  // Colors
  // Palet pastel biru awan + putih (light). Dark tetap tersedia via toggle.
  const bg = isDark ? '#090d16' : '#f0f9ff';
  const surface = isDark ? '#111827' : '#ffffff';
  const text = isDark ? '#f8fafc' : '#0c4a6e';
  const border = isDark ? '#1f2937' : '#bae6fd';
  const canvas = isDark ? '#060a12' : '#f0f9ff';
  const gridDots = isDark ? '#1f2937' : '#bae6fd';

  return (
    <div style={{ width: '100vw', height: '100vh', background: bg, position: 'relative', overflow: 'hidden' }}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageImport}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportJSON}
      />

      {/* Top Header Navigation */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: surface,
          borderBottom: `2px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #bae6fd 0%, #e0f2fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            🌐
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: text, letterSpacing: -0.2 }}>
              NexGenTopologi
            </h1>
            <div style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1 }}>
              Interactive Network Topology Editor & Archify Exporter
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Tool Mode Toggles: Geser vs Hapus */}
          <div
            style={{
              display: 'flex',
              background: isDark ? '#0b1120' : '#f1f5f9',
              padding: 3,
              borderRadius: 8,
              border: `1px solid ${border}`,
              marginRight: 6,
            }}
          >
            <button
              onClick={() => setToolMode('select')}
              style={{
                ...btnBase,
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 6,
                background: toolMode === 'select' ? (isDark ? '#334155' : '#ffffff') : 'transparent',
                color: toolMode === 'select' ? (isDark ? '#38bdf8' : '#0284c7') : '#94a3b8',
                fontWeight: toolMode === 'select' ? 700 : 500,
                boxShadow: toolMode === 'select' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              }}
              title="Mode Geser & Pilih (Normal)"
            >
              ✋ Geser
            </button>
            <button
              onClick={() => {
                const next = toolMode === 'delete' ? 'select' : 'delete';
                setToolMode(next);
                if (next === 'delete') {
                  notify('⚠️ Mode Hapus aktif: Klik device/kabel yang mau dihapus (otomatis balik ke Geser)');
                }
              }}
              style={{
                ...btnBase,
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 6,
                background: toolMode === 'delete' ? '#ef4444' : 'transparent',
                color: toolMode === 'delete' ? '#ffffff' : '#94a3b8',
                fontWeight: toolMode === 'delete' ? 700 : 500,
                boxShadow: toolMode === 'delete' ? '0 0 10px rgba(239,68,68,0.5)' : 'none',
              }}
              title="Klik device atau kabel untuk hapus sekali (langsung otomatis balik ke kursor Geser)"
            >
              🗑️ Hapus Device
            </button>
          </div>

          <button
            onClick={() => setShowTextModal(true)}
            style={{ ...btnBase, background: '#2563eb', color: '#fff' }}
            title="Parse teks misal: Switch -> Router -> Firewall"
          >
            ⚡ Input Teks Cepat
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ ...btnBase, background: '#475569', color: '#fff' }}
            title="Muat denah atau background gambar"
          >
            🖼️ Gambar BG
          </button>

          <button
            onClick={() => jsonInputRef.current?.click()}
            style={{ ...btnBase, background: '#334155', color: '#fff' }}
          >
            📂 Import JSON
          </button>

          <button
            onClick={handleExportJSON}
            style={{ ...btnBase, background: '#0284c7', color: '#fff' }}
          >
            💾 Simpan JSON
          </button>

          <button
            onClick={handleExportPNG}
            style={{ ...btnBase, background: '#0d9488', color: '#fff' }}
          >
            📷 Export PNG
          </button>

          <button
            onClick={handleExportArchify}
            style={{ ...btnBase, background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)', color: '#fff' }}
            title="Generate Archify HTML dengan standalone interactive viewer"
          >
            🚀 Export Archify HTML
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            style={{ ...btnBase, background: isDark ? '#1e293b' : '#e2e8f0', color: text }}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      {/* Main Canvas + Sidebar Layout */}
      <div style={{ width: '100%', height: '100%', display: 'flex', paddingTop: 56 }}>
        {/* Left Toolbar - Node Palettes */}
        <aside
          style={{
            width: 180,
            background: surface,
            borderRight: `2px solid ${border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '16px 12px',
            zIndex: 20,
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
            Tipe Perangkat
          </div>

          <PaletteItem
            icon="🔀"
            label="Switch"
            type="switch"
            color="#7dd3c0"
            isDark={isDark}
            onClick={() => addNode('switch', 'Core Switch', 'VLAN 10/20')}
            onDragStart={(e) => onDragStart(e, 'switch', 'Core Switch')}
          />
          <PaletteItem
            icon="📡"
            label="Router"
            type="router"
            color="#818cf8"
            isDark={isDark}
            onClick={() => addNode('router', 'Border Router', 'BGP Peer')}
            onDragStart={(e) => onDragStart(e, 'router', 'Border Router')}
          />
          <PaletteItem
            icon="🛡️"
            label="Firewall"
            type="firewall"
            color="#fda4af"
            isDark={isDark}
            onClick={() => addNode('firewall', 'Firewall GW', 'NAT & VPN')}
            onDragStart={(e) => onDragStart(e, 'firewall', 'Firewall GW')}
          />
          <PaletteItem
            icon="🖥️"
            label="Server"
            type="server"
            color="#7dd3fc"
            isDark={isDark}
            onClick={() => addNode('server', 'App Server', 'Linux / Docker')}
            onDragStart={(e) => onDragStart(e, 'server', 'App Server')}
          />
          <PaletteItem
            icon="☁️"
            label="Cloud / WAN"
            type="cloud"
            color="#a5b4fc"
            isDark={isDark}
            onClick={() => addNode('cloud', 'Cloud WAN', 'Public IP')}
            onDragStart={(e) => onDragStart(e, 'cloud', 'Cloud WAN')}
          />
          <PaletteItem
            icon="💻"
            label="PC / Client"
            type="pc"
            color="#67e8f9"
            isDark={isDark}
            onClick={() => addNode('pc', 'Workstation', 'DHCP Client')}
            onDragStart={(e) => onDragStart(e, 'pc', 'Workstation')}
          />
          <PaletteItem
            icon="🗄️"
            label="Database"
            type="database"
            color="#fcd34d"
            isDark={isDark}
            onClick={() => addNode('database', 'Database Cluster', 'PostgreSQL')}
            onDragStart={(e) => onDragStart(e, 'database', 'Database Cluster')}
          />
          <PaletteItem
            icon="🔌"
            label="API Gateway"
            type="api"
            color="#c4b5fd"
            isDark={isDark}
            onClick={() => addNode('api', 'API Gateway', 'REST :443')}
            onDragStart={(e) => onDragStart(e, 'api', 'API Gateway')}
          />

          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${border}`, fontSize: 11, color: isDark ? '#64748b' : '#64748b' }}>
            💡 Klik atau drag ikon ke canvas untuk menambah node.
          </div>
        </aside>

        {/* Center Canvas */}
        <main
          ref={reactFlowWrapper}
          className={toolMode === 'delete' ? 'delete-mode' : undefined}
          style={{ flex: 1, height: '100%', position: 'relative', cursor: toolMode === 'delete' ? 'crosshair' : 'default' }}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={enrichedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            nodeTypes={nodeTypes}
            onInit={setRfInstance}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            fitView
            style={{ background: canvas }}
            defaultEdgeOptions={{
              type: 'straight',
              animated: true,
            }}
          >
            {/* Background Image synced with pan/zoom */}
            <CanvasBackgroundImage src={bgImage} pos={bgPos} />

            <Background color={gridDots} variant={BackgroundVariant.Dots} gap={24} />
            <Controls style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8 }} />
            <MiniMap
              style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, height: 90 }}
              nodeColor="#38bdf8"
              maskColor="rgba(0,0,0,0.4)"
            />

            {/* Quick Status Bar */}
            {statusMessage && (
              <Panel position="top-center">
                <div
                  style={{
                    background: '#ffffff',
                    color: '#0369a1',
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: '1px solid #7dd3fc',
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
                  }}
                >
                  {statusMessage}
                </div>
              </Panel>
            )}

            {/* Background Image Controls Panel */}
            {bgImage && (
              <Panel position="bottom-left" style={{ margin: '0 0 16px 16px' }}>
                <div
                  style={{
                    background: surface,
                    border: `1px solid ${border}`,
                    borderRadius: 8,
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    minWidth: 200,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: text }}>Pengaturan Background</span>
                    <button
                      onClick={() => setShowBgControls(!showBgControls)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      {showBgControls ? '▲' : '▼'}
                    </button>
                  </div>
                  {showBgControls && (
                    <>
                      <label style={{ fontSize: 10, color: '#94a3b8' }}>
                        Opacity: {Math.round(bgPos.opacity * 100)}%
                        <input
                          type="range"
                          min="0.05"
                          max="1"
                          step="0.05"
                          value={bgPos.opacity}
                          onChange={(e) => setBgPos({ ...bgPos, opacity: parseFloat(e.target.value) })}
                          style={{ width: '100%' }}
                        />
                      </label>
                      <label style={{ fontSize: 10, color: '#94a3b8' }}>
                        Skala Gambar: {bgPos.scale.toFixed(2)}x
                        <input
                          type="range"
                          min="0.2"
                          max="3"
                          step="0.1"
                          value={bgPos.scale}
                          onChange={(e) => setBgPos({ ...bgPos, scale: parseFloat(e.target.value) })}
                          style={{ width: '100%' }}
                        />
                      </label>
                      <button
                        onClick={() => setBgImage(null)}
                        style={{ ...btnBase, background: '#ef4444', color: '#fff', padding: '4px 8px', fontSize: 11 }}
                      >
                        Hapus Gambar
                      </button>
                    </>
                  )}
                </div>
              </Panel>
            )}

            {/* Quick Stats */}
            <Panel position="bottom-right" style={{ margin: '0 16px 16px 0' }}>
              <div
                style={{
                  background: surface,
                  border: `1px solid ${border}`,
                  padding: '6px 12px',
                  borderRadius: 6,
                  color: '#94a3b8',
                  fontSize: 11,
                  display: 'flex',
                  gap: 12,
                }}
              >
                <span>Nodes: <strong>{nodes.length}</strong></span>
                <span>Links: <strong>{edges.length}</strong></span>
              </div>
            </Panel>
          </ReactFlow>
        </main>

        {/* Right Sidebar - Properties Inspector */}
        <aside
          style={{
            width: 260,
            background: surface,
            borderLeft: `2px solid ${border}`,
            padding: 16,
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: text, borderBottom: `1px solid ${border}`, paddingBottom: 8 }}>
            Properties Inspector
          </div>

          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>
                Node: {selectedNode.type?.toUpperCase()} ({selectedNode.id})
              </div>

              <label style={labelStyle}>
                Nama / Label:
                <input
                  type="text"
                  value={selectedNode.data.label || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, 'label', e.target.value)}
                  style={{ ...inputStyle, background: isDark ? '#0f172a' : '#f8fafc', color: text }}
                />
              </label>

              <label style={labelStyle}>
                Sublabel / IP / Port:
                <input
                  type="text"
                  value={selectedNode.data.description || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, 'description', e.target.value)}
                  style={{ ...inputStyle, background: isDark ? '#0f172a' : '#f8fafc', color: text }}
                />
              </label>

              <button
                onClick={deleteSelected}
                style={{ ...btnBase, background: '#ef4444', color: '#fff', marginTop: 10 }}
              >
                🗑️ Hapus Node
              </button>
            </div>
          ) : selectedEdge ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>
                Koneksi / Link ({selectedEdge.id})
              </div>

              <label style={labelStyle}>
                Label Link / Bandwidth:
                <input
                  type="text"
                  value={typeof selectedEdge.label === 'string' ? selectedEdge.label : ''}
                  onChange={(e) => {
                    const newLabel = e.target.value;
                    setEdges((eds) =>
                      eds.map((edge) => (edge.id === selectedEdge.id ? { ...edge, label: newLabel } : edge))
                    );
                  }}
                  style={{ ...inputStyle, background: isDark ? '#0f172a' : '#f8fafc', color: text }}
                />
              </label>

              <button
                onClick={deleteSelected}
                style={{ ...btnBase, background: '#ef4444', color: '#fff', marginTop: 10 }}
              >
                🗑️ Hapus Link
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
              Pilih sebuah node atau sambungan garis di canvas untuk mengedit label, sublabel, IP address, atau menghapusnya.
            </div>
          )}
        </aside>
      </div>

      {/* Modal Text Topology Parser */}
      {showTextModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: surface,
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: 24,
              width: 520,
              maxWidth: '90vw',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>
              ⚡ Input Teks Cepat Topologi
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
              Ketik urutan topologi dengan tanda panah <code>-&gt;</code> atau <code>→</code>. Tipe node otomatis
              dikenali berdasarkan kata kunci (switch, router, firewall, server, cloud, pc).
            </p>
            <textarea
              rows={6}
              value={topologyText}
              onChange={(e) => setTopologyText(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                background: isDark ? '#0f172a' : '#f8fafc',
                border: `1px solid ${border}`,
                color: text,
                fontFamily: 'monospace',
                fontSize: 12,
                outline: 'none',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowTextModal(false)}
                style={{ ...btnBase, background: '#475569', color: '#fff' }}
              >
                Batal
              </button>
              <button
                onClick={handleParseTopologyText}
                style={{ ...btnBase, background: '#2563eb', color: '#fff' }}
              >
                Generate Diagram
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaletteItem({
  icon,
  label,
  type,
  color,
  onClick,
  onDragStart,
  isDark,
}: {
  icon: string;
  label: string;
  type: string;
  color: string;
  onClick: () => void;
  onDragStart: (e: DragEvent) => void;
  isDark: boolean;
}) {
  return (
    <div
      data-node-type={type}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 8,
        border: `1px solid ${color}44`,
        background: `${color}14`,
        cursor: 'grab',
        userSelect: 'none',
        transition: 'transform 0.15s ease',
      }}
      title={`Klik atau drag untuk tambah ${label}`}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#f8fafc' : '#0c4a6e' }}>{label}</span>
    </div>
  );
}

const btnBase: CSSProperties = {
  border: 'none',
  borderRadius: 6,
  padding: '7px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  outline: 'none',
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #334155',
  fontSize: 12,
  outline: 'none',
};
