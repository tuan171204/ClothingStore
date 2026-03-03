package com.example.clothingstore.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressResponse {
    Long id;
    String receiverName;
    String phone;
    String streetAddress;
    Integer provinceId;
    String provinceName;
    Integer districtId;
    String districtName;
    String wardCode;
    String wardName;
    boolean isDefault;
}
