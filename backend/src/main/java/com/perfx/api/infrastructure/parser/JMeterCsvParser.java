package com.perfx.api.infrastructure.parser;

import com.perfx.api.application.port.out.TestResultParser;
import com.perfx.api.domain.exception.ParseProcessingException;
import com.perfx.api.domain.model.ParsedMetrics;
import com.perfx.api.domain.model.RequestStats;
import com.perfx.api.domain.model.TestMetric;
import com.perfx.api.domain.model.TestRunTimeSeriesMetric;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
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
    public ParsedMetrics parse(InputStream inputStream) {
        Map<String, RequestStats> aggregateStatsMap = new HashMap<>();
        Map<String, RequestStats> timeSeriesStatsMap = new HashMap<>();

        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
            char delimiter = ',';
            if (reader.markSupported()) {
                reader.mark(8192);
                String firstLine = reader.readLine();
                if (firstLine != null) {
                    int commaCount = 0;
                    int semicolonCount = 0;
                    for (int i = 0; i < firstLine.length(); i++) {
                        char c = firstLine.charAt(i);
                        if (c == ',') commaCount++;
                        else if (c == ';') semicolonCount++;
                    }
                    if (semicolonCount > commaCount) {
                        delimiter = ';';
                    }
                }
                reader.reset();
            }

            try (BufferedReader autoCloseReader = reader;
                 CSVParser csvParser = new CSVParser(autoCloseReader, CSVFormat.DEFAULT.builder()
                     .setDelimiter(delimiter)
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreHeaderCase(true)
                     .setTrim(true)
                     .setAllowMissingColumnNames(true)
                     .setIgnoreEmptyLines(true)
                     .build())) {


            long minTimeStamp = Long.MAX_VALUE;
            long maxTimeStamp = Long.MIN_VALUE;

            for (CSVRecord record : csvParser) {
                try {
                    String label = extractLabel(record);
                    if (label == null || label.trim().isEmpty() || "Unknown".equals(label)) {
                        continue;
                    }

                    long timeStamp = 0;
                    if (record.isSet("timeStamp")) {
                        timeStamp = Long.parseLong(record.get("timeStamp"));
                    } else if (record.isSet("timestamp")) {
                        timeStamp = Long.parseLong(record.get("timestamp"));
                    }

                    double elapsed = 0;
                    if (record.isSet("elapsed")) {
                        elapsed = Double.parseDouble(record.get("elapsed"));
                    }

                    String responseCode = "200";
                    if (record.isSet("responseCode")) {
                        responseCode = record.get("responseCode");
                    }

                    boolean success = true;
                    if (record.isSet("success")) {
                        success = determineSuccess(record);
                    } else {
                        if (responseCode != null && responseCode.matches("\\d+")) {
                            if (Integer.parseInt(responseCode) >= 400) {
                                success = false;
                            }
                        }
                    }

                    if (timeStamp > 0) {
                        minTimeStamp = Math.min(minTimeStamp, timeStamp);
                        maxTimeStamp = Math.max(maxTimeStamp, timeStamp);
                    }

                    aggregateStatsMap.computeIfAbsent(label, k -> new RequestStats())
                            .addResponse(elapsed, success, responseCode);

                    int minuteOffset = 0;
                    if (timeStamp > 0 && minTimeStamp != Long.MAX_VALUE) {
                        minuteOffset = (int) ((timeStamp - minTimeStamp) / 60000);
                    }
                    String tsKey = minuteOffset + "|" + label;
                    timeSeriesStatsMap.computeIfAbsent(tsKey, k -> new RequestStats())
                            .addResponse(elapsed, success, responseCode);
                } catch (Exception e) {
                    System.err.println("Skipping malformed CSV record due to error: " + e.getMessage());
                }
            }

            if (aggregateStatsMap.isEmpty()) {
                throw new ParseProcessingException("No valid JMeter CSV records found in the file", null);
            }

            double durationInSeconds = Math.max((maxTimeStamp - minTimeStamp) / 1000.0, 1.0);
            if (minTimeStamp == Long.MAX_VALUE) {
                durationInSeconds = 1.0;
            }

            List<TestMetric> aggregateMetrics = buildAggregateMetrics(aggregateStatsMap, durationInSeconds);
            List<TestRunTimeSeriesMetric> timeSeriesMetrics = buildTimeSeriesMetrics(timeSeriesStatsMap);

            return new ParsedMetrics(aggregateMetrics, timeSeriesMetrics);
            }
        } catch (ParseProcessingException e) {
            throw e;
        } catch (Exception e) {
            throw new ParseProcessingException("Failed to parse JMeter CSV", e);
        }
    }

    private String extractLabel(CSVRecord record) {
        if (record.isSet("label")) return record.get("label");
        if (record.isSet("URL")) return record.get("URL");
        return "Unknown";
    }

    private boolean determineSuccess(CSVRecord record) {
        boolean success = true;
        if (record.isSet("success")) {
            success = Boolean.parseBoolean(record.get("success"));
        }
        
        String responseCode = null;
        if (record.isSet("responseCode")) {
            responseCode = record.get("responseCode");
        }
        
        if (responseCode != null && responseCode.matches("\\d+")) {
            if (Integer.parseInt(responseCode) >= 400) {
                return false;
            }
        }
        return success;
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
