package com.licenta.backend_ai;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Diagnostic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String boala;
    private Double siguranta;
    private LocalDateTime dataScanarii;
    private Long userId;

    public Diagnostic() {
        this.dataScanarii = LocalDateTime.now();
    }
    public Long getId() {return id;}
    public String getBoala() {return boala;}
    public void setBoala(String boala) {this.boala = boala;}
    public Double getSiguranta() {return siguranta;}
    public void setSiguranta(Double siguranta) {this.siguranta = siguranta;}
    public LocalDateTime getDataScanarii() {return dataScanarii;}
    public Long getUserId(){return userId;}
    public void setUserId(Long userId){this.userId = userId;}
}
