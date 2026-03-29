package com.example.clothingstore.mapper;

import com.example.clothingstore.dtos.user.request.UserCreationRequest;
import com.example.clothingstore.dtos.user.request.UserUpdateRequest;
import com.example.clothingstore.dtos.user.response.UserResponse;
import com.example.clothingstore.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {
    User toUser(UserCreationRequest request);

    UserResponse toUserResponse(User user);

    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
