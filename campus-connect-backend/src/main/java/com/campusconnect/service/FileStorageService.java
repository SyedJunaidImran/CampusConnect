package com.campusconnect.service;

import com.campusconnect.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * FileStorageService — handles local storage, validation, retrieval, and deletion of study material files.
 *
 * SAFETY FEATURES:
 * - Extension and MIME type validation against an allowed whitelist.
 * - Path traversal protection using path normalization and security checks.
 * - UUID-prefixed file naming to prevent collisions and overwrites on disk.
 */
@Service
public class FileStorageService implements StorageService {

    @Value("${app.upload.dir:uploads/study-materials}")
    private String uploadDir;

    private Path fileStorageLocation;

    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
            "pdf", "doc", "docx", "ppt", "pptx", "txt", "png", "jpg", "jpeg", "zip", "xls", "xlsx"
    ));

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(this.uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create directory for upload storage at: " + this.fileStorageLocation, ex);
        }
    }

    /**
     * Stores a MultipartFile safely and returns the unique stored file name.
     */
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store an empty file");
        }

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "document"
        );

        // Path traversal check
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new IllegalArgumentException("Filename contains invalid path sequence: " + originalFilename);
        }

        // Extension check
        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported file type: ." + extension +
                    ". Allowed types: " + String.join(", ", ALLOWED_EXTENSIONS));
        }

        // Generate collision-proof file name
        String storedFileName = UUID.randomUUID().toString() + "_" + originalFilename;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return storedFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file " + originalFilename, ex);
        }
    }

    /**
     * Stores binary content directly (useful for seeding or programmatic generation).
     */
    public String storeBytes(byte[] content, String originalFilename) {
        String cleanName = StringUtils.cleanPath(originalFilename);
        String storedFileName = UUID.randomUUID().toString() + "_" + cleanName;
        try {
            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
            Files.write(targetLocation, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            return storedFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store seeded file " + originalFilename, ex);
        }
    }

    /**
     * Loads a file from disk as a Spring Resource.
     */
    public Resource loadFileAsResource(String storedFileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(storedFileName).normalize();

            // Validate that filePath is still within storage location (path traversal safeguard)
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new SecurityException("Access to path outside upload directory is forbidden");
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found or unreadable: " + storedFileName);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Invalid file path: " + storedFileName);
        }
    }

    /**
     * Deletes a stored file from disk.
     */
    public boolean deleteFile(String storedFileName) {
        if (storedFileName == null || storedFileName.isBlank()) {
            return false;
        }
        try {
            Path filePath = this.fileStorageLocation.resolve(storedFileName).normalize();
            if (filePath.startsWith(this.fileStorageLocation)) {
                return Files.deleteIfExists(filePath);
            }
            return false;
        } catch (IOException ex) {
            return false;
        }
    }

    /**
     * Determines content MIME type from filename.
     */
    public String determineContentType(String fileName) {
        String ext = getFileExtension(fileName).toLowerCase();
        switch (ext) {
            case "pdf": return "application/pdf";
            case "doc": return "application/msword";
            case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "ppt": return "application/vnd.ms-powerpoint";
            case "pptx": return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "xls": return "application/vnd.ms-excel";
            case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "txt": return "text/plain";
            case "png": return "image/png";
            case "jpg":
            case "jpeg": return "image/jpeg";
            case "zip": return "application/zip";
            default: return "application/octet-stream";
        }
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0 && dotIndex < filename.length() - 1) {
            return filename.substring(dotIndex + 1);
        }
        return "";
    }
}
