package com.perfx.api.infrastructure.web;

import com.perfx.api.infrastructure.persistence.entity.ApplicationEntity;
import com.perfx.api.infrastructure.persistence.repo.SpringDataApplicationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class ApplicationController {

    private final SpringDataApplicationRepository repository;

    public ApplicationController(SpringDataApplicationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<ApplicationEntity>> getApplications(@RequestParam("userId") UUID userId) {
        return ResponseEntity.ok(repository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<ApplicationEntity> create(@RequestParam("userId") UUID userId, @RequestParam("name") String name) {
        if (repository.findByUserIdAndName(userId, name).isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        ApplicationEntity app = new ApplicationEntity();
        app.setUserId(userId);
        app.setName(name);
        return ResponseEntity.ok(repository.save(app));
    }
}
