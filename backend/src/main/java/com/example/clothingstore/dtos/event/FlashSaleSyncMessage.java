package com.example.clothingstore.dtos.event;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FlashSaleSyncMessage {
    private Long flashSaleId;
    private Long skuId;
    private int quantity;
}