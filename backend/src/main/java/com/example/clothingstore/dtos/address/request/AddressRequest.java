package com.example.clothingstore.dtos.address.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressRequest {
    String receiverName;
    String phone;
    String streetAddress;

    Integer provinceId;
    String provinceName;

    Integer districtId;
    String districtName;

    String wardCode;
    String wardName;

    Boolean isDefault;
}
