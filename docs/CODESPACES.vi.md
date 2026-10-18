# Motion Workbench trong GitHub Codespaces — chỉ cần trình duyệt

Đây là Motion Workbench gốc của Video Shotcraft: 124 recipe cards, 150 shot
variants và mẫu Ink Press. Không thay engine, hiệu ứng hoặc thư viện bằng bản rút
gọn. VS Code web là nơi quản lý file; Workbench mở ở một tab trình duyệt khác.
Không cần CMD, PowerShell hoặc cài Node trên Windows.

## Trước khi tạo Codespace: kiểm tra ngân sách

Tạo hoặc tiếp tục Codespace bắt đầu sử dụng tài nguyên của tài khoản GitHub.
Cấu hình trong repository không thể chặn hóa đơn hoặc thay đổi ngân sách tài
khoản. Pull Request này không tạo Codespace, prebuild hoặc bật thanh toán.

Theo tài liệu GitHub được kiểm tra ngày 19/10/2026:

| Tài khoản cá nhân | Compute đi kèm mỗi tháng | Storage đi kèm |
| --- | --- | --- |
| GitHub Free | 120 core-hours, tương đương khoảng 60 giờ trên máy 2-core | 15 GB-month |
| GitHub Pro | 180 core-hours, tương đương khoảng 90 giờ trên máy 2-core | 20 GB-month |

Ngoài phần đi kèm, giá niêm yết là **0,18 USD/giờ cho máy 2-core** và
**0,07 USD/GB-month lưu trữ**. Thuế, điều kiện tài khoản và giá mới của GitHub có
thể thay đổi. Repository public không làm Codespaces miễn phí vô hạn.

1. Mở avatar GitHub → **Settings → Billing & licensing**; xem usage, phương thức
   thanh toán và budget cho Codespaces. Tên mục có thể khác theo giao diện.
2. Nếu chưa đồng ý chi tiền, không thêm phương thức thanh toán hoặc tăng ngân
   sách. Nếu tài khoản đã có phương thức thanh toán, kiểm tra budget Codespaces
   với **Stop usage when budget limit is reached**; không chỉ đặt cảnh báo.
3. Chỉ tạo Codespace khi đã kiểm tra phần miễn phí còn lại và chấp nhận sử dụng
   phần đó. Không có phương thức thanh toán hợp lệ thì GitHub chặn sử dụng khi
   hết quota; giới hạn tài khoản có thể làm Codespace không tạo được.

Nguồn: [GitHub Codespaces billing](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces),
[budgets](https://docs.github.com/en/billing/how-tos/set-up-budgets),
[pricing calculator](https://github.com/pricing/calculator?feature=codespaces).

## Mở hoàn toàn bằng giao diện web

1. Mở [repository](https://github.com/Trungdung1235/video-shotcraft-Dragan).
2. Trước khi PR được merge, chọn branch **codex/codespaces-workbench** ở danh sách
   branch. Sau khi merge, dùng **main**. Một Codespace cũ chưa có cấu hình này
   cần **Rebuild Container**; tạo Codespace mới đơn giản hơn.
3. Chọn **Code → Codespaces → … → New with options**. Kiểm tra branch và chọn
   máy **2-core / 8 GB RAM / 32 GB storage**, không cần nâng máy để thử mẫu.
   Nhấn **Create codespace** sau khi đã kiểm tra ngân sách ở trên.
4. Chờ container build và cài npm dependencies. Lần đầu lâu hơn những lần mở lại.
   Cấu hình tự liên kết mẫu Ink Press và khởi động Workbench.
5. Tab Workbench thường tự mở. Nếu trình duyệt chặn tab mới, mở **Ports** ở panel
   dưới VS Code web; tìm **5198 / Motion Workbench**, xác nhận **Visibility =
   Private**, rồi bấm biểu tượng quả địa cầu **Open in Browser**. Có thể tìm panel
   bằng menu **View → Terminal**, rồi chọn tab **Ports**; không cần gõ lệnh.
6. Workbench tự nhập mẫu Ink Press nếu đây là lần đầu. Nếu cần nhập lại, chọn
   **Media → Import film: Ink Press · AIFL promo**. Nhập lại có thể thay thế chỉnh
   sửa hiện tại; hãy Export JSON trước.

URL có dạng `https://<tên-codespace>-5198.app.github.dev`. Đây là URL được GitHub
xác thực, không phải website được triển khai công khai. Khi mở lại Codespace đã
dừng, dùng danh sách [github.com/codespaces](https://github.com/codespaces) và
**Open in browser**; Workbench tự khởi động lại.

## Chỉnh sửa, lưu và xuất video

- Nhấn **Play** hoặc phím cách để xem preview; chọn clip trên timeline.
- Trong Inspector, sửa chữ, màu và cỡ chữ của clip có schema. Kéo/trim/đổi speed
  áp dụng được cho các shot. 150 demo giữ implementation gốc; những demo chưa
  khai báo schema chỉ chỉnh thời gian/lớp, không có toàn bộ chữ/màu trong Inspector.
- **Export JSON** tải dự án xuống máy Windows qua trình duyệt. **Import** mở lại
  JSON đã lưu. Autosave nằm trong localStorage của trình duyệt/origin hiện tại,
  không phải bản sao lưu trên GitHub và không tự đồng bộ sang máy khác.
- Nhấn **Export video**, giữ Codespace đang chạy và chờ hoàn tất. Nhấn
  **Download MP4** để tải file về máy ngay trong trình duyệt. Không cần Finder.
  Render dùng Remotion gốc, 1 worker trong Codespaces, không giảm hiệu ứng hoặc
  độ phân giải. Mẫu Ink Press 1080p dài 1.085 frame có SFX gốc, không có BGM.
- File MP4 cũng nằm trong **workbench/exports/** ở Explorer của VS Code web;
  nhấp phải file → **Download**. Sau khi server khởi động lại, lịch sử job trong
  RAM không còn; dùng Explorer để tải MP4 cũ. JSON và MP4 không tự commit/push.

## Tài nguyên và quyền riêng tư

- Cấu hình yêu cầu tối thiểu 2 CPU, 8 GB RAM, 32 GB disk. Đây là mức tối thiểu,
  không khóa bạn ở máy 2-core: kiểm tra lựa chọn trước khi tạo Codespace.
- Preview 3D nhiều lớp có thể không giữ được 30fps trên máy nhỏ. Render chờ từng
  frame nên chậm hơn thời gian thực nhưng vẫn giữ hiệu ứng. Không có cam kết GPU.
- Vite kiểm tra đúng hostname của Codespace; HMR dùng WSS qua proxy HTTPS. Chỉ
  cổng 5198 được cấu hình tự forward; những cổng khác không tự mở.
- GitHub forward cổng ở chế độ **Private mặc định**. Cấu hình không chuyển sang
  Public; hãy kiểm tra cột Visibility khi mở. Không chọn **Public** hoặc **Private
  to Organization**. Chủ Codespace vẫn có thể đổi cài đặt này trong Ports.
- Private hạn chế truy cập bằng xác thực GitHub, không ngăn mã trong repository
  chạy trong container truy cập file. Chỉ dùng code và extension bạn tin cậy;
  không đưa dữ liệu nhạy cảm vào repo public này hoặc commit file media riêng.
- Render chạy trong Codespace, không gửi video tới một dịch vụ render trả phí.
  Dữ liệu dự án nằm trong browser/Codespace và các file bạn chủ động tải xuống.
  Đổi origin, xóa dữ liệu trình duyệt hoặc xóa Codespace có thể làm mất dữ liệu.

Nguồn: [forwarding ports](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace).

## Dừng sử dụng và tránh lưu trữ không cần thiết

1. Export JSON và tải MP4 về máy trước.
2. Mở [github.com/codespaces](https://github.com/codespaces), chọn **… → Stop
   codespace**. Chỉ đóng tab không bảo đảm máy dừng ngay. Compute tính trong thời
   gian máy đang active, kể cả khi bạn không thao tác.
3. Codespace đã dừng vẫn chiếm storage. Khi không cần nữa, tải/commit dữ liệu cần
   giữ rồi chọn **Delete**. Xóa Codespace xóa file chưa lưu ở nơi khác.
4. Có thể đặt **Settings → Codespaces → Default idle timeout** thành 5–15 phút
   để tiết kiệm. Mặc định GitHub là 30 phút; timeout và giới hạn phiên có thể
   ngắt một render dài. Không có cấu hình tài khoản nào bị PR này thay đổi.
5. Custom container, node_modules, render cache và MP4 đều có thể chiếm phần
   storage tính phí. Không bật prebuild chỉ để thử Workbench.

Nguồn: [idle timeout](https://docs.github.com/en/codespaces/setting-your-user-preferences/setting-your-timeout-period-for-github-codespaces),
[stop/start](https://docs.github.com/en/codespaces/developing-in-a-codespace/stopping-and-starting-a-codespace).

## Phạm vi kiểm thử

Kết quả cụ thể nằm trong [báo cáo kiểm thử](CODESPACES-VALIDATION.md) và phần
**Validation** của Pull Request.
Phân biệt kiểm thử container/trình duyệt nội bộ với việc tạo Codespace thực tế:
chưa tạo tài nguyên GitHub có thể phát sinh phí chỉ để chạy kiểm thử. Việc xác
thực GitHub, port proxy Private và quota thực tế cần xác minh khi chủ tài khoản
tự mở Codespace. Không suy ra chúng đã qua chỉ từ một localhost chạy được.

Nếu tab không mở, kiểm tra Ports/Private và build log trước. Nếu container vẫn
đang cài dependencies, chờ hoàn tất. Nếu Export video báo lỗi, xem thông báo của
nút và log **workbench/.dev.log** trong Explorer; không cần đổi cổng sang Public.
