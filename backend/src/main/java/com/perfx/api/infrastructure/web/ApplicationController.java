package com.perfx.api.infrastructure.web;

import com.perfx.api.application.port.in.ManageApplicationUseCase;
import com.perfx.api.domain.model.Application;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class ApplicationController {

    private final ManageApplicationUseCase manageApplicationUseCase;

    public ApplicationController(ManageApplicationUseCase manageApplicationUseCase) {
        this.manageApplicationUseCase = manageApplicationUseCase;
    }

    @GetMapping
    public ResponseEntity<List<Application>> getApplications(@RequestParam("userId") UUID userId) {
        return ResponseEntity.ok(manageApplicationUseCase.getApplications(userId));
    }

    @PostMapping
    public ResponseEntity<Application> create(@RequestParam("userId") UUID userId,
                                               @RequestParam("name") String name) {
        Application app = manageApplicationUseCase.createApplication(userId, name);
        return ResponseEntity.ok(app);
    }
}
