package com.licenta.backend_ai;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private String json(String username, String password)
    {
        return "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
    }

    @Test
    void inregistrareReusita() throws Exception
    {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json("testuser","1234")))
                .andExpect(status().isOk())
                .andExpect((ResultMatcher) jsonPath("$.username").value("testuser"))
                .andExpect((ResultMatcher) jsonPath("$.id").exists());
    }

    @Test
    void inregistrareUsernameDuplicat() throws Exception
    {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("duplicat","1234")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("duplicat","5678")))
                .andExpect(status().isBadRequest())
                .andExpect((ResultMatcher) jsonPath("$.eroare").exists());
    }

    @Test
    void inregistrareParolaPreaScurta() throws Exception
    {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("userparola","12")))
                .andExpect(status().isBadRequest())
                .andExpect((ResultMatcher) jsonPath("$.eroare").exists());
    }

    @Test
    void loginReusit() throws Exception
    {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("loginuser","parola123")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("loginuser","parola123")))
                .andExpect(status().isOk())
                .andExpect((ResultMatcher) jsonPath("$.username").value("loginuser"));
    }

    @Test
    void loginParolaGresita() throws Exception
    {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("usergresit","parolacorecta")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("usergresit","parolagresita")))
                .andExpect(status().isUnauthorized())
                .andExpect((ResultMatcher) jsonPath("$.eroare").exists());
    }

}
