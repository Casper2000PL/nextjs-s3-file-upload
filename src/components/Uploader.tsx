"use client";

import React, { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const Uploader = () => {
  const [files, setFiles] = useState<
    Array<{
      id: string;
      file: File;
      uploading: boolean;
      progress: number;
      key?: string;
      isDeleting: boolean;
      error: boolean;
      objectUrl?: string;
    }>
  >([]);

  function uploadFile(file: File) {
    setFiles((prevFiles) =>
      prevFiles.map((f) =>
        f.file.name === file.name ? { ...f, uploading: true } : f
      )
    );

    try {
    } catch (error) {}
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles((prevFiles) => [
        ...prevFiles,
        ...acceptedFiles.map((file) => ({
          id: uuidv4(),
          file,
          uploading: false,
          progress: 0,
          isDeleting: false,
          error: false,
          objectUrl: URL.createObjectURL(file),
        })),
      ]);
    }

    acceptedFiles.forEach(uploadFile);
  }, []);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      const tooManyFiles = fileRejections.find(
        (fileRejection) => fileRejection.errors[0].code === "too-many-files"
      );

      const fileTooLarge = fileRejections.find(
        (fileRejection) => fileRejection.errors[0].code === "file-too-large"
      );

      if (tooManyFiles) {
        toast.error("You can only upload up to 5 files at a time.");
      }

      if (fileTooLarge) {
        toast.error("File size exceeds the 5 MB limit.");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxFiles: 5,
    maxSize: 1024 * 1024 * 5, // 5 MB limit
    accept: {
      "image/*": [],
    },
  });

  return (
    <>
      <Card
        className={cn(
          "border-dashed border-2 border-gray-300 p-4",
          isDragActive
            ? "border-primary bg-primary/10 border-solid"
            : "border-border hover:border-primary "
        )}
        {...getRootProps()}
      >
        <CardContent className="flex flex-col items-center justify-center w-full h-64">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full gap-y-3">
              <p>Drag drop some files here, or click to select files</p>

              <Button>Select files</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 mt-6">
        {files.map((file) => (
          <div key={file.id}>
            <img src={file.objectUrl} alt={file.file.name} />
          </div>
        ))}
      </div>
    </>
  );
};

export default Uploader;
