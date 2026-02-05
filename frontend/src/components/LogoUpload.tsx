import React, { useState } from "react";
import { Upload, message, Image } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps, RcFile, UploadFile } from "antd/es/upload/interface";

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
  const [currentFile, setCurrentFile] = useState<File | undefined>(value);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

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

  const handleChange: UploadProps["onChange"] = async (info) => {
    const { file, fileList: newFileList } = info;

    if (file.status === "removed" || newFileList.length === 0) {
      setPreviewUrl(undefined);
      setCurrentFile(undefined);
      setFileList([]);
      onChange?.(undefined);
      return;
    }

    // Get the actual file object - use originFileObj if available, otherwise use file itself
    const fileObj = (file.originFileObj || file) as File;

    // Check if it's a valid File object
    if (fileObj && fileObj instanceof File) {
      const isValid = await validateFile(fileObj as RcFile);

      if (isValid) {
        const url = URL.createObjectURL(fileObj);
        setPreviewUrl(url);
        setCurrentFile(fileObj);
        setFileList(newFileList);
        onChange?.(fileObj);
      } else {
        // Validation failed, clear the file list
        setFileList([]);
      }
    }
  };

  const uploadProps: UploadProps = {
    name: "logo",
    multiple: false,
    maxCount: 1,
    fileList: fileList,
    beforeUpload: () => false, // Prevent auto upload
    onChange: handleChange,
    onRemove: () => {
      setPreviewUrl(undefined);
      setCurrentFile(undefined);
      setFileList([]);
      onChange?.(undefined);
    },
  };

  return (
    <div>
      {previewUrl ? (
        <div style={{ textAlign: "center" }}>
          <Image
            src={previewUrl}
            alt="Logo preview"
            style={{ maxWidth: 200, maxHeight: 200, marginBottom: 16 }}
          />
          <div>
            <Upload {...uploadProps} showUploadList={true}>
              <a>Change Logo</a>
            </Upload>
          </div>
        </div>
      ) : (
        <Dragger {...uploadProps}>
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

