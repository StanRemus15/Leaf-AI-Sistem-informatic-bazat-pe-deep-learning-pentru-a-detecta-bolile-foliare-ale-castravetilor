package com.licenta.backend_ai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

@RestController
@RequestMapping("/api/ai-detection")
@CrossOrigin(origins = "*")
public class DiagnosticController {

    private final String PYTHON_PATH = "http://127.0.0.1:8050/diagnostic";

    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private DiagnosticRepository diagnosticRepository;

    @PostMapping("/analiza/")
    public ResponseEntity<String> PozaLaAi(@RequestParam("file") MultipartFile file) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ByteArrayResource pozaPy = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "poza.jpg";
                }
            };
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", pozaPy);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(PYTHON_PATH, requestEntity, String.class);

            String jsonPy = response.getBody();
            System.out.println("JSON primit de la Python: " + jsonPy);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonPy);
            if(root.has("eroare")) {

                return ResponseEntity.ok(jsonPy);
            }
            Diagnostic diagnostic = new Diagnostic();
            diagnostic.setBoala(root.get("boala_detectata").asText());
            diagnostic.setSiguranta(root.get("siguranta").asDouble());

            diagnosticRepository.save(diagnostic);
            return ResponseEntity.ok(jsonPy);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Eroare de comunicare: " + e.getMessage());
        }
    }

    @GetMapping("/istoric")
    public List<Diagnostic> getIstoric() {
        return diagnosticRepository.findAll();
    }
}