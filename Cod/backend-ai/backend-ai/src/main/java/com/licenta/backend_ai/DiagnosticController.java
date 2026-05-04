package com.licenta.backend_ai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestClient;
import org.springframework.beans.factory.annotation.Autowire;

import com.fasterxml.jackson.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/ai-detection")
@CrossOrigin(origins = "*")

public class DiagnosticController {

    private final String PYTHON_PATH = "http://127.0.0.1:8050/diagnostic";
    private final RestClient restClient = RestClient.create();

    @Autowired
    private DiagnosticRepository diagnosticRepository;

    @PostMapping("/analiza/")
    public ResponseEntity<String> PozaLaAi(@RequestParam("file") MultipartFile file) {

        try {
            ByteArrayResource pozaPy = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "poza_test.jpg";
                }
            };
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", pozaPy);

            ResponseEntity<String> response = restClient.post()
                    .uri(PYTHON_PATH)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .toEntity(String.class);
            String jsonPy = response.getBody();
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonPy);

            Diagnostic diagnostic = new Diagnostic();
            diagnostic.setBoala(root.get("boala").asText());
            diagnostic.setSiguranta(root.get("siguranta").asDouble());

            diagnosticRepository.save(diagnostic);
            return ResponseEntity.ok(response.getBody());
        }
        catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
    @GetMapping("/istoric")
    public List<Diagnostic> getIstoric()
    {
        return diagnosticRepository.findAll();
    }
}

