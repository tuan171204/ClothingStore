package com.example.clothingstore.dto.ghtk;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class GhtkLocationDTO {
    // GHTK trả về field tên là "id" và "name"
    private Long id; // Đây chính là ghtk_id
    private String name;

    @JsonProperty("province_id") // Trường này có khi lấy Huyện
    private Long provinceId;

    @JsonProperty("district_id") // Trường này có khi lấy Xã
    private Long districtId;
}