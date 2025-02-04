"use client";

import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import React, { FormEvent, useState, useRef, useCallback } from "react";

// Shadcn UI components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

// Dynamically import React Quill for Next.js
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// React Image Crop
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

// Optional BackButton component
import BackButton from "@/components/BackButton";

// Helper function to get the cropped image blob using canvas
async function getCroppedImg(image: HTMLImageElement, crop: Crop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelCropWidth = crop.width ? crop.width * scaleX : 0;
  const pixelCropHeight = crop.height ? crop.height * scaleY : 0;

  canvas.width = pixelCropWidth;
  canvas.height = pixelCropHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(
    image,
    (crop.x || 0) * scaleX,
    (crop.y || 0) * scaleY,
    pixelCropWidth,
    pixelCropHeight,
    0,
    0,
    pixelCropWidth,
    pixelCropHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 1);
  });
}

// Dynamically load React Quill to avoid SSR issues:
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Quill modules to show headings, bold, italic, bullet/number lists, etc.
const quillModules = {
  toolbar: [
    // Dropdown with heading sizes
    [{ header: [1, 2, 3, false] }],
    // Bold, italic, underline
    ["bold", "italic", "underline"],
    // Bullet list, numbered list
    [{ list: "ordered" }, { list: "bullet" }],
    // Align text
    [{ align: [] }],
    // Links, code, clean
    ["link", "code-block", "clean"],
  ],
};

export default function NewAnnouncement() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Only HR or ADMIN can create announcements
  const allowedRoles = ["HR", "ADMIN"];
  const isAuthorized = session?.user?.role && allowedRoles.includes(session.user.role);

  const [title, setTitle] = useState("");
  // HTML output from Quill
  const [editorContent, setEditorContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [archived, setArchived] = useState(false);
  const [roleTarget, setRoleTarget] = useState("EVERYONE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image cropping
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: "%", x: 0, y: 0, width: 80, height: 0 });
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const aspectOptions = [
    { label: "Free", value: "free" },
    { label: "Square (1:1)", value: "1" },
    { label: "Horizontal (16:9)", value: "1.7777777" },
    { label: "Vertical (9:16)", value: "0.5625" },
  ];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Reset crop state
      setCrop({ unit: "%", x: 0, y: 0, width: 80, height: 0 });
      setCompletedCrop(null);
    }
  }

  function handleAspectChange(value: string) {
    if (value === "free") {
      setAspect(undefined);
      setCrop({ unit: "%", x: 0, y: 0, width: 80, height: 0 });
    } else {
      setAspect(Number(value));
      setCrop({ unit: "%", x: 0, y: 0, width: 80, height: 0 });
    }
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
  }, []);

  const onCropComplete = useCallback((finalCrop: Crop) => {
    setCompletedCrop(finalCrop);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    // Quick check: ensure we have a title & some content
    if (!title.trim() || !editorContent.trim()) {
      alert("Title and text cannot be empty.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("text", editorContent); // Quill's HTML

      if (pinned) formData.append("pinned", "true");
      if (archived) formData.append("archived", "true");
      if (roleTarget !== "EVERYONE") {
        formData.append("roleTargets", roleTarget);
      }

      // Handle image cropping
      if (selectedFile) {
        let fileToUpload: Blob = selectedFile;
        if (completedCrop && completedCrop.width && completedCrop.height && imgRef.current) {
          fileToUpload = await getCroppedImg(imgRef.current, completedCrop);
        }
        formData.append("imageFile", fileToUpload, "cropped.jpg");
      }

      const resp = await fetch("/api/announcements/create", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.message || "Something went wrong");
      }

      // On success, redirect
      router.push("/announcements");
    } catch (err: any) {
      console.error("Error creating announcement:", err);
      alert(`Failed to create announcement:\n${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <span className="text-xl">Loading...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    if (typeof window !== "undefined") router.push("/404");
    return null;
  }

  return (
    <>
      <Head>
        <title>EMS - New Announcement</title>
      </Head>
      <main className="p-6 min-h-screen">
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg border">
            <CardHeader>
              <CardTitle className="text-2xl font-bold mb-1">
                Create a New Announcement
              </CardTitle>
              <CardDescription>
                Use the editor below to format your text (headings, bold, links, etc.) just like in Word.
              </CardDescription>
            </CardHeader>

            <form onSubmit={onSubmit}>
              <CardContent className="space-y-5">
                {/* Title */}
                <div>
                  <Label htmlFor="title" className="mb-2 block font-semibold">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Announcement Title..."
                    required
                  />
                </div>

                {/* React Quill WYSIWYG Editor */}
                <div>
                  <Label className="mb-2 block font-semibold">
                    Announcement Text
                  </Label>
                  <ScrollArea className="bg-white border border-gray-300 rounded min-h-[200px]">
                    <ReactQuill
                      value={editorContent}
                      onChange={setEditorContent}
                      modules={quillModules}
                      theme="snow"
                      style={{ height: "300px" }}
                    />
                  </ScrollArea>
                </div>

                {/* Image Upload and Crop */}
                <div className="space-y-2">
                  <Label className="font-semibold">Image (optional)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Aspect Ratio:</span>
                    <select
                      className="border text-sm rounded px-2 py-1"
                      onChange={(e) => handleAspectChange(e.target.value)}
                    >
                      {aspectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {previewUrl && (
                    <div className="mt-3 p-2 border-2 border-dashed border-gray-400 rounded-lg bg-white flex flex-col items-center">
                      <ReactCrop
                        crop={crop}
                        onChange={(newCrop) => setCrop(newCrop)}
                        onComplete={onCropComplete}
                        aspect={aspect}
                      >
                        <img
                          src={previewUrl}
                          alt="Crop preview"
                          ref={imgRef}
                          onLoad={onImageLoad}
                          className="max-h-72 object-contain"
                        />
                      </ReactCrop>
                      <p className="text-xs text-gray-600 text-center mt-1">
                        Drag to adjust the crop. The cropped image will be used for upload.
                      </p>
                    </div>
                  )}
                </div>

                {/* Pinned & Archived options */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={pinned}
                      onChange={() => setPinned(!pinned)}
                      id="pinnedCheck"
                    />
                    <Label htmlFor="pinnedCheck">Pinned</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={archived}
                      onChange={() => setArchived(!archived)}
                      id="archivedCheck"
                    />
                    <Label htmlFor="archivedCheck">Archived</Label>
                  </div>
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <Label className="font-semibold">Target Audience</Label>
                  <div className="flex flex-wrap items-center gap-4">
                    {["EVERYONE", "HR", "ADMIN", "EMPLOYEE"].map((role) => (
                      <label key={role} className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="roleTargets"
                          value={role}
                          checked={roleTarget === role}
                          onChange={() => setRoleTarget(role)}
                        />
                        {role.charAt(0) + role.slice(1).toLowerCase()}
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 text-white font-bold px-4 py-2 hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  {isSubmitting ? "Submitting..." : "Create Announcement"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}
