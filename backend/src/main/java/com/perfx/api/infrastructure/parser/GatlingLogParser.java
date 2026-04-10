package com.perfx.api.infrastructure.parser;

import com.perfx.api.application.port.out.TestResultParser;
import com.perfx.api.domain.exception.ParseProcessingException;
import com.perfx.api.domain.model.ParsedMetrics;
import com.perfx.api.domain.model.RequestStats;
import com.perfx.api.domain.model.TestMetric;
import com.perfx.api.domain.model.TestRunTimeSeriesMetric;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Parser for Gatling 3.x simulation.log files.
 *
 * The simulation.log is a TAB-separated file with the following line types:
 * <ul>
 *   <li>{@code RUN} — simulation metadata (skipped)</li>
 *   <li>{@code USER} — virtual user lifecycle events (skipped)</li>
 *   <li>{@code REQUEST} — individual HTTP request samples (parsed)</li>
 * </ul>
 *
 * REQUEST line format (tab-separated):
 * {@code REQUEST\tname\tstartTimestamp\tendTimestamp\tstatus(OK|KO)\t[errorMessage]}
 *
 * This parser computes aggregate and per-minute time-series metrics from the raw
 * request samples, achieving full parity with the JMeter CSV parser output.
 */
@Component
public class GatlingLogParser implements TestResultParser {

    private static final Logger log = LoggerFactory.getLogger(GatlingLogParser.class);
    private static final String TAB = "\t";
    private static final String REQUEST_TYPE = "REQUEST";
    private static final String STATUS_OK = "OK";

    @Override
    public boolean supports(String tool) {
        return "GATLING".equalsIgnoreCase(tool);
    }

    @Override
    public ParsedMetrics parse(InputStream inputStream) {
        Map<String, RequestStats> aggregateStatsMap = new HashMap<>();
        Map<String, RequestStats> timeSeriesStatsMap = new HashMap<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {

            long minTimestamp = Long.MAX_VALUE;
            long maxTimestamp = Long.MIN_VALUE;
            int lineNumber = 0;
            int requestCount = 0;
            String line;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                line = line.trim();
                if (line.isEmpty()) {
                    continue;
                }

                String[] fields = line.split(TAB);
                if (fields.length == 0) {
                    continue;
                }

                String recordType = fields[0];

                // Only process REQUEST lines
                if (!REQUEST_TYPE.equals(recordType)) {
                    continue;
                }

                // REQUEST lines: REQUEST \t name \t startTs \t endTs \t status \t [errorMessage]
                if (fields.length < 5) {
                    log.warn("Skipping malformed REQUEST line {} (expected >=5 fields, got {}): {}",
                            lineNumber, fields.length, line);
                    continue;
                }

                String requestName = fields[1];
                long startTs;
                long endTs;
                try {
                    startTs = Long.parseLong(fields[2]);
                    endTs = Long.parseLong(fields[3]);
                } catch (NumberFormatException e) {
                    log.warn("Skipping REQUEST line {} with non-numeric timestamps: {}", lineNumber, line);
                    continue;
                }

                String status = fields[4];
                boolean success = STATUS_OK.equalsIgnoreCase(status);
                // Optional error message / response code in field 5
                String errorMessage = (fields.length > 5 && !fields[5].isEmpty()) ? fields[5] : null;

                double elapsed = endTs - startTs; // duration in milliseconds

                minTimestamp = Math.min(minTimestamp, startTs);
                maxTimestamp = Math.max(maxTimestamp, endTs);

                // Aggregate stats per request name
                aggregateStatsMap.computeIfAbsent(requestName, k -> new RequestStats())
                        .addResponse(elapsed, success, errorMessage);

                // Time-series stats: bucket by minute offset from simulation start
                int minuteOffset = (int) ((startTs - minTimestamp) / 60000);
                String tsKey = minuteOffset + "|" + requestName;
                timeSeriesStatsMap.computeIfAbsent(tsKey, k -> new RequestStats())
                        .addResponse(elapsed, success, errorMessage);

                requestCount++;
            }

            if (requestCount == 0) {
                log.warn("No REQUEST lines found in Gatling simulation.log ({} lines read)", lineNumber);
            }

            double durationInSeconds = Math.max((maxTimestamp - minTimestamp) / 1000.0, 1.0);

            List<TestMetric> aggregateMetrics = buildAggregateMetrics(aggregateStatsMap, durationInSeconds);
            List<TestRunTimeSeriesMetric> timeSeriesMetrics = buildTimeSeriesMetrics(timeSeriesStatsMap);

            return new ParsedMetrics(aggregateMetrics, timeSeriesMetrics);

        } catch (ParseProcessingException e) {
            throw e;
        } catch (Exception e) {
            throw new ParseProcessingException("Failed to parse Gatling simulation.log", e);
        }
    }

    private List<TestMetric> buildAggregateMetrics(Map<String, RequestStats> statsMap, double durationInSeconds) {
        List<TestMetric> metrics = new ArrayList<>();
        for (Map.Entry<String, RequestStats> entry : statsMap.entrySet()) {
            RequestStats stats = entry.getValue();
            metrics.add(TestMetric.builder()
                    .requestName(entry.getKey())
                    .avgResponseTime(stats.getMean())
                    .percentile90(stats.getPercentile(90.0))
                    .percentile95(stats.getPercentile(95.0))
                    .percentile98(stats.getPercentile(98.0))
                    .throughput(stats.getCount() / durationInSeconds)
                    .errorRate(stats.getErrorRate())
                    .errorCode(stats.getMostFrequentErrorCode())
                    .build());
        }
        return metrics;
    }

    private List<TestRunTimeSeriesMetric> buildTimeSeriesMetrics(Map<String, RequestStats> statsMap) {
        List<TestRunTimeSeriesMetric> metrics = new ArrayList<>();
        for (Map.Entry<String, RequestStats> entry : statsMap.entrySet()) {
            String[] parts = entry.getKey().split("\\|", 2);
            int minuteOffset = Integer.parseInt(parts[0]);
            RequestStats stats = entry.getValue();
            metrics.add(TestRunTimeSeriesMetric.builder()
                    .minuteOffset(minuteOffset)
                    .requestName(parts[1])
                    .avgResponseTime(stats.getMean())
                    .percentile98(stats.getPercentile(98.0))
                    .throughput(stats.getCount() / 60.0)
                    .errorRate(stats.getErrorRate())
                    .build());
        }
        return metrics;
    }
}
