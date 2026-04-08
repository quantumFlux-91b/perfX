package com.perfx.api.domain.model;

import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;

import java.util.HashMap;
import java.util.Map;

/**
 * Reusable statistical aggregator for performance test request samples.
 * Tracks response time distribution, error counts, and most-frequent error codes.
 * Designed to be shared across all parser implementations (JMeter, Gatling, K6, etc.).
 */
public class RequestStats {

    private final DescriptiveStatistics descriptiveStatistics = new DescriptiveStatistics();
    private long count = 0;
    private long errorCount = 0;
    private final Map<String, Long> errorCodes = new HashMap<>();

    public void addResponse(double elapsed, boolean success, String code) {
        descriptiveStatistics.addValue(elapsed);
        count++;
        if (!success) {
            errorCount++;
            errorCodes.merge(code, 1L, Long::sum);
        }
    }

    public double getMean() {
        return descriptiveStatistics.getMean();
    }

    public double getPercentile(double p) {
        return descriptiveStatistics.getPercentile(p);
    }

    public long getCount() {
        return count;
    }

    public long getErrorCount() {
        return errorCount;
    }

    public double getErrorRate() {
        return count == 0 ? 0.0 : (double) errorCount / count;
    }

    public String getMostFrequentErrorCode() {
        if (errorCodes.isEmpty()) return null;
        return errorCodes.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }
}
