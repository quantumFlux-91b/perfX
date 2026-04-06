package com.perfx.api.infrastructure.web;

import com.perfx.api.application.port.in.CompareTestRunsUseCase;
import com.perfx.api.application.port.in.GetTestRunsUseCase;
import com.perfx.api.application.port.in.UploadTestResultUseCase;
import com.perfx.api.domain.model.MetricComparison;
import com.perfx.api.domain.model.TestRun;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/test-runs")
@CrossOrigin(origins = "*") 
public class TestRunController {

    private final UploadTestResultUseCase uploadUseCase;
    private final GetTestRunsUseCase getUseCase;
    private final CompareTestRunsUseCase compareUseCase;

    public TestRunController(UploadTestResultUseCase uploadUseCase, GetTestRunsUseCase getUseCase, CompareTestRunsUseCase compareUseCase) {
        this.uploadUseCase = uploadUseCase;
        this.getUseCase = getUseCase;
        this.compareUseCase = compareUseCase;
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<TestRun> upload(
            @RequestParam("userId") UUID userId, 
            @RequestParam("applicationName") String appName,
            @RequestParam("applicationVersion") String appVersion,
            @RequestParam(value = "runId", required = false) String runId,
            @RequestParam("tool") String tool,
            @RequestParam("file") MultipartFile file) throws Exception {

        TestRun run = uploadUseCase.upload(userId, appName, appVersion, runId, tool, file.getInputStream());
        return ResponseEntity.ok(run);
    }

    @GetMapping
    public ResponseEntity<List<TestRun>> getRecent(
            @RequestParam("userId") UUID userId,
            @RequestParam("applicationName") String appName) {
        return ResponseEntity.ok(getUseCase.getRecentRuns(userId, appName));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TestRun> getById(@PathVariable("id") UUID id) {
         return ResponseEntity.ok(getUseCase.getRunDetails(id));
    }

    @GetMapping("/compare")
    public ResponseEntity<List<MetricComparison>> compare(
            @RequestParam("baseRunId") UUID baseRunId,
            @RequestParam("targetRunId") UUID targetRunId) {
        return ResponseEntity.ok(compareUseCase.compare(baseRunId, targetRunId));
    }
}
