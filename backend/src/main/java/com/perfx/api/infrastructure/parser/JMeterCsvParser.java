package com.perfx.api.infrastructure.parser;

import com.perfx.api.application.port.out.TestResultParser;
import com.perfx.api.domain.model.TestMetric;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

import com.perfx.api.domain.model.ParsedMetrics;
import com.perfx.api.domain.model.TestRunTimeSeriesMetric;

@Component
public class JMeterCsvParser implements TestResultParser {

    @Override
    public boolean supports(String tool) {
        return "JMETER".equalsIgnoreCase(tool);
    }

    @Override
    public ParsedMetrics parse(InputStream inputStream) {
        Map<String, RequestStats> aggregateStatsMap = new HashMap<>();
        Map<String, RequestStats> timeSeriesStatsMap = new HashMap<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {

            long minTimeStamp = Long.MAX_VALUE;
            long maxTimeStamp = Long.MIN_VALUE;

            for (CSVRecord record : csvParser) {
                String label = record.isSet("label") ? record.get("label") : record.isSet("URL") ? record.get("URL") : "Unknown";
                if (label == null || label.trim().isEmpty()) {
                    continue;
                }
                
                long timeStamp = Long.parseLong(record.get("timeStamp"));
                double elapsed = Double.parseDouble(record.get("elapsed"));
                boolean success = Boolean.parseBoolean(record.get("success"));
                String responseCode = record.get("responseCode");
                if (responseCode != null && responseCode.matches("\\d+")) {
                    if (Integer.parseInt(responseCode) >= 400) {
                        success = false;
                    }
                }

                minTimeStamp = Math.min(minTimeStamp, timeStamp);
                maxTimeStamp = Math.max(maxTimeStamp, timeStamp);

                // Add to global aggregate
                RequestStats globalStats = aggregateStatsMap.computeIfAbsent(label, k -> new RequestStats());
                globalStats.addResponse(elapsed, success, responseCode);
                
                // Add to time series aggregate. Group by (minuteOffset|requestName)
                int minuteOffset = (int) ((timeStamp - minTimeStamp) / 60000);
                String tsKey = minuteOffset + "|" + label;
                RequestStats tsStats = timeSeriesStatsMap.computeIfAbsent(tsKey, k -> new RequestStats());
                tsStats.addResponse(elapsed, success, responseCode);
            }

            double durationInSeconds = (maxTimeStamp - minTimeStamp) / 1000.0;
            if (durationInSeconds <= 0) {
                durationInSeconds = 1.0;
            }

            List<TestMetric> aggregateMetrics = new ArrayList<>();
            for (Map.Entry<String, RequestStats> entry : aggregateStatsMap.entrySet()) {
                String label = entry.getKey();
                RequestStats stats = entry.getValue();
                
                TestMetric metric = TestMetric.builder()
                        .requestName(label)
                        .avgResponseTime(stats.descriptiveStatistics.getMean())
                        .percentile90(stats.descriptiveStatistics.getPercentile(90.0))
                        .percentile95(stats.descriptiveStatistics.getPercentile(95.0))
                        .percentile98(stats.descriptiveStatistics.getPercentile(98.0))
                        .throughput(stats.count / durationInSeconds)
                        .errorRate((double) stats.errorCount / stats.count)
                        .errorCode(stats.getMostFrequentErrorCode())
                        .build();

                aggregateMetrics.add(metric);
            }

            List<TestRunTimeSeriesMetric> timeSeriesMetrics = new ArrayList<>();
            for (Map.Entry<String, RequestStats> entry : timeSeriesStatsMap.entrySet()) {
                String[] parts = entry.getKey().split("\\|", 2);
                int minuteOffset = Integer.parseInt(parts[0]);
                String label = parts[1];
                RequestStats stats = entry.getValue();
                
                TestRunTimeSeriesMetric metric = TestRunTimeSeriesMetric.builder()
                        .minuteOffset(minuteOffset)
                        .requestName(label)
                        .avgResponseTime(stats.descriptiveStatistics.getMean())
                        .percentile98(stats.descriptiveStatistics.getPercentile(98.0))
                        .throughput(stats.count / 60.0) // Fixed to 60.0s for a full 1-minute bucket. Last bucket might be smaller, but standard is 60s window throughput.
                        .errorRate((double) stats.errorCount / stats.count)
                        .build();

                timeSeriesMetrics.add(metric);
            }

            return new ParsedMetrics(aggregateMetrics, timeSeriesMetrics);

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse JMeter CSV", e);
        }
    }

    private static class RequestStats {
        DescriptiveStatistics descriptiveStatistics = new DescriptiveStatistics();
        long count = 0;
        long errorCount = 0;
        Map<String, Long> errorCodes = new HashMap<>();

        void addResponse(double elapsed, boolean success, String code) {
            descriptiveStatistics.addValue(elapsed);
            count++;
            if (!success) {
                errorCount++;
                errorCodes.put(code, errorCodes.getOrDefault(code, 0L) + 1);
            }
        }

        String getMostFrequentErrorCode() {
            if (errorCodes.isEmpty()) return null;
            return errorCodes.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
        }
    }
}
