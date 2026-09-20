package com.campusconnect.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FileStorageServiceTest {

    private FileStorageService fileStorageService;

    @TempDir
    Path tempUploadDir;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService();
        ReflectionTestUtils.setField(fileStorageService, "uploadDir", tempUploadDir.toString());
        fileStorageService.init();
    }

    @Test
    @DisplayName("storeFile should save file and return non-empty stored filename")
    void testStoreFileSuccess() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "lecture_notes.pdf",
                "application/pdf",
                "PDF Sample Content".getBytes()
        );

        String storedName = fileStorageService.storeFile(file);
        assertNotNull(storedName);
        assertTrue(storedName.contains("lecture_notes.pdf"));

        Resource resource = fileStorageService.loadFileAsResource(storedName);
        assertNotNull(resource);
        assertTrue(resource.exists());
        assertTrue(resource.isReadable());

        boolean deleted = fileStorageService.deleteFile(storedName);
        assertTrue(deleted);
    }

    @Test
    @DisplayName("storeFile should throw IllegalArgumentException for empty files")
    void testStoreEmptyFileThrowsException() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.pdf",
                "application/pdf",
                new byte[0]
        );

        assertThrows(IllegalArgumentException.class, () -> fileStorageService.storeFile(emptyFile));
    }

    @Test
    @DisplayName("storeFile should reject path traversal characters")
    void testPathTraversalRejection() {
        MockMultipartFile maliciousFile = new MockMultipartFile(
                "file",
                "../secret.pdf",
                "application/pdf",
                "test".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> fileStorageService.storeFile(maliciousFile));
    }

    @Test
    @DisplayName("storeFile should reject disallowed file extensions like .exe or .sh")
    void testDisallowedExtensionRejection() {
        MockMultipartFile executableFile = new MockMultipartFile(
                "file",
                "malware.exe",
                "application/octet-stream",
                "binary".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> fileStorageService.storeFile(executableFile));
    }

    @Test
    @DisplayName("determineContentType should return expected MIME types")
    void testDetermineContentType() {
        assertEquals("application/pdf", fileStorageService.determineContentType("document.pdf"));
        assertEquals("text/plain", fileStorageService.determineContentType("notes.txt"));
        assertEquals("image/png", fileStorageService.determineContentType("diagram.png"));
        assertEquals("application/octet-stream", fileStorageService.determineContentType("unknown.xyz"));
    }
}
