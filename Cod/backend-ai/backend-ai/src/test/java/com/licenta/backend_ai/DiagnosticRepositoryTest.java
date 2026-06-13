package com.licenta.backend_ai;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class DiagnosticRepositoryTest {

    @Autowired
    private DiagnosticRepository diagnosticRepository;

    private Diagnostic diagnostic(String boala,double siguranta,Long userId)
    {
        Diagnostic d = new Diagnostic();
        d.setBoala(boala);
        d.setSiguranta(siguranta);
        d.setUserId(userId);
        return d;
    }

    @Test
    void istoriculEsteSeparatDeUtilizator()
    {
        diagnosticRepository.save(diagnostic("Anthracnose",82.5,1L));
        diagnosticRepository.save(diagnostic("Healthy",96.0,1L));
        diagnosticRepository.save(diagnostic("Downy Mildew",71.0,2L));

        List<Diagnostic> istoricUser1 = diagnosticRepository.findByUserId(1L);
        List<Diagnostic> istoricUser2 = diagnosticRepository.findByUserId(2L);

        assertEquals(2, istoricUser1.size());
        assertEquals(1, istoricUser2.size());

        assertEquals("Downy Mildew", istoricUser2.get(0).getBoala());

        assertTrue(istoricUser1.stream().noneMatch(d->d.getUserId().equals(2L)));
    }

    @Test
    void utilizatorFaraScanariPimesteListaGoala()
    {
        diagnosticRepository.save(diagnostic("Healthy",95.0,1L));

        List<Diagnostic> istoric = diagnosticRepository.findByUserId(99L);
        assertTrue(istoric.isEmpty());
    }

    @Test
    void dataScanariiEsteCompletataAutomat() {
        Diagnostic salvat = diagnosticRepository.save(diagnostic("Healthy", 95.0, 1L));
        assertNotNull(salvat.getDataScanarii());
        assertNotNull(salvat.getId());
    }
}
