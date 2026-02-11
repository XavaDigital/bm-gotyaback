import React, { useState, useEffect } from "react";
import { Upload, message, Image } from "antd";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd";
import type { RcFile } from "antd/es/upload/interface";

interface ImageUploadProps {
  value?: string;
  onChange?: (file: File | null) => void;
  type?: "logo" | "cover";
}

const beforeUpload = (file: RcFile) => {
  const isValidType =
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp" ||
    file.type === "image/jpg";

  if (!isValidType) {
    message.error("You can only upload JPG/PNG/WEBP files!");
    return Upload.LIST_IGNORE;
  }

  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error("Image must be smaller than 5MB!");
    return Upload.LIST_IGNORE;
  }

  return false; // Prevent auto upload, we'll handle it manually
};

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  type = "logo",
}) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);

  // Update preview when value prop changes
  useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  const handleChange: UploadProps["onChange"] = (info) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }

    // Get the actual file object
    const file = (info.file.originFileObj || info.file) as File;

    // Check if it's a valid File object
    if (file && file instanceof File) {
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        setLoading(false);
      };
      reader.readAsDataURL(file);

      // Pass the file to parent

      onChange?.(file);
    } else {
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>
        {type === "logo" ? "Upload Logo" : "Upload Cover"}
      </div>
    </div>
  );

  return (
    <Upload
      name="image"
      listType="picture-card"
      className="image-uploader"
      showUploadList={false}
      beforeUpload={beforeUpload}
      onChange={handleChange}
    >
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt={type}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          preview={false}
        />
      ) : (
        uploadButton
      )}
    </Upload>
  );
};

export default ImageUpload;
