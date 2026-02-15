package com.example.clothingstore.controller;

import com.example.clothingstore.dto.request.ProductRequest;
import com.example.clothingstore.dto.response.ProductResponse;
import com.example.clothingstore.service.cloudinary.CloudinaryService;
import com.example.clothingstore.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Cho phép Next.js gọi sang (tránh lỗi CORS)
public class ProductController {

    private final ProductService productService;
    private final CloudinaryService cloudinaryService;

    // 1. API Lấy danh sách sản phẩm
    // GET http://localhost:8080/api/v1/products
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts(){
        return ResponseEntity.ok(productService.getAllProducts());
    }

    // 2. API Lấy chi tiết 1 sản phẩm
    // GET http://localhost:8080/api/v1/products/1
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id){
        return ResponseEntity.ok(productService.getProductById(id));
    }

    // 3. API Tìm SKU từ Options (Cho chức năng chọn Màu/Size)
    // POST http://localhost:8080/api/v1/products/1/sku-check
    // Body: [301, 308] (ID của Màu Đỏ, Size M)
    @PostMapping("/{productId}/sku-check")
    public ResponseEntity<Long> getSkuId(@PathVariable Long productId, @RequestBody List<Long> optionValueIds){
        return ResponseEntity.ok(productService.getSkuIdByOptions(productId, optionValueIds));
    }

    // 4. API Tạo sản phẩm (FULL Options + SKU)
    // POST http://localhost:8080/api/v1/products
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }

    // 5. API Cập nhật sản phẩm
    // PUT http://localhost:8080/api/v1/products/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long id, @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    // 6. API Xóa sản phẩm
    // DELETE http://localhost:8080/api/v1/products/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // API Upload ảnh test thử
    // POST http://localhost:8080/api/v1/products/upload-image
    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file){
        try {
            String imageUrl = cloudinaryService.uploadImage(file);
            return ResponseEntity.ok(imageUrl);
        } catch (java.io.IOException e) {
            return ResponseEntity.badRequest().body("Lỗi upload ảnh: " + e.getMessage());
        }
    }


}
