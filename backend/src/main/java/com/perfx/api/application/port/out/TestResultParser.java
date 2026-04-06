package com.perfx.api.application.port.out;

import com.perfx.api.domain.model.TestMetric;
import java.io.InputStream;
import java.util.List;

public interface TestResultParser {
    boolean supports(String tool);
    List<TestMetric> parse(InputStream inputStream);
}
