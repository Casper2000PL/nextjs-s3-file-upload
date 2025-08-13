/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { Loader2Icon, Trash2Icon } from "lucide-react";

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

  async function removeFile(fileId: string) {
    try {
      const fileToRemove = files.find((f) => f.id === fileId);

      if (fileToRemove) {
        if (fileToRemove.objectUrl) {
          URL.revokeObjectURL(fileToRemove.objectUrl);
        }
      }

      setFiles((prevFiles) =>
        prevFiles.map((f) => (f.id === fileId ? { ...f, isDeleting: true } : f))
      );

      const deleteFileResponse = await fetch("/api/s3/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: fileToRemove?.key }),
      });

      if (!deleteFileResponse.ok) {
        toast.error("Failed to remove file from storage.");

        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === fileId ? { ...f, isDeleting: false, error: true } : f
          )
        );
        return;
      }

      toast.success("File removed successfully");
      setFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId));
    } catch (error) {
      toast.error("Failed to remove file from storage.");
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileId ? { ...f, isDeleting: false, error: true } : f
        )
      );
    }
  }

  async function uploadFile(file: File) {
    setFiles((prevFiles) =>
      prevFiles.map((f) =>
        f.file.name === file.name ? { ...f, uploading: true } : f
      )
    );

    try {
      const presignedUrlResponse = await fetch("/api/s3/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!presignedUrlResponse.ok) {
        toast.error("Failed to get presigned URL");

        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.file.name === file.name
              ? { ...f, uploading: false, progress: 0, error: true }
              : f
          )
        );

        return;
      }

      const { presignedUrl, key } = await presignedUrlResponse.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentageCompleted = Math.round(
              (event.loaded / event.total) * 100
            );

            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.file.name === file.name
                  ? {
                      ...f,
                      progress: percentageCompleted,
                      key: key,
                    }
                  : f
              )
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status == 200 || xhr.status == 204) {
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.file.name === file.name
                  ? { ...f, uploading: false, progress: 100, error: false }
                  : f
              )
            );

            toast.success("File uploaded successfully");

            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Upload failed"));
        };

        xhr.open("PUT", presignedUrl);

        xhr.setRequestHeader("Content-Type", file.type);

        xhr.send(file);
      });
    } catch (error) {
      console.error("Upload error: ", error);

      toast.error("Failed to upload file");

      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.file.name === file.name
            ? { ...f, uploading: false, progress: 0, error: true }
            : f
        )
      );
    }
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
          <div key={file.id} className="flex flex-col gap-1">
            <div className="relative aspect-square rounded-lg overflow-hidden">
              <img
                src={file.objectUrl}
                alt={file.file.name}
                className="w-full h-full object-cover"
              />

              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => removeFile(file.id)}
                disabled={file.uploading || file.isDeleting}
              >
                {file.isDeleting ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <Trash2Icon className="size-4" />
                )}
              </Button>

              {file.uploading && !file.isDeleting && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white font-medium text-lg">
                    {file.progress}%
                  </div>
                </div>
              )}

              {file.error && (
                <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                  <div className="text-white font-medium">Error</div>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground truncate px-1">
              {file.file.name}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

export default Uploader;
