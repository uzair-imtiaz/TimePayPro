import React, { useState } from "react";
import { Upload, Button, Image } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const PictureUpload = ({ setPictureFile }) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  const handlePreview = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <div>Picture: </div>
      <Upload
        beforeUpload={(file) => {
          setPictureFile(file);
          handlePreview(file);
          return false;
        }}
        onRemove={() => {
          setPictureFile(null);
          setPreviewUrl(null);
        }}
        accept="image/*"
        showUploadList={false}
      >
        <Button icon={<UploadOutlined />}>Select Picture</Button>
      </Upload>
      {previewUrl && (
        <div style={{ marginTop: "16px" }}>
          <Image
            src={previewUrl}
            alt="Preview"
            style={{ maxWidth: "100%", maxHeight: "200px" }}
          />
        </div>
      )}
    </div>
  );
};

export default PictureUpload;
