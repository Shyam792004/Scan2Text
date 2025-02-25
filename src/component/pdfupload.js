import { useState } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
} from "@aws-sdk/client-textract";

const REGION = "us-east-1";
const BUCKET_NAME = "cv-dsa-project";

// Initialize S3 and Textract Clients
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: "AKIAVRUVS7G76DB4N7B3",
    secretAccessKey: "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",
  },
});

const textractClient = new TextractClient({
  region: REGION,
  credentials: {
    accessKeyId: "AKIAVRUVS7G76DB4N7B3",
    secretAccessKey: "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",
  },
});

export default function PdfUpload() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [jobId, setJobId] = useState(null);
  const [extractedText, setExtractedText] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file) return alert("Please select a file first");

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const fileUint8Array = new Uint8Array(fileArrayBuffer);

      const params = {
        Bucket: BUCKET_NAME,
        Key: file.name,
        Body: fileUint8Array,
        ContentType: "application/pdf",
      };

      setUploadStatus("Uploading...");
      
      const uploadCommand = new PutObjectCommand(params);
      await s3Client.send(uploadCommand);
      setUploadStatus("Upload Successful ✅");

      startTextExtraction(file.name);
    } catch (err) {
      setUploadStatus("Upload Failed ❌");
      console.error(err);
    }
  };

  const startTextExtraction = async (fileName) => {
    const command = new StartDocumentTextDetectionCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: BUCKET_NAME,
          Name: fileName,
        },
      },
    });

    try {
      const response = await textractClient.send(command);
      setJobId(response.JobId);
      checkJobStatus(response.JobId);
    } catch (error) {
      console.error("Error starting text extraction:", error);
    }
  };

  const checkJobStatus = async (jobId) => {
    const params = { JobId: jobId };
    const command = new GetDocumentTextDetectionCommand(params);

    const interval = setInterval(async () => {
      try {
        const response = await textractClient.send(command);

        if (response.JobStatus === "SUCCEEDED") {
          clearInterval(interval);
          processTextResults(response.Blocks);
        } else if (response.JobStatus === "FAILED") {
          clearInterval(interval);
          console.error("Text extraction failed");
        }
      } catch (error) {
        console.error("Error checking job status:", error);
      }
    }, 5000);
  };

  const processTextResults = (blocks) => {
    const text = blocks
      .filter((block) => block.BlockType === "LINE")
      .map((block) => block.Text)
      .join("\n");

    setExtractedText(text);
  };

  const downloadTextFile = () => {
    if (!extractedText) {
      alert("No text available to download");
      return;
    }

    const blob = new Blob([extractedText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "extracted_text.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      {/* Top Bar */}
      {/* <div className="w-full bg-black text-white py-4 text-center text-2xl font-bold shadow-md">
        Upload PDF
      </div> */}

      {/* Upload Card */}
      <div className="bg-white flex items-center justify-center rounded-2xl shadow-lg p-6 w-full max-w-lg mt-10 text-center">
        {/* <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload & Extract Text</h2> */}
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="fileupload"
        />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload & Extract Text</h2>

        <button 
          onClick={uploadFile} 
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition mb-2 btn"
        >
          Upload & Process
                    {/* <button className="btn">View Uploaded Files</button> */}

        </button>
        {uploadStatus && <p className="text-sm text-gray-700">{uploadStatus}</p>}
      </div>

      {/* Extracted Text Section */}
      {extractedText && (
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg mt-6 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Extracted Text</h3>
          <pre className="whitespace-pre-wrap p-2 border rounded bg-gray-100 text-sm text-left max-h-64 overflow-y-auto">{extractedText}</pre>
          <button 
            onClick={downloadTextFile} 
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition mt-2"
          >
            Download as .TXT
          </button>
        </div>
      )}
    </div>
  );
}
