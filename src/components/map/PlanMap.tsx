import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { lotCode } from "../../lib/money";
import type { Lot, Point } from "../../lib/types";
import { useHtmlImage } from "../../lib/useHtmlImage";

export type MapTool = "select" | "polyline" | "rect";

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
};

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
}: PlanMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 900, height: 640 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rectStart, setRectStart] = useState<Point | null>(null);
  const image = useHtmlImage(planUrl);

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

  const imageSize = useMemo(() => {
    if (!image) return { width: 1, height: 1, scale: 1 };
    const scale = Math.min(size.width / image.width, size.height / image.height);
    return { width: image.width, height: image.height, scale };
  }, [image, size]);

  const groupScale = imageSize.scale * zoom;

  function pointerToRel(event: KonvaEventObject<MouseEvent | TouchEvent>): Point | null {
    const stage = event.target.getStage();
    if (!stage || !image) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      x: (pointer.x - offset.x) / (image.width * groupScale),
      y: (pointer.y - offset.y) / (image.height * groupScale),
    };
  }

  function handleClick(event: KonvaEventObject<MouseEvent>) {
    if (mode !== "edit") return;
    const point = pointerToRel(event);
    if (!point) return;
    if (tool === "polyline") {
      onDraftPoints([...draftPoints, point]);
    }
  }

  function handleMouseDown(event: KonvaEventObject<MouseEvent>) {
    if (mode !== "edit" || tool !== "rect") return;
    const point = pointerToRel(event);
    if (point) setRectStart(point);
  }

  function handleMouseUp(event: KonvaEventObject<MouseEvent>) {
    if (mode !== "edit" || tool !== "rect" || !rectStart) return;
    const end = pointerToRel(event);
    setRectStart(null);
    if (!end) return;
    const points: Point[] = [
      { x: rectStart.x, y: rectStart.y },
      { x: end.x, y: rectStart.y },
      { x: end.x, y: end.y },
      { x: rectStart.x, y: end.y },
    ];
    if (Math.abs(end.x - rectStart.x) > 0.002 && Math.abs(end.y - rectStart.y) > 0.002) {
      onCreatePolygon?.(points);
    }
  }

  function handleWheel(event: KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();
    const next = event.evt.deltaY > 0 ? zoom * 0.9 : zoom * 1.1;
    setZoom(Math.min(6, Math.max(0.4, next)));
  }

  function handleDragEnd(event: KonvaEventObject<MouseEvent>) {
    setOffset({ x: event.target.x(), y: event.target.y() });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-sm">
        <button type="button" className="rounded-full border px-3 py-1" onClick={() => setZoom((value) => Math.max(0.4, value * 0.85))}>
          Zoom -
        </button>
        <button type="button" className="rounded-full border px-3 py-1" onClick={() => setZoom((value) => Math.min(6, value * 1.15))}>
          Zoom +
        </button>
        <button
          type="button"
          className="rounded-full border px-3 py-1"
          onClick={() => {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
          }}
        >
          Reset zoom
        </button>
      </div>
      <div ref={containerRef} className="h-[70vh] overflow-hidden rounded-xl border bg-slate-100">
        <Stage
          width={size.width}
          height={size.height}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(event) => event.evt.preventDefault()}
        >
          <Layer>
            <Group x={offset.x} y={offset.y} scaleX={groupScale} scaleY={groupScale} draggable={tool === "select"} onDragEnd={handleDragEnd}>
              {image && <KonvaImage image={image} width={image.width} height={image.height} listening={false} />}
              {lots.map((lot) => {
                if (!lot.polygon || lot.polygon.length < 3) return null;
                const selected = selectedIds.includes(lot.id);
                const fill = lot.status === "vendido" ? "rgba(220,38,38,0.45)" : "rgba(34,197,94,0.42)";
                const stroke = selected ? "#ca8a04" : lot.status === "vendido" ? "#991b1b" : "#15803d";
                const center = centroid(lot.polygon);
                return (
                  <Group key={lot.id}>
                    <Line
                      points={toFlat(lot.polygon, image?.width || 1, image?.height || 1)}
                      closed
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={selected ? 4 : 2}
                      onClick={(event) => {
                        event.cancelBubble = true;
                        if (lot.status === "vendido" && mode === "view") return;
                        onSelect(lot, event.evt.ctrlKey || event.evt.metaKey);
                      }}
                      onContextMenu={(event) => {
                        event.evt.preventDefault();
                        if (mode === "edit") onRequestEdit?.(lot);
                      }}
                    />
                    <Text
                      x={center.x * (image?.width || 1) - 18}
                      y={center.y * (image?.height || 1) - 8}
                      text={lotCode(lot.manzana, lot.numero)}
                      fontSize={14}
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
                    points={toFlat(draftPoints, image?.width || 1, image?.height || 1)}
                    stroke="#0f2744"
                    strokeWidth={2}
                  />
                  {draftPoints.map((point, index) => (
                    <Circle
                      key={index}
                      x={point.x * (image?.width || 1)}
                      y={point.y * (image?.height || 1)}
                      radius={4}
                      fill="#c6a04a"
                    />
                  ))}
                </>
              )}
              {rectStart && <Rect x={0} y={0} width={0} height={0} />}
            </Group>
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
