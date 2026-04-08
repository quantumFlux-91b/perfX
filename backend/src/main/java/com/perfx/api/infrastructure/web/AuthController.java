package com.perfx.api.infrastructure.web;

import com.perfx.api.application.port.in.LoginUserUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final LoginUserUseCase loginUserUseCase;

    public AuthController(LoginUserUseCase loginUserUseCase) {
        this.loginUserUseCase = loginUserUseCase;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam("username") String username,
                                   @RequestParam("password") String password) {
        String userId = loginUserUseCase.login(username, password);
        if (userId != null) {
            return ResponseEntity.ok(Map.of("id", userId, "username", username));
        }
        return ResponseEntity.status(401).build();
    }
}
