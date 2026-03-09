package com.example.clothingstore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BrandRequest {

    @NotBlank(message = "Tên thương hiệu không được để trống!")
    @Size(min = 2, max = 100, message = "Tên thương hiệu phải có độ dài từ 2 đến 100 ký tự!")
    private String name;
    private String logo;

    // @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    // private String description;
}