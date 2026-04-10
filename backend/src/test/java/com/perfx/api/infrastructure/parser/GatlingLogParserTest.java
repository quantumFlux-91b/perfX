package com.perfx.api.infrastructure.parser;

import com.perfx.api.domain.model.ParsedMetrics;
import com.perfx.api.domain.model.TestMetric;
import com.perfx.api.domain.model.TestRunTimeSeriesMetric;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class GatlingLogParserTest {

    private GatlingLogParser parser;

    @BeforeEach
    void setUp() {
        parser = new GatlingLogParser();
    }

    // ==================== supports() ====================

    @Test
    @DisplayName("supports() returns true for GATLING (case-insensitive)")
    void supportsGatling() {
        assertTrue(parser.supports("GATLING"));
        assertTrue(parser.supports("gatling"));
        assertTrue(parser.supports("Gatling"));
        assertFalse(parser.supports("JMETER"));
        assertFalse(parser.supports(""));
    }

    // ==================== Aggregate Metrics ====================

    @Test
    @DisplayName("parse() correctly computes aggregate metrics from simulation.log")
    void parseAggregateMetrics() {
        String log = """
                RUN\tcom.example.Sim\ttest\t1700000000000\t3.9.5
                USER\tScenario\tSTART\t1700000000100
                REQUEST\tGet Homepage\t1700000000200\t1700000000350\tOK\t
                REQUEST\tGet Homepage\t1700000000400\t1700000000520\tOK\t
                REQUEST\tGet Homepage\t1700000000600\t1700000000780\tOK\t
                REQUEST\tLogin\t1700000000800\t1700000001050\tOK\t
                REQUEST\tLogin\t1700000001100\t1700000001400\tOK\t
                REQUEST\tLogin\t1700000001500\t1700000001950\tKO\t401 Unauthorized
                USER\tScenario\tEND\t1700000002000
                """;

        ParsedMetrics result = parser.parse(toStream(log));
        List<TestMetric> metrics = result.getAggregateMetrics();

        assertEquals(2, metrics.size());

        Map<String, TestMetric> byName = metrics.stream()
                .collect(Collectors.toMap(TestMetric::getRequestName, m -> m));

        // Get Homepage: elapsed = 150, 120, 180 → mean ≈ 150
        TestMetric homepage = byName.get("Get Homepage");
        assertNotNull(homepage);
        assertEquals(150.0, homepage.getAvgResponseTime(), 1.0);
        assertEquals(0.0, homepage.getErrorRate(), 0.001);
        assertTrue(homepage.getThroughput() > 0);
        assertNull(homepage.getErrorCode());

        // Login: elapsed = 250, 300, 450 → mean ≈ 333.33, 1 error out of 3
        TestMetric login = byName.get("Login");
        assertNotNull(login);
        assertEquals(333.33, login.getAvgResponseTime(), 1.0);
        assertEquals(1.0 / 3.0, login.getErrorRate(), 0.01);
        assertEquals("401 Unauthorized", login.getErrorCode());
    }

    // ==================== Time-Series Metrics ====================

    @Test
    @DisplayName("parse() produces time-series buckets by minute offset")
    void parseTimeSeriesMetrics() {
        // Requests spanning 3 minutes: minute 0, 1, and 2
        String log = """
                RUN\tcom.example.Sim\ttest\t1700000000000\t3.9.5
                REQUEST\tAPI\t1700000000200\t1700000000300\tOK\t
                REQUEST\tAPI\t1700000000400\t1700000000550\tOK\t
                REQUEST\tAPI\t1700000060200\t1700000060400\tOK\t
                REQUEST\tAPI\t1700000120200\t1700000120500\tOK\t
                """;

        ParsedMetrics result = parser.parse(toStream(log));
        List<TestRunTimeSeriesMetric> tsMetrics = result.getTimeSeriesMetrics();

        Map<Integer, List<TestRunTimeSeriesMetric>> byMinute = tsMetrics.stream()
                .collect(Collectors.groupingBy(TestRunTimeSeriesMetric::getMinuteOffset));

        assertEquals(3, byMinute.size());
        assertTrue(byMinute.containsKey(0));
        assertTrue(byMinute.containsKey(1));
        assertTrue(byMinute.containsKey(2));

        // Minute 0: 2 samples with elapsed 100, 150 → mean = 125
        TestRunTimeSeriesMetric min0 = byMinute.get(0).get(0);
        assertEquals("API", min0.getRequestName());
        assertEquals(125.0, min0.getAvgResponseTime(), 1.0);

        // Minute 1: 1 sample with elapsed 200
        TestRunTimeSeriesMetric min1 = byMinute.get(1).get(0);
        assertEquals(200.0, min1.getAvgResponseTime(), 1.0);

        // Minute 2: 1 sample with elapsed 300
        TestRunTimeSeriesMetric min2 = byMinute.get(2).get(0);
        assertEquals(300.0, min2.getAvgResponseTime(), 1.0);
    }

    // ==================== Error Handling ====================

    @Test
    @DisplayName("parse() correctly tracks KO status as errors")
    void parseKoStatus() {
        String log = """
                RUN\tcom.example.Sim\ttest\t1700000000000\t3.9.5
                REQUEST\tAPI\t1700000000200\t1700000000400\tOK\t
                REQUEST\tAPI\t1700000000500\t1700000000700\tKO\t500 Internal Server Error
                REQUEST\tAPI\t1700000000800\t1700000001000\tKO\tconnection timed out
                """;

        ParsedMetrics result = parser.parse(toStream(log));
        TestMetric metric = result.getAggregateMetrics().get(0);

        assertEquals(2.0 / 3.0, metric.getErrorRate(), 0.01);
        // Most frequent error — both are unique, either one is acceptable
        assertNotNull(metric.getErrorCode());
    }

    @Test
    @DisplayName("parse() skips RUN and USER lines gracefully")
    void parseSkipsNonRequestLines() {
        String log = """
                RUN\tcom.example.Sim\ttest\t1700000000000\t3.9.5
                USER\tScenario1\tSTART\t1700000000100
                USER\tScenario1\tEND\t1700000001000
                REQUEST\tAPI\t1700000000200\t1700000000400\tOK\t
                """;

        ParsedMetrics result = parser.parse(toStream(log));

        assertEquals(1, result.getAggregateMetrics().size());
        assertEquals("API", result.getAggregateMetrics().get(0).getRequestName());
        assertEquals(200.0, result.getAggregateMetrics().get(0).getAvgResponseTime(), 1.0);
    }

    @Test
    @DisplayName("parse() handles empty file without throwing")
    void parseEmptyFile() {
        ParsedMetrics result = parser.parse(toStream(""));

        assertNotNull(result);
        assertTrue(result.getAggregateMetrics().isEmpty());
        assertTrue(result.getTimeSeriesMetrics().isEmpty());
    }

    @Test
    @DisplayName("parse() skips malformed REQUEST lines and continues")
    void parseMalformedLines() {
        String log = """
                RUN\tcom.example.Sim\ttest\t1700000000000\t3.9.5
                REQUEST\tBadLine
                REQUEST\tAPI\tnotanumber\t1700000000400\tOK\t
                REQUEST\tGoodAPI\t1700000000200\t1700000000500\tOK\t
                """;

        ParsedMetrics result = parser.parse(toStream(log));

        // Only the last valid REQUEST line should be parsed
        assertEquals(1, result.getAggregateMetrics().size());
        assertEquals("GoodAPI", result.getAggregateMetrics().get(0).getRequestName());
    }

    // ==================== File-based Test ====================

    @Test
    @DisplayName("parse() correctly processes the full simulation.log fixture file")
    void parseFixtureFile() {
        InputStream fixture = getClass().getClassLoader().getResourceAsStream("samples/gatling/simulation.log");
        assertNotNull(fixture, "Test fixture gatling/simulation.log not found");

        ParsedMetrics result = parser.parse(fixture);
        List<TestMetric> metrics = result.getAggregateMetrics();

        // Fixture has 3 unique request names: Get Homepage, Login, Search Products
        assertEquals(3, metrics.size());

        Map<String, TestMetric> byName = metrics.stream()
                .collect(Collectors.toMap(TestMetric::getRequestName, m -> m));

        assertTrue(byName.containsKey("Get Homepage"));
        assertTrue(byName.containsKey("Login"));
        assertTrue(byName.containsKey("Search Products"));

        // Search Products has 1 KO out of 7 → errorRate ≈ 0.1429
        TestMetric search = byName.get("Search Products");
        assertEquals(1.0 / 7.0, search.getErrorRate(), 0.01);
        assertEquals("500 Internal Server Error", search.getErrorCode());

        // Login has 1 KO out of 6 → errorRate ≈ 0.1667
        TestMetric login = byName.get("Login");
        assertEquals(1.0 / 6.0, login.getErrorRate(), 0.01);

        // Get Homepage has 0 KO → errorRate = 0
        TestMetric homepage = byName.get("Get Homepage");
        assertEquals(0.0, homepage.getErrorRate(), 0.001);

        // Time-series: fixture spans 3 minutes (0, 60s, 120s offsets)
        List<TestRunTimeSeriesMetric> tsMetrics = result.getTimeSeriesMetrics();
        Map<Integer, List<TestRunTimeSeriesMetric>> byMinute = tsMetrics.stream()
                .collect(Collectors.groupingBy(TestRunTimeSeriesMetric::getMinuteOffset));

        assertEquals(3, byMinute.size());
        assertTrue(byMinute.containsKey(0));
        assertTrue(byMinute.containsKey(1));
        assertTrue(byMinute.containsKey(2));
    }

    // ==================== Helpers ====================

    private InputStream toStream(String content) {
        return new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8));
    }
}
