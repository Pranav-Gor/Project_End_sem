const express = require('express');
const router = express.Router();
const { protectAllowInactive } = require('../middleware/auth');
const multer = require('multer');
const { uploadBuffer } = require('../utils/cloudinary');

// Use memory storage since we send buffers straight to Cloudinary stream
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
});

/**
 * POST /api/upload
 * Single file upload.
 * Form-data field: `file`
 */
router.post('/', protectAllowInactive, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const folder = req.body.folder || 'auctus/general';
    console.log(`Uploading single file: ${req.file.originalname} to folder: ${folder}`);
    
    const secureUrl = await uploadBuffer(req.file.buffer, folder);

    res.json({
      success: true,
      data: {
        url: secureUrl,
      },
    });
  } catch (error) {
    console.error('Upload Error:', error.message || error);
    res.status(500).json({ 
      success: false, 
      message: 'File upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/upload/bulk
 * Multiple files upload (up to 10).
 * Form-data field: `files`
 */
router.post('/bulk', protectAllowInactive, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided' });
    }

    const folder = req.body.folder || 'auctus/general';
    console.log(`Uploading ${req.files.length} files to folder: ${folder}`);

    const uploadPromises = req.files.map(file => uploadBuffer(file.buffer, folder));
    const results = await Promise.allSettled(uploadPromises);

    const urls = [];
    const errors = [];

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        urls.push(result.value);
      } else {
        errors.push({
          file: req.files[idx].originalname,
          message: result.reason.message || 'Upload failed'
        });
      }
    });

    res.json({
      success: true,
      data: {
        urls,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk Upload Error:', error.message || error);
    res.status(500).json({ success: false, message: 'Bulk upload failed' });
  }
});

module.exports = router;
