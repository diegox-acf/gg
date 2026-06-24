package gg.gaming.orders.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Guards {@code /admin/**}: the request must carry the {@code admin} role. The BFF is the trust
 * boundary — it validates the Keycloak session and forwards the realm roles as a comma-separated
 * {@code X-User-Roles} header (consistent with the existing {@code X-User-Id} pattern). A request
 * without that role gets 403. See ADR-022 for the trust model and its known limitation (a direct
 * caller on the compose network can forge the header).
 */
@Component
class AdminAccessInterceptor implements HandlerInterceptor {

  static final String ROLES_HEADER = "X-User-Roles";
  static final String ADMIN_ROLE = "admin";

  @Override
  public boolean preHandle(
      HttpServletRequest request, HttpServletResponse response, Object handler) {
    if (!hasAdminRole(request.getHeader(ROLES_HEADER))) {
      throw new AdminForbiddenException();
    }
    return true;
  }

  private static boolean hasAdminRole(String header) {
    if (header == null || header.isBlank()) {
      return false;
    }
    for (String role : header.split(",")) {
      if (ADMIN_ROLE.equalsIgnoreCase(role.trim())) {
        return true;
      }
    }
    return false;
  }
}
