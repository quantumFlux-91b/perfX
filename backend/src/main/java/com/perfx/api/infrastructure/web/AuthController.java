package com.perfx.api.infrastructure.web;

import com.perfx.api.application.port.in.LoginUserUseCase;
import com.perfx.api.application.port.in.RegisterUserUseCase;
import com.perfx.api.domain.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final LoginUserUseCase loginUserUseCase;
    private final RegisterUserUseCase registerUserUseCase;

    public AuthController(LoginUserUseCase loginUserUseCase, RegisterUserUseCase registerUserUseCase) {
        this.loginUserUseCase = loginUserUseCase;
        this.registerUserUseCase = registerUserUseCase;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        User user = loginUserUseCase.login(email, password);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.status(401).build();
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String firstName = request.get("firstName");
        String lastName = request.get("lastName");
        User user = registerUserUseCase.register(email, password, firstName, lastName);
        return ResponseEntity.ok(user);
    }
}
