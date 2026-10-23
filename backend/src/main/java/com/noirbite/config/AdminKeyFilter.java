package com.noirbite.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Protects admin and write endpoints with a shared secret sent in the X-Admin-Key header.
 * If ADMIN_API_KEY is not set, all protected endpoints are disabled (403) - fail closed.
 */
@Component
public class AdminKeyFilter extends OncePerRequestFilter {
    @Value("${app.admin-key:}")
    private String adminKey;

    private boolean isProtected(HttpServletRequest req) {
        String path = req.getRequestURI();
        String method = req.getMethod();
        if ("OPTIONS".equals(method)) return false;
        if (path.startsWith("/api/admin/")) return true;
        if (path.startsWith("/api/foods") && !"GET".equals(method)) return true;
        return path.matches("/api/orders/\\d+/status");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        if (isProtected(req)) {
            String provided = req.getHeader("X-Admin-Key");
            boolean ok = !adminKey.isBlank() && provided != null && MessageDigest.isEqual(
                    adminKey.getBytes(StandardCharsets.UTF_8), provided.getBytes(StandardCharsets.UTF_8));
            if (!ok) {
                res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                res.setContentType("application/json");
                res.getWriter().write("{\"message\":\"Admin access required\"}");
                return;
            }
        }
        chain.doFilter(req, res);
    }
}
