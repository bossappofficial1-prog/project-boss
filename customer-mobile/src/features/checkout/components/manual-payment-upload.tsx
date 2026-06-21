import { uploadManualPaymentProof } from "@/features/checkout/services/payment-proof.service";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import * as ImagePicker from "expo-image-picker";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Image,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type UploadStatus = "idle" | "uploading" | "success" | "error";

const MAX_FILE_SIZE = 3 * 1024 * 1024;

interface Props {
  orderId: string;
  onSuccess?: () => void;
}

export function ManualPaymentUpload({ orderId, onSuccess }: Props) {
  const c = useThemeColors();
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: string;
    name: string;
    size: number;
  } | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      setStatus("error");
      setErrorMessage("Ukuran file maksimal 3MB");
      return;
    }

    setSelectedFile({
      uri: asset.uri,
      type: asset.mimeType || "image/jpeg",
      name: asset.fileName || `bukti-${Date.now()}.jpg`,
      size: asset.fileSize || 0,
    });
    setStatus("idle");
    setErrorMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setErrorMessage(null);

    try {
      await uploadManualPaymentProof(orderId, selectedFile);
      setStatus("success");
      setSelectedFile(null);
      onSuccess?.();
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error?.message || "Gagal mengunggah bukti pembayaran");
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setStatus("idle");
    setErrorMessage(null);
  };

  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 8,
        backgroundColor: c.card,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: `${c.primary}08`,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <UploadCloud size={14} color={c.primary} />
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: c.mutedForeground,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Upload Bukti Pembayaran
        </Text>
      </View>

      <View style={{ padding: 14, gap: 10 }}>
        <Text style={{ fontSize: 12, color: c.mutedForeground, lineHeight: 18 }}>
          Unggah bukti transfer/QRIS sebagai konfirmasi pembayaran manual.
        </Text>

        {/* File picker */}
        {!selectedFile && status !== "success" && (
          <Pressable
            onPress={handlePickImage}
            style={{
              paddingVertical: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: c.border,
              backgroundColor: `${c.primary}04`,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Image size={24} color={c.mutedForeground} />
            <Text style={{ fontSize: 12, color: c.mutedForeground }}>
              Ketuk untuk memilih foto
            </Text>
            <Text style={{ fontSize: 10, color: c.mutedForeground }}>
              Maks. 3MB (JPG, PNG)
            </Text>
          </Pressable>
        )}

        {/* Selected file preview */}
        {selectedFile && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 10,
              borderRadius: 10,
              backgroundColor: c.muted,
            }}
          >
            <Image size={20} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: "500", color: c.foreground }} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text style={{ fontSize: 10, color: c.mutedForeground }}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
            <Pressable onPress={handleRemoveFile} hitSlop={8}>
              <X size={16} color={c.mutedForeground} />
            </Pressable>
          </View>
        )}

        {/* Error */}
        {errorMessage && (
          <View
            style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor: "#fef2f2",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 6,
            }}
          >
            <AlertCircle size={14} color="#dc2626" style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 11, color: "#dc2626", flex: 1, lineHeight: 16 }}>
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Success */}
        {status === "success" && !errorMessage && (
          <View
            style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor: "#f0fdf4",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 6,
            }}
          >
            <CheckCircle size={14} color="#16a34a" style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 11, color: "#16a34a", flex: 1, lineHeight: 16 }}>
              Bukti pembayaran berhasil diunggah. Menunggu verifikasi oleh outlet.
            </Text>
          </View>
        )}

        {/* Upload button */}
        {selectedFile && status !== "success" && (
          <Pressable
            onPress={handleUpload}
            disabled={status === "uploading"}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: status === "uploading" ? c.muted : c.primary,
            }}
          >
            {status === "uploading" ? (
              <Loader2 size={16} color={c.primaryForeground} />
            ) : (
              <UploadCloud size={16} color={c.primaryForeground} />
            )}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: status === "uploading" ? c.mutedForeground : c.primaryForeground,
              }}
            >
              {status === "uploading" ? "Mengunggah..." : "Unggah Sekarang"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
