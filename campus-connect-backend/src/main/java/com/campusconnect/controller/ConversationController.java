package com.campusconnect.controller;

import com.campusconnect.dto.request.SendMessageRequest;
import com.campusconnect.dto.request.StartConversationRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.ConversationResponse;
import com.campusconnect.dto.response.EligibleRecipientResponse;
import com.campusconnect.dto.response.MessageResponse;
import com.campusconnect.service.ConversationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Student-Faculty Conversations and Messages.
 * Accessible under both /api/conversations and /api/messages.
 */
@RestController
@RequestMapping({"/api/conversations", "/api/messages"})
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    /**
     * GET /api/conversations
     * Retrieve all conversations for the authenticated user.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(Authentication authentication) {
        List<ConversationResponse> conversations = conversationService.getConversationsForUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Conversations retrieved successfully", conversations));
    }

    /**
     * GET /api/conversations/recipients
     * Retrieve authorized recipients list based on user role and course enrollments/assignments.
     */
    @GetMapping("/recipients")
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<EligibleRecipientResponse>>> getEligibleRecipients(Authentication authentication) {
        List<EligibleRecipientResponse> recipients = conversationService.getEligibleRecipients(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Eligible recipients retrieved successfully", recipients));
    }

    /**
     * GET /api/conversations/unread-count
     * Retrieve total unread incoming messages count for current user.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(Authentication authentication) {
        long unreadCount = conversationService.getUnreadCount(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", Map.of("unreadCount", unreadCount)));
    }

    /**
     * GET /api/conversations/{id}
     * Retrieve single conversation details.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY')")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversationById(
            @PathVariable Long id,
            Authentication authentication) {

        ConversationResponse response = conversationService.getConversationById(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Conversation retrieved successfully", response));
    }

    /**
     * GET /api/conversations/{id}/messages
     * Retrieve message history for a conversation and auto-mark incoming messages as read.
     */
    @GetMapping("/{id}/messages")
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY')")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getConversationMessages(
            @PathVariable Long id,
            Authentication authentication) {

        List<MessageResponse> messages = conversationService.getConversationMessages(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Messages retrieved successfully", messages));
    }

    /**
     * POST /api/conversations
     * Start a new conversation (or reuse existing) with an initial message.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY')")
    public ResponseEntity<ApiResponse<ConversationResponse>> startConversation(
            @Valid @RequestBody StartConversationRequest request,
            Authentication authentication) {

        ConversationResponse response = conversationService.startConversation(authentication.getName(), request);
        return new ResponseEntity<>(ApiResponse.success("Conversation started successfully", response), HttpStatus.CREATED);
    }

    /**
     * POST /api/conversations/{id}/messages
     * Send a new message in an existing conversation.
     */
    @PostMapping("/{id}/messages")
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY')")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request,
            Authentication authentication) {

        MessageResponse response = conversationService.sendMessage(authentication.getName(), id, request);
        return new ResponseEntity<>(ApiResponse.success("Message sent successfully", response), HttpStatus.CREATED);
    }

    /**
     * POST /api/conversations/{id}/read
     * Mark messages in a conversation as read.
     */
    @PostMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY')")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        conversationService.markMessagesAsRead(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Conversation marked as read", null));
    }
}
