package com.licenta.backend_ai;

import jakarta.persistence.*;

@Entity
@Table(name = "utilizatori")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true,nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    public User() {}

    public Long getId() {return id;}

    public String getUsername() {return username;}
    public String getPasswordHash() {return passwordHash;}
    public void setPasswordHash(String passwordHash) {this.passwordHash = passwordHash;}
    public void setUsername(String username) {this.username = username;}

}
