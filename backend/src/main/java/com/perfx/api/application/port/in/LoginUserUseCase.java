package com.perfx.api.application.port.in;

public interface LoginUserUseCase {
    String login(String username, String rawPassword);
}
