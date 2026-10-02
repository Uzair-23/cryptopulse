import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';

export default function CandleChart({ data = [], height = 440 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  // Helper to format and deduplicate OHLC data
  const formatCandles = (rawData) => {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];

    const sorted = [...rawData].sort((a, b) => a[0] - b[0]);
    const formatted = [];
    const seenTimes = new Set();

    for (const item of sorted) {
      if (!Array.isArray(item) || item.length < 5) continue;
      const time = Math.floor(item[0] / 1000); // Convert ms to seconds

      const open = Number(item[1]);
      const high = Number(item[2]);
      const low = Number(item[3]);
      const close = Number(item[4]);

      if (
        !seenTimes.has(time) &&
        Number.isFinite(open) &&
        Number.isFinite(high) &&
        Number.isFinite(low) &&
        Number.isFinite(close)
      ) {
        seenTimes.add(time);
        formatted.push({ time, open, high, low, close });
      }
    }

    return formatted;
  };

  // 1. Chart initialization and cleanup
  useEffect(() => {
    if (!containerRef.current) return;

    // Create chart instance matching design system dark tokens
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth || 600,
      height: height,
      layout: {
        background: { type: 'solid', color: '#11151C' }, // --surface
        textColor: '#8A94A3', // --text-muted
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: 11
      },
      grid: {
        vertLines: { color: '#242A35', style: 1 }, // --border
        horzLines: { color: '#242A35', style: 1 }
      },
      crosshair: {
        vertLine: {
          color: '#8A94A3',
          width: 1,
          style: 3,
          labelBackgroundColor: '#171C26' // --surface-2
        },
        horzLine: {
          color: '#8A94A3',
          width: 1,
          style: 3,
          labelBackgroundColor: '#171C26'
        }
      },
      timeScale: {
        borderColor: '#242A35',
        timeVisible: true,
        secondsVisible: false
      },
      rightPriceScale: {
        borderColor: '#242A35'
      }
    });

    // Add candlestick series using Lightweight Charts v5 API
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22C55E', // --bull
      downColor: '#EF4444', // --bear
      borderUpColor: '#22C55E',
      borderDownColor: '#EF4444',
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444'
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Initial data load
    const candles = formatCandles(data);
    if (candles.length > 0) {
      series.setData(candles);
      chart.timeScale().fitContent();
    }

    // Handle responsive container resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries.length || !entries[0].contentRect) return;
      const { width } = entries[0].contentRect;
      if (width > 0 && chartRef.current) {
        chartRef.current.applyOptions({ width });
      }
    });

    resizeObserver.observe(containerRef.current);

    // Explicit cleanup to prevent memory leaks
    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []); // Run once on mount

  // 2. Efficiently update series data on timeframe / data change without chart re-creation
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    const candles = formatCandles(data);
    if (candles.length > 0) {
      seriesRef.current.setData(candles);
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ minHeight: `${height}px` }}
    />
  );
}
