#!/usr/bin/env node

/**
 * 썸네일 서비스 테스트 스크립트
 *
 * 사용법:
 * node scripts/test-thumbnail-service.js
 */

const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testSharp() {
  console.log('\n=== Sharp 테스트 ===');
  try {
    // 간단한 테스트 이미지 생성 (100x100 빨간색)
    const testBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).jpeg().toBuffer();

    console.log('✅ Sharp 작동 확인:', {
      bufferSize: testBuffer.length
    });

    // 리사이즈 테스트
    const thumbnail = await sharp(testBuffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    console.log('✅ Sharp 리사이즈 성공:', {
      originalSize: testBuffer.length,
      thumbnailSize: thumbnail.length
    });

    return thumbnail;
  } catch (error) {
    console.error('❌ Sharp 오류:', error.message);
    throw error;
  }
}

async function testSupabaseStorage(thumbnailBuffer) {
  console.log('\n=== Supabase Storage 테스트 ===');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ 환경 변수 누락:', {
      NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!serviceRoleKey
    });
    throw new Error('환경 변수가 설정되지 않았습니다');
  }

  console.log('✅ 환경 변수 확인 완료');

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 버킷 목록 확인
  console.log('\n--- 버킷 목록 조회 ---');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('❌ 버킷 목록 조회 실패:', bucketsError);
    throw bucketsError;
  }

  console.log('버킷 목록:', buckets.map(b => ({
    id: b.id,
    name: b.name,
    public: b.public
  })));

  const thumbnailsBucket = buckets.find(b => b.name === 'thumbnails');
  if (!thumbnailsBucket) {
    console.error('❌ thumbnails 버킷이 존재하지 않습니다!');
    throw new Error('thumbnails 버킷 없음');
  }

  console.log('✅ thumbnails 버킷 확인:', {
    id: thumbnailsBucket.id,
    public: thumbnailsBucket.public
  });

  // 테스트 파일 업로드
  console.log('\n--- 테스트 파일 업로드 ---');
  const testFilePath = `test/${Date.now()}_test.jpg`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('thumbnails')
    .upload(testFilePath, thumbnailBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (uploadError) {
    console.error('❌ 업로드 실패:', uploadError);
    throw uploadError;
  }

  console.log('✅ 업로드 성공:', uploadData);

  // Public URL 생성
  const { data: urlData } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(testFilePath);

  console.log('✅ Public URL 생성:', urlData.publicUrl);

  // 파일 삭제
  console.log('\n--- 테스트 파일 삭제 ---');
  const { error: deleteError } = await supabase.storage
    .from('thumbnails')
    .remove([testFilePath]);

  if (deleteError) {
    console.error('❌ 삭제 실패:', deleteError);
  } else {
    console.log('✅ 삭제 성공');
  }
}

async function main() {
  console.log('썸네일 서비스 테스트 시작...\n');

  try {
    const thumbnailBuffer = await testSharp();
    await testSupabaseStorage(thumbnailBuffer);

    console.log('\n=== 모든 테스트 통과! ===\n');
    process.exit(0);
  } catch (error) {
    console.error('\n=== 테스트 실패 ===');
    console.error(error);
    process.exit(1);
  }
}

main();
