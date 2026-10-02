import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, LineSeries, LineStyle } from 'lightweight-charts';
import { SMA, RSI } from 'technicalindicators';

export default function CandleChart({
  data = [],
  height = 440,
  showSma20 = true,
  showSma50 = true,
  showRsi = false
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const sma20SeriesRef = useRef(null);
  const sma50SeriesRef = useRef(null);
  const rsiSeriesRef = useRef(null);

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

  // Helper to align indicator values to the end of candles array
  const alignIndicator = (candles, indicatorValues) => {
    if (!indicatorValues || !indicatorValues.length || !candles || !candles.length) {
      return [];
    }
    const offset = candles.length - indicatorValues.length;
    if (offset < 0) return [];

    const result = [];
    for (let i = 0; i < indicatorValues.length; i++) {
      const candle = candles[offset + i];
      const val = Number(indicatorValues[i]);
      if (candle && Number.isFinite(val)) {
        result.push({
          time: candle.time,
          value: val
        });
      }
    }
    return result;
  };

  // 1. Chart initialization and teardown
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
        borderColor: '#242A35',
        scaleMargins: {
          top: 0.05,
          bottom: 0.05
        }
      }
    });

    // Add candlestick series using Lightweight Charts v5 API
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22C55E', // --bull
      downColor: '#EF4444', // --bear
      borderUpColor: '#22C55E',
      borderDownColor: '#EF4444',
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444'
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Handle responsive container resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries.length || !entries[0].contentRect) return;
      const { width } = entries[0].contentRect;
      if (width > 0 && chartRef.current) {
        chartRef.current.applyOptions({ width });
      }
    });

    resizeObserver.observe(containerRef.current);

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      sma20SeriesRef.current = null;
      sma50SeriesRef.current = null;
      rsiSeriesRef.current = null;
    };
  }, []); // Run once on mount

  // 2. Synchronize series data and toggles without recreating the chart instance
  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    const candles = formatCandles(data);
    candleSeries.setData(candles);

    const closes = candles.map((c) => c.close);

    // Adjust main price scale margin depending on RSI sub-pane presence
    chart.priceScale('right').applyOptions({
      scaleMargins: {
        top: 0.05,
        bottom: showRsi ? 0.28 : 0.05
      }
    });

    // --- SMA 20 Overlay ---
    if (showSma20 && closes.length >= 20) {
      if (!sma20SeriesRef.current) {
        sma20SeriesRef.current = chart.addSeries(LineSeries, {
          color: '#38BDF8', // Muted sky blue
          lineWidth: 1.5,
          priceScaleId: 'right',
          title: 'SMA 20'
        });
      }
      const sma20Values = SMA.calculate({ period: 20, values: closes });
      const sma20Data = alignIndicator(candles, sma20Values);
      sma20SeriesRef.current.setData(sma20Data);
    } else {
      if (sma20SeriesRef.current) {
        chart.removeSeries(sma20SeriesRef.current);
        sma20SeriesRef.current = null;
      }
    }

    // --- SMA 50 Overlay ---
    if (showSma50 && closes.length >= 50) {
      if (!sma50SeriesRef.current) {
        sma50SeriesRef.current = chart.addSeries(LineSeries, {
          color: '#F59E0B', // Muted amber/orange
          lineWidth: 1.5,
          priceScaleId: 'right',
          title: 'SMA 50'
        });
      }
      const sma50Values = SMA.calculate({ period: 50, values: closes });
      const sma50Data = alignIndicator(candles, sma50Values);
      sma50SeriesRef.current.setData(sma50Data);
    } else {
      if (sma50SeriesRef.current) {
        chart.removeSeries(sma50SeriesRef.current);
        sma50SeriesRef.current = null;
      }
    }

    // --- RSI(14) Sub-pane ---
    if (showRsi && closes.length >= 14) {
      if (!rsiSeriesRef.current) {
        const rsiSeries = chart.addSeries(LineSeries, {
          priceScaleId: 'rsi',
          color: '#A855F7', // Violet
          lineWidth: 1.5,
          title: 'RSI(14)',
          priceFormat: {
            type: 'custom',
            formatter: (p) => Number(p).toFixed(1)
          }
        });

        chart.priceScale('rsi').applyOptions({
          scaleMargins: {
            top: 0.76, // Constrain to bottom ~22%
            bottom: 0.02
          },
          autoScale: false,
          borderColor: '#242A35'
        });

        // Add 70 & 30 reference lines
        rsiSeries.createPriceLine({
          price: 70,
          color: '#5B6472',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: '70'
        });
        rsiSeries.createPriceLine({
          price: 30,
          color: '#5B6472',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: '30'
        });

        rsiSeriesRef.current = rsiSeries;
      }

      const rsiValues = RSI.calculate({ period: 14, values: closes });
      const rsiData = alignIndicator(candles, rsiValues);
      rsiSeriesRef.current.setData(rsiData);
    } else {
      if (rsiSeriesRef.current) {
        chart.removeSeries(rsiSeriesRef.current);
        rsiSeriesRef.current = null;
      }
    }

    if (candles.length > 0) {
      chart.timeScale().fitContent();
    }
  }, [data, showSma20, showSma50, showRsi]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ minHeight: `${height}px` }}
    />
  );
}
