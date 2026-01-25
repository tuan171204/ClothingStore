package com.example.clothingstore.dto.ghtk;
import lombok.Data;
import java.util.List;

@Data
public class GhtkResponse<T> {
    private boolean success;
    private String message;
    private List<T> data; // List Tỉnh hoặc Huyện
}