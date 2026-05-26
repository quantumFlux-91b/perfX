package com.perfx.api.infrastructure.parser;

import com.perfx.api.domain.model.ParsedMetrics;
import com.perfx.api.domain.model.TestMetric;
import com.perfx.api.domain.model.TestRunTimeSeriesMetric;
import com.perfx.api.domain.exception.ParseProcessingException;
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

class JMeterCsvParserTest {

    private JMeterCsvParser parser;

    @BeforeEach
    void setUp() {
        parser = new JMeterCsvParser();
    }

    @Test
    @DisplayName("supports() returns true for JMETER (case-insensitive)")
    void supportsJmeter() {
        assertTrue(parser.supports("JMETER"));
        assertTrue(parser.supports("jmeter"));
        assertTrue(parser.supports("JMeter"));
        assertFalse(parser.supports("GATLING"));
        assertFalse(parser.supports(""));
    }

    @Test
    @DisplayName("parse() correctly computes aggregate metrics from CSV")
    void parseAggregateMetrics() {
        String csv = """
                timeStamp,elapsed,label,responseCode,responseMessage,threadName,dataType,success,failureMessage,bytes,sentBytes,grpThreads,allThreads,URL,Latency,IdleTime,Connect
                1700000000000,120,Login,200,OK,Thread1,text,true,,500,100,1,1,http://test/login,100,0,10
                1700000001000,150,Login,200,OK,Thread2,text,true,,500,100,1,1,http://test/login,110,0,10
                1700000002000,200,Login,500,Error,Thread3,text,false,,500,100,1,1,http://test/login,180,0,10
                1700000000000,80,Search,200,OK,Thread1,text,true,,300,80,1,1,http://test/search,60,0,5
                1700000001000,90,Search,200,OK,Thread2,text,true,,300,80,1,1,http://test/search,65,0,5
                """;

        ParsedMetrics result = parser.parse(toStream(csv));
        List<TestMetric> aggregateMetrics = result.getAggregateMetrics();

        assertEquals(2, aggregateMetrics.size());

        Map<String, TestMetric> metricsByName = aggregateMetrics.stream()
                .collect(Collectors.toMap(TestMetric::getRequestName, m -> m));

        // Login: 3 requests, 1 error (500 response code)
        TestMetric login = metricsByName.get("Login");
        assertNotNull(login);
        assertEquals(156.67, login.getAvgResponseTime(), 1.0); // mean of 120, 150, 200
        assertTrue(login.getErrorRate() > 0.3 && login.getErrorRate() < 0.34);
        assertTrue(login.getThroughput() > 0);

        // Search: 2 requests, 0 errors
        TestMetric search = metricsByName.get("Search");
        assertNotNull(search);
        assertEquals(85.0, search.getAvgResponseTime(), 1.0); // mean of 80, 90
        assertEquals(0.0, search.getErrorRate());
    }

    @Test
    @DisplayName("parse() produces time-series buckets by minute offset")
    void parseTimeSeriesMetrics() {
        String csv = """
                timeStamp,elapsed,label,responseCode,responseMessage,threadName,dataType,success,failureMessage,bytes,sentBytes,grpThreads,allThreads,URL,Latency,IdleTime,Connect
                1700000000000,100,API,200,OK,T1,text,true,,500,100,1,1,http://test/api,80,0,5
                1700000030000,110,API,200,OK,T1,text,true,,500,100,1,1,http://test/api,85,0,5
                1700000060000,120,API,200,OK,T1,text,true,,500,100,1,1,http://test/api,90,0,5
                1700000120000,130,API,200,OK,T1,text,true,,500,100,1,1,http://test/api,95,0,5
                """;

        ParsedMetrics result = parser.parse(toStream(csv));
        List<TestRunTimeSeriesMetric> tsMetrics = result.getTimeSeriesMetrics();

        // Minute 0: timestamps 0 and 30000 (both within first 60s)
        // Minute 1: timestamp 60000
        // Minute 2: timestamp 120000
        Map<Integer, List<TestRunTimeSeriesMetric>> byMinute = tsMetrics.stream()
                .collect(Collectors.groupingBy(TestRunTimeSeriesMetric::getMinuteOffset));

        assertEquals(3, byMinute.size());
        assertTrue(byMinute.containsKey(0));
        assertTrue(byMinute.containsKey(1));
        assertTrue(byMinute.containsKey(2));

        // Minute 0 should have 2 samples
        TestRunTimeSeriesMetric min0 = byMinute.get(0).get(0);
        assertEquals(105.0, min0.getAvgResponseTime(), 1.0); // mean of 100, 110
    }

    @Test
    @DisplayName("parse() throws ParseProcessingException on invalid CSV")
    void parseInvalidCsvThrows() {
        String invalidCsv = "this,is,not,valid\nno,timestamp,column,here";

        assertThrows(ParseProcessingException.class, () -> parser.parse(toStream(invalidCsv)));
    }

    @Test
    @DisplayName("parse() correctly identifies HTTP 4xx/5xx as errors")
    void parseHttpErrorCodes() {
        String csv = """
                timeStamp,elapsed,label,responseCode,responseMessage,threadName,dataType,success,failureMessage,bytes,sentBytes,grpThreads,allThreads,URL,Latency,IdleTime,Connect
                1700000000000,100,API,200,OK,T1,text,true,,500,100,1,1,http://test/api,80,0,5
                1700000001000,200,API,404,Not Found,T1,text,true,,500,100,1,1,http://test/api,80,0,5
                1700000002000,300,API,503,Service Unavailable,T1,text,true,,500,100,1,1,http://test/api,80,0,5
                """;

        ParsedMetrics result = parser.parse(toStream(csv));
        TestMetric metric = result.getAggregateMetrics().get(0);

        // 404 and 503 should be counted as errors even though success=true in CSV
        assertEquals(2.0 / 3.0, metric.getErrorRate(), 0.01);
    }

    @Test
    @DisplayName("parse() correctly handles semicolon-delimited JTL/CSV files")
    void parseSemicolonDelimitedCsv() {
        String csv = """
                timeStamp;elapsed;label;responseCode;responseMessage;threadName;dataType;success;failureMessage;bytes;sentBytes;grpThreads;allThreads;URL;Latency;IdleTime;Connect
                1700000000000;120;Login;200;OK;Thread1;text;true;;500;100;1;1;http://test/login;100;0;10
                1700000001000;150;Login;200;OK;Thread2;text;true;;500;100;1;1;http://test/login;110;0;10
                """;

        ParsedMetrics result = parser.parse(toStream(csv));
        List<TestMetric> aggregateMetrics = result.getAggregateMetrics();

        assertEquals(1, aggregateMetrics.size());
        TestMetric login = aggregateMetrics.get(0);
        assertEquals("Login", login.getRequestName());
        assertEquals(135.0, login.getAvgResponseTime(), 1.0);
    }

    private InputStream toStream(String content) {
        return new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8));
    }
}

