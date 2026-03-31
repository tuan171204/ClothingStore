package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.cart.CartData;
import com.example.clothingstore.dtos.cart.request.CartItemRequest;
import com.example.clothingstore.dtos.cart.response.CartResponse;
import com.example.clothingstore.entity.Inventory;
import com.example.clothingstore.entity.Sku;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.InventoryRepository;
import com.example.clothingstore.repository.SkuRepository;
import com.example.clothingstore.service.CartService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final StringRedisTemplate stringRedisTemplate;
    private final SkuRepository skuRepository;
    private final InventoryRepository inventoryRepository;
    private final ObjectMapper objectMapper;

    private static final String USER_CART_PREFIX   = "cart:user:";
    private static final String GUEST_CART_PREFIX  = "cart:guest:";
    private static final long   USER_CART_TTL_DAYS  = 7;
    private static final long   GUEST_CART_TTL_DAYS = 1;
    private static final String CART_UPDATE_LUA = """
        local key = KEYS[1]
        local skuId = tonumber(ARGV[1])
        local qtyToAdd = tonumber(ARGV[2])
        local maxStock = tonumber(ARGV[3])
        local timestamp = ARGV[4]
        local ttlSeconds = tonumber(ARGV[5])

        local current = redis.call('GET', key)
        local cart

        if current then
            cart = cjson.decode(current)
        else
            cart = { items = {} } -- Tạo object JSON bình thường
        end

        if not cart.items then cart.items = {} end

        local currentQtyInCart = 0
        local itemIndex = -1

        for i, item in ipairs(cart.items) do
            if tonumber(item.skuId) == skuId then
                currentQtyInCart = tonumber(item.quantity)
                itemIndex = i
                break
            end
        end

        if (currentQtyInCart + qtyToAdd) > maxStock then
            return "ERROR_STOCK"
        end

        if itemIndex ~= -1 then
            cart.items[itemIndex].quantity = currentQtyInCart + qtyToAdd
        else
            table.insert(cart.items, {
                skuId = skuId,
                quantity = qtyToAdd,
                addedAt = timestamp
            })
        end

        cart.updatedAt = timestamp

        redis.call('SETEX', key, ttlSeconds, cjson.encode(cart))

        return "SUCCESS"
    """;

    private final RedisScript<String> cartScript = new DefaultRedisScript<>(CART_UPDATE_LUA, String.class);

    // ============================================================
    // PUBLIC API
    // ============================================================

    @Override
    public CartResponse getCart(String userId) {
        CartData cart = loadCart(USER_CART_PREFIX + userId);
        return buildCartResponse(cart, true); // true = re-validate stock
    }

    @Override
    public CartResponse getGuestCart(String sessionId) {
        CartData cart = loadCart(GUEST_CART_PREFIX + sessionId);
        return buildCartResponse(cart, false);
    }

    @Override
    public CartResponse addItem(String userId, CartItemRequest request) {
        return addItemToCart(USER_CART_PREFIX + userId, request, USER_CART_TTL_DAYS);
    }

    @Override
    public CartResponse addItemToGuestCart(String sessionId, CartItemRequest request) {
        return addItemToCart(GUEST_CART_PREFIX + sessionId, request, GUEST_CART_TTL_DAYS);
    }

    @Override
    public CartResponse updateItem(String userId, CartItemRequest request) {
        String key = USER_CART_PREFIX + userId;
        CartData cart = loadCart(key);

        Sku sku = findActiveSku(request.getSkuId());
        int available = getAvailableStock(sku);

        if (request.getQuantity() > available) {
            throw new RuntimeException(
                    "Kho chỉ còn " + available + " sản phẩm cho SKU: " + sku.getCode());
        }

        cart.getItems().stream()
                .filter(i -> i.getSkuId().equals(request.getSkuId()))
                .findFirst()
                .ifPresentOrElse(
                        item -> item.setQuantity(request.getQuantity()),
                        () -> cart.getItems().add(CartData.CartItemData.builder()
                                .skuId(request.getSkuId())
                                .quantity(request.getQuantity())
                                .addedAt(LocalDateTime.now())
                                .build())
                );

        cart.setUpdatedAt(LocalDateTime.now());
        saveCart(key, cart, USER_CART_TTL_DAYS);
        return buildCartResponse(cart, false);
    }

    @Override
    public void removeItem(String userId, Long skuId) {
        String key = USER_CART_PREFIX + userId;
        CartData cart = loadCart(key);
        cart.getItems().removeIf(i -> i.getSkuId().equals(skuId));
        cart.setUpdatedAt(LocalDateTime.now());
        saveCart(key, cart, USER_CART_TTL_DAYS);
    }

    @Override
    public void clearCart(String userId) {
        stringRedisTemplate.delete(USER_CART_PREFIX + userId);
    }

    @Override
    public CartResponse mergeGuestCart(String userId, String sessionId) {
        String guestKey = GUEST_CART_PREFIX + sessionId;
        String userKey  = USER_CART_PREFIX + userId;

        CartData guestCart = loadCart(guestKey);
        if (guestCart.getItems().isEmpty()) return getCart(userId);

        CartData userCart = loadCart(userKey);

        for (CartData.CartItemData guestItem : guestCart.getItems()) {
            Optional<CartData.CartItemData> existing = userCart.getItems().stream()
                    .filter(i -> i.getSkuId().equals(guestItem.getSkuId()))
                    .findFirst();

            if (existing.isPresent()) {
                // Merge: lấy max giữa 2 cart, không vượt stock
                int available = getAvailableStockById(guestItem.getSkuId());
                int merged = Math.min(existing.get().getQuantity() + guestItem.getQuantity(), available);
                existing.get().setQuantity(merged);
            } else {
                userCart.getItems().add(guestItem);
            }
        }

        userCart.setUpdatedAt(LocalDateTime.now());
        saveCart(userKey, userCart, USER_CART_TTL_DAYS);
        stringRedisTemplate.delete(guestKey); // Xóa guest cart sau khi merge
        return buildCartResponse(userCart, true);
    }

    /**
     * Re-validate toàn bộ cart với stock thực tế.
     * Gọi khi: user mở trang cart, user bắt đầu checkout.
     * Trả về CartResponse với stockWarning = true cho item bị ảnh hưởng.
     * Tự động điều chỉnh quantity trong Redis nếu stock thay đổi.
     */
    public CartResponse validateAndSyncCart(String userId) {
        String key = USER_CART_PREFIX + userId;
        CartData cart = loadCart(key);

        if (cart.getItems().isEmpty()) {
            return CartResponse.builder()
                    .items(Collections.emptyList())
                    .totalAmount(BigDecimal.ZERO)
                    .totalItems(0)
                    .build();
        }

        List<Long> skuIds = cart.getItems().stream()
                .map(CartData.CartItemData::getSkuId)
                .collect(Collectors.toList());

        // Batch load để tránh N+1
        Map<Long, Inventory> invMap = inventoryRepository.findBySkuIdIn(skuIds).stream()
                .collect(Collectors.toMap(i -> i.getSku().getId(), i -> i));

        Map<Long, Sku> skuMap = skuRepository.findAllById(skuIds).stream()
                .collect(Collectors.toMap(Sku::getId, s -> s));

        boolean cartModified = false;
        List<CartResponse.CartItemResponse> itemResponses = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        int totalItems = 0;

        for (CartData.CartItemData itemData : cart.getItems()) {
            Sku sku = skuMap.get(itemData.getSkuId());
            if (sku == null || !Boolean.TRUE.equals(sku.getIsActive())) {
                cartModified = true;
                continue; // SKU bị xóa/deactivate → remove khỏi cart
            }

            Inventory inv = invMap.get(itemData.getSkuId());
            int available = inv != null ? inv.getAvailableQuantity() : 0;

            boolean warning = false;
            String warningMsg = null;
            int effectiveQty = itemData.getQuantity();

            if (available == 0) {
                warning = true;
                warningMsg = "\"" + sku.getProduct().getName() + "\" đã hết hàng và đã được xóa khỏi giỏ";
                cartModified = true;
                continue; // Hết hàng → remove
            } else if (effectiveQty > available) {
                warning = true;
                warningMsg = "Số lượng \"" + sku.getProduct().getName()
                        + "\" đã thay đổi. Hiện chỉ còn " + available + " sản phẩm.";
                effectiveQty = available;
                itemData.setQuantity(available); // Điều chỉnh trong Redis data
                cartModified = true;
            }

            String variantName = buildVariantName(sku);
            BigDecimal subtotal = sku.getPrice().multiply(BigDecimal.valueOf(effectiveQty));

            itemResponses.add(CartResponse.CartItemResponse.builder()
                    .skuId(sku.getId())
                    .productId(sku.getProduct() != null ? sku.getProduct().getId() : null)
                    .productName(sku.getProduct() != null ? sku.getProduct().getName() : "")
                    .skuCode(sku.getCode())
                    .variantName(variantName)
                    .thumbnailUrl(sku.getImgUrl() != null ? sku.getImgUrl()
                            : (sku.getProduct() != null ? sku.getProduct().getThumbnail() : null))
                    .quantity(effectiveQty)
                    .price(sku.getPrice())
                    .subtotal(subtotal)
                    .stockAvailable(available)
                    .stockWarning(warning)
                    .warningMessage(warningMsg)
                    .build());

            totalAmount = totalAmount.add(subtotal);
            totalItems += effectiveQty;
        }

        // Nếu cart bị modify → save lại Redis với data đã điều chỉnh
        if (cartModified) {
            // Chỉ giữ lại items còn hàng
            List<Long> validSkuIds = itemResponses.stream()
                    .map(CartResponse.CartItemResponse::getSkuId)
                    .collect(Collectors.toList());
            cart.getItems().removeIf(i -> !validSkuIds.contains(i.getSkuId()));
            cart.setUpdatedAt(LocalDateTime.now());
            saveCart(key, cart, USER_CART_TTL_DAYS);
        }

        return CartResponse.builder()
                .items(itemResponses)
                .totalAmount(totalAmount)
                .totalItems(totalItems)
                .build();
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private CartResponse addItemToCart(String key, CartItemRequest request, long ttlDays) {
        Sku sku = findActiveSku(request.getSkuId());
        int available = getAvailableStock(sku);

        if (available <= 0) {
            throw new RuntimeException("Sản phẩm '" + sku.getCode() + "' đã hết hàng");
        }

        // Chuẩn bị tham số cho Lua
        String timestamp = LocalDateTime.now().toString();
        long ttlSeconds = TimeUnit.DAYS.toSeconds(ttlDays);
        String className = CartData.class.getName();

        // Thực thi Lua Script
        String result = stringRedisTemplate.execute(
                cartScript,
                Collections.singletonList(key),
                String.valueOf(request.getSkuId()),
                String.valueOf(request.getQuantity()),
                String.valueOf(available),
                timestamp,
                String.valueOf(ttlSeconds)
        );

        if ("ERROR_STOCK".equals(result)) {
            throw new RuntimeException("Kho chỉ còn " + available + " sản phẩm. Số lượng trong giỏ vượt giới hạn.");
        }

        // Load lại Cart từ Redis để trả về (lúc này đã an toàn vì write đã xong)
        CartData updatedCart = loadCart(key);
        return buildCartResponse(updatedCart, false);
    }

    private CartData loadCart(String key) {
        try {
            String rawJson = stringRedisTemplate.opsForValue().get(key);
            if (rawJson == null) return CartData.builder().items(new ArrayList<>()).build();
            // Dùng readValue thay vì convertValue
            return objectMapper.readValue(rawJson, CartData.class);
        } catch (Exception e) {
            log.warn("Lỗi load cart từ Redis key={}: {}", key, e.getMessage());
            return CartData.builder().items(new ArrayList<>()).build();
        }
    }

    private void saveCart(String key, CartData cart, long ttlDays) {
        try {
            String json = objectMapper.writeValueAsString(cart);
            stringRedisTemplate.opsForValue().set(key, json, ttlDays, TimeUnit.DAYS);
        } catch (Exception e) {
            log.error("Lỗi lưu cart vào Redis key={}", key, e);
        }
    }

    /**
     * Build CartResponse từ CartData, có thể re-validate stock.
     * Nếu stock thay đổi: tự động điều chỉnh quantity và đặt stockWarning = true.
     */
    private CartResponse buildCartResponse(CartData cart, boolean revalidateStock) {
        List<CartResponse.CartItemResponse> itemResponses = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        int totalItems = 0;

        // Batch load SKUs để tránh N+1
        List<Long> skuIds = cart.getItems().stream()
                .map(CartData.CartItemData::getSkuId)
                .collect(Collectors.toList());

        Map<Long, Sku> skuMap = skuRepository.findAllById(skuIds).stream()
                .collect(Collectors.toMap(Sku::getId, s -> s));

        Map<Long, Integer> stockMap = new HashMap<>();
        if (revalidateStock) {
            inventoryRepository.findAll().stream()
                    .filter(inv -> skuIds.contains(inv.getSku().getId()))
                    .forEach(inv -> stockMap.put(inv.getSku().getId(), inv.getAvailableQuantity()));
        }

        for (CartData.CartItemData itemData : cart.getItems()) {
            Sku sku = skuMap.get(itemData.getSkuId());
            if (sku == null || !Boolean.TRUE.equals(sku.getIsActive())) continue;

            int effectiveQty = itemData.getQuantity();
            boolean warning = false;
            String warningMsg = null;

            if (revalidateStock && stockMap.containsKey(sku.getId())) {
                int available = stockMap.get(sku.getId());
                if (available <= 0) {
                    warningMsg = "Sản phẩm đã hết hàng";
                    warning = true;
                    effectiveQty = 0;
                } else if (effectiveQty > available) {
                    warningMsg = "Kho chỉ còn " + available + " sản phẩm, đã điều chỉnh số lượng";
                    warning = true;
                    effectiveQty = available;
                    itemData.setQuantity(available); // Tự động điều chỉnh
                }
            }

            if (effectiveQty == 0) continue; // Bỏ qua item hết hàng

            String variantName = buildVariantName(sku);
            BigDecimal subtotal = sku.getPrice().multiply(BigDecimal.valueOf(effectiveQty));

            itemResponses.add(CartResponse.CartItemResponse.builder()
                    .skuId(sku.getId())
                    .productId(sku.getProduct() != null ? sku.getProduct().getId() : null)
                    .productName(sku.getProduct() != null ? sku.getProduct().getName() : "")
                    .skuCode(sku.getCode())
                    .variantName(variantName)
                    .thumbnailUrl(sku.getImgUrl() != null ? sku.getImgUrl()
                            : (sku.getProduct() != null ? sku.getProduct().getThumbnail() : null))
                    .quantity(effectiveQty)
                    .price(sku.getPrice())
                    .subtotal(subtotal)
                    .stockAvailable(stockMap.getOrDefault(sku.getId(), sku.getStockQuantity()))
                    .stockWarning(warning)
                    .warningMessage(warningMsg)
                    .build());

            totalAmount = totalAmount.add(subtotal);
            totalItems += effectiveQty;
        }

        return CartResponse.builder()
                .items(itemResponses)
                .totalAmount(totalAmount)
                .totalItems(totalItems)
                .build();
    }

    private Sku findActiveSku(Long skuId) {
        Sku sku = skuRepository.findById(skuId)
                .orElseThrow(() -> new AppException(ErrorCode.SKU_NOT_FOUND));
        if (!Boolean.TRUE.equals(sku.getIsActive())) {
            throw new RuntimeException("SKU này hiện không còn kinh doanh");
        }
        return sku;
    }

    private int getAvailableStock(Sku sku) {
        return inventoryRepository.findBySkuId(sku.getId())
                .map(Inventory::getAvailableQuantity)
                .orElse(sku.getStockQuantity() != null ? sku.getStockQuantity() : 0);
    }

    private int getAvailableStockById(Long skuId) {
        return inventoryRepository.findBySkuId(skuId)
                .map(Inventory::getAvailableQuantity)
                .orElse(0);
    }

    private String buildVariantName(Sku sku) {
        if (sku.getValues() == null || sku.getValues().isEmpty()) return sku.getCode();
        return sku.getValues().stream()
                .map(v -> v.getOptionValue().getValue())
                .collect(Collectors.joining(" - "));
    }
}