package com.perfx.api.infrastructure.web;

import com.perfx.api.infrastructure.persistence.entity.UserEntity;
import com.perfx.api.infrastructure.persistence.repo.SpringDataUserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    private final SpringDataUserRepository userRepository;

    public AuthController(SpringDataUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<UserEntity> login(@RequestParam("username") String username, @RequestParam("password") String password) {
        Optional<UserEntity> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            // For MVP we ignore actual password check and just verify user exists
            return ResponseEntity.ok(user.get());
        }
        return ResponseEntity.status(401).build();
    }
}
