'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import worldLow from '@amcharts/amcharts5-geodata/worldLow';

const DRAG_THRESHOLD = 8;

export type AmChartsGlobeHandle = {
  rotateHorizontal: (direction: 'left' | 'right') => void;
  selectCountry: (countryId: string, focus?: boolean) => void;
  clearSelection: () => void;
  getRotation: () => { x: number; y: number };
};

type CountrySelectionHandler = (countryId: string, countryName: string) => void;

export const AmChartsGlobe = forwardRef<
  AmChartsGlobeHandle,
  {
    autoRotate: boolean;
    reducedMotion: boolean;
    onSelect: CountrySelectionHandler;
    onDragStateChange: (dragging: boolean) => void;
    onReady: () => void;
    onError: (message: string) => void;
  }
>(function AmChartsGlobe(
  {
    autoRotate,
    reducedMotion,
    onSelect,
    onDragStateChange,
    onReady,
    onError,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<am5map.MapChart | null>(null);
  const polygonSeriesRef = useRef<am5map.MapPolygonSeries | null>(null);
  const selectedPolygonRef = useRef<am5map.MapPolygon | null>(null);
  const callbacksRef = useRef({ onSelect, onDragStateChange, onReady, onError });
  const reducedMotionRef = useRef(reducedMotion);

  useEffect(() => {
    callbacksRef.current = { onSelect, onDragStateChange, onReady, onError };
  }, [onDragStateChange, onError, onReady, onSelect]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  const setSelectedCountry = useCallback((countryId: string, focus = false) => {
    const chart = chartRef.current;
    const polygonSeries = polygonSeriesRef.current;
    if (!chart || !polygonSeries) return;

    const dataItem = polygonSeries.getDataItemById(countryId);
    const polygon = dataItem?.get('mapPolygon');
    if (!dataItem || !polygon) return;

    if (selectedPolygonRef.current && selectedPolygonRef.current !== polygon) {
      selectedPolygonRef.current.set('active', false);
    }
    polygon.set('active', true);
    selectedPolygonRef.current = polygon;

    if (focus) {
      const centroid = polygon.geoCentroid();
      const duration = reducedMotionRef.current ? 0 : 520;
      chart.animate({
        key: 'rotationX',
        to: -centroid.longitude,
        duration,
        easing: am5.ease.inOut(am5.ease.cubic),
      });
      chart.animate({
        key: 'rotationY',
        to: -centroid.latitude,
        duration,
        easing: am5.ease.inOut(am5.ease.cubic),
      });
    }
  }, []);

  useImperativeHandle(ref, () => ({
    rotateHorizontal(direction) {
      const chart = chartRef.current;
      if (!chart) return;
      const currentRotation = chart.get('rotationX', 0);
      chart.animate({
        key: 'rotationX',
        to: currentRotation + (direction === 'left' ? -30 : 30),
        duration: reducedMotion ? 0 : 480,
        easing: am5.ease.inOut(am5.ease.cubic),
      });
    },
    selectCountry(countryId, focus = false) {
      setSelectedCountry(countryId, focus);
    },
    clearSelection() {
      selectedPolygonRef.current?.set('active', false);
      selectedPolygonRef.current = null;
    },
    getRotation() {
      return {
        x: chartRef.current?.get('rotationX', 0) ?? 0,
        y: chartRef.current?.get('rotationY', 0) ?? 0,
      };
    },
  }), [reducedMotion, setSelectedCountry]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let root: am5.Root | null = null;
    try {
      root = am5.Root.new(container);
      root.setThemes([am5themes_Animated.new(root)]);

      const chart = root.container.children.push(
        am5map.MapChart.new(root, {
          projection: am5map.geoOrthographic(),
          panX: 'rotateX',
          panY: 'rotateY',
          wheelX: 'none',
          wheelY: 'none',
          pinchZoom: true,
          zoomLevel: 0.92,
          minZoomLevel: 0.92,
          maxZoomLevel: 1.65,
          rotationX: -12,
          rotationY: -10,
          paddingTop: 8,
          paddingRight: 8,
          paddingBottom: 8,
          paddingLeft: 8,
        }),
      );
      chartRef.current = chart;

      const oceanSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          affectsBounds: false,
        }),
      );
      oceanSeries.mapPolygons.template.setAll({
        fill: am5.color(0x197ec2),
        fillOpacity: 1,
        stroke: am5.color(0x75d9ff),
        strokeOpacity: 0.28,
        strokeWidth: 1.5,
        interactive: false,
      });
      oceanSeries.data.push({
        geometry: am5map.getGeoRectangle(90, 180, -90, -180),
      });

      const graticuleSeries = chart.series.push(
        am5map.GraticuleSeries.new(root, {
          step: 15,
        }),
      );
      graticuleSeries.mapLines.template.setAll({
        stroke: am5.color(0xbbeeff),
        strokeOpacity: 0.09,
        strokeWidth: 0.7,
      });

      const polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: worldLow,
          exclude: ['AQ'],
        }),
      );
      polygonSeriesRef.current = polygonSeries;

      const polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.setAll({
        fill: am5.color(0x65bd78),
        stroke: am5.color(0x164f48),
        strokeWidth: 0.8,
        strokeOpacity: 0.8,
        tooltipText: '{name}',
        tooltipPosition: 'pointer',
        interactive: true,
        focusable: true,
        role: 'button',
        ariaLabel: 'Explore {name}',
        cursorOverStyle: 'pointer',
      });
      polygonTemplate.states.create('hover', {
        fill: am5.color(0xa3e89a),
        stroke: am5.color(0xf2ffe9),
        strokeWidth: 1.25,
      });
      polygonTemplate.states.create('active', {
        fill: am5.color(0xffd65a),
        stroke: am5.color(0xfff2a6),
        strokeWidth: 2,
      });

      const tooltip = am5.Tooltip.new(root, {
        getFillFromSprite: false,
        getStrokeFromSprite: false,
        pointerOrientation: 'horizontal',
        dy: -8,
      });
      tooltip.set(
        'background',
        am5.RoundedRectangle.new(root, {
          fill: am5.color(0xfffbec),
          fillOpacity: 0.98,
          strokeOpacity: 0,
          cornerRadiusBL: 14,
          cornerRadiusBR: 14,
          cornerRadiusTL: 14,
          cornerRadiusTR: 14,
        }),
      );
      tooltip.label.setAll({
        fill: am5.color(0x10213d),
        fontSize: 14,
        fontWeight: '700',
        paddingTop: 8,
        paddingRight: 12,
        paddingBottom: 8,
        paddingLeft: 12,
      });
      polygonTemplate.set('tooltip', tooltip);

      let pointerStart: { x: number; y: number } | null = null;
      let pointerMoved = false;
      let lastDragAt = 0;

      chart.chartContainer.events.on('globalpointerdown', (event) => {
        pointerStart = { x: event.point.x, y: event.point.y };
        pointerMoved = false;
        callbacksRef.current.onDragStateChange(true);
      });
      chart.chartContainer.events.on('globalpointermove', (event) => {
        if (!pointerStart) return;
        if (
          Math.hypot(
            event.point.x - pointerStart.x,
            event.point.y - pointerStart.y,
          ) > DRAG_THRESHOLD
        ) {
          pointerMoved = true;
        }
      });
      chart.chartContainer.events.on('globalpointerup', () => {
        if (pointerMoved) lastDragAt = performance.now();
        pointerStart = null;
        callbacksRef.current.onDragStateChange(false);
      });

      polygonTemplate.events.on('click', (event) => {
        if (pointerMoved || performance.now() - lastDragAt < 180) return;
        const dataItem = event.target.dataItem as
          | am5.DataItem<am5map.IMapPolygonSeriesDataItem>
          | undefined;
        const countryId = String(dataItem?.get('id') ?? '');
        const countryName = String(
          (dataItem?.dataContext as { name?: string } | undefined)?.name ?? '',
        );
        if (!countryId || !countryName) return;

        setSelectedCountry(countryId, true);
        callbacksRef.current.onSelect(countryId, countryName);
      });

      polygonSeries.events.on('datavalidated', () => {
        callbacksRef.current.onReady();
      });
    } catch (error) {
      callbacksRef.current.onError(
        error instanceof Error ? error.message : 'The globe could not be prepared.',
      );
    }

    return () => {
      chartRef.current = null;
      polygonSeriesRef.current = null;
      selectedPolygonRef.current = null;
      root?.dispose();
    };
  }, [setSelectedCountry]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !autoRotate || reducedMotion) return;

    const timer = window.setInterval(() => {
      const currentRotation = chart.get('rotationX', 0);
      chart.animate({
        key: 'rotationX',
        to: currentRotation - 2.2,
        duration: 1450,
        easing: am5.ease.linear,
      });
    }, 1500);

    return () => window.clearInterval(timer);
  }, [autoRotate, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full touch-none"
      role="application"
      aria-label="Interactive world globe. Drag to rotate or use the country selector below."
    />
  );
});
