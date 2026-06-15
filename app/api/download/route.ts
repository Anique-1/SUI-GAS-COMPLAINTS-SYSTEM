import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary server-side
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'document.pdf';

    if (!fileUrl) {
      return NextResponse.json({ error: 'Missing file URL query parameter.' }, { status: 400 });
    }

    // Data URLs can be downloaded client-side directly
    if (fileUrl.startsWith('data:')) {
      return NextResponse.json(
        { error: 'Mock local data URLs should be downloaded directly on the client side.' },
        { status: 400 }
      );
    }

    // Parse the Cloudinary URL to extract parameters needed for SDK signing
    let resource_type = 'raw';
    let public_id = '';
    let format = 'pdf';

    if (fileUrl.includes('/raw/upload/')) {
      const parts = fileUrl.split('/raw/upload/');
      const path = parts[1];
      const cleanPath = path.replace(/^v\d+\//, ''); // Strip version prefix
      const lastDot = cleanPath.lastIndexOf('.');
      format = lastDot !== -1 ? cleanPath.substring(lastDot + 1) : 'pdf';
      resource_type = 'raw';
      public_id = cleanPath; // Raw assets include their file extension in the public_id
    } else if (fileUrl.includes('/image/upload/')) {
      const parts = fileUrl.split('/image/upload/');
      const path = parts[1];
      const cleanPath = path.replace(/^v\d+\//, ''); // Strip version prefix
      const lastDot = cleanPath.lastIndexOf('.');
      format = lastDot !== -1 ? cleanPath.substring(lastDot + 1) : 'pdf';
      resource_type = 'image';
      public_id = lastDot !== -1 ? cleanPath.substring(0, lastDot) : cleanPath; // Image assets do not include the extension in the public_id
    } else {
      return NextResponse.json({ error: 'Invalid or unsupported Cloudinary URL format.' }, { status: 400 });
    }

    // Generate signed authenticated download URL
    const downloadUrl = cloudinary.utils.private_download_url(public_id, format, {
      resource_type,
      type: 'upload',
    });

    // Fetch the file contents from the signed API URL server-to-server (bypasses ACL / public block)
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      console.error(`Failed to fetch PDF from Cloudinary API. Status: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch the document from storage.' },
        { status: response.status }
      );
    }

    const fileBuffer = await response.arrayBuffer();

    // Send binary content back with attachment headers to force download with the clean filename
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });

  } catch (error: any) {
    console.error('API download handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server download error.' },
      { status: 500 }
    );
  }
}
