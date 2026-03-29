package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.address.request.AddressRequest;
import com.example.clothingstore.dtos.address.response.AddressResponse;
import com.example.clothingstore.dtos.ApiResponse;
import com.example.clothingstore.service.impl.AddressService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/addresses")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AddressController {
    AddressService addressService;

    @GetMapping
    public ApiResponse<List<AddressResponse>> getAllMyAddresses(){
        return ApiResponse.<List<AddressResponse>>builder()
                .result(addressService.getAllMyAddresses())
                .build();
    }

    @PostMapping
    public ApiResponse<AddressResponse> addNewAddress(@RequestBody AddressRequest request){
        return ApiResponse.<AddressResponse>builder()
                .result(addressService.addNewAddress(request))
                .build();
    }

    @GetMapping("/default")
    public ApiResponse<AddressResponse> getMyDefaultAddress(){
        return ApiResponse.<AddressResponse>builder()
                .result(addressService.getMyDefaultAddress())
                .build();
    }

    @PostMapping("/default")
    public ApiResponse<AddressResponse> saveDefaultAddress(@RequestBody AddressRequest request){
        return ApiResponse.<AddressResponse>builder()
                .result(addressService.saveMyDefaultAddress(request))
                .build();
    }
}
