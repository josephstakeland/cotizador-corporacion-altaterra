import { useEffect, useRef, useState } from "react";
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { lotCode, money } from "../../lib/money";
import { lotFill, lotStroke } from "../../lib/plan-style";
import type { Lot, Point } from "../../lib/types";
import { useHtmlImage } from "../../lib/useHtmlImage";

export type MapTool = "select" | "polyline" | "rect" | "reshape";

type PlanMapProps = {
  planUrl: string;
  lots: Lot[];
  tool: MapTool;
  mode: "view" | "edit";
  selectedIds: string[];
  draftPoints: Point[];
  onDraftPoints: (points: Point[]) => void;
  onSelect: (lot: Lot, additive: boolean) => void;
  onCreatePolygon?: (points: Point[]) => void;
  onRequestEdit?: (lot: Lot) => void;
  reshapeLotId?: string | null;
  containerClassName?: string;
  onDownload?: () => void;
  downloadBusy?: boolean;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function projectOnSegment(point: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) return a;
  const t = Math.min(1, Math.max(0, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len2));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

function nearestEdge(points: Point[], point: Point) {
  let best = { index: 1, dist: Infinity, point };
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const projected = projectOnSegment(point, a, b);
    const dist = Math.hypot(point.x - projected.x, point.y - projected.y);
    if (dist < best.dist) best = { index: i + 1, dist, point: projected };
  }
  return best;
}

function centroid(points: Point[]): Point {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function toFlat(points: Point[], width: number, height: number): number[] {
  return points.flatMap((point) => [point.x * width, point.y * height]);
}

export function PlanMap({
  planUrl,
  lots,
  tool,
  mode,
  selectedIds,
  draftPoints,
  onDraftPoints,
  onSelect,
  onCreatePolygon,
  onRequestEdit,
  reshapeLotId,
  containerClassName,
  onDownload,
  downloadBusy,
}: PlanMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spaceRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef({ active: false, x: 0, y: 0 });
  const lastPinch = useRef(0);
  const lastMid = useRef<{ x: number; y: number } | null>(null);
  const gestureRef = useRef<{ x: number; y: number; moved: boolean; kind: "pan" | "point" | "rect"; point: Point | null } | null>(null);
  const rectStartRef = useRef<Point | null>(null);
  const lastTouchRef = useRef(0);
  const vertexDragRef = useRef(false);
  const draftRef = useRef(draftPoints);
  draftRef.current = draftPoints;
  const reshaping = tool === "reshape" || Boolean(reshapeLotId);
  const [size, setSize] = useState({ width: 900, height: 640 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [spaceDown, setSpaceDown] = useState(false);
  const [rectStart, setRectStart] = useState<Point | null>(null);
  const [rectCurrent, setRectCurrent] = useState<Point | null>(null);
  const [hover, setHover] = useState<{ lot: Lot; x: number; y: number } | null>(null);
  const image = useHtmlImage(planUrl);

  offsetRef.current = offset;
  zoomRef.current = zoom;

  const fitScale = image ? Math.min(size.width / image.width, size.height / image.height) : 1;
  const groupScale = fitScale * zoom;
  const imgW = image?.width || 1;
  const imgH = image?.height || 1;

  function centered(nextZoom = 1) {
    if (!image || size.width < 10) return { x: 0, y: 0 };
    const scale = Math.min(size.width / image.width, size.height / image.height) * nextZoom;
    return {
      x: (size.width - image.width * scale) / 2,
      y: (size.height - image.height * scale) / 2,
    };
  }

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      setSize({ width: node.clientWidth, height: node.clientHeight });
    });
    observer.observe(node);
    setSize({ width: node.clientWidth, height: node.clientHeight });
    return () => observer.disconnect();
  }, []);

  const didCenter = useRef(false);

  useEffect(() => {
    didCenter.current = false;
  }, [planUrl]);

  useEffect(() => {
    if (!image || size.width < 10 || size.height < 10 || didCenter.current) return;
    const next = centered(1);
    didCenter.current = true;
    setZoom(1);
    setOffset(next);
    offsetRef.current = next;
  }, [image, size.width, size.height]);

  useEffect(() => {
    function typing(target: EventTarget | null) {
      const tag = (target as HTMLElement | null)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || typing(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      spaceRef.current = true;
      setSpaceDown(true);
      setRectStart(null);
      setRectCurrent(null);
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.code !== "Space") return;
      event.preventDefault();
      spaceRef.current = false;
      setSpaceDown(false);
      panRef.current.active = false;
    }
    function onBlur() {
      spaceRef.current = false;
      setSpaceDown(false);
      panRef.current.active = false;
    }
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  function stagePoint(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    const stage = event.target.getStage();
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (pointer) return pointer;
    if (!("changedTouches" in event.evt)) return null;
    const touch = event.evt.changedTouches[0] || event.evt.touches[0];
    if (!touch) return null;
    const box = stage.container().getBoundingClientRect();
    return { x: touch.clientX - box.left, y: touch.clientY - box.top };
  }

  function pointerToRel(event: KonvaEventObject<MouseEvent | TouchEvent>): Point | null {
    if (!image) return null;
    const pointer = stagePoint(event);
    if (!pointer) return null;
    const current = offsetRef.current;
    const scale = fitScale * zoomRef.current;
    return {
      x: (pointer.x - current.x) / (image.width * scale),
      y: (pointer.y - current.y) / (image.height * scale),
    };
  }

  function lotUnder(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    let node = event.target as { name: () => string; getAttr: (key: string) => unknown; getParent: () => typeof node | null } | null;
    while (node) {
      if (node.name() === "lot") {
        const id = String(node.getAttr("id") || "");
        return lots.find((lot) => lot.id === id) || null;
      }
      node = node.getParent();
    }
    return null;
  }

  function wantPan(event: MouseEvent | TouchEvent) {
    if (spaceRef.current) return true;
    if ("button" in event && event.button === 1) return true;
    if (mode === "edit" && tool === "select" && !reshaping) return true;
    return false;
  }

  function startPan(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    panRef.current = { active: true, x: pointer.x, y: pointer.y };
  }

  function movePan(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    if (!panRef.current.active) return;
    const pointer = stagePoint(event);
    if (!pointer) return;
    const dx = pointer.x - panRef.current.x;
    const dy = pointer.y - panRef.current.y;
    panRef.current = { active: true, x: pointer.x, y: pointer.y };
    const next = { x: offsetRef.current.x + dx, y: offsetRef.current.y + dy };
    offsetRef.current = next;
    setOffset(next);
  }

  function markStoredPoint(point: Point) {
    if (mode !== "edit") return;
    if (reshaping && draftRef.current.length >= 3) {
      const edge = nearestEdge(draftRef.current, point);
      const threshold = 18 / (image ? image.width * fitScale * zoomRef.current : 1);
      if (edge.dist <= threshold) {
        const next = [...draftRef.current];
        next.splice(edge.index, 0, edge.point);
        onDraftPoints(next);
      }
      return;
    }
    if (tool !== "polyline") return;
    onDraftPoints([...draftRef.current, point]);
  }

  function markDraw(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    if (vertexDragRef.current || panRef.current.active || spaceRef.current) return;
    if (event.target.name() === "vertex" || event.target.name() === "lot") return;
    const point = pointerToRel(event);
    if (!point) return;
    markStoredPoint(point);
  }

  function chooseLot(lot: Lot, additive = false) {
    if (lot.status === "vendido" && mode === "view") return;
    onSelect(lot, additive);
  }

  function beginRect(point: Point) {
    rectStartRef.current = point;
    setRectStart(point);
    setRectCurrent(point);
  }

  function commitRect(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    const start = rectStartRef.current;
    rectStartRef.current = null;
    setRectStart(null);
    setRectCurrent(null);
    if (mode !== "edit" || tool !== "rect" || !start) return;
    const end = pointerToRel(event);
    if (!end) return;
    const points: Point[] = [
      { x: start.x, y: start.y },
      { x: end.x, y: start.y },
      { x: end.x, y: end.y },
      { x: start.x, y: end.y },
    ];
    if (Math.abs(end.x - start.x) > 0.002 && Math.abs(end.y - start.y) > 0.002) {
      onCreatePolygon?.(points);
    }
  }

  function handleTouchStart(event: KonvaEventObject<TouchEvent>) {
    lastTouchRef.current = Date.now();
    if (event.evt.touches.length > 1) {
      gestureRef.current = null;
      panRef.current.active = false;
      rectStartRef.current = null;
      setRectStart(null);
      setRectCurrent(null);
      return;
    }
    if (event.target.name() === "vertex") return;
    event.evt.preventDefault();
    const pointer = stagePoint(event);
    if (!pointer) return;
    const kind = mode === "edit" && tool === "rect" ? "rect" : mode === "edit" && (tool === "polyline" || reshaping) ? "point" : "pan";
    gestureRef.current = { x: pointer.x, y: pointer.y, moved: false, kind, point: pointerToRel(event) };
    if (kind === "rect") {
      const point = pointerToRel(event);
      if (point) beginRect(point);
    }
  }

  function handleTouchMove(event: KonvaEventObject<TouchEvent>) {
    const touches = event.evt.touches;
    if (touches.length === 2) {
      event.evt.preventDefault();
      gestureRef.current = null;
      panRef.current.active = false;
      const dist = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
      const box = event.target.getStage()?.container().getBoundingClientRect();
      const mid = {
        x: (touches[0].clientX + touches[1].clientX) / 2 - (box?.left || 0),
        y: (touches[0].clientY + touches[1].clientY) / 2 - (box?.top || 0),
      };
      if (lastPinch.current) {
        setZoom((value) => Math.min(6, Math.max(0.4, value * (dist / lastPinch.current))));
      }
      if (lastMid.current) {
        const next = {
          x: offsetRef.current.x + (mid.x - lastMid.current.x),
          y: offsetRef.current.y + (mid.y - lastMid.current.y),
        };
        offsetRef.current = next;
        setOffset(next);
      }
      lastPinch.current = dist;
      lastMid.current = mid;
      return;
    }
    if (touches.length !== 1) return;
    const gesture = gestureRef.current;
    if (!gesture) return;
    const pointer = stagePoint(event);
    if (!pointer) return;
    const slop = gesture.kind === "point" ? 28 : 12;
    if (Math.hypot(pointer.x - gesture.x, pointer.y - gesture.y) > slop) gesture.moved = true;
    if (gesture.kind === "pan" && gesture.moved) {
      event.evt.preventDefault();
      if (!panRef.current.active) panRef.current = { active: true, x: pointer.x, y: pointer.y };
      movePan(event);
      return;
    }
    if (gesture.kind === "rect" && gesture.moved) {
      event.evt.preventDefault();
      const point = pointerToRel(event);
      if (point) setRectCurrent(point);
    }
  }

  function handleTouchEnd(event: KonvaEventObject<TouchEvent>) {
    lastPinch.current = 0;
    lastMid.current = null;
    const gesture = gestureRef.current;
    gestureRef.current = null;
    const dragged = panRef.current.active || Boolean(gesture?.moved);
    panRef.current.active = false;
    if (!gesture) return;
    if (gesture.kind === "rect") {
      if (gesture.moved) commitRect(event);
      else {
        rectStartRef.current = null;
        setRectStart(null);
        setRectCurrent(null);
      }
      return;
    }
    if (dragged) return;
    if (gesture.kind === "point" && gesture.point) {
      markStoredPoint(gesture.point);
      return;
    }
    const lot = lotUnder(event);
    if (lot) chooseLot(lot);
  }

  function handleClick(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    if (Date.now() - lastTouchRef.current < 800) return;
    if (event.evt.type === "touchend" || event.evt.type === "touchstart") return;
    markDraw(event);
  }

  function handleMouseDown(event: KonvaEventObject<MouseEvent>) {
    if (Date.now() - lastTouchRef.current < 800) return;
    containerRef.current?.focus();
    if (event.target.name() === "vertex") return;
    if (wantPan(event.evt)) {
      event.evt.preventDefault();
      startPan(event);
      return;
    }
    if (mode !== "edit" || tool !== "rect") return;
    const point = pointerToRel(event);
    if (!point) return;
    beginRect(point);
  }

  function handleMouseMove(event: KonvaEventObject<MouseEvent>) {
    if (Date.now() - lastTouchRef.current < 800) return;
    if (panRef.current.active) {
      event.evt.preventDefault();
      movePan(event);
      return;
    }
    if (!rectStart || spaceRef.current || tool !== "rect") return;
    const point = pointerToRel(event);
    if (point) setRectCurrent(point);
  }

  function handleMouseUp(event: KonvaEventObject<MouseEvent>) {
    if (Date.now() - lastTouchRef.current < 800) return;
    if (panRef.current.active) {
      panRef.current.active = false;
      rectStartRef.current = null;
      setRectStart(null);
      setRectCurrent(null);
      return;
    }
    commitRect(event);
  }

  function handleWheel(event: KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    const oldScale = fitScale * zoomRef.current;
    const nextZoom = Math.min(6, Math.max(0.4, event.evt.deltaY > 0 ? zoomRef.current * 0.9 : zoomRef.current * 1.1));
    const newScale = fitScale * nextZoom;
    if (pointer) {
      const world = {
        x: (pointer.x - offsetRef.current.x) / oldScale,
        y: (pointer.y - offsetRef.current.y) / oldScale,
      };
      const nextOffset = { x: pointer.x - world.x * newScale, y: pointer.y - world.y * newScale };
      offsetRef.current = nextOffset;
      setOffset(nextOffset);
    }
    setZoom(nextZoom);
  }

  const preview = rectStart && rectCurrent
    ? {
        x: Math.min(rectStart.x, rectCurrent.x) * imgW,
        y: Math.min(rectStart.y, rectCurrent.y) * imgH,
        width: Math.abs(rectCurrent.x - rectStart.x) * imgW,
        height: Math.abs(rectCurrent.y - rectStart.y) * imgH,
      }
    : null;

  const panning = spaceDown;
  const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const hint =
    mode === "view"
      ? coarse
        ? "Toca un lote para marcarlo. Arrastra para mover el plano."
        : "Puntero sobre un lote para ver datos. Espacio + arrastrar para mover."
      : reshaping
        ? coarse
          ? "Arrastra los puntos dorados. Toca un lado para agregar un punto."
          : "Arrastra los puntos. Clic en un lado para agregar. Doble clic en un punto para quitarlo."
        : tool === "rect"
          ? coarse
            ? "Arrastra el dedo para dibujar el rectángulo. Dos dedos para mover."
            : "Arrastra para dibujar. Mantén Espacio para mover el plano."
          : tool === "polyline"
            ? coarse
              ? "Toca el plano para marcar puntos. Dos dedos para mover y hacer zoom."
              : "Clic para marcar puntos. Mantén Espacio y arrastra para mover."
            : coarse
              ? "Toca un lote para elegirlo. Arrastra para mover el plano."
              : "Arrastra para mover el plano";

  return (
    <div className="space-y-2">
      <div className="no-print flex flex-wrap items-center gap-2 text-sm">
        <button type="button" className="app-btn min-h-11 border border-white/15 px-4" onClick={() => setZoom((value) => Math.max(0.4, value * 0.85))}>
          Zoom -
        </button>
        <button type="button" className="app-btn min-h-11 border border-white/15 px-4" onClick={() => setZoom((value) => Math.min(6, value * 1.15))}>
          Zoom +
        </button>
        <button
          type="button"
          className="app-btn min-h-11 border border-white/15 px-4"
          onClick={() => {
            const next = centered(1);
            setZoom(1);
            setOffset(next);
            offsetRef.current = next;
          }}
        >
          Reset zoom
        </button>
        {onDownload ? (
          <button
            type="button"
            className="app-btn min-h-11 border border-white/15 bg-white px-4 text-brand-navy"
            disabled={downloadBusy}
            onClick={onDownload}
          >
            {downloadBusy ? "Generando PDF..." : "Descargar PDF"}
          </button>
        ) : null}
        <span className="text-xs text-[var(--muted)]">{hint}</span>
      </div>
      <div
        ref={containerRef}
        tabIndex={0}
        className={`relative ${containerClassName || "aspect-[1.41/1] max-h-[72vh] min-h-[220px] w-full overflow-hidden rounded-xl border border-white/10 bg-slate-200"}`}
        style={{
          cursor: panning || panRef.current.active ? "grab" : hover ? "pointer" : tool === "rect" ? "crosshair" : reshaping ? "default" : "default",
          outline: "none",
          touchAction: "none",
        }}
      >
        <Stage
          width={size.width}
          height={size.height}
          pixelRatio={typeof window !== "undefined" ? Math.max(2, window.devicePixelRatio || 1) : 2}
          ref={(node) => {
            node?.container().style.setProperty("touch-action", "none");
          }}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            panRef.current.active = false;
            setRectStart(null);
            setRectCurrent(null);
            setHover(null);
          }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(event) => event.evt.preventDefault()}
        >
          <Layer>
            <Group x={offset.x} y={offset.y} scaleX={groupScale} scaleY={groupScale}>
              <Rect width={imgW} height={imgH} fill="#e8edf3" />
              {image && <KonvaImage image={image} width={image.width} height={image.height} />}
              {lots.map((lot) => {
                if (!lot.polygon || lot.polygon.length < 3) return null;
                if (reshapeLotId && lot.id === reshapeLotId) return null;
                const selected = selectedIds.includes(lot.id);
                const hovered = hover?.lot.id === lot.id;
                const fill = lotFill(lot.status, hovered);
                const stroke = lotStroke(lot, selected, hovered);
                const center = centroid(lot.polygon);
                return (
                  <Group key={lot.id}>
                    <Line
                      name="lot"
                      id={lot.id}
                      points={toFlat(lot.polygon, imgW, imgH)}
                      closed
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={(selected || hovered ? 5 : 2) / groupScale}
                      hitStrokeWidth={24 / groupScale}
                      onMouseEnter={(event) => {
                        const pointer = event.target.getStage()?.getPointerPosition();
                        if (!pointer) return;
                        setHover({ lot, x: pointer.x, y: pointer.y });
                      }}
                      onMouseMove={(event) => {
                        const pointer = event.target.getStage()?.getPointerPosition();
                        if (!pointer) return;
                        setHover({ lot, x: pointer.x, y: pointer.y });
                      }}
                      onMouseLeave={() => setHover(null)}
                      onClick={(event) => {
                        event.cancelBubble = true;
                        if (Date.now() - lastTouchRef.current < 800) return;
                        if (event.evt.type === "touchend" || event.evt.type === "touchstart") return;
                        if (spaceRef.current || panRef.current.active) return;
                        chooseLot(lot, event.evt.ctrlKey || event.evt.metaKey);
                      }}
                      onContextMenu={(event) => {
                        event.evt.preventDefault();
                        if (mode === "edit") onRequestEdit?.(lot);
                      }}
                    />
                    <Text
                      x={center.x * imgW - 18}
                      y={center.y * imgH - 8}
                      text={lotCode(lot.manzana, lot.numero)}
                      fontSize={Math.max(12, 16 / groupScale)}
                      fontStyle="bold"
                      fill="#111827"
                      listening={false}
                    />
                  </Group>
                );
              })}
              {draftPoints.length > 0 && (
                <>
                  <Line
                    points={toFlat(draftPoints, imgW, imgH)}
                    closed={reshaping}
                    fill={reshaping ? "rgba(212, 179, 106, 0.32)" : undefined}
                    stroke="#0f2744"
                    strokeWidth={3 / groupScale}
                  />
                  {draftPoints.map((point, index) => (
                    <Circle
                      key={index}
                      name="vertex"
                      x={point.x * imgW}
                      y={point.y * imgH}
                      radius={(coarse ? 18 : 10) / groupScale}
                      fill="#c6a04a"
                      stroke="#fff"
                      strokeWidth={2 / groupScale}
                      draggable={mode === "edit"}
                      dragBoundFunc={(pos) => ({
                        x: Math.min(imgW, Math.max(0, pos.x)),
                        y: Math.min(imgH, Math.max(0, pos.y)),
                      })}
                      onMouseDown={(event) => {
                        event.cancelBubble = true;
                      }}
                      onDragStart={(event) => {
                        event.cancelBubble = true;
                        vertexDragRef.current = true;
                        panRef.current.active = false;
                      }}
                      onDragMove={(event) => {
                        event.cancelBubble = true;
                        const next = draftRef.current.map((item, i) =>
                          i === index
                            ? { x: clamp01(event.target.x() / imgW), y: clamp01(event.target.y() / imgH) }
                            : item,
                        );
                        onDraftPoints(next);
                      }}
                      onDragEnd={() => {
                        window.setTimeout(() => {
                          vertexDragRef.current = false;
                        }, 0);
                      }}
                      onDblClick={(event) => {
                        event.cancelBubble = true;
                        if (draftRef.current.length <= 3) return;
                        onDraftPoints(draftRef.current.filter((_, i) => i !== index));
                      }}
                    />
                  ))}
                </>
              )}
              {preview && (
                <Rect
                  x={preview.x}
                  y={preview.y}
                  width={preview.width}
                  height={preview.height}
                  fill="rgba(212, 179, 106, 0.28)"
                  stroke="#0f2744"
                  strokeWidth={3 / groupScale}
                  dash={[10 / groupScale, 6 / groupScale]}
                  listening={false}
                />
              )}
            </Group>
          </Layer>
        </Stage>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 w-56 rounded-xl border border-white/20 bg-[#0f1728]/95 p-3 text-white shadow-2xl"
            style={{
              left: Math.min(hover.x + 14, Math.max(8, size.width - 232)),
              top: Math.min(hover.y + 14, Math.max(8, size.height - 168)),
            }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-base font-bold text-amber-300">{lotCode(hover.lot.manzana, hover.lot.numero)}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${hover.lot.status === "disponible" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                {hover.lot.status === "disponible" ? "Disponible" : "Vendido"}
              </span>
            </div>
            <p className="text-xs text-white/70">Manzana {hover.lot.manzana} · Lote {hover.lot.numero}</p>
            <div className="mt-2 space-y-1 text-xs">
              <p>Área / medidas: <span className="font-semibold text-white">{hover.lot.areaM2.toFixed(2)} m²</span></p>
              <p>Precio: <span className="font-semibold text-amber-200">{money(hover.lot.price)}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
