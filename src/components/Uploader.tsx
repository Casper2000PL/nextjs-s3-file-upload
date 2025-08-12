"use client";

import React, { useCallback } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { toast } from "sonner";

const Uploader = () => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Do something with the files

    console.log(acceptedFiles);
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
  );
};

export default Uploader;
