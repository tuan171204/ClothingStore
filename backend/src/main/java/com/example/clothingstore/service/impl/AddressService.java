package com.example.clothingstore.service.impl;

import com.example.clothingstore.dto.request.AddressRequest;
import com.example.clothingstore.dto.response.AddressResponse;
import com.example.clothingstore.entity.User;
import com.example.clothingstore.entity.address.Address;
import com.example.clothingstore.mapper.AddressMapper;
import com.example.clothingstore.repository.AddressRepository;
import com.example.clothingstore.repository.UserRepository;
import com.example.clothingstore.repository.address.DistrictRepository;
import com.example.clothingstore.repository.address.ProvinceRepository;
import com.example.clothingstore.repository.address.WardRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AddressService {
    AddressRepository addressRepository;
    UserRepository userRepository;
    AddressMapper addressMapper;

    // Lấy User đang đăng nhập từ JWT Token
    private User getCurrentUser(){
        var context = SecurityContextHolder.getContext();
        String userName = context.getAuthentication().getName();
        return userRepository.findByUsername(userName).orElseThrow(
                () -> new RuntimeException("User not found !")
        );
    }

    // 1. API lấy địa chỉ mặc định của User hiện tại
    public AddressResponse getMyDefaultAddress(){
        User user = getCurrentUser();
        Optional<Address> addressOpt = addressRepository.findByUserAndIsDefaultTrue(user);

        return addressOpt.map(addressMapper::toAddressResponse).orElse(null);
    }

    // 2. API Lưu hoặc Cập nhật địa chỉ mặc định
    public AddressResponse saveMyDefaultAddress(AddressRequest request){
        User user = getCurrentUser();

    // Kiểm tra xem user đã có địa chỉ mặc định chưa
        Optional<Address> existingDefaultOpt = addressRepository.findByUserAndIsDefaultTrue(user);

        Address address;
        if (existingDefaultOpt.isPresent()){
            address = existingDefaultOpt.get();
        }
        else {
            address = addressMapper.toAddress(request);
            address.setUser(user);
        }

        Address savedAddress = addressRepository.save(address);
        return addressMapper.toAddressResponse(address);
    }

    // 3. API Lấy TẤT CẢ địa chỉ của User hiện tại
    public List<AddressResponse> getAllMyAddresses() {
        User user = getCurrentUser();
        List<Address> addresses = addressRepository.findByUser(user);
        return addresses.stream()
                .map(addressMapper::toAddressResponse)
                .collect(Collectors.toList());
    }

    // 4. API Thêm địa chỉ mới vào Sổ địa chỉ
    @Transactional
    public AddressResponse addNewAddress(AddressRequest request) {
        User user = getCurrentUser();
        List<Address> existingAddresses = addressRepository.findByUser(user);

        // Nếu user tick chọn "Đặt làm mặc định" HOẶC đây là địa chỉ đầu tiên của user
        boolean isFirstAddress = existingAddresses.isEmpty();
        boolean shouldBeDefault = (request.getIsDefault() != null && request.getIsDefault()) || isFirstAddress;

        if (shouldBeDefault) {
            // Hủy mặc định của tất cả các địa chỉ cũ
            for (Address addr : existingAddresses) {
                addr.setDefault(false);
            }
            addressRepository.saveAll(existingAddresses);
        }

        // Tạo địa chỉ mới
        Address address = addressMapper.toAddress(request);
        address.setUser(user);
        address.setDefault(shouldBeDefault);

        Address savedAddress = addressRepository.save(address);
        return addressMapper.toAddressResponse(savedAddress);
    }

}
