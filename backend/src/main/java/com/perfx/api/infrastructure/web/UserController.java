package com.perfx.api.infrastructure.web;

import com.perfx.api.application.port.in.EditUserProfileUseCase;
import com.perfx.api.domain.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final EditUserProfileUseCase editUserProfileUseCase;

    public UserController(EditUserProfileUseCase editUserProfileUseCase) {
        this.editUserProfileUseCase = editUserProfileUseCase;
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<User> updateProfile(@PathVariable("id") UUID id, @RequestBody Map<String, String> request) {
        String firstName = request.get("firstName");
        String lastName = request.get("lastName");
        String profilePictureUrl = request.get("profilePictureUrl");
        User updatedUser = editUserProfileUseCase.editProfile(id, firstName, lastName, profilePictureUrl);
        return ResponseEntity.ok(updatedUser);
    }
}
