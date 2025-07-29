"use client";

import { useEffect } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

const reportMetric = (metric: PerformanceMetric) => {
  // In production, you would send this to your analytics service
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance Metric:', metric);
  }
  
  // Example: Send to analytics service
  // analytics.track('performance_metric', metric);
};

const getMetricRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
  };

  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const metric: PerformanceMetric = {
          name: entry.name,
          value: entry.value || (entry as any).processingStart || 0,
          rating: getMetricRating(entry.name, entry.value || (entry as any).processingStart || 0),
        };
        reportMetric(metric);
      });
    });

    // Observe different performance metrics
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      // Fallback for browsers that don't support all entry types
      console.warn('Some performance metrics not available:', e);
    }

    // Monitor page load time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        reportMetric({
          name: 'page-load-time',
          value: loadTime,
          rating: getMetricRating('LCP', loadTime),
        });
      }
    });

    // Monitor resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.transferSize && entry.transferSize > 100000) { // Log resources > 100KB
          console.warn(`Large resource detected: ${entry.name} (${Math.round(entry.transferSize / 1024)}KB)`);
        }
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('Resource monitoring not available:', e);
    }

    return () => {
      observer.disconnect();
      resourceObserver.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}