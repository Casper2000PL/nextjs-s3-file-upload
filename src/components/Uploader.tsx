"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const Uploader = () => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Do something with the files
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Card
      className={cn("border-dashed border-2 border-gray-300 p-4")}
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
