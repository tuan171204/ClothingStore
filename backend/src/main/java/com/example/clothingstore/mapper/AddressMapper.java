package com.example.clothingstore.mapper;

import com.example.clothingstore.dto.request.AddressRequest;
import com.example.clothingstore.dto.response.AddressResponse;
import com.example.clothingstore.entity.address.Address;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface AddressMapper {
    AddressResponse toAddressResponse(Address address);

    Address toAddress(AddressRequest addressRequest);
}
