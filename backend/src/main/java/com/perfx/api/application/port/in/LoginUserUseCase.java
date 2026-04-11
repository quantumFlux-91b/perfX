package com.perfx.api.application.port.in;

import com.perfx.api.domain.model.User;

public interface LoginUserUseCase {
    User login(String email, String rawPassword);
}
