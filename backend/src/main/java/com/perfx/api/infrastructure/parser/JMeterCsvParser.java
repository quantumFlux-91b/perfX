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

@Component
public class JMeterCsvParser implements TestResultParser {

    @Override
    public boolean supports(String tool) {
        return "JMETER".equalsIgnoreCase(tool);
    }

    @Override
    public List<TestMetric> parse(InputStream inputStream) {
        Map<String, RequestStats> statsMap = new HashMap<>();

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

                RequestStats stats = statsMap.computeIfAbsent(label, k -> new RequestStats());
                stats.addResponse(elapsed, success, responseCode);
            }

            double durationInSeconds = (maxTimeStamp - minTimeStamp) / 1000.0;
            if (durationInSeconds <= 0) {
                durationInSeconds = 1.0;
            }

            List<TestMetric> metrics = new ArrayList<>();
            for (Map.Entry<String, RequestStats> entry : statsMap.entrySet()) {
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

                metrics.add(metric);
            }

            return metrics;

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
