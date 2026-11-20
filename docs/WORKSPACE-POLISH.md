# Sửa tự cuộn và tinh chỉnh workspace

Nhánh `fix/intake-scroll-alert-polish`, kế thừa `feat/scamgraph-html-fidelity` tại `8b50ca7`.

- Sửa lỗi bước Sự việc: effect trước đây phụ thuộc `errors`, nên mỗi lần xóa lỗi của một trường khi gõ lại cuộn đến thông báo nếu còn lỗi khác. Nay effect chỉ chạy khi có lần bấm Tiếp tục/Gửi không hợp lệ; xử lý khung render và reduced motion. Không đổi quy tắc kiểm tra hoặc nội dung dữ liệu.
- Cảnh báo: giữ nguyên handler mở modal, lọc mức độ, căn cứ, nguồn, sơ đồ và tạo hồ sơ. Thẻ có khoảng cách đều, viền chọn không đổi chiều rộng, hover màu/viền nhẹ, giảm blur, modal fade 150–180ms, bỏ chuyển động trượt của toàn trang cảnh báo. Khi vào cảnh báo, đưa viewport về đầu trước khi vẽ để tránh giữ vị trí cuộn từ trang trước. Vòng điểm dùng màu theo mức rủi ro, không đổi điểm.
- Cỡ chữ chỉ áp dụng trong `.app-shell`: tiêu đề 32→30px, tiêu đề khối 23→21px, chữ 16→15px, chữ bảng 15→14px; chú thích không dưới 13px. Giữ chiều cao điều khiển. Không dùng zoom toàn trang.
- Không sửa `Login.tsx`, `login.css`, `BrandMark.tsx`, `sample-theme.css` hoặc bảng/hiệu ứng login. Bản login đang có được giữ nguyên so với base; không thay mẫu khác.

Kiểm tra: TypeScript/build đạt; test mới ở 1440×900 và 1280×720 kiểm tra cuộn đúng một lần khi xác nhận lỗi, không gọi cuộn khi gõ tiếp dù vẫn còn lỗi khác, nội dung nháp giữ nguyên; cảnh báo sáng/tối, modal/Escape, lọc và dữ liệu nguồn; cỡ chữ và overflow. Hồi quy browser, edge và intake đạt: PA-013 → xác nhận 4 phản ánh/60 triệu → hồ sơ/báo cáo, CUM-002 và HS-002 độc lập, lưu trạng thái, vai trò và lỗi lưu. Bằng chứng ở `docs/polish-review/`.

Chạy Node 24, pnpm 11.25.0: `pnpm install --frozen-lockfile`, `pnpm dev --host 0.0.0.0`. Kiểm tra: `pnpm exec tsc --noEmit`, `pnpm build`. Test mới: `DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE=/workspace/.test-tools/node_modules/playwright node tests/workspace-polish.cjs` (máy khác cần Playwright/Chromium tương ứng).

Chỉ kiểm tra Chromium ở hai kích thước desktop trên; chưa kiểm tra Safari/Firefox. Không merge hoặc triển khai Production.
