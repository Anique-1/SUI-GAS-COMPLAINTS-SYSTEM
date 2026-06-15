import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary server-side with longer timeout settings
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000, // Set timeout limit to 60 seconds to support slow connections
});

export async function POST(req: NextRequest) {
  try {
    const isConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET;

    if (!isConfigured) {
      return NextResponse.json(
        { error: 'Cloudinary server credentials are not configured.' },
        { status: 501 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Convert file to array buffer and convert to a Buffer for binary stream uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    // Parse and sanitize the original file name to preserve it in the URL
    const originalName = file.name;
    const lastDot = originalName.lastIndexOf('.');
    const nameWithoutExt = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');

    // Build public_id. For resource_type: 'raw' (PDFs), Cloudinary requires the extension inside the public_id!
    const uniquePublicId = isPdf 
      ? `${cleanName}_${Date.now()}.pdf` 
      : `${cleanName}_${Date.now()}`;

    // Upload using standard stream helper (restores binary stream integrity for raw files)
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: isPdf ? 'raw' : 'auto',
          folder: 'sui_gas_complaints_registry',
          public_id: uniquePublicId,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      name: file.name,
    });
  } catch (error: any) {
    console.error('Server Cloudinary upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Server upload operation failed.' },
      { status: 500 }
    );
  }
}
