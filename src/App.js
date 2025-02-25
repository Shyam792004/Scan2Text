import React from "react";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";
import PdfUpload from "./component/pdfupload";
import "./styles.css"; // Import CSS file

function App() {
  return (
    <div className="app-container">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="content">
        <h1>📄 Upload Your PDF</h1>
        <div className="upload-box flex  justify-center items-center">
          <h2>Select a PDF File</h2>
          <PdfUpload />
          {/* <button className="btn">View Uploaded Files</button> */}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
