package com.campusconnect.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * StorageService abstraction for managing uploaded files and resources.
 *
 * Provides a uniform contract for local disk storage (default FileStorageService)
 * and future cloud object storage implementations (AWS S3, Cloudinary, GCP Storage).
 */
public interface StorageService {

    /**
     * Store an uploaded multipart file securely and return the unique stored identifier.
     */
    String storeFile(MultipartFile file);

    /**
     * Store raw byte content directly (useful for seeding or programmatic generation).
     */
    String storeBytes(byte[] content, String originalFilename);

    /**
     * Load a stored file by its identifier as a Spring Resource.
     */
    Resource loadFileAsResource(String storedFileName);

    /**
     * Delete a stored file by its identifier.
     */
    boolean deleteFile(String storedFileName);

    /**
     * Determine MIME content type from filename.
     */
    String determineContentType(String fileName);
}
