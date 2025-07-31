# Page snapshot

```yaml
- button
- heading "Selamat Datang Kembali" [level=1]
- paragraph: Masuk ke akun Anda untuk melanjutkan
- text: Email
- textbox "contoh@email.com": test@example.com
- text: Password
- textbox "Masukkan password": password
- paragraph: Email atau password salah
- button "Masuk"
- paragraph:
  - text: Belum punya akun?
  - link "Daftar":
    - /url: /auth/register
- img
- button "Go to parent" [disabled]
- button "Open in editor"
- button "Close"
- button "Toggle Nuxt DevTools":
  - img
- text: 299 ms
- button "Toggle Component Inspector":
  - img
```