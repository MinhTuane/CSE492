package com.capstone.mbservices.service;

import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.enums.UserRole;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import com.capstone.mbservices.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId("user-1");
        mockUser.setEmail("john@example.com");
        mockUser.setFirstname("John");
        mockUser.setLastname("Doe");
        mockUser.setPassword("encodedPassword123");
        mockUser.setRole(UserRole.CUSTOMER);
        mockUser.setIsActive(true);
    }

    @Test
    void getUserProfile_Success() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));

        User result = userService.getUserProfile("user-1");

        assertNotNull(result);
        assertEquals("john@example.com", result.getEmail());
        assertEquals("John", result.getFirstname());
        verify(userRepository, times(1)).findById("user-1");
    }

    @Test
    void getUserProfile_NotFound_ThrowsException() {
        when(userRepository.findById("user-invalid")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            userService.getUserProfile("user-invalid");
        });
    }

    @Test
    void updateProfile_Success() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        Map<String, String> updates = Map.of(
            "firstname", "Johnny",
            "phone", "0123456789"
        );

        User updatedUser = userService.updateProfile("user-1", updates);

        assertNotNull(updatedUser);
        assertEquals("Johnny", updatedUser.getFirstname());
        assertEquals("0123456789", updatedUser.getPhone());
        // Lastname should remain unchanged
        assertEquals("Doe", updatedUser.getLastname());
        
        verify(userRepository, times(1)).save(mockUser);
    }

    @Test
    void changePassword_Success() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("oldPass123", "encodedPassword123")).thenReturn(true);
        when(passwordEncoder.encode("newPass123")).thenReturn("newEncodedPass");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        assertDoesNotThrow(() -> {
            userService.changePassword("user-1", "oldPass123", "newPass123");
        });

        assertEquals("newEncodedPass", mockUser.getPassword());
        verify(userRepository, times(1)).save(mockUser);
    }

    @Test
    void changePassword_WrongOldPassword_ThrowsException() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrongOldPass", "encodedPassword123")).thenReturn(false);

        Exception exception = assertThrows(Exception.class, () -> {
            userService.changePassword("user-1", "wrongOldPass", "newPass123");
        });

        verify(userRepository, never()).save(any(User.class));
    }
}
