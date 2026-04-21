package com.licenta.backend_ai;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestClient;

import java.io.IOException;

@RestController
@RequestMapping("/api/ai-detection")
@CrossOrigin(origins = "*")

public class DiagnosticController {

    private final String PYTHON_PATH = "http://127.0.0.1:8000/diagnostic/";
    private final RestClient restClient = RestClient.create();

    @PostMapping("/analiza/")
    public ResponseEntity<String> PozaLaAi(@RequestParam("file") MultipartFile file) throws IOException {

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
            return ResponseEntity.ok(response.getBody());
        }
        catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

}
