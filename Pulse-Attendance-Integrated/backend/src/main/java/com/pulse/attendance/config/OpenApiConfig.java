package com.pulse.attendance.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI pulseAttendanceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Pulse Attendance API")
                        .version("1.0.0")
                        .description(
                                "Employee attendance management APIs with advanced search, standardized responses, "
                                        + "error handling and JWT Bearer authentication. "
                                        + "Use the Authorize button in Swagger UI to provide your JWT token."
                        ))
                .components(new Components()
                        .addSecuritySchemes(
                                SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name("Authorization")
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description(
                                                "Enter the JWT token returned by the login API. "
                                                        + "Swagger will automatically send it as: "
                                                        + "Authorization: Bearer <token>"
                                        )))
                .addSecurityItem(new SecurityRequirement()
                        .addList(SECURITY_SCHEME_NAME));
    }
}
