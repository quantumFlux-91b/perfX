package com.perfx.api.application.port.in;

import com.perfx.api.domain.model.User;

public interface RegisterUserUseCase {
    User register(String email, String rawPassword, String firstName, String lastName);
}
