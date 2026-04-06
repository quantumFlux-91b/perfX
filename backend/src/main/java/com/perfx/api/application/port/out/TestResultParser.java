package com.perfx.api.application.port.out;

import com.perfx.api.domain.model.ParsedMetrics;
import java.io.InputStream;

public interface TestResultParser {
    boolean supports(String tool);
    ParsedMetrics parse(InputStream inputStream);
}
