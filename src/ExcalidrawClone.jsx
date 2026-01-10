import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Square, ArrowRight, Pencil, MousePointer2, Type, Pin, Image, Eraser, Undo, Circle, Triangle, Hand } from 'lucide-react';

// ============================================================================
// UTILITIES
// ============================================================================

const generateId = () => Math.random().toString(36).substr(2, 9);

// Seeded random for consistent "roughness"
const seededRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const hexToRgba = (hex, alpha = 1) => {
  const clean = hex.replace('#', '');
  const int = parseInt(clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const stringToColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const r = (hash >> 16) & 0xff;
  const g = (hash >> 8) & 0xff;
  const b = hash & 0xff;
  return `rgb(${(r + 256) % 256}, ${(g + 256) % 256}, ${(b + 256) % 256})`;
};

// Convert screen coordinates to world coordinates
const screenToWorld = (screenX, screenY, camera) => ({
  x: (screenX - camera.x) / camera.zoom,
  y: (screenY - camera.y) / camera.zoom,
});

// Calculate distance between two points
const distance = (x1, y1, x2, y2) => 
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// Check if point is near a line (for arrow hit testing)
const isPointNearLine = (px, py, x1, y1, x2, y2, threshold = 5) => {
  const lineLen = distance(x1, y1, x2, y2);
  if (lineLen === 0) return distance(px, py, x1, y1) < threshold;
  
  const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (lineLen ** 2)));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  
  return distance(px, py, projX, projY) < threshold;
};

  const pointInTriangle = (px, py, a, b, c) => {
    const v0x = c[0] - a[0];
    const v0y = c[1] - a[1];
    const v1x = b[0] - a[0];
    const v1y = b[1] - a[1];
    const v2x = px - a[0];
    const v2y = py - a[1];

    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    return u >= 0 && v >= 0 && u + v < 1;
  };

// ============================================================================
// HAND-DRAWN RENDERING
// ============================================================================

const drawRoughLine = (ctx, x1, y1, x2, y2, seed = 0) => {
  const len = distance(x1, y1, x2, y2);
  if (len < 4) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    return;
  }
  
  const segments = Math.max(4, Math.floor(len / 8));
  const points = [];
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    
    const edgeFactor = Math.min(t, 1 - t) * 2;
    const offsetX = (seededRandom(seed + i * 2) - 0.5) * 1.5 * edgeFactor;
    const offsetY = (seededRandom(seed + i * 2 + 1) - 0.5) * 1.5 * edgeFactor;
    
    points.push({ x: x + offsetX, y: y + offsetY });
  }
  
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
};

const drawRoughRect = (ctx, x, y, width, height, seed = 0, color = '#fff', strokeWidth = 2) => {
  ctx.beginPath();
  drawRoughLine(ctx, x, y, x + width, y, seed);
  drawRoughLine(ctx, x + width, y, x + width, y + height, seed + 100);
  drawRoughLine(ctx, x + width, y + height, x, y + height, seed + 200);
  drawRoughLine(ctx, x, y + height, x, y, seed + 300);
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.stroke();
};

const drawRoughArrow = (ctx, x1, y1, x2, y2, seed = 0, color = '#fff', strokeWidth = 2) => {
  ctx.beginPath();
  drawRoughLine(ctx, x1, y1, x2, y2, seed);
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.stroke();
  
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowLen = 20;
  const arrowAngle = Math.PI / 6;
  
  const arrowX1 = x2 - arrowLen * Math.cos(angle - arrowAngle);
  const arrowY1 = y2 - arrowLen * Math.sin(angle - arrowAngle);
  const arrowX2 = x2 - arrowLen * Math.cos(angle + arrowAngle);
  const arrowY2 = y2 - arrowLen * Math.sin(angle + arrowAngle);
  
  ctx.beginPath();
  drawRoughLine(ctx, x2, y2, arrowX1, arrowY1, seed + 400);
  ctx.stroke();
  
  ctx.beginPath();
  drawRoughLine(ctx, x2, y2, arrowX2, arrowY2, seed + 500);
  ctx.stroke();
};

const drawRoughEllipse = (ctx, x1, y1, x2, y2, seed = 0, color = '#fff', strokeWidth = 2) => {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const rx = Math.abs(x2 - x1) / 2;
  const ry = Math.abs(y2 - y1) / 2;

  const passes = 2;
  for (let i = 0; i < passes; i++) {
    const offsetX = (seededRandom(seed + i * 10) - 0.5) * 2;
    const offsetY = (seededRandom(seed + i * 10 + 1) - 0.5) * 2;
    ctx.beginPath();
    ctx.ellipse(cx + offsetX, cy + offsetY, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
};

const drawRoughTriangle = (ctx, x1, y1, x2, y2, seed = 0, color = '#fff', strokeWidth = 2) => {
  const top = [(x1 + x2) / 2, y1];
  const left = [x1, y2];
  const right = [x2, y2];

  ctx.beginPath();
  drawRoughLine(ctx, top[0], top[1], left[0], left[1], seed);
  drawRoughLine(ctx, left[0], left[1], right[0], right[1], seed + 100);
  drawRoughLine(ctx, right[0], right[1], top[0], top[1], seed + 200);
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.stroke();
};

const drawRoughPath = (ctx, points, seed = 0) => {
  // Show immediate ink at start
  if (points.length < 4) {
    const x = points[0];
    const y = points[1];
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, ctx.lineWidth / 2), 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);

  for (let i = 2; i < points.length - 2; i += 2) {
    const xc = (points[i] + points[i + 2]) / 2;
    const yc = (points[i + 1] + points[i + 3]) / 2;
    ctx.quadraticCurveTo(points[i], points[i + 1], xc, yc);
  }

  if (points.length >= 4) {
    ctx.quadraticCurveTo(
      points[points.length - 2],
      points[points.length - 1],
      points[points.length - 2],
      points[points.length - 1]
    );
  }

  ctx.stroke();
};

// ============================================================================
// ELEMENT OPERATIONS
// ============================================================================

const createElement = (type, x1, y1, x2 = null, y2 = null, color = '#ffffff', strokeWidth = 2, opacity = 1) => {
  const element = {
    id: generateId(),
    type,
    x1,
    y1,
    x2: x2 || x1,
    y2: y2 || y1,
    seed: Math.floor(Math.random() * 10000),
    color,
    strokeWidth,
    opacity,
  };
  
  if (type === 'freehand') {
    element.points = [x1, y1];
    element.color = color;
    element.strokeWidth = strokeWidth;
  }
  
  if (type === 'text') {
    element.text = '';
    element.width = 200;
    element.height = 40;
    element.isEditing = true;
  }
  
  if (type === 'image') {
    element.imageData = null;
    element.width = 200;
    element.height = 200;
  }
  
  if (type === 'pin') {
    element.text = '';
    element.color = '#fbbf24';
    element.opacity = opacity;
    element.width = 150;
    element.height = 150;
    element.isEditing = true;
    element.tags = [];
  }
  
  return element;
};

const isPointInElement = (x, y, element) => {
  const { type, x1, y1, x2, y2, points, width, height } = element;
  
  if (type === 'rectangle' || type === 'ellipse' || type === 'triangle') {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    if (type === 'rectangle') {
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }
    if (type === 'ellipse') {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      if (rx === 0 || ry === 0) return false;
      const norm = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2);
      return norm <= 1.05; // allow slight margin for rough stroke
    }
    const triTop = [(x1 + x2) / 2, minY];
    const triLeft = [minX, maxY];
    const triRight = [maxX, maxY];
    return pointInTriangle(x, y, triTop, triLeft, triRight);
  }
  
  if (type === 'arrow') {
    return isPointNearLine(x, y, x1, y1, x2, y2, 8);
  }
  
  if (type === 'freehand') {
    for (let i = 0; i < points.length - 2; i += 2) {
      if (isPointNearLine(x, y, points[i], points[i + 1], points[i + 2], points[i + 3], 8)) {
        return true;
      }
    }
    return false;
  }
  
  if (type === 'text' || type === 'image' || type === 'pin') {
    return x >= x1 && x <= x1 + width && y >= y1 && y <= y1 + height;
  }
  
  return false;
};

const getElementBounds = (element) => {
  const { type, x1, y1, x2, y2, points, width, height } = element;
  
  if (type === 'freehand') {
    const xs = points.filter((_, i) => i % 2 === 0);
    const ys = points.filter((_, i) => i % 2 === 1);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }
  
  if (type === 'text' || type === 'image' || type === 'pin') {
    return {
      minX: x1,
      maxX: x1 + width,
      minY: y1,
      maxY: y1 + height,
    };
  }
  
  return {
    minX: Math.min(x1, x2),
    maxX: Math.max(x1, x2),
    minY: Math.min(y1, y2),
    maxY: Math.max(y1, y2),
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ExcalidrawClone() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Load persisted state from localStorage
  const loadPersistedState = () => {
    try {
      const saved = localStorage.getItem('voidboard-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          elements: parsed.elements || [],
          camera: parsed.camera || { x: 0, y: 0, zoom: 1 },
          snapshots: parsed.snapshots || [],
          theme: parsed.theme || 'dark'
        };
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
    return { elements: [], camera: { x: 0, y: 0, zoom: 1 }, snapshots: [], theme: 'dark' };
  };
  
  const persistedState = loadPersistedState();
  
  const [elements, setElements] = useState(persistedState.elements);
  const [history, setHistory] = useState([persistedState.elements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [tool, setTool] = useState('select');
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [strokeOpacity, setStrokeOpacity] = useState(1);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [camera, setCamera] = useState(persistedState.camera);
  const [action, setAction] = useState('none');
  const [selectedId, setSelectedId] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [snapshots, setSnapshots] = useState(persistedState.snapshots);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(true);
  const [tagFilter, setTagFilter] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [showLanding, setShowLanding] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [theme, setTheme] = useState(persistedState.theme);
  const [eraserMode, setEraserMode] = useState('point'); // point, brush, shape
  const [eraserSize, setEraserSize] = useState(20);
  const [eraserHoverTarget, setEraserHoverTarget] = useState(null);
  const [eraserDragArea, setEraserDragArea] = useState(null);
  const [controlsCollapsed, setControlsCollapsed] = useState(true);
  const isEditingText = useRef(false);
  const needsRender = useRef(true);
  
  // Force focus textarea when editing
  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingTextId]);
    try {
      const stateToSave = {
        elements,
        camera,
        snapshots,
        theme,
        version: '1.0',
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('voidboard-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }, [elements, camera, snapshots, theme]);
  
  // Update history when elements change
  useEffect(() => {
    if (isEditingText.current) return; // Skip history updates while editing text
    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory[newHistory.length - 1] !== elements) {
      newHistory.push(elements);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [elements, history, historyIndex]);
  
  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
      setSelectedId(null);
    }
  }, [historyIndex, history]);

  const moveLayer = useCallback((direction) => {
    if (!selectedId) return;
    setElements(prev => {
      const idx = prev.findIndex(el => el.id === selectedId);
      if (idx === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      if (direction === 'front') {
        next.push(item);
      } else {
        next.unshift(item);
      }
      return next;
    });
  }, [selectedId]);
  
  // Snapshot functions
  const saveSnapshot = useCallback(() => {
    if (!snapshotName.trim()) {
      alert('Please enter a snapshot name');
      return;
    }
    const snapshot = {
      id: generateId(),
      name: snapshotName,
      timestamp: new Date().toISOString(),
      elements: JSON.parse(JSON.stringify(elements)),
      camera: { ...camera }
    };
    setSnapshots(prev => [...prev, snapshot]);
    setSnapshotName('');
    setShowSnapshotModal(false);
  }, [snapshotName, elements, camera]);
  
  const loadSnapshot = useCallback((snapshot) => {
    setElements(snapshot.elements);
    setCamera(snapshot.camera);
    setShowSnapshotModal(false);
  }, []);
  
  const deleteSnapshot = useCallback((id) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
  }, []);
  
  const exportToJSON = useCallback(() => {
    const data = {
      elements,
      camera,
      snapshots,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voidboard-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [elements, camera, snapshots]);
  
  const importFromJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.elements) {
            setElements(data.elements);
          }
          if (data.camera) {
            setCamera(data.camera);
          }
          if (data.snapshots) {
            setSnapshots(data.snapshots);
          }
        } catch (error) {
          alert('Failed to import file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);
  
  // Update all tags when elements change
  useEffect(() => {
    const tags = new Set();
    elements.forEach(el => {
      if (el.type === 'pin' && el.tags) {
        el.tags.forEach(tag => tags.add(tag));
      }
    });
    setAllTags(Array.from(tags));
  }, [elements]);
  
  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      needsRender.current = true;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme CSS vars
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--panel-bg', 'rgba(24,24,30,0.55)');
      root.style.setProperty('--panel-border', 'rgba(255,255,255,0.08)');
      root.style.setProperty('--panel-text', '#e5e7eb');
      root.style.setProperty('--panel-muted', '#9ca3af');
    } else {
      root.style.setProperty('--panel-bg', 'rgba(255,255,255,0.7)');
      root.style.setProperty('--panel-border', 'rgba(0,0,0,0.08)');
      root.style.setProperty('--panel-text', '#0f172a');
      root.style.setProperty('--panel-muted', '#475569');
    }
  }, [theme]);
  
  // Render loop
  useEffect(() => {
    let frameId;
    
    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      
      if (canvas && ctx && needsRender.current) {
        ctx.save();
        const grad = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          Math.min(canvas.width, canvas.height) * 0.05,
          canvas.width / 2,
          canvas.height / 2,
          Math.max(canvas.width, canvas.height)
        );
        if (theme === 'dark') {
          grad.addColorStop(0, '#0b1120');
          grad.addColorStop(0.6, '#0f172a');
          grad.addColorStop(1, '#0a0f1c');
        } else {
          grad.addColorStop(0, '#f1f5f9');
          grad.addColorStop(0.6, '#e2e8f0');
          grad.addColorStop(1, '#dbeafe');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.translate(camera.x, camera.y);
        ctx.scale(camera.zoom, camera.zoom);
        
        // Grid
        const gridSize = 40;
        const startX = Math.floor(-camera.x / camera.zoom / gridSize) * gridSize;
        const startY = Math.floor(-camera.y / camera.zoom / gridSize) * gridSize;
        const endX = startX + canvas.width / camera.zoom + gridSize;
        const endY = startY + canvas.height / camera.zoom + gridSize;
        
        ctx.fillStyle = '#333';
        for (let x = startX; x < endX; x += gridSize) {
          for (let y = startY; y < endY; y += gridSize) {
            ctx.fillRect(x, y, 2, 2);
          }
        }
        
        // Draw elements
        const filteredElements = tagFilter ? elements.filter(el => 
          el.type === 'pin' && el.tags && el.tags.includes(tagFilter)
        ) : elements;
        
        filteredElements.forEach(element => {
          const { type, x1, y1, x2, y2, points, seed, text, imageData, width, height, color, isEditing, strokeWidth, tags, opacity } = element;
          const strokeColorRgba = hexToRgba(color || '#fff', opacity ?? 1);
          const resolvedWidth = strokeWidth || 2;

          if (type === 'rectangle') {
            drawRoughRect(ctx, x1, y1, x2 - x1, y2 - y1, seed, strokeColorRgba, resolvedWidth);
          } else if (type === 'ellipse') {
            drawRoughEllipse(ctx, x1, y1, x2, y2, seed, strokeColorRgba, resolvedWidth);
          } else if (type === 'triangle') {
            drawRoughTriangle(ctx, x1, y1, x2, y2, seed, strokeColorRgba, resolvedWidth);
          } else if (type === 'arrow') {
            drawRoughArrow(ctx, x1, y1, x2, y2, seed, strokeColorRgba, resolvedWidth);
          } else if (type === 'freehand') {
            ctx.strokeStyle = strokeColorRgba;
            ctx.lineWidth = resolvedWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            drawRoughPath(ctx, points, seed);
          } else if (type === 'text') {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x1, y1, width, height);
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.strokeRect(x1, y1, width, height);
            
            if (text && !isEditing) {
              ctx.fillStyle = '#fff';
              ctx.font = '16px sans-serif';
              ctx.textBaseline = 'top';
              const lines = text.split('\n');
              lines.forEach((line, i) => {
                ctx.fillText(line, x1 + 10, y1 + 10 + i * 20);
              });
            }
          } else if (type === 'image') {
            if (imageData) {
              const img = new window.Image();
              img.src = imageData;
              ctx.drawImage(img, x1, y1, width, height);
            } else {
              ctx.fillStyle = '#1a1a1a';
              ctx.fillRect(x1, y1, width, height);
              ctx.strokeStyle = '#444';
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]);
              ctx.strokeRect(x1, y1, width, height);
              ctx.setLineDash([]);
              ctx.fillStyle = '#666';
              ctx.font = '14px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('Click to upload image', x1 + width / 2, y1 + height / 2);
            }
          } else if (type === 'pin') {
            const pinOpacity = opacity ?? 1;
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(x1 + 3, y1 + 3, width, height);
            ctx.fillStyle = hexToRgba(color || '#fbbf24', pinOpacity);
            ctx.fillRect(x1, y1, width, height);
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x1, y1, width, height);
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(x1 + width / 2, y1 + 15, 6, 0, Math.PI * 2);
            ctx.fill();
            
            if (text && !isEditing) {
              ctx.fillStyle = '#000';
              ctx.font = '14px sans-serif';
              ctx.textBaseline = 'top';
              const lines = text.split('\n');
              lines.forEach((line, i) => {
                ctx.fillText(line, x1 + 10, y1 + 35 + i * 18, width - 20);
              });
            }
            
            // Draw tags
            if (tags && tags.length > 0 && !isEditing) {
              ctx.font = '10px sans-serif';
              let tagX = x1 + 5;
              const tagY = y1 + height - 20;
              tags.forEach(tag => {
                const tagWidth = ctx.measureText(tag).width + 8;
                ctx.fillStyle = hexToRgba(stringToColor(tag), 0.8);
                ctx.fillRect(tagX, tagY, tagWidth, 16);
                ctx.fillStyle = '#fff';
                ctx.fillText(tag, tagX + 4, tagY + 4);
                tagX += tagWidth + 4;
              });
            }
          }
        });
        
        // Selection box
        if (selectedId && !editingTextId) {
          const element = elements.find(el => el.id === selectedId);
          if (element) {
            const bounds = getElementBounds(element);
            const padding = 8 / camera.zoom;
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2 / camera.zoom;
            ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom]);
            ctx.strokeRect(
              bounds.minX - padding,
              bounds.minY - padding,
              bounds.maxX - bounds.minX + padding * 2,
              bounds.maxY - bounds.minY + padding * 2
            );
            ctx.setLineDash([]);
            
            if (element.type === 'text' || element.type === 'image' || element.type === 'pin') {
              const handleSize = 8 / camera.zoom;
              const handles = [
                [bounds.minX, bounds.minY],
                [bounds.maxX, bounds.minY],
                [bounds.minX, bounds.maxY],
                [bounds.maxX, bounds.maxY],
              ];
              ctx.fillStyle = '#3b82f6';
              handles.forEach(([hx, hy]) => {
                ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
              });
              
              // Add move icon for pins
              if (element.type === 'pin') {
                const centerX = (bounds.minX + bounds.maxX) / 2;
                const centerY = bounds.minY - 15 / camera.zoom;
                ctx.fillStyle = '#3b82f6';
                ctx.font = `${12 / camera.zoom}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('✋ Drag to move · Double-click to edit', centerX, centerY);
              }
            }
          }
        }
        
        // Hover highlight for eraser point mode
        if (eraserHoverTarget && tool === 'eraser' && eraserMode === 'point') {
          const element = elements.find(el => el.id === eraserHoverTarget);
          if (element) {
            const bounds = getElementBounds(element);
            const padding = 6 / camera.zoom;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2 / camera.zoom;
            ctx.setLineDash([4 / camera.zoom, 4 / camera.zoom]);
            ctx.strokeRect(
              bounds.minX - padding,
              bounds.minY - padding,
              bounds.maxX - bounds.minX + padding * 2,
              bounds.maxY - bounds.minY + padding * 2
            );
            ctx.setLineDash([]);
          }
        }
        
        // Shape eraser drag area
        if (eraserDragArea && action === 'eraserShape') {
          const { x1, y1, x2, y2 } = eraserDragArea;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2 / camera.zoom;
          ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom]);
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          ctx.setLineDash([]);
        }
        
        ctx.restore();
        needsRender.current = false;
      }
      
      frameId = requestAnimationFrame(render);
    };
    
    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [elements, selectedId, camera, editingTextId, theme, eraserHoverTarget, eraserDragArea, eraserMode, action, tool]);
  
  useEffect(() => {
    needsRender.current = true;
  }, [elements, selectedId, camera, tagFilter, theme]);
  
  const gridSize = 40;

  const maybeSnap = (value) => snapToGrid ? Math.round(value / gridSize) * gridSize : value;

  const handlePointerDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || editingTextId) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    let { x: worldX, y: worldY } = screenToWorld(screenX, screenY, camera);
    worldX = maybeSnap(worldX);
    worldY = maybeSnap(worldY);
    
    if (e.button === 1 || e.shiftKey || tool === 'pan') {
      setAction('panning');
      setStartPoint({ screenX, screenY, cameraX: camera.x, cameraY: camera.y });
      return;
    }
    
    if (tool === 'eraser') {
      if (eraserMode === 'point') {
        const clickedElement = [...elements].reverse().find(el => 
          isPointInElement(worldX, worldY, el)
        );
        
        if (clickedElement) {
          const newElements = elements.filter(el => el.id !== clickedElement.id);
          setElements(newElements);
          setSelectedId(null);
        }
      } else if (eraserMode === 'brush') {
        // Start brush erasing
        setAction('erasing');
        setStartPoint({ worldX, worldY });
      } else if (eraserMode === 'shape') {
        // Start shape eraser drag
        setAction('eraserShape');
        setStartPoint({ worldX, worldY });
        setEraserDragArea({ x1: worldX, y1: worldY, x2: worldX, y2: worldY });
      }
      return;
    }
    
    if (tool === 'select') {
      if (selectedId) {
        const element = elements.find(el => el.id === selectedId);
        if (element && isPointInElement(worldX, worldY, element)) {
          setAction('moving');
          setStartPoint({ worldX, worldY, element: { ...element } });
          return;
        }
      }
      
      const clickedElement = [...elements].reverse().find(el => 
        isPointInElement(worldX, worldY, el)
      );
      
      if (clickedElement) {
        setSelectedId(clickedElement.id);
        // For text and pin, only enter edit mode on double-click
        // Single click just selects and allows dragging
        if (clickedElement.type === 'image' && !clickedElement.imageData) {
          fileInputRef.current?.click();
        }
      } else {
        // Background drag: start panning when clicking empty space
        setSelectedId(null);
        setAction('panning');
        setStartPoint({ screenX, screenY, cameraX: camera.x, cameraY: camera.y });
      }
      return;
    }
    
    if (tool === 'rectangle' || tool === 'arrow' || tool === 'freehand' || tool === 'ellipse' || tool === 'triangle') {
      const newElement = createElement(tool, worldX, worldY, worldX, worldY, strokeColor, strokeWidth, strokeOpacity);
      setElements(prev => [...prev, newElement]);
      setSelectedId(newElement.id);
      setAction('drawing');
      setStartPoint({ worldX, worldY });
    }
    
    if (tool === 'text' || tool === 'image' || tool === 'pin') {
      const newElement = createElement(tool, worldX, worldY, worldX, worldY, strokeColor, strokeWidth, strokeOpacity);
      const newElements = [...elements, newElement];
      setElements(newElements);
      setSelectedId(newElement.id);
      
      if (tool === 'text' || tool === 'pin') {
        setEditingTextId(newElement.id);
      }
      if (tool === 'image') {
        fileInputRef.current?.click();
      }
      setTool('select');
    }
  }, [tool, elements, selectedId, camera, editingTextId, strokeColor, strokeWidth, strokeOpacity, snapToGrid]);
  
  const handlePointerMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    let { x: worldX, y: worldY } = screenToWorld(screenX, screenY, camera);
    worldX = maybeSnap(worldX);
    worldY = maybeSnap(worldY);
    
    if (action === 'panning' && startPoint) {
      const dx = screenX - startPoint.screenX;
      const dy = screenY - startPoint.screenY;
      setCamera({
        ...camera,
        x: startPoint.cameraX + dx,
        y: startPoint.cameraY + dy,
      });
      return;
    }
    
    if (action === 'drawing' && selectedId) {
      setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;
        
        if (el.type === 'freehand') {
          const lastX = el.points[el.points.length - 2];
          const lastY = el.points[el.points.length - 1];
          const dist = distance(worldX, worldY, lastX, lastY);

          // Slight smoothing to reduce jitter
          const alpha = 0.35;
          const smoothX = lastX + (worldX - lastX) * alpha;
          const smoothY = lastY + (worldY - lastY) * alpha;

          if (dist > 2) {
            return { ...el, points: [...el.points, smoothX, smoothY] };
          }
          return el;
        }
        
        return { ...el, x2: worldX, y2: worldY };
      }));
    }
    
    if (action === 'moving' && selectedId && startPoint) {
      const dx = worldX - startPoint.worldX;
      const dy = worldY - startPoint.worldY;
      
      setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;
        
        const original = startPoint.element;
        
        if (el.type === 'freehand') {
          return {
            ...el,
            points: original.points.map((val, i) => 
              i % 2 === 0 ? val + dx : val + dy
            ),
          };
        }
        
        if (el.type === 'text' || el.type === 'image' || el.type === 'pin') {
          return { ...el, x1: original.x1 + dx, y1: original.y1 + dy };
        }
        
        return {
          ...el,
          x1: original.x1 + dx,
          y1: original.y1 + dy,
          x2: original.x2 + dx,
          y2: original.y2 + dy,
        };
      }));
    }
    
    // Eraser brush mode - erase parts of freehand strokes
    if (action === 'erasing' && tool === 'eraser' && startPoint) {
      const lastWorldX = startPoint.lastErasedX || worldX;
      const lastWorldY = startPoint.lastErasedY || worldY;
      const dist = distance(worldX, worldY, lastWorldX, lastWorldY);
      
      // Only update every few pixels to reduce flicker
      if (dist > 3 / camera.zoom) {
        setElements(prev => {
          const newElements = [];
          let changed = false;
          
          prev.forEach(el => {
            if (el.type === 'freehand') {
              const survivingPoints = [];
              for (let i = 0; i < el.points.length; i += 2) {
                const px = el.points[i];
                const py = el.points[i + 1];
                const dist = distance(worldX, worldY, px, py);
                if (dist > eraserSize / camera.zoom) {
                  survivingPoints.push(px, py);
                } else {
                  changed = true;
                }
              }
              if (survivingPoints.length >= 4) {
                newElements.push({ ...el, points: survivingPoints });
              } else if (survivingPoints.length > 0) {
                changed = true;
              }
            } else {
              const bounds = getElementBounds(el);
              const centerX = (bounds.minX + bounds.maxX) / 2;
              const centerY = (bounds.minY + bounds.maxY) / 2;
              const dist = distance(worldX, worldY, centerX, centerY);
              if (dist > eraserSize / camera.zoom) {
                newElements.push(el);
              } else {
                changed = true;
              }
            }
          });
          
          return changed ? newElements : prev;
        });
        
        setStartPoint({ ...startPoint, lastErasedX: worldX, lastErasedY: worldY });
      }
    }
    
    // Eraser shape mode - update drag area
    if (action === 'eraserShape' && startPoint) {
      setEraserDragArea({ x1: startPoint.worldX, y1: startPoint.worldY, x2: worldX, y2: worldY });
    }
    
    // Track hover target for visual feedback (throttled)
    if (tool === 'eraser' && action === 'none' && eraserMode === 'point') {
      const hovered = [...elements].reverse().find(el => 
        isPointInElement(worldX, worldY, el)
      );
      const hoveredId = hovered?.id || null;
      if (hoveredId !== eraserHoverTarget) {
        setEraserHoverTarget(hoveredId);
      }
    } else if (eraserHoverTarget) {
      setEraserHoverTarget(null);
    }
  }, [action, selectedId, startPoint, camera, snapToGrid, tool, eraserMode, eraserSize, elements, eraserHoverTarget]);
  
  const handlePointerUp = useCallback(() => {
    if (action === 'drawing') {
      // Drawing is already in elements, just mark it as finalized
      needsRender.current = true;
      setTimeout(() => setSelectedId(null), 150);
    }
    
    // Shape eraser - delete all elements in the drag area
    if (action === 'eraserShape' && eraserDragArea) {
      const { x1, y1, x2, y2 } = eraserDragArea;
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      
      setElements(prev => prev.filter(el => {
        const bounds = getElementBounds(el);
        // Check if element overlaps with eraser area
        const overlaps = !(bounds.maxX < minX || bounds.minX > maxX || bounds.maxY < minY || bounds.minY > minY);
        return !overlaps;
      }));
      setEraserDragArea(null);
    }
    
    setAction('none');
    setStartPoint(null);
  }, [action, eraserDragArea]);
  
  // Double-click to edit pins and text
  const handleDoubleClick = useCallback((e) => {
    if (tool !== 'select' || editingTextId) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x: worldX, y: worldY } = screenToWorld(screenX, screenY, camera);
    
    const clickedElement = [...elements].reverse().find(el => 
      isPointInElement(worldX, worldY, el)
    );
    
    if (clickedElement && (clickedElement.type === 'text' || clickedElement.type === 'pin')) {
      setSelectedId(clickedElement.id);
      setEditingTextId(clickedElement.id);
    }
  }, [tool, elements, camera, editingTextId]);
  
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, camera.zoom * zoomFactor));
    
    const worldBeforeZoom = screenToWorld(screenX, screenY, camera);
    const newCamera = { ...camera, zoom: newZoom };
    const worldAfterZoom = screenToWorld(screenX, screenY, newCamera);
    
    setCamera({
      x: camera.x + (worldAfterZoom.x - worldBeforeZoom.x) * newZoom,
      y: camera.y + (worldAfterZoom.y - worldBeforeZoom.y) * newZoom,
      zoom: newZoom,
    });
  }, [camera]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setShowSnapshotModal(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportToJSON();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        importFromJSON();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistoryPanel(v => !v);
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
        const step = 120 / camera.zoom;
        setCamera((prev) => {
          if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') return { ...prev, y: prev.y - step };
          if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') return { ...prev, y: prev.y + step };
          if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') return { ...prev, x: prev.x - step };
          return { ...prev, x: prev.x + step };
        });
      }
      if (e.key === 'Escape') {
        if (editingTextId) {
          setEditingTextId(null);
        }
        if (showSnapshotModal) {
          setShowSnapshotModal(false);
        }
        if (showTagModal) {
          setShowTagModal(false);
        }
        if (showTutorial) {
          setShowTutorial(false);
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !editingTextId) {
          e.preventDefault();
          setElements(prev => prev.filter(el => el.id !== selectedId));
          setSelectedId(null);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, exportToJSON, importFromJSON, editingTextId, showSnapshotModal, showTagModal, showTutorial, camera.zoom, selectedId]);
  
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const newElements = elements.map(el => 
        el.id === selectedId 
          ? { ...el, imageData: event.target.result }
          : el
      );
      setElements(newElements);
    };
    reader.readAsDataURL(file);
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);
  
  // Update eraser cursor position with RAF for smoothness
  useEffect(() => {
    if (tool !== 'eraser' || eraserMode !== 'brush') {
      const cursor = document.getElementById('eraserCursor');
      if (cursor) cursor.style.display = 'none';
      return;
    }
    
    let rafId = null;
    let lastX = 0;
    let lastY = 0;
    
    const handleMouseMove = (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
      
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          const cursor = document.getElementById('eraserCursor');
          if (cursor) {
            cursor.style.left = `${lastX}px`;
            cursor.style.top = `${lastY}px`;
            cursor.style.display = 'block';
          }
          rafId = null;
        });
      }
    };
    
    const handleMouseLeave = () => {
      const cursor = document.getElementById('eraserCursor');
      if (cursor) cursor.style.display = 'none';
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [tool, eraserMode]);
  
  const editingElement = editingTextId ? elements.find(el => el.id === editingTextId) : null;
  const editingScreenPos = editingElement ? {
    x: editingElement.x1 * camera.zoom + camera.x,
    y: editingElement.y1 * camera.zoom + camera.y,
    width: editingElement.width * camera.zoom,
    height: editingElement.height * camera.zoom,
  } : null;
  
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'pan', icon: Hand, label: 'Pan' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
    { id: 'freehand', icon: Pencil, label: 'Draw' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'image', icon: Image, label: 'Image' },
    { id: 'pin', icon: Pin, label: 'Pin/Note' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];
  
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', backgroundColor: '#000' }}>
      {/* Landing Overlay */}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {showLanding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xl"
          style={{
            animation: 'fadeIn 0.35s ease',
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(2, 6, 23, 0.8)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div
            className="relative mx-4 w-full max-w-xl rounded-3xl border border-white/10 bg-white/10 p-10 text-center text-white shadow-2xl shadow-black/40 backdrop-blur-2xl"
            style={{
              position: 'relative',
              margin: '0 1rem',
              width: '100%',
              maxWidth: '48rem',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.10)',
              padding: '2.5rem',
              textAlign: 'center',
              color: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent"
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '24px',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06), rgba(255,255,255,0))'
              }}
            />
            <div className="relative space-y-6" style={{ position: 'relative' }}>
              <div className="space-y-2">
                <div
                  className="mx-auto h-12 w-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-lg font-semibold"
                  style={{
                    margin: '0 auto',
                    height: '48px',
                    width: '48px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255,255,255,0.10)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                >
                  VB
                </div>
                <h1
                  className="text-3xl font-semibold tracking-tight"
                  style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.01em', marginTop: '0.5rem' }}
                >
                  Voidboard
                </h1>
                <p
                  className="text-sm text-slate-200/80"
                  style={{ fontSize: '0.875rem', color: 'rgba(226,232,240,0.8)' }}
                >
                  A minimal infinite canvas for ideas
                </p>
              </div>
              <div className="flex items-center justify-center gap-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowLanding(false)}
                  className="group inline-flex items-center justify-center rounded-full bg-white/90 px-6 py-3 text-slate-900 font-semibold shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:bg-white"
                  style={{
                    animation: 'fadeIn 0.5s ease 0.1s forwards',
                    opacity: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255,255,255,0.90)',
                    padding: '0.75rem 1.5rem',
                    color: '#0f172a',
                    fontWeight: 600,
                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                    transition: 'transform 200ms ease, background-color 200ms ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.90)'; }}
                >
                  Start Drawing
                </button>
                <a
                  href="#"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-white font-semibold transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
                  style={{
                    animation: 'fadeIn 0.5s ease 0.15s forwards',
                    opacity: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '9999px',
                    border: '1px solid rgba(255,255,255,0.20)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    padding: '0.75rem 1.5rem',
                    color: '#ffffff',
                    fontWeight: 600,
                    transition: 'transform 200ms ease, background-color 200ms ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.10)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100 }}>
          <div style={{ width: '90%', maxWidth: '560px', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '20px', color: 'var(--panel-text)', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Quick Tour</h3>
              <button onClick={() => setShowTutorial(false)} style={{ background: 'transparent', border: 'none', color: 'var(--panel-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <ol style={{ paddingLeft: '18px', color: 'var(--panel-text)', lineHeight: 1.6 }}>
              <li>Pick a tool on the glass toolbar (top-left). Try Draw, Rectangle, Ellipse, or Triangle.</li>
              <li>Use the Appearance card to set color, opacity, and stroke width.</li>
              <li>Toggle Snap for tidy layouts; Layer buttons handle overlaps.</li>
              <li>Open the 📜 Panel to browse snapshots and recent history.</li>
              <li>Export a PNG or copy a share link to send your board.</li>
            </ol>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button onClick={() => setShowTutorial(false)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--panel-border)', backgroundColor: 'transparent', color: 'var(--panel-text)', cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ width: '90%', maxWidth: '520px', backgroundColor: 'rgba(24,24,27,0.8)', border: '1px solid #3f3f46', borderRadius: '16px', padding: '24px', color: '#e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>About Voidboard</h3>
              <button onClick={() => setShowInfoModal(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>
            <p style={{ margin: '4px 0 12px', color: '#d1d5db' }}>A lightweight infinite canvas for quick sketching, flows, and notes. New goodies: full color wheel, opacity & stroke sliders, layer controls, grid snapping, and a side history panel.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, #111827, #0f172a)', border: '1px solid #1f2937' }}>
                <div style={{ color: '#9ca3af', fontSize: '12px' }}>Shortcuts</div>
                <div style={{ color: '#e5e7eb', fontSize: '12px', marginTop: '6px' }}>Ctrl+Z undo · Shift+Drag pan · Scroll zoom</div>
              </div>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, #111827, #0f172a)', border: '1px solid #1f2937' }}>
                <div style={{ color: '#9ca3af', fontSize: '12px' }}>Tips</div>
                <div style={{ color: '#e5e7eb', fontSize: '12px', marginTop: '6px' }}>Use Snap for tidy layouts · Layer buttons for overlaps · Opacity for ghosting.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History / Snap Panel */}
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100%', width: '320px', transform: showHistoryPanel ? 'translateX(0)' : 'translateX(110%)', transition: 'transform 0.25s ease', backgroundColor: 'var(--panel-bg)', backdropFilter: 'blur(12px)', borderLeft: '1px solid var(--panel-border)', boxShadow: showHistoryPanel ? '-12px 0 30px rgba(0,0,0,0.45)' : 'none', zIndex: 1500, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #1f1f25', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e5e7eb' }}>
          <div>
            <div style={{ fontWeight: 700 }}>History & Snaps</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{history.length - 1} steps · {snapshots.length} snaps</div>
          </div>
          <button onClick={() => setShowHistoryPanel(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>
        <div style={{ padding: '12px 16px', overflowY: 'auto', flex: 1, display: 'grid', gap: '12px' }}>
          <div>
            <div style={{ color: '#d4d4d8', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>Snapshots</div>
            {snapshots.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: '12px' }}>No snapshots yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {[...snapshots].reverse().map((snap) => (
                  <div key={snap.id} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: '8px', alignItems: 'center', backgroundColor: '#131317', border: '1px solid #1f1f25', borderRadius: '10px', padding: '8px' }}>
                    <div style={{ height: '48px', borderRadius: '8px', background: 'radial-gradient(circle at 30% 30%, rgba(59,130,246,0.5), rgba(14,165,233,0.15))', border: '1px solid #1f2937' }} />
                    <div>
                      <div style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 600 }}>{snap.name}</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>{new Date(snap.timestamp).toLocaleString()}</div>
                      <div style={{ color: '#6b7280', fontSize: '11px' }}>{snap.elements.length} elements</div>
                    </div>
                    <button onClick={() => loadSnapshot(snap)} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Load</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div style={{ color: '#d4d4d8', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>Recent History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {history.slice(Math.max(0, history.length - 6)).map((h, idx) => (
                <div key={idx} style={{ padding: '8px', backgroundColor: '#131317', borderRadius: '8px', border: '1px solid #1f1f25', color: '#9ca3af', fontSize: '12px' }}>
                  Step {history.length - 6 + idx + 1}: {h.length} elements
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={editingTextId ? undefined : handlePointerDown}
        onPointerMove={editingTextId ? undefined : handlePointerMove}
        onPointerUp={editingTextId ? undefined : handlePointerUp}
        onPointerLeave={editingTextId ? undefined : handlePointerUp}
        onDoubleClick={editingTextId ? undefined : handleDoubleClick}
        style={{ 
          touchAction: 'none', 
          cursor: action === 'panning' || tool === 'pan'
            ? (action === 'panning' ? 'grabbing' : 'grab')
            : tool === 'select'
              ? (selectedId && elements.find(el => el.id === selectedId)?.type === 'pin' ? 'move' : 'grab')
              : tool === 'eraser'
                ? 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22 viewBox=%220 0 32 32%22%3E%3Crect x=%224%22 y=%222%22 width=%2216%22 height=%2214%22 rx=%222%22 fill=%22%23ff9999%22 stroke=%22%23333%22 stroke-width=%221.5%22/%3E%3Crect x=%224%22 y=%2216%22 width=%2216%22 height=%223%22 fill=%22%23c0c0c0%22 stroke=%22%23666%22 stroke-width=%221%22/%3E%3Ccircle cx=%2212%22 cy=%2226%22 r=%221.5%22 fill=%22%23666%22/%3E%3C/svg%3E") 12 12, auto'
                : tool === 'freehand'
                  ? 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22 viewBox=%220 0 32 32%22%3E%3Cg transform=%22rotate(-30 16 16)%22%3E%3Crect x=%2212%22 y=%228%22 width=%228%22 height=%224%22 fill=%22%230f172a%22/%3E%3Cpath d=%22M10 22l12-12 3 3-12 12-4 1z%22 fill=%22%233b82f6%22 stroke=%22%231f2937%22 stroke-width=%221.5%22/%3E%3C/g%3E%3C/svg%3E") 4 24, auto'
                  : 'crosshair',
          pointerEvents: editingTextId ? 'none' : 'auto'
        }}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      
      {/* Eraser Brush Cursor Preview */}
      {tool === 'eraser' && eraserMode === 'brush' && (
        <div
          style={{
            position: 'fixed',
            pointerEvents: 'none',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            zIndex: 9999
          }}
        >
          <div
            id="eraserCursor"
            style={{
              position: 'absolute',
              border: '2px solid #ef4444',
              borderRadius: '50%',
              width: `${eraserSize}px`,
              height: `${eraserSize}px`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              pointerEvents: 'none',
              display: 'none',
              willChange: 'left, top',
              transition: 'width 0.15s ease, height 0.15s ease'
            }}
          />
        </div>
      )}
      
      {editingTextId && editingElement && editingScreenPos && (
        <div
          style={{
            position: 'fixed',
            left: `${editingScreenPos.x}px`,
            top: `${editingScreenPos.y}px`,
            width: `${editingScreenPos.width}px`,
            height: `${editingScreenPos.height}px`,
            zIndex: 10000,
            pointerEvents: 'auto'
          }}
        >
          <textarea
            ref={textareaRef}
            autoFocus
            value={editingElement.text || ''}
            onChange={(e) => {
              setElements(prev => prev.map(el =>
                el.id === editingTextId ? { ...el, text: e.target.value } : el
              ));
            }}
            onBlur={(e) => {
              isEditingText.current = false;
              const finalText = e.target.value;
              setElements(prev => prev.map(el =>
                el.id === editingTextId ? { ...el, text: finalText, isEditing: false } : el
              ));
              setEditingTextId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                isEditingText.current = false;
                textareaRef.current?.blur();
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              border: '3px solid #3b82f6',
              padding: '10px',
              resize: 'none',
              outline: 'none',
              fontSize: `${14 * camera.zoom}px`,
              fontFamily: 'sans-serif',
              backgroundColor: '#ffffff',
              color: '#000000',
              boxSizing: 'border-box',
              zIndex: 10001,
              position: 'relative'
            }}
          />
        </div>
      )}
      
      <div style={{ position: 'fixed', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '10px', backdropFilter: 'blur(12px)', boxShadow: '8px 12px 32px rgba(0,0,0,0.35)' }}>
        {/* LEFT HALF (collapsible): everything to the left of the Panel */}
        <div style={{ display: controlsCollapsed ? 'none' : 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Undo Button */}
        <button
          onClick={undo}
          disabled={historyIndex === 0}
          style={{
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: '#18181b',
            color: historyIndex === 0 ? '#52525b' : '#a1a1aa',
            cursor: historyIndex === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (historyIndex > 0) {
              e.currentTarget.style.backgroundColor = '#27272a';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#18181b';
            e.currentTarget.style.color = historyIndex === 0 ? '#52525b' : '#a1a1aa';
          }}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={18} />
        </button>
        
        {/* Snapshot Button */}
        <button
          onClick={() => setShowSnapshotModal(true)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: '#18181b',
            color: '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '12px',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#27272a';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#18181b';
            e.currentTarget.style.color = '#a1a1aa';
          }}
          title="Save/Load Snapshots (Ctrl+S)"
        >
          📸 {snapshots.length}
        </button>
        
        {/* Export Button */}
        <button
          onClick={exportToJSON}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: '#18181b',
            color: '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '12px',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#27272a';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#18181b';
            e.currentTarget.style.color = '#a1a1aa';
          }}
          title="Export to JSON (Ctrl+E)"
        >
          💾
        </button>
        
        {/* Import Button */}
        <button
          onClick={importFromJSON}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: '#18181b',
            color: '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '12px',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#27272a';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#18181b';
            e.currentTarget.style.color = '#a1a1aa';
          }}
          title="Import from JSON (Ctrl+I)"
        >
          📂
        </button>

        {/* Export PNG */}
        <button
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `voidboard-${Date.now()}.png`;
            a.click();
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: '#18181b',
            color: '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '12px',
            fontWeight: '600'
          }}
          title="Export PNG"
        >
          🖼 PNG
        </button>

        {/* Share link */}
        <button
          onClick={() => {
            const link = window.location.href;
            if (navigator.clipboard) {
              navigator.clipboard.writeText(link);
              alert('Link copied to clipboard');
            } else {
              prompt('Copy this link', link);
            }
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: '#18181b',
            color: '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '12px',
            fontWeight: '600'
          }}
          title="Copy board link"
        >
          🔗 Share
        </button>

        {/* Snap Toggle */}
        <button
          onClick={() => setSnapToGrid(v => !v)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: snapToGrid ? '#3b82f6' : '#18181b',
            color: snapToGrid ? '#fff' : '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '12px',
            fontWeight: '600'
          }}
          title="Snap to grid"
        >
          ⬚ Snap
        </button>
        
        {/* Layer Controls */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => moveLayer('back')}
            disabled={!selectedId}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #3f3f46',
              backgroundColor: '#18181b',
              color: selectedId ? '#a1a1aa' : '#52525b',
              cursor: selectedId ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            title="Send to back"
          >
            ⬇ Layer
          </button>
          <button
            onClick={() => moveLayer('front')}
            disabled={!selectedId}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #3f3f46',
              backgroundColor: '#18181b',
              color: selectedId ? '#a1a1aa' : '#52525b',
              cursor: selectedId ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            title="Bring to front"
          >
            ⬆ Layer
          </button>
        </div>
        
        {/* About / Info */}
        <button
          onClick={() => setShowInfoModal(true)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: '#18181b',
            color: '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          ℹ️ Info
        </button>

        {/* Tutorial */}
        <button
          onClick={() => setShowTutorial(true)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: '#18181b',
            color: '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          ❓ Tutorial
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: '#18181b',
            color: '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '12px',
            fontWeight: '600'
          }}
          title="Toggle dark/light"
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
        </div>

        {/* PANEL BUTTON (fixed in original spot) */}
        <button
          onClick={() => setShowHistoryPanel(v => !v)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: showHistoryPanel ? '#3b82f6' : '#18181b',
            color: showHistoryPanel ? '#fff' : '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '12px',
            fontWeight: '600'
          }}
          title="Show history & snapshots"
        >
          📜 Panel
        </button>

        {/* Collapse Toggle for LEFT HALF */}
        <button
          onClick={() => setControlsCollapsed(v => !v)}
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: controlsCollapsed ? '#3b82f6' : '#18181b',
            color: controlsCollapsed ? '#fff' : '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '12px',
            fontWeight: '600'
          }}
          title={controlsCollapsed ? 'Expand left controls' : 'Collapse left controls'}
        >
          {controlsCollapsed ? '⮞' : '⮜'}
        </button>

        {/* RIGHT HALF (always visible): Tags + Tools */}
        {selectedId && elements.find(el => el.id === selectedId)?.type === 'pin' && (
          <button
            onClick={() => setShowTagModal(true)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #3f3f46',
              backgroundColor: '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '12px',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
            title="Manage Tags"
          >
            🏷️ Tags
          </button>
        )}
        
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '10px', padding: '6px', boxShadow: '8px 8px 18px rgba(0,0,0,0.28), -6px -6px 16px rgba(255,255,255,0.04)' }}>
        {tools.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => {
              setTool(id);
              if (id !== 'select') setSelectedId(null);
            }}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer',
              backgroundColor: tool === id ? 'rgba(59,130,246,0.18)' : 'transparent',
              color: tool === id ? '#fff' : 'var(--panel-text)',
              transition: 'all 0.2s',
              boxShadow: '6px 6px 12px rgba(0,0,0,0.25), -6px -6px 12px rgba(255,255,255,0.05)'
            }}
            onMouseEnter={(e) => {
              if (tool !== id) {
                e.target.style.backgroundColor = '#27272a';
                e.target.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (tool !== id) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#a1a1aa';
              }
            }}
            title={label}
          >
            <Icon size={18} />
          </button>
        ))}
        </div>
      </div>
      
      {/* Eraser Controls */}
      {tool === 'eraser' && (
        <div style={{ position: 'fixed', top: '70px', left: '16px', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '240px', backdropFilter: 'blur(14px)', boxShadow: '10px 14px 30px rgba(0,0,0,0.32)' }}>
          <div style={{ color: '#d4d4d8', fontSize: '12px', fontWeight: '700' }}>Eraser Settings</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: '#a1a1aa', fontSize: '12px' }}>Mode</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'point', label: 'Point', desc: 'Click to delete' },
                { id: 'brush', label: 'Brush', desc: 'Drag to erase' },
                { id: 'shape', label: 'Area', desc: 'Drag rectangle' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setEraserMode(mode.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid var(--panel-border)',
                    backgroundColor: eraserMode === mode.id ? '#ef4444' : 'transparent',
                    color: eraserMode === mode.id ? '#fff' : 'var(--panel-text)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  title={mode.desc}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          
          {(eraserMode === 'brush' || eraserMode === 'shape') && (
            <label style={{ color: '#a1a1aa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ minWidth: '70px' }}>Size</span>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={eraserSize}
                onChange={(e) => setEraserSize(parseInt(e.target.value, 10))}
                style={{ flex: 1 }}
              />
              <span style={{ width: '42px', textAlign: 'right', color: '#d4d4d8' }}>{eraserSize}px</span>
            </label>
          )}
        </div>
      )}
      
      {/* Color & Stroke Picker for Freehand Tool */}
      {tool !== 'select' && tool !== 'eraser' && tool !== 'pan' && (
        <div style={{ position: 'fixed', top: '70px', left: '16px', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '220px', backdropFilter: 'blur(14px)', boxShadow: '10px 14px 30px rgba(0,0,0,0.32)' }}>
          <div style={{ color: '#d4d4d8', fontSize: '12px', fontWeight: '700' }}>Appearance</div>
          <label style={{ color: '#a1a1aa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ minWidth: '70px' }}>Color</span>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              style={{ width: '48px', height: '28px', border: '1px solid #3f3f46', borderRadius: '6px', background: '#0f0f10', cursor: 'pointer' }}
            />
            <span style={{ color: '#71717a', fontSize: '11px' }}>{strokeColor.toUpperCase()}</span>
          </label>
          <label style={{ color: '#a1a1aa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ minWidth: '70px' }}>Opacity</span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={strokeOpacity}
              onChange={(e) => setStrokeOpacity(parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ width: '44px', textAlign: 'right', color: '#d4d4d8' }}>{Math.round(strokeOpacity * 100)}%</span>
          </label>
          <label style={{ color: '#a1a1aa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ minWidth: '70px' }}>Stroke</span>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
              style={{ flex: 1 }}
            />
            <span style={{ width: '32px', textAlign: 'right', color: '#d4d4d8' }}>{strokeWidth}px</span>
          </label>
        </div>
      )}
      
      {/* Quick Guide - retractable with smooth collapse */}
      <div style={{ position: 'fixed', bottom: '16px', left: '16px', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '10px 12px', color: 'var(--panel-text)', fontSize: '12px', maxWidth: '320px', backdropFilter: 'blur(12px)', boxShadow: '10px 14px 30px rgba(0,0,0,0.32)', overflow: 'hidden', transition: 'max-height 0.25s ease, opacity 0.25s ease', maxHeight: showQuickGuide ? '520px' : '52px', opacity: showQuickGuide ? 1 : 0.85 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontWeight: '600', color: '#d4d4d8' }}>Quick Guide</div>
          <button
            onClick={() => setShowQuickGuide(v => !v)}
            style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '14px' }}
            title={showQuickGuide ? 'Collapse' : 'Expand'}
          >
            {showQuickGuide ? 'Collapse' : 'Expand'}
          </button>
        </div>
        <div style={{ maxHeight: showQuickGuide ? '420px' : '0px', overflow: 'hidden', transition: 'max-height 0.25s ease, opacity 0.25s ease', opacity: showQuickGuide ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            <div><span style={{ color: '#71717a' }}>•</span> <kbd style={{ padding: '2px 4px', backgroundColor: '#27272a', borderRadius: '3px', color: '#d4d4d8' }}>Shift</kbd> + Drag to pan</div>
            <div><span style={{ color: '#71717a' }}>•</span> Arrow keys / WASD to pan</div>
            <div><span style={{ color: '#71717a' }}>•</span> <kbd style={{ padding: '2px 4px', backgroundColor: '#27272a', borderRadius: '3px', color: '#d4d4d8' }}>Scroll</kbd> to zoom</div>
            <div><span style={{ color: '#71717a' }}>•</span> <kbd style={{ padding: '2px 4px', backgroundColor: '#27272a', borderRadius: '3px', color: '#d4d4d8' }}>Ctrl+Z</kbd> to undo</div>
            <div><span style={{ color: '#71717a' }}>•</span> <kbd style={{ padding: '2px 4px', backgroundColor: '#27272a', borderRadius: '3px', color: '#d4d4d8' }}>Ctrl+S</kbd> save snapshot</div>
            <div><span style={{ color: '#71717a' }}>•</span> <kbd style={{ padding: '2px 4px', backgroundColor: '#27272a', borderRadius: '3px', color: '#d4d4d8' }}>Ctrl+E</kbd> export JSON</div>
            <div><span style={{ color: '#71717a' }}>•</span> Click eraser then click elements to delete</div>
            <div><span style={{ color: '#71717a' }}>•</span> Click text/pin to edit</div>
            <div><span style={{ color: '#71717a' }}>•</span> Click image placeholder to upload</div>
            <div><span style={{ color: '#71717a' }}>•</span> <kbd style={{ padding: '2px 4px', backgroundColor: '#27272a', borderRadius: '3px', color: '#d4d4d8' }}>Esc</kbd> to finish editing</div>
          </div>
          {allTags.length > 0 && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #3f3f46' }}>
              <div style={{ fontWeight: '600', color: '#d4d4d8', marginBottom: '8px' }}>Filter by Tag</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                <button
                  onClick={() => setTagFilter('')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #3f3f46',
                    backgroundColor: !tagFilter ? '#3b82f6' : 'transparent',
                    color: !tagFilter ? '#fff' : '#a1a1aa',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  All
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tag)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #3f3f46',
                      backgroundColor: tagFilter === tag ? '#3b82f6' : 'transparent',
                      color: tagFilter === tag ? '#fff' : '#a1a1aa',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Undo/Redo timeline */}
      <div style={{ position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', padding: '10px 14px', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '999px', backdropFilter: 'blur(12px)', boxShadow: '10px 14px 30px rgba(0,0,0,0.32)' }}>
        {history.slice(Math.max(0, history.length - 12)).map((_, idx, arr) => {
          const active = historyIndex === history.length - arr.length + idx;
          return (
            <div key={idx} style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: active ? '#3b82f6' : 'var(--panel-border)', border: active ? '1px solid #60a5fa' : '1px solid var(--panel-border)', boxShadow: active ? '0 0 0 4px rgba(59,130,246,0.18)' : 'inset 2px 2px 4px rgba(0,0,0,0.2)' }} />
          );
        })}
      </div>

      {/* Zoom Controls - Right Bottom */}
      <div style={{ position: 'fixed', bottom: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '10px', backdropFilter: 'blur(12px)', boxShadow: '10px 14px 30px rgba(0,0,0,0.32)' }}>
        <button
          onClick={() => {
            const newZoom = Math.max(0.1, camera.zoom - 0.1);
            setCamera({ ...camera, zoom: newZoom });
          }}
          style={{ padding: '6px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', color: '#a1a1aa', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#27272a'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
          title="Zoom out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        
        <button
          onClick={() => {
            setCamera({ ...camera, zoom: 1 });
          }}
          style={{ padding: '4px 12px', fontSize: '14px', fontFamily: 'monospace', color: '#d4d4d8', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', minWidth: '60px' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#27272a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          title="Reset zoom"
        >
          {Math.round(camera.zoom * 100)}%
        </button>
        
        <button
          onClick={() => {
            const newZoom = Math.min(3, camera.zoom + 0.1);
            setCamera({ ...camera, zoom: newZoom });
          }}
          style={{ padding: '6px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', color: '#a1a1aa', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#27272a'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
          title="Zoom in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
      </div>

      {/* Snapshot Modal */}
      {showSnapshotModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#d4d4d8', fontSize: '20px' }}>Board Snapshots</h2>
              <button
                onClick={() => setShowSnapshotModal(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '24px', padding: '0', width: '32px', height: '32px' }}
              >
                ×
              </button>
            </div>
            
            {/* Save New Snapshot */}
            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #27272a' }}>
              <div style={{ color: '#d4d4d8', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Save Current Board</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  placeholder="Enter snapshot name..."
                  style={{ flex: 1, padding: '8px 12px', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#d4d4d8', fontSize: '14px' }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && snapshotName.trim()) {
                      saveSnapshot();
                    }
                  }}
                />
                <button
                  onClick={saveSnapshot}
                  disabled={!snapshotName.trim()}
                  style={{ padding: '8px 16px', backgroundColor: snapshotName.trim() ? '#3b82f6' : '#27272a', color: '#fff', border: 'none', borderRadius: '6px', cursor: snapshotName.trim() ? 'pointer' : 'not-allowed', fontWeight: '500', fontSize: '14px' }}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Snapshots List */}
            <div style={{ color: '#d4d4d8', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
              Saved Snapshots ({snapshots.length})
            </div>
            {snapshots.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#71717a', fontSize: '14px' }}>
                No snapshots yet. Save your first snapshot above!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...snapshots].reverse().map((snapshot) => (
                  <div key={snapshot.id} style={{ padding: '12px', backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#d4d4d8', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                          {snapshot.name}
                        </div>
                        <div style={{ color: '#71717a', fontSize: '12px' }}>
                          {new Date(snapshot.timestamp).toLocaleString()}
                        </div>
                        <div style={{ color: '#a1a1aa', fontSize: '12px', marginTop: '4px' }}>
                          {snapshot.elements.length} element{snapshot.elements.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            loadSnapshot(snapshot);
                            setShowSnapshotModal(false);
                          }}
                          style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteSnapshot(snapshot.id)}
                          style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tag Modal for Pins */}
      {showTagModal && selectedId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#d4d4d8', fontSize: '18px' }}>Pin Tags</h2>
              <button
                onClick={() => setShowTagModal(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '24px', padding: '0', width: '32px', height: '32px' }}
              >
                ×
              </button>
            </div>
            
            {/* Add Tag Input */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#d4d4d8', marginBottom: '8px', fontSize: '14px' }}>Add Tag</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  id="tagInput"
                  placeholder="Enter tag name..."
                  style={{ flex: 1, padding: '8px 12px', backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#d4d4d8', fontSize: '14px' }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target;
                      const tag = input.value.trim();
                      if (tag) {
                        const element = elements.find(el => el.id === selectedId);
                        if (element && element.type === 'pin') {
                          const updatedElements = elements.map(el => {
                            if (el.id === selectedId) {
                              const tags = el.tags || [];
                              if (!tags.includes(tag)) {
                                return { ...el, tags: [...tags, tag] };
                              }
                            }
                            return el;
                          });
                          setElements(updatedElements);
                          input.value = '';
                        }
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('tagInput');
                    const tag = input.value.trim();
                    if (tag) {
                      const element = elements.find(el => el.id === selectedId);
                      if (element && element.type === 'pin') {
                        const updatedElements = elements.map(el => {
                          if (el.id === selectedId) {
                            const tags = el.tags || [];
                            if (!tags.includes(tag)) {
                              return { ...el, tags: [...tags, tag] };
                            }
                          }
                          return el;
                        });
                        setElements(updatedElements);
                        input.value = '';
                      }
                    }
                  }}
                  style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Current Tags */}
            <div>
              <div style={{ color: '#d4d4d8', marginBottom: '8px', fontSize: '14px' }}>Current Tags</div>
              {(() => {
                const element = elements.find(el => el.id === selectedId);
                const tags = element?.tags || [];
                if (tags.length === 0) {
                  return <div style={{ padding: '16px', textAlign: 'center', color: '#71717a', fontSize: '14px', backgroundColor: '#09090b', borderRadius: '6px', border: '1px solid #27272a' }}>No tags yet</div>;
                }
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {tags.map(tag => (
                      <div key={tag} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', borderRadius: '6px', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: stringToColor(tag) }}>{tag}</span>
                        <button
                          onClick={() => {
                            const updatedElements = elements.map(el => {
                              if (el.id === selectedId) {
                                return { ...el, tags: (el.tags || []).filter(t => t !== tag) };
                              }
                              return el;
                            });
                            setElements(updatedElements);
                          }}
                          style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0', fontSize: '16px', lineHeight: '1' }}
                        >
                          ×
                        </button>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => {
                              const updatedElements = elements.map(el => {
                                if (el.id === selectedId) {
                                  const tagsArr = el.tags || [];
                                  const idx = tagsArr.indexOf(tag);
                                  if (idx > 0) {
                                    const next = [...tagsArr];
                                    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                    return { ...el, tags: next };
                                  }
                                }
                                return el;
                              });
                              setElements(updatedElements);
                            }}
                            style={{ backgroundColor: 'transparent', border: '1px solid #ffffff33', color: '#fff', cursor: 'pointer', padding: '0 6px', borderRadius: '4px', fontSize: '10px' }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => {
                              const updatedElements = elements.map(el => {
                                if (el.id === selectedId) {
                                  const tagsArr = el.tags || [];
                                  const idx = tagsArr.indexOf(tag);
                                  if (idx >= 0 && idx < tagsArr.length - 1) {
                                    const next = [...tagsArr];
                                    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                                    return { ...el, tags: next };
                                  }
                                }
                                return el;
                              });
                              setElements(updatedElements);
                            }}
                            style={{ backgroundColor: 'transparent', border: '1px solid #ffffff33', color: '#fff', cursor: 'pointer', padding: '0 6px', borderRadius: '4px', fontSize: '10px' }}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}