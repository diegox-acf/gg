package gg.gaming.orders.admin;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Registers the admin-role guard for all {@code /admin/**} routes. */
@Configuration
class AdminWebConfig implements WebMvcConfigurer {

  private final AdminAccessInterceptor adminAccess;

  AdminWebConfig(AdminAccessInterceptor adminAccess) {
    this.adminAccess = adminAccess;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(adminAccess).addPathPatterns("/admin/**");
  }
}
