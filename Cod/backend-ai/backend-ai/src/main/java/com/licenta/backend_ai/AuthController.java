package com.licenta.backend_ai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Encryption error", e);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || username.trim().length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("eroare", "Username must have at least 3 characters."));
        }
        if (password == null || password.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("eroare", "Password must have at least 4 characters."));
        }
        if (userRepository.existsByUsername(username.trim())) {
            return ResponseEntity.badRequest().body(Map.of("eroare", "This username is already taken."));
        }

        User user = new User();
        user.setUsername(username.trim());
        user.setPasswordHash(hashPassword(password));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("id", user.getId(), "username", user.getUsername()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        Optional<User> userOpt = userRepository.findByUsername(username == null ? "" : username.trim());

        if (userOpt.isEmpty() || !userOpt.get().getPasswordHash().equals(hashPassword(password == null ? "" : password))) {
            return ResponseEntity.status(401).body(Map.of("eroare", "Incorrect username or password."));
        }

        User user = userOpt.get();
        return ResponseEntity.ok(Map.of("id", user.getId(), "username", user.getUsername()));
    }
}