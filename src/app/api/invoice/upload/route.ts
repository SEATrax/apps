import { NextRequest, NextResponse } from 'next/server';
import { PinataService } from '../../../../lib/pinata.service';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Mulai upload dokumen invoice...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'File dokumen wajib diisi'
      }, { status: 400 });
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    
    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Nama dokumen wajib diisi'
      }, { status: 400 });
    }

    const timestamp = Date.now();
    const identifier = `invoice-doc-${timestamp}`;

    console.log('📤 Step 1: Upload file ke IPFS...');
    const pinataService = new PinataService();
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileResult = await pinataService.uploadImage(
      buffer,
      file.name,
      `${identifier}-${file.name}`
    );
    console.log('✅ File uploaded:', fileResult.ipfsHash);

    // Parse attributes if exists
    const attributesStr = formData.get('attributes') as string;
    const attributes = attributesStr ? JSON.parse(attributesStr) : [];

    const metadata: any = {
      name: name || file.name,
      description: description || `Invoice document: ${file.name}`,
      image: fileResult.url,
      attributes: [
        ...attributes,
        { trait_type: 'File Type', value: file.type },
        { trait_type: 'File Size', value: file.size.toString() },
        { trait_type: 'Upload Timestamp', value: timestamp.toString() }
      ],
      document_type: file.type,
      file_size: file.size,
      original_name: file.name
    };

    const createdAt = formData.get('created_at') as string;
    if (createdAt) {
      metadata.created_at = createdAt;
    }

    const invoiceNumber = formData.get('invoice_number') as string;
    if (invoiceNumber) {
      metadata.invoice_number = invoiceNumber;
    }

    const exporterCompany = formData.get('exporter_company') as string;
    if (exporterCompany) {
      metadata.exporter_company = exporterCompany;
    }

    console.log('📤 Step 2: Upload metadata ke IPFS...');
    const metadataResult = await pinataService.uploadJSON(metadata);
    console.log('✅ Metadata uploaded:', metadataResult.ipfsHash);

    return NextResponse.json({
      success: true,
      message: 'Dokumen berhasil di-upload ke IPFS',
      data: {
        metadata_cid: metadataResult.ipfsHash,
        metadata_url: metadataResult.url,
        file_cid: fileResult.ipfsHash,
        file_url: fileResult.url,
        metadata: metadata
      }
    });
  } catch (error: any) {
    console.error('❌ Error upload dokumen:', error);

    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}