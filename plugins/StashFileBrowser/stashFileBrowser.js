(function() {
    // Register custom route handler for file browser interface
    api.registerPluginRoute("/filebrowser", "GET", (context) => {
      return { 
        template: "assets/filebrowser/index.html",
        contentType: "text/html"
      };
    });
    
    // Register API endpoint for listing files
    api.registerPluginRoute("/api/list", "GET", (context) => {
      const path = context.query.path || "/";
      
      try {
        const files = listFilesInDirectory(path);
        return { 
          files: files,
          path: path,
          success: true
        };
      } catch (err) {
        return { 
          error: err.message,
          success: false
        };
      }
    });
    
    // Register API endpoint for file download
    api.registerPluginRoute("/api/download", "GET", (context) => {
      const path = context.query.path;
      if (!path) {
        return { error: "No path specified", success: false };
      }
      
      try {
        // Read the file
        const fileContent = readFileContent(path);
        
        // Get file name from path
        const fileName = path.split('/').pop();
        
        return { 
          content: fileContent,
          fileName: fileName,
          contentType: "application/octet-stream",
          headers: {
            "Content-Disposition": `attachment; filename="${fileName}"`
          },
          success: true
        };
      } catch (err) {
        return { 
          error: err.message,
          success: false
        };
      }
    });
    
    // Register API endpoint for text file preview
    api.registerPluginRoute("/api/preview", "GET", (context) => {
      const path = context.query.path;
      if (!path) {
        return { error: "No path specified", success: false };
      }
      
      try {
        // Only preview text-based files
        const content = readFilePreview(path);
        return { 
          content: content,
          success: true
        };
      } catch (err) {
        return { 
          error: err.message,
          success: false
        };
      }
    });
    
    // Function to list files in a directory
    function listFilesInDirectory(path) {
      const { exec } = require('child_process');
      const { join } = require('path');
      
      // Read directory contents
      const fs = require('fs');
      const files = fs.readdirSync(path, { withFileTypes: true });
      
      // Map files to objects with metadata
      return files.map(file => {
        const filePath = join(path, file.name);
        const stats = fs.statSync(filePath);
        
        return {
          name: file.name,
          path: filePath,
          isDirectory: file.isDirectory(),
          size: stats.size,
          modified: stats.mtime
        };
      });
    }
    
    // Function to read file contents for download
    function readFileContent(path) {
      const fs = require('fs');
      return fs.readFileSync(path);
    }
    
    // Function to read preview of text files
    function readFilePreview(path) {
      const fs = require('fs');
      const MAX_PREVIEW_SIZE = 10000; // Only show first 10KB for preview
      
      // Check file extension to determine if it's a text file
      const ext = path.split('.').pop().toLowerCase();
      const textExtensions = ['txt', 'log', 'json', 'xml', 'html', 'css', 'js', 'md', 'csv'];
      
      if (!textExtensions.includes(ext)) {
        return "File cannot be previewed (binary file or unsupported format)";
      }
      
      // Read first chunk of file
      const buffer = Buffer.alloc(MAX_PREVIEW_SIZE);
      const fd = fs.openSync(path, 'r');
      const bytesRead = fs.readSync(fd, buffer, 0, MAX_PREVIEW_SIZE, 0);
      fs.closeSync(fd);
      
      // Convert buffer to string
      return buffer.toString('utf8', 0, bytesRead);
    }
  })();