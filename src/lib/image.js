import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, HAS_SUPABASE } from './config'

// 이미지 업로드용 Storage 버킷 (없으면 dataURL 직접 전송)
const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || ''

let _storage = null
function storageClient() {
  if (!_storage) _storage = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return _storage
}

// 버킷이 설정돼 있으면 Storage 에 업로드하고 public URL 반환, 아니면 null
async function uploadBlob(blob, name) {
  if (!BUCKET || !HAS_SUPABASE) return null
  try {
    const safe = String(name || 'img.jpg').replace(/[^\w.\-]/g, '_').slice(-40)
    const path = `${Date.now()}-${Math.round(Math.random() * 1e9).toString(36)}-${safe}`
    const sb = storageClient()
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })
    if (error) return null
    return sb.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || null
  } catch {
    return null
  }
}

// 공유용 이미지 src 생성: 버킷이 있으면 업로드 URL, 없거나 실패하면 압축 dataURL
export async function toShareableSrc(file, maxSize, quality = 0.8) {
  const dataUrl = await downscaleImage(file, maxSize, quality)
  if (!BUCKET) return dataUrl
  try {
    const blob = await (await fetch(dataUrl)).blob()
    return (await uploadBlob(blob, file.name)) || dataUrl
  } catch {
    return dataUrl
  }
}

// 큰 이미지를 캔버스로 줄여 dataURL 로 반환 (전송량 절감)
export function downscaleImage(file, maxSize, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')) }
    img.src = url
  })
}

// 파일 선택 다이얼로그를 띄워 압축된 dataURL 을 반환 (취소 시 null)
// 모바일 브라우저는 input이 DOM에 붙어 있어야 파일 선택이 동작하므로 body에 추가한다.
export function pickImage(maxSize = 1024, quality = 0.8) {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.position = 'fixed'
    input.style.left = '-9999px'
    input.style.opacity = '0'
    document.body.appendChild(input)

    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input)
    }
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0]
      if (!file) { cleanup(); return resolve(null) }
      try {
        const dataUrl = await toShareableSrc(file, maxSize, quality)
        resolve({ dataUrl, name: file.name })
      } catch {
        resolve(null)
      } finally {
        cleanup()
      }
    })
    // 사용자가 취소하면 change가 안 올 수 있으니, 포커스 복귀 시 정리
    window.addEventListener(
      'focus',
      () => setTimeout(() => { if (input.files.length === 0) cleanup() }, 1000),
      { once: true },
    )
    input.click()
  })
}
