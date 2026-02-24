package com.example.clothingstore.service;

import com.example.clothingstore.dto.request.UserCreationRequest;
import com.example.clothingstore.dto.request.UserUpdateRequest;
import com.example.clothingstore.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse createUser(UserCreationRequest request);

    List<UserResponse> getUsers();

    UserResponse getUser(String userId);

    UserResponse updateUser(UserUpdateRequest request, String userId);

    void deleteUser(String userId);

    UserResponse getMyInfo();

//    UserResponse upgradeMyAccount();
}
