import React, { useState } from "react";
import { Upload, message, Image } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps, RcFile } from "antd/es/upload/interface";

const { Dragger } = Upload;

interface LogoUploadProps {
  value?: File;
  onChange?: (file: File | undefined) => void;
  maxSize?: number; // MB
  minDimensions?: { width: number; height: number };
}

const LogoUpload: React.FC<LogoUploadProps> = ({
  value,
  onChange,
  maxSize = 2,
  minDimensions = { width: 200, height: 200 },
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    value ? URL.createObjectURL(value) : undefined
  );
  const [fileList, setFileList] = useState<any[]>([]);

  const validateFile = (file: RcFile): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check file type
      const isValidType =
        file.type === "image/png" ||
        file.type === "image/jpeg" ||
        file.type === "image/svg+xml";

      if (!isValidType) {
        message.error("You can only upload PNG, JPG, or SVG files!");
        resolve(false);
        return;
      }

      // Check file size
      const isValidSize = file.size / 1024 / 1024 < maxSize;
      if (!isValidSize) {
        message.error(`Image must be smaller than ${maxSize}MB!`);
        resolve(false);
        return;
      }

      // Check dimensions (skip for SVG)
      if (file.type !== "image/svg+xml") {
        const img = new window.Image();
        img.onload = () => {
          const isValidDimensions =
            img.width >= minDimensions.width &&
            img.height >= minDimensions.height;

          if (!isValidDimensions) {
            message.error(
              `Image must be at least ${minDimensions.width}x${minDimensions.height}px!`
            );
            resolve(false);
            return;
          }

          // Warn if not square
          if (img.width !== img.height) {
            message.warning(
              "For best results, use a square image (same width and height)"
            );
          }

          resolve(true);
        };
        img.onerror = () => {
          message.error("Failed to load image");
          resolve(false);
        };
        img.src = URL.createObjectURL(file);
      } else {
        // SVG files pass validation
        resolve(true);
      }
    });
  };

  const handleBeforeUpload = async (file: RcFile) => {
    const isValid = await validateFile(file);
    if (isValid) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFileList([file]);
      onChange?.(file as File);
    }
    return false; // Prevent auto upload
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    setFileList([]);
    onChange?.(undefined);
  };

  const uploadProps: UploadProps = {
    name: "logo",
    multiple: false,
    maxCount: 1,
    fileList: fileList,
    beforeUpload: handleBeforeUpload,
    onRemove: handleRemove,
  };

  return (
    <div>
      {previewUrl ? (
        <div style={{ textAlign: "center" }}>
          <Image
            src={previewUrl}
            alt="Logo preview"
            style={{ maxWidth: 200, maxHeight: 200, marginBottom: 16 }}
            preview={true}
          />
          <div
            style={{ display: "flex", gap: "12px", justifyContent: "center" }}
          >
            <Upload {...uploadProps} showUploadList={false}>
              <a style={{ cursor: "pointer" }}>Change Logo</a>
            </Upload>
            <a
              style={{ cursor: "pointer", color: "#ff4d4f" }}
              onClick={handleRemove}
            >
              Remove
            </a>
          </div>
        </div>
      ) : (
        <Dragger {...uploadProps} showUploadList={false}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag logo file to this area to upload
          </p>
          <p className="ant-upload-hint">
            PNG, JPG, or SVG • Max {maxSize}MB • Min {minDimensions.width}x
            {minDimensions.height}px
          </p>
        </Dragger>
      )}
    </div>
  );
};

export default LogoUpload;
